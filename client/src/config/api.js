// Centralized API base URL resolver
const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};

// Environment variable resolution with better fallbacks
export const API_BASE_URL = (() => {
  // Development: Use proxy for local development
  if (process.env.NODE_ENV === 'development') {
    return ''; // Use relative paths for proxy
  }

  // Production: Try environment variables in order of preference
  const envCandidates = [
    process.env.REACT_APP_API_BASE_URL,
    viteEnv?.VITE_API_BASE_URL,
    process.env.REACT_APP_VR_SPORTS_API_URL,
    process.env.REACT_APP_API_URL
  ];

  // Return first valid URL
  for (const candidate of envCandidates) {
    if (candidate && candidate.trim()) {
      return candidate.replace(/\/$/, '');
    }
  }

  // Fallback to production URL if no environment variables are set
  console.warn('⚠️ No API base URL found in environment variables, using fallback');
  return 'https://odds-backend-4e9q.onrender.com';
})();

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
