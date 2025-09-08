export function getApiBase() {
  const env = import.meta?.env || process?.env || {};
  const fromEnv = env.VITE_API_BASE || env.REACT_APP_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/+$/,"");
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:10000`; // dev default
}
