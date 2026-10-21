import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, Tags } from '../components.jsx';

const MODES = [
  { value: 'mixed', label: 'For you' },
  { value: 'similar', label: 'Same stack' },
  { value: 'complementary', label: 'Complementary' },
];

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(user.looking_for || 'mixed');
  const [ai, setAi] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [match, setMatch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/profiles/discover?mode=${mode}&ai=${ai}`);
      setQueue(data.profiles);
      setAiAvailable(data.aiAvailable);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, ai]);

  useEffect(() => {
    load();
  }, [load]);

  const current = queue[0];

  const swipe = async (liked) => {
    if (!current) return;
    setQueue((q) => q.slice(1));
    try {
      const res = await api('/swipes', { method: 'POST', body: { targetId: current.id, liked } });
      if (res.matched) setMatch({ ...current, matchId: res.matchId });
    } catch (err) {
      setError(err.message);
    }
    if (queue.length <= 2) load();
  };

  return (
    <div className="discover">
      <div className="toolbar">
        <div className="tabs">
          {MODES.map((m) => (
            <button key={m.value} className={mode === m.value ? 'active' : ''} onClick={() => setMode(m.value)}>
              {m.label}
            </button>
          ))}
        </div>
        <label className="toggle" title={aiAvailable ? '' : 'Set OPENAI_API_KEY on the server to enable'}>
          <input type="checkbox" checked={ai} disabled={!aiAvailable} onChange={(e) => setAi(e.target.checked)} />
          AI recommendations
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && !current && <div className="center muted">Finding developers…</div>}
      {!loading && !current && (
        <div className="center card">
          <p>You have seen everyone for now 🎉</p>
          <Link to="/browse" className="btn">Browse all developers</Link>
        </div>
      )}

      {current && (
        <div className="swipe-card card" key={current.id}>
          <div className="swipe-head">
            <Avatar src={current.avatar_url} name={current.name} size={120} />
            <div>
              <h2>
                <Link to={`/profiles/${current.id}`}>{current.name}</Link>
              </h2>
              <p className="muted">
                {current.seniority} · {current.role} · {current.years_experience} yrs · {current.location}
              </p>
              <span className={`badge ${current.match.kind}`}>
                {current.match.source === 'ai' ? '✨ AI · ' : ''}
                {current.match.kind === 'complementary' ? 'Complementary' : 'Similar stack'} ·{' '}
                {Math.round(current.match.score * 100)}%
              </span>
            </div>
          </div>
          <p className="reason">💡 {current.match.reason}</p>
          <p>{current.bio}</p>
          <h4>Tech stack</h4>
          <Tags items={current.tech_stack} highlight={user.tech_stack} />
          <h4>Interests</h4>
          <Tags items={current.interests} highlight={user.interests} />
          <div className="actions">
            <button className="btn round pass" onClick={() => swipe(false)} aria-label="Pass">✕</button>
            <button className="btn round like" onClick={() => swipe(true)} aria-label="Like">♥</button>
          </div>
        </div>
      )}

      {match && (
        <div className="modal" onClick={() => setMatch(null)}>
          <div className="card center" onClick={(e) => e.stopPropagation()}>
            <h2>It&apos;s a match! 🎉</h2>
            <Avatar src={match.avatar_url} name={match.name} size={96} />
            <p>You and {match.name} liked each other.</p>
            <div className="row">
              <button className="btn" onClick={() => setMatch(null)}>Keep swiping</button>
              <button className="btn primary" onClick={() => navigate(`/chat/${match.matchId}`)}>Say hi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
