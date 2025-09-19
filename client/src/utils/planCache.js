const CACHE_KEY = 'oss-plan-info';
export const PLAN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('planCache: failed to parse cached plan info', err);
    return null;
  }
}

export function loadPlanInfo() {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  const parsed = safeParse(raw);
  if (!parsed) return null;

  return parsed;
}

export function savePlanInfo(info) {
  if (!isBrowser || !info) return;
  const payload = {
    ...info,
    cachedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('planCache: failed to persist plan info', err);
  }
}

export function clearPlanInfo() {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.warn('planCache: failed to clear plan info', err);
  }
}

export function isPlanInfoStale(info, ttl = PLAN_CACHE_TTL) {
  if (!info) return true;

  const timestamp = info.fetchedAt || info.cachedAt;
  if (!timestamp) return true;

  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return true;

  return Date.now() - time > ttl;
}
