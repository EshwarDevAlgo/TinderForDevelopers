import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, ROLES, Tags } from '../components.jsx';

export default function Browse() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ q: '', role: '', tech: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ profiles: [], total: 0, pageSize: 24 });
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const t = setTimeout(() => {
      api(`/profiles?${params}`).then(setData).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filters, page]);

  const set = (k) => (e) => {
    setPage(1);
    setFilters({ ...filters, [k]: e.target.value });
  };
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div>
      <div className="toolbar">
        <input placeholder="Search name, bio, stack…" value={filters.q} onChange={set('q')} />
        <select value={filters.role} onChange={set('role')}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input placeholder="Exact tech (e.g. React)" value={filters.tech} onChange={set('tech')} />
      </div>
      {error && <p className="error">{error}</p>}
      <p className="muted">{data.total} developers</p>
      <div className="grid">
        {data.profiles.map((p) => (
          <Link key={p.id} to={`/profiles/${p.id}`} className="card mini">
            <div className="row">
              <Avatar src={p.avatar_url} name={p.name} />
              <div>
                <strong>{p.name}</strong>
                <div className="muted small">
                  {p.seniority} {p.role} · {p.location}
                </div>
              </div>
            </div>
            <Tags items={p.tech_stack} highlight={user.tech_stack} />
          </Link>
        ))}
      </div>
      <div className="pager">
        <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
        <span>
          Page {page} / {pages}
        </span>
        <button className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next ›</button>
      </div>
    </div>
  );
}
