import { WebSocketServer } from 'ws';
import { query } from './db.js';
import { verifyToken } from './middleware/auth.js';
import { redis, subscriber } from './redis.js';

const CHANNEL = 'devmatch:events';
const AUTH_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 30000;

// userId -> Set<WebSocket> for sockets connected to *this* instance.
const clients = new Map();

function deliverLocal(userId, payload) {
  const sockets = clients.get(Number(userId));
  if (!sockets) return;
  const data = JSON.stringify(payload);
  for (const ws of sockets) if (ws.readyState === ws.OPEN) ws.send(data);
}

/** Fan out to every API instance via Redis pub/sub so chat works across the ASG. */
export async function publishToUser(userId, payload) {
  await redis.publish(CHANNEL, JSON.stringify({ to: Number(userId), payload }));
}

export async function isMatchMember(matchId, userId) {
  const { rows } = await query('SELECT user_a, user_b FROM matches WHERE id = $1', [matchId]);
  const m = rows[0];
  if (!m || (m.user_a !== userId && m.user_b !== userId)) return null;
  return m;
}

async function handleChatMessage(ws, msg) {
  const matchId = Number(msg.matchId);
  const content = String(msg.content || '').trim();
  if (!Number.isInteger(matchId) || !content || content.length > 2000) {
    return ws.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
  }
  const match = await isMatchMember(matchId, ws.userId);
  if (!match) return ws.send(JSON.stringify({ type: 'error', error: 'Not part of this match' }));

  const { rows } = await query(
    `INSERT INTO messages (match_id, sender_id, content) VALUES ($1, $2, $3)
     RETURNING id, match_id, sender_id, content, created_at`,
    [matchId, ws.userId, content],
  );
  const payload = { type: 'message', message: rows[0], clientId: msg.clientId };
  await Promise.all([publishToUser(match.user_a, payload), publishToUser(match.user_b, payload)]);
}

export async function initRealtime(server) {
  await subscriber.subscribe(CHANNEL);
  subscriber.on('message', (_channel, raw) => {
    try {
      const { to, payload } = JSON.parse(raw);
      deliverLocal(to, payload);
    } catch {
      /* ignore malformed */
    }
  });

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Token is sent as the first message rather than in the URL to keep it out of access logs.
    const authTimer = setTimeout(() => {
      if (!ws.userId) ws.close(4001, 'Authentication timeout');
    }, AUTH_TIMEOUT_MS);

    ws.on('message', async (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
      }
      try {
        if (!ws.userId) {
          if (msg.type !== 'auth') return ws.close(4001, 'Authenticate first');
          ws.userId = verifyToken(String(msg.token || ''));
          clearTimeout(authTimer);
          if (!clients.has(ws.userId)) clients.set(ws.userId, new Set());
          clients.get(ws.userId).add(ws);
          return ws.send(JSON.stringify({ type: 'ready', userId: ws.userId }));
        }
        if (msg.type === 'message') return await handleChatMessage(ws, msg);
        if (msg.type === 'typing') {
          const match = await isMatchMember(Number(msg.matchId), ws.userId);
          if (!match) return undefined;
          const other = match.user_a === ws.userId ? match.user_b : match.user_a;
          return await publishToUser(other, { type: 'typing', matchId: Number(msg.matchId), userId: ws.userId });
        }
        return ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
      } catch (err) {
        if (!ws.userId) return ws.close(4001, 'Invalid token');
        console.error('WS handler error', err);
        return ws.send(JSON.stringify({ type: 'error', error: 'Server error' }));
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimer);
      const set = clients.get(ws.userId);
      if (set) {
        set.delete(ws);
        if (!set.size) clients.delete(ws.userId);
      }
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);
  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}
