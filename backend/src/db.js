import fs from 'node:fs';
import pg from 'pg';
import { config } from './config.js';

function sslOptions() {
  if (!config.dbSsl) return undefined;
  if (fs.existsSync(config.dbCaPath)) {
    return { ca: fs.readFileSync(config.dbCaPath, 'utf8'), rejectUnauthorized: true };
  }
  console.warn(`DB CA bundle not found at ${config.dbCaPath}; falling back to unverified TLS`);
  return { rejectUnauthorized: false };
}

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: sslOptions(),
  max: 20,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => console.error('Postgres pool error', err));

export const query = (text, params) => pool.query(text, params);
