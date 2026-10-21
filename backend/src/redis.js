import Redis from 'ioredis';
import { config } from './config.js';

const options = { maxRetriesPerRequest: 3, enableReadyCheck: true };

export const redis = new Redis(config.redisUrl, options);
// Pub/sub needs a dedicated connection.
export const subscriber = new Redis(config.redisUrl, options);

redis.on('error', (err) => console.error('Redis error', err.message));
subscriber.on('error', (err) => console.error('Redis subscriber error', err.message));

export async function cacheGetJson(key) {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key, value, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache failures must never break the request path.
  }
}

export async function cacheDel(...keys) {
  try {
    if (keys.length) await redis.del(...keys);
  } catch {
    /* ignore */
  }
}
