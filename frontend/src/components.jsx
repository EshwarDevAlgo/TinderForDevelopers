export const ROLES = ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'data', 'ml', 'designer', 'qa', 'security'];
export const SENIORITY = ['junior', 'mid', 'senior', 'lead'];
export const LOOKING_FOR = [
  { value: 'mixed', label: 'Both – similar stack & complementary roles' },
  { value: 'similar', label: 'Similar – people with my stack' },
  { value: 'complementary', label: 'Complementary – roles I can learn from' },
];

export function Avatar({ src, name, size = 48 }) {
  const fallback = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || '?')}`;
  return (
    <img
      className="avatar"
      src={src || fallback}
      alt={name}
      width={size}
      height={size}
      onError={(e) => {
        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
      }}
    />
  );
}

export function Tags({ items = [], highlight = [] }) {
  const hl = new Set(highlight.map((h) => h.toLowerCase()));
  return (
    <div className="tags">
      {items.map((t) => (
        <span key={t} className={`tag ${hl.has(t.toLowerCase()) ? 'hl' : ''}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

const toList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

/** Shared profile fields for register + edit. `value` uses comma strings for list fields. */
export function ProfileFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <>
      <label>
        Name
        <input required maxLength={80} value={value.name} onChange={set('name')} />
      </label>
      <div className="row">
        <label>
          Role
          <select value={value.role} onChange={set('role')}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Seniority
          <select value={value.seniority} onChange={set('seniority')}>
            {SENIORITY.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Years exp.
          <input type="number" min={0} max={60} value={value.years_experience} onChange={set('years_experience')} />
        </label>
      </div>
      <label>
        Tech stack <small>(comma separated, e.g. React, TypeScript)</small>
        <input value={value.tech_stack} onChange={set('tech_stack')} />
      </label>
      <label>
        Interests <small>(comma separated)</small>
        <input value={value.interests} onChange={set('interests')} />
      </label>
      <label>
        Looking for
        <select value={value.looking_for} onChange={set('looking_for')}>
          {LOOKING_FOR.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label>
        Bio
        <textarea rows={3} maxLength={600} value={value.bio} onChange={set('bio')} />
      </label>
      <div className="row">
        <label>
          Location
          <input maxLength={80} value={value.location} onChange={set('location')} />
        </label>
        <label>
          GitHub URL
          <input placeholder="https://github.com/you" value={value.github_url} onChange={set('github_url')} />
        </label>
      </div>
    </>
  );
}

export const profileToForm = (p = {}) => ({
  name: p.name || '',
  role: p.role || 'frontend',
  seniority: p.seniority || 'mid',
  years_experience: p.years_experience ?? 1,
  tech_stack: (p.tech_stack || []).join(', '),
  interests: (p.interests || []).join(', '),
  looking_for: p.looking_for || 'mixed',
  bio: p.bio || '',
  location: p.location || '',
  github_url: p.github_url || '',
});

export const formToPayload = (f) => ({
  ...f,
  years_experience: Number(f.years_experience) || 0,
  tech_stack: toList(f.tech_stack),
  interests: toList(f.interests),
});
