import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { isMatchMember } from '../realtime.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT m.id, m.created_at,
              json_build_object('id', u.id, 'name', u.name, 'role', u.role, 'avatar_url', u.avatar_url,
                                'tech_stack', u.tech_stack) AS user,
              lm.content AS last_message, lm.created_at AS last_message_at, lm.sender_id AS last_sender_id
       FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
       LEFT JOIN LATERAL (
         SELECT content, created_at, sender_id FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1
       ) lm ON true
       WHERE m.user_a = $1 OR m.user_b = $1
       ORDER BY COALESCE(lm.created_at, m.created_at) DESC`,
      [req.userId],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id(\\d+)/messages', async (req, res, next) => {
  try {
    const matchId = Number(req.params.id);
    const match = await isMatchMember(matchId, req.userId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    const otherId = match.user_a === req.userId ? match.user_b : match.user_a;
    const [{ rows: messages }, { rows: other }] = await Promise.all([
      query(
        `SELECT * FROM (
           SELECT id, match_id, sender_id, content, created_at FROM messages
           WHERE match_id = $1 ORDER BY created_at DESC LIMIT 200
         ) t ORDER BY created_at ASC`,
        [matchId],
      ),
      query('SELECT id, name, role, avatar_url, tech_stack FROM users WHERE id = $1', [otherId]),
    ]);
    return res.json({ matchId, user: other[0], messages });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id(\\d+)', async (req, res, next) => {
  try {
    const matchId = Number(req.params.id);
    const match = await isMatchMember(matchId, req.userId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    await query('DELETE FROM matches WHERE id = $1', [matchId]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
