import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';
import { seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const LOCK_ID = 7_426_001; // arbitrary; serializes migrations across ASG instances

export async function migrate({ seed: runSeed = false, force = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    const sql = await fs.readFile(path.join(here, 'schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Schema migrated');
    if (runSeed) await seed(client, { force });
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate({ seed: process.argv.includes('--seed'), force: process.argv.includes('--force') })
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
