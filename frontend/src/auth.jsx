import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [token, setTok] = useState(getToken());

  useEffect(() => {
    if (!token) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => {
        setToken(null);
        setTok(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const onLogout = () => {
      setTok(null);
      setUser(null);
    };
    window.addEventListener('devmatch:logout', onLogout);
    return () => window.removeEventListener('devmatch:logout', onLogout);
  }, []);

  const handleAuth = useCallback((data) => {
    setToken(data.token);
    setTok(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => handleAuth(await api('/auth/login', { method: 'POST', body: { email, password } })),
    [handleAuth],
  );
  const register = useCallback(
    async (payload) => handleAuth(await api('/auth/register', { method: 'POST', body: payload })),
    [handleAuth],
  );
  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
