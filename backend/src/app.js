import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
  app.set('trust proxy', config.trustProxyHops); // 2 = CloudFront -> ALB, 1 = ALB only
  app.use(
    helmet({
      // Plain-HTTP ALB mode: upgrade-insecure-requests and HSTS would break the site.
      hsts: !config.spaDir,
      contentSecurityPolicy: {
        directives: {
          'upgrade-insecure-requests': config.spaDir ? null : [],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'ws:', 'wss:', 'https:'],
        },
      },
    }),
  );
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

  if (config.spaDir) mountSpa(app);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

const MEDIA_PATH = /^\/media\/\d+\/[0-9a-f-]{36}\.jpg$/;

function mountSpa(app) {
  const s3 = new S3Client({ region: config.s3.region });

  app.get('/media/*', async (req, res, next) => {
    if (!MEDIA_PATH.test(req.path)) return res.sendStatus(404);
    try {
      const obj = await s3.send(
        new GetObjectCommand({ Bucket: config.s3.uploadsBucket, Key: req.path.slice(1) }),
      );
      res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return obj.Body.pipe(res);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.name === 'AccessDenied') return res.sendStatus(404);
      return next(err);
    }
  });

  app.use('/assets', express.static(path.join(config.spaDir, 'assets'), { immutable: true, maxAge: '365d' }));
  app.use('/assets', (_req, res) => res.sendStatus(404));
  app.use(express.static(config.spaDir, { index: false }));
  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(config.spaDir, 'index.html'));
  });
}
