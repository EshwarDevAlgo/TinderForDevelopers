import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, Tags } from '../components.jsx';

export default function ProfileView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [meta, setMeta] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    const start = performance.now();
    api(`/profiles/${id}`, { raw: true }).then(async (res) => {
      const body = await res.json();
      if (!res.ok) return setStatus(body.error);
      setProfile(body);
      setMeta({ cache: res.headers.get('x-cache'), ms: Math.round(performance.now() - start) });
      return undefined;
    });
  }, [id]);

  const swipe = async (liked) => {
    const res = await api('/swipes', { method: 'POST', body: { targetId: profile.id, liked } });
    if (res.matched) navigate(`/chat/${res.matchId}`);
    else setStatus(liked ? 'Liked! You will match if they like you back.' : 'Passed.');
  };

  if (!profile) return <div className="center muted">{status || 'Loading…'}</div>;
  const isMe = profile.id === user.id;

  return (
    <div className="card profile">
      <div className="swipe-head">
        <Avatar src={profile.avatar_url} name={profile.name} size={140} />
        <div>
          <h1>{profile.name}</h1>
          <p className="muted">
            {profile.seniority} · {profile.role} · {profile.years_experience} yrs · {profile.location}
          </p>
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
              {profile.github_url}
            </a>
          )}
          <p className="muted small">
            Redis cache: {meta.cache || '—'} · {meta.ms} ms
          </p>
        </div>
      </div>
      <p>{profile.bio}</p>
      <h4>Tech stack</h4>
      <Tags items={profile.tech_stack} highlight={user.tech_stack} />
      <h4>Interests</h4>
      <Tags items={profile.interests} highlight={user.interests} />
      <p className="muted">Looking for: {profile.looking_for}</p>
      {!isMe && (
        <div className="actions">
          <button className="btn round pass" onClick={() => swipe(false)}>✕</button>
          <button className="btn round like" onClick={() => swipe(true)}>♥</button>
        </div>
      )}
      {status && <p className="muted center">{status}</p>}
    </div>
  );
}
