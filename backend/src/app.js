import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { LOOKING_FOR, ROLES, SENIORITY } from './constants.js';
import { query } from './db.js';
import { redis } from './redis.js';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import profileRoutes from './routes/profiles.js';
import swipeRoutes from './routes/swipes.js';
import uploadRoutes from './routes/uploads.js';
import { llmEnabled } from './services/llm.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 2); // CloudFront -> ALB
  app.use(helmet());
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin.split(',') }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await Promise.all([query('SELECT 1'), redis.ping()]);
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(503).json({ status: 'degraded', error: err.message });
    }
  });

  app.get('/api/meta', (_req, res) => {
    res.json({ roles: ROLES, lookingFor: LOOKING_FOR, seniority: SENIORITY, aiAvailable: llmEnabled() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/swipes', swipeRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
