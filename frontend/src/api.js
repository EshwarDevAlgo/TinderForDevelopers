const TOKEN_KEY = 'devmatch_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('devmatch:logout'));
  }
  if (raw) return res;
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  return data;
}

export async function uploadAvatar(file) {
  const presign = await api('/uploads/avatar', { method: 'POST', body: { contentType: file.type } });
  if (file.size > presign.maxBytes) throw new Error(`Image must be under ${Math.round(presign.maxBytes / 1048576)} MB`);
  const form = new FormData();
  Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v));
  form.append('file', file);
  const res = await fetch(presign.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload to storage failed');
  return presign.avatarUrl;
}

/** Waits for the Lambda to publish the processed (downsized) image. */
export async function waitForImage(url, attempts = 15) {
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
    if (res?.ok) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}
