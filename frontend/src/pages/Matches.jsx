import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar } from '../components.jsx';
import { useSocket } from '../socket.jsx';

export default function Matches() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => api('/matches').then(setMatches).catch((e) => setError(e.message));
    load();
    return subscribe((msg) => {
      if (msg.type === 'match' || msg.type === 'message') load();
    });
  }, [subscribe]);

  if (error) return <p className="error">{error}</p>;
  if (!matches) return <div className="center muted">Loading…</div>;
  if (!matches.length) {
    return (
      <div className="center card">
        <p>No matches yet. Start swiping!</p>
        <Link to="/" className="btn primary">Discover</Link>
      </div>
    );
  }

  return (
    <div className="list">
      {matches.map((m) => (
        <Link key={m.id} to={`/chat/${m.id}`} className="card list-item">
          <Avatar src={m.user.avatar_url} name={m.user.name} size={56} />
          <div className="grow">
            <strong>{m.user.name}</strong> <span className="muted small">{m.user.role}</span>
            <div className="muted small ellipsis">
              {m.last_message
                ? `${m.last_sender_id === user.id ? 'You: ' : ''}${m.last_message}`
                : 'New match — say hi 👋'}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
