import { LOOKING_FOR, ROLES, SENIORITY } from './constants.js';

export const PUBLIC_PROFILE_COLUMNS =
  'id, name, role, seniority, bio, tech_stack, interests, looking_for, location, years_experience, github_url, avatar_url, created_at';

const cleanList = (value, max = 15) => {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean).map((s) => s.slice(0, 40)))].slice(0, max);
};

const str = (v, max) => String(v ?? '').trim().slice(0, max);

/** Validates and normalizes editable profile fields. Returns { values, error }. */
export function parseProfileInput(body, { partial = false } = {}) {
  const values = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('name')) {
    values.name = str(body.name, 80);
    if (!values.name) return { error: 'name is required' };
  }
  if (!partial || has('role')) {
    values.role = str(body.role, 20).toLowerCase();
    if (!ROLES.includes(values.role)) return { error: `role must be one of: ${ROLES.join(', ')}` };
  }
  if (has('seniority')) {
    values.seniority = str(body.seniority, 10).toLowerCase();
    if (!SENIORITY.includes(values.seniority)) return { error: `seniority must be one of: ${SENIORITY.join(', ')}` };
  }
  if (has('looking_for')) {
    values.looking_for = str(body.looking_for, 20).toLowerCase();
    if (!LOOKING_FOR.includes(values.looking_for)) return { error: `looking_for must be one of: ${LOOKING_FOR.join(', ')}` };
  }
  if (has('bio')) values.bio = str(body.bio, 600);
  if (has('location')) values.location = str(body.location, 80);
  if (has('tech_stack')) values.tech_stack = cleanList(body.tech_stack);
  if (has('interests')) values.interests = cleanList(body.interests);
  if (has('years_experience')) {
    const n = Number(body.years_experience);
    if (!Number.isInteger(n) || n < 0 || n > 60) return { error: 'years_experience must be 0-60' };
    values.years_experience = n;
  }
  if (has('github_url')) {
    values.github_url = str(body.github_url, 200);
    if (values.github_url && !/^https:\/\/(www\.)?github\.com\/[\w.-]+\/?$/i.test(values.github_url)) {
      return { error: 'github_url must look like https://github.com/username' };
    }
  }
  if (has('avatar_url')) {
    values.avatar_url = str(body.avatar_url, 300);
    if (values.avatar_url && !/^(https:\/\/|\/media\/)/.test(values.avatar_url)) {
      return { error: 'avatar_url must be https:// or an uploaded /media/ path' };
    }
  }
  return { values };
}
