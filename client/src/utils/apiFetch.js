import { withApiBase } from '../config/api';

export async function apiFetch(path, options = {}) {
  const url = withApiBase(path);
  const opts = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  };
  const res = await fetch(url, opts);
  let body;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }
  if (!res.ok) {
    const code = body?.code || body?.error || String(res.status);
    const hint = body?.hint || body?.detail || undefined;
    const err = new Error(body?.message || body?.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.code = code;
    err.hint = hint;
    err.body = body;
    throw err;
  }
  return body;
}

