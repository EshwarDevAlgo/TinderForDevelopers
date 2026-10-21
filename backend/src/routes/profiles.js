import { Router } from 'express';
import { config } from '../config.js';
import { LOOKING_FOR, ROLES } from '../constants.js';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { PUBLIC_PROFILE_COLUMNS, parseProfileInput } from '../profile.js';
import { cacheDel, cacheGetJson, cacheSetJson } from '../redis.js';
import { llmEnabled, llmRerank } from '../services/llm.js';
import { rankCandidates } from '../services/recommendations.js';

const router = Router();
router.use(requireAuth);

export const profileCacheKey = (id) => `profile:${id}`;

async function loadUser(id) {
  const { rows } = await query(`SELECT ${PUBLIC_PROFILE_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

// Browse / search all developers.
router.get('/', async (req, res, next) => {
  try {
    const pageSize = 24;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const where = ['id <> $1'];
    const params = [req.userId];
    if (req.query.role && ROLES.includes(req.query.role)) {
      params.push(req.query.role);
      where.push(`role = $${params.length}`);
    }
    if (req.query.tech) {
      params.push(String(req.query.tech).toLowerCase().slice(0, 40));
      where.push(`EXISTS (SELECT 1 FROM unnest(tech_stack) t WHERE lower(t) = $${params.length})`);
    }
    if (req.query.q) {
      params.push(`%${String(req.query.q).slice(0, 60).replace(/[%_\\]/g, '\\$&')}%`);
      where.push(`(name ILIKE $${params.length} OR bio ILIKE $${params.length} OR array_to_string(tech_stack, ' ') ILIKE $${params.length})`);
    }
    params.push(pageSize, (page - 1) * pageSize);
    const { rows } = await query(
      `SELECT ${PUBLIC_PROFILE_COLUMNS}, count(*) OVER() AS total
       FROM users WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const total = rows[0] ? Number(rows[0].total) : 0;
    rows.forEach((r) => delete r.total);
    res.json({ page, pageSize, total, profiles: rows });
  } catch (err) {
    next(err);
  }
});

// Personalized recommendations (heuristic, optionally re-ranked by an LLM).
router.get('/discover', async (req, res, next) => {
  try {
    const me = await loadUser(req.userId);
    if (!me) return res.status(404).json({ error: 'User not found' });
    const mode = LOOKING_FOR.includes(req.query.mode) ? req.query.mode : me.looking_for;
    const wantAi = req.query.ai === 'true' && llmEnabled();

    const { rows: candidates } = await query(
      `SELECT ${PUBLIC_PROFILE_COLUMNS} FROM users u
       WHERE u.id <> $1
         AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = $1 AND s.target_id = u.id)
       LIMIT 2000`,
      [req.userId],
    );

    let ranked = rankCandidates(me, candidates, mode, wantAi ? 25 : 20);
    let usedAi = false;

    if (wantAi && ranked.length) {
      const cacheKey = `reco:${req.userId}:${mode}`;
      let aiOrder = await cacheGetJson(cacheKey);
      if (!aiOrder) {
        aiOrder = await llmRerank(me, ranked, mode);
        if (aiOrder) await cacheSetJson(cacheKey, aiOrder, 300);
      }
      if (aiOrder) {
        const byId = new Map(ranked.map((p) => [p.id, p]));
        const ordered = [];
        for (const { id, reason } of aiOrder) {
          const p = byId.get(id);
          if (!p) continue;
          ordered.push({ ...p, match: { ...p.match, reason, source: 'ai' } });
          byId.delete(id);
        }
        ranked = [...ordered, ...byId.values()].slice(0, 20);
        usedAi = ordered.length > 0;
      }
    }

    return res.json({ mode, ai: usedAi, aiAvailable: llmEnabled(), profiles: ranked });
  } catch (err) {
    return next(err);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { values, error } = parseProfileInput(req.body, { partial: true });
    if (error) return res.status(400).json({ error });
    const keys = Object.keys(values);
    if (!keys.length) return res.status(400).json({ error: 'No updatable fields provided' });
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await query(
      `UPDATE users SET ${sets} WHERE id = $1 RETURNING ${PUBLIC_PROFILE_COLUMNS}`,
      [req.userId, ...Object.values(values)],
    );
    await cacheDel(profileCacheKey(req.userId));
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

// Cached profile view: Redis, 60s TTL (LRU eviction configured on the Redis server).
router.get('/:id(\\d+)', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const key = profileCacheKey(id);
    const cached = await cacheGetJson(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    const profile = await loadUser(id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    await cacheSetJson(key, profile, config.profileCacheTtlSeconds);
    res.set('X-Cache', 'MISS');
    return res.json(profile);
  } catch (err) {
    return next(err);
  }
});

export default router;
