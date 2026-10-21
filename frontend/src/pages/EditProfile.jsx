import { useState } from 'react';
import { api, uploadAvatar, waitForImage } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, ProfileFields, formToPayload, profileToForm } from '../components.jsx';

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(profileToForm(user));
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api('/profiles/me', {
        method: 'PATCH',
        body: { ...formToPayload(form), avatar_url: avatarUrl },
      });
      setUser({ ...user, ...updated });
      setStatus('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setStatus('Uploading…');
    try {
      const url = await uploadAvatar(file);
      setStatus('Processing image (Lambda is reducing resolution)…');
      const ready = await waitForImage(url);
      const updated = await api('/profiles/me', { method: 'PATCH', body: { avatar_url: url } });
      setUser({ ...user, ...updated });
      setAvatarUrl(url);
      setStatus(ready ? 'Profile picture updated' : 'Uploaded – the picture will appear shortly');
    } catch (err) {
      setStatus('');
      setError(err.message);
    }
  };

  return (
    <div className="card wide">
      <h1>Your profile</h1>
      <div className="row avatar-edit">
        <Avatar src={avatarUrl} name={form.name} size={120} />
        <div className="form">
          <label>
            Upload picture <small>(JPEG/PNG, max 5 MB)</small>
            <input type="file" accept="image/jpeg,image/png" onChange={onFile} />
          </label>
          <label>
            …or image URL
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </label>
        </div>
      </div>
      <form className="form" onSubmit={save}>
        <ProfileFields value={form} onChange={setForm} />
        {error && <p className="error">{error}</p>}
        {status && <p className="success">{status}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </div>
  );
}
