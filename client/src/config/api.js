// Centralized API base URL resolver
const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};

// Environment variable resolution with better fallbacks
export const API_BASE_URL = (() => {
  // Development: Use LOCAL backend
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Using LOCAL backend at http://localhost:10000');
    return 'http://localhost:10000';
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
  
  console.log('🔍 withApiBase called with:', { path, base, NODE_ENV: process.env.NODE_ENV });

  // Use production URL in development mode since local backend is not available
  if (process.env.NODE_ENV === 'development') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const result = `${base}${cleanPath}`;
    console.log('🔍 withApiBase (dev) returning:', result);
    return result;
  }

  if (!base) return path; // fallback to relative for local proxy/dev
  if (path.startsWith('http')) return path;
  const result = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log('🔍 withApiBase (prod) returning:', result);
  return result;
}
