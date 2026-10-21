import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const listeners = useRef(new Set());
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let closed = false;
    let retry = 1000;
    let timer;

    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
      ws.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (msg.type === 'ready') {
          setConnected(true);
          retry = 1000;
        }
        if (msg.type === 'match') setToast(`It's a match with ${msg.user?.name}! 🎉`);
        listeners.current.forEach((fn) => fn(msg));
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) {
          timer = setTimeout(connect, retry);
          retry = Math.min(retry * 2, 15000);
        }
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [token]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const send = useCallback((payload) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  return (
    <SocketContext.Provider value={{ connected, send, subscribe, notify: setToast }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
