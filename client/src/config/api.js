// Centralized API base URL resolver
const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
export const API_BASE_URL = (
  // Preferred
  process.env.REACT_APP_API_BASE_URL ||
  viteEnv?.VITE_API_BASE_URL ||
  // Backwards-compat fallbacks
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_VR_SPORTS_API_URL ||
  ''
).replace(/\/$/, '');

export function withApiBase(path) {
  const base = API_BASE_URL;
  // Force local development to use relative paths for proxy
  if (process.env.NODE_ENV === 'development') {
    return path; // Use relative path for local proxy
  }
  if (!base) return path; // fallback to relative for local proxy/dev
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
