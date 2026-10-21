import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { redis, subscriber } from './redis.js';
import { initRealtime } from './realtime.js';
import { migrate } from '../db/migrate.js';

async function main() {
  await migrate({ seed: config.seedOnStart });

  const server = http.createServer(createApp());
  const wss = await initRealtime(server);
  server.listen(config.port, () => console.log(`DevMatch API listening on :${config.port}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    wss.close();
    server.close(async () => {
      await Promise.allSettled([pool.end(), redis.quit(), subscriber.quit()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
