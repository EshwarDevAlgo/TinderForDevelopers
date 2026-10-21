import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@devmatch.dev');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card card">
      <h1>Find your dev match</h1>
      <p className="muted">Connect with developers who share your stack — or complement it.</p>
      <form onSubmit={submit} className="form">
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="muted small">
        Demo accounts: <code>demo@devmatch.dev</code> (React) / <code>backend@devmatch.dev</code> (Spring) — password{' '}
        <code>DevMatch123!</code>
      </p>
      <p>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
