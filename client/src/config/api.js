// Centralized API base URL resolver
const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  viteEnv?.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

export function withApiBase(path) {
  const base = API_BASE_URL;
  if (!base) return path; // fallback to relative for local proxy/dev
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

