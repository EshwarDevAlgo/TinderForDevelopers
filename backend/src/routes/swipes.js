import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { publishToUser } from '../realtime.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  const targetId = Number(req.body.targetId);
  const liked = req.body.liked === true;
  if (!Number.isInteger(targetId) || targetId === req.userId) {
    return res.status(400).json({ error: 'Invalid targetId' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query('SELECT id, name, avatar_url, role FROM users WHERE id = $1', [targetId]);
    if (!target.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    await client.query(
      `INSERT INTO swipes (swiper_id, target_id, liked) VALUES ($1, $2, $3)
       ON CONFLICT (swiper_id, target_id) DO UPDATE SET liked = EXCLUDED.liked, created_at = now()`,
      [req.userId, targetId, liked],
    );

    let match = null;
    if (liked) {
      const reciprocal = await client.query(
        'SELECT 1 FROM swipes WHERE swiper_id = $1 AND target_id = $2 AND liked = true',
        [targetId, req.userId],
      );
      if (reciprocal.rows.length) {
        const [a, b] = [req.userId, targetId].sort((x, y) => x - y);
        const { rows } = await client.query(
          `INSERT INTO matches (user_a, user_b) VALUES ($1, $2)
           ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
           RETURNING id, created_at, (xmax = 0) AS created`,
          [a, b],
        );
        match = rows[0];
      }
    }
    await client.query('COMMIT');

    if (match?.created) {
      const me = await pool.query('SELECT id, name, avatar_url, role FROM users WHERE id = $1', [req.userId]);
      await publishToUser(targetId, { type: 'match', matchId: match.id, user: me.rows[0] }).catch(() => {});
    }
    return res.json({ matched: Boolean(match), matchId: match?.id ?? null, user: target.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
});

export default router;
