import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Requires Postgres + Redis (provided by docker compose locally and by service containers in CI).
const enabled = Boolean(process.env.DATABASE_URL && process.env.REDIS_URL);

let server;
let base;
let cleanup;

before(async () => {
  if (!enabled) return;
  const { migrate } = await import('../db/migrate.js');
  const { createApp } = await import('../src/app.js');
  const { initRealtime } = await import('../src/realtime.js');
  const { pool } = await import('../src/db.js');
  const { redis, subscriber } = await import('../src/redis.js');
  await migrate({ seed: true });
  server = http.createServer(createApp());
  const wss = await initRealtime(server);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  cleanup = async () => {
    wss.close();
    await new Promise((resolve) => server.close(resolve));
    await Promise.allSettled([pool.end(), redis.quit(), subscriber.quit()]);
  };
});

after(async () => cleanup?.());

const api = async (path, { token, ...opts } = {}) => {
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return { status: res.status, headers: res.headers, body: res.status === 204 ? null : await res.json() };
};

test('health, login, discover, cached profile, swipe -> match', { skip: !enabled }, async () => {
  assert.equal((await api('/api/health')).status, 200);

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'demo@devmatch.dev', password: 'DevMatch123!' }),
  });
  assert.equal(login.status, 200);
  const { token } = login.body;

  const browse = await api('/api/profiles?tech=react', { token });
  assert.equal(browse.status, 200);
  assert.ok(browse.body.total >= 10);

  const discover = await api('/api/profiles/discover?mode=complementary', { token });
  assert.equal(discover.status, 200);
  assert.ok(discover.body.profiles.length > 0);
  assert.equal(discover.body.profiles[0].match.kind, 'complementary');

  const id = discover.body.profiles[0].id;
  const first = await api(`/api/profiles/${id}`, { token });
  const second = await api(`/api/profiles/${id}`, { token });
  assert.equal(first.status, 200);
  assert.equal(second.headers.get('x-cache'), 'HIT');

  const swipe = await api('/api/swipes', { method: 'POST', token, body: JSON.stringify({ targetId: id, liked: true }) });
  assert.equal(swipe.status, 200);

  const matches = await api('/api/matches', { token });
  assert.equal(matches.status, 200);
  assert.ok(matches.body.length >= 3);
});

test('rejects unauthenticated requests', { skip: !enabled }, async () => {
  assert.equal((await api('/api/profiles/discover')).status, 401);
});
