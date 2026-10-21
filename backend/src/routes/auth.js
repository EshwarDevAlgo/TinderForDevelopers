import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { PUBLIC_PROFILE_COLUMNS, parseProfileInput } from '../profile.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Valid email required' });
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8-128 characters' });
    }
    const { values, error } = parseProfileInput(req.body);
    if (error) return res.status(400).json({ error });

    const hash = await bcrypt.hash(password, 10);
    const cols = ['email', 'password_hash', ...Object.keys(values)];
    const params = [email, hash, ...Object.values(values)];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await query(
      `INSERT INTO users (${cols.join(', ')}) VALUES (${placeholders})
       ON CONFLICT (email) DO NOTHING
       RETURNING ${PUBLIC_PROFILE_COLUMNS}`,
      params,
    );
    if (!rows.length) return res.status(409).json({ error: 'Email already registered' });
    return res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const { rows } = await query(`SELECT password_hash, ${PUBLIC_PROFILE_COLUMNS} FROM users WHERE email = $1`, [email]);
    const user = rows[0];
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    delete user.password_hash;
    return res.json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT email, ${PUBLIC_PROFILE_COLUMNS} FROM users WHERE id = $1`, [req.userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
