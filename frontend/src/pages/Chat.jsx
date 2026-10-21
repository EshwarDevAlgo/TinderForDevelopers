import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar } from '../components.jsx';
import { useSocket } from '../socket.jsx';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { send, subscribe, connected } = useSocket();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    api(`/matches/${matchId}/messages`)
      .then((d) => {
        setOther(d.user);
        setMessages(d.messages);
      })
      .catch((e) => setError(e.message));
  }, [matchId]);

  useEffect(() => {
    let typingTimer;
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'message' && msg.message.match_id === Number(matchId)) {
        setMessages((prev) => (prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message]));
        setTyping(false);
      }
      if (msg.type === 'typing' && msg.matchId === Number(matchId)) {
        setTyping(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => setTyping(false), 3000);
      }
      if (msg.type === 'error') setError(msg.error);
    });
    return () => {
      clearTimeout(typingTimer);
      unsubscribe();
    };
  }, [matchId, subscribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const submit = (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (send({ type: 'message', matchId: Number(matchId), content })) {
      setText('');
      setError('');
    } else {
      setError('Not connected – reconnecting…');
    }
  };

  const onType = (e) => {
    setText(e.target.value);
    if (Date.now() - lastTypingSent.current > 2000) {
      lastTypingSent.current = Date.now();
      send({ type: 'typing', matchId: Number(matchId) });
    }
  };

  return (
    <div className="chat card">
      <div className="chat-head">
        <Link to="/matches">‹</Link>
        {other && (
          <Link to={`/profiles/${other.id}`} className="row">
            <Avatar src={other.avatar_url} name={other.name} size={40} />
            <div>
              <strong>{other.name}</strong>
              <div className="muted small">{other.role} · {other.tech_stack?.slice(0, 3).join(', ')}</div>
            </div>
          </Link>
        )}
        <span className={`dot ${connected ? 'on' : ''}`} />
      </div>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender_id === user.id ? 'mine' : ''}`}>
            {m.content}
            <time>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        ))}
        {typing && <div className="muted small">{other?.name} is typing…</div>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="error">{error}</p>}
      <form className="composer" onSubmit={submit}>
        <input value={text} onChange={onType} maxLength={2000} placeholder="Type a message…" />
        <button className="btn primary" disabled={!connected}>Send</button>
      </form>
    </div>
  );
}
