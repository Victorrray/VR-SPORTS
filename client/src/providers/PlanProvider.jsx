import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { clearPlanInfo, isPlanInfoStale, loadPlanInfo, savePlanInfo } from '../utils/planCache';
import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';

const PlanContext = createContext(null);

const PLAN_TTL_MS = 30_000;
const PREMIUM_GRACE_MS = 900_000;
const POLITE_REFRESH_MS = 60_000;

const PREMIUM_PLANS = new Set(['platinum', 'premium', 'vip']);

const defaultPlan = {
  plan: 'free',
  quota: null,
  used: null,
  remaining: null,
  fetchedAt: null,
  stale: true,
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTimestamp = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const isPremiumPlan = (planId) => PREMIUM_PLANS.has(String(planId || '').toLowerCase());

const shapePlan = (data = {}) => {
  const quota = toNumber(data.quota ?? data.limit);
  const used = toNumber(data.used ?? data.calls_made);
  let remaining = toNumber(data.remaining);

  if (remaining === null && quota !== null && used !== null) {
    remaining = Math.max(0, quota - used);
  }

  const fetchedAt = new Date().toISOString();

  return {
    ...defaultPlan,
    ...data,
    plan: data.plan || 'free',
    quota,
    limit: quota,
    used,
    calls_made: used,
    remaining,
    fetchedAt,
    stale: Boolean(data.stale),
  };
};

export const PlanProvider = ({ children }) => {
  const { user, authLoading } = useAuth();

  const initialPlan = loadPlanInfo();
  const initialLastFetchAt = parseTimestamp(initialPlan?.fetchedAt || initialPlan?.cachedAt);
  const initialPremiumAt = isPremiumPlan(initialPlan?.plan)
    ? parseTimestamp(initialPlan?.fetchedAt || initialPlan?.cachedAt) || Date.now()
    : 0;

  const [plan, setPlan] = useState(initialPlan || null);
  const [planLoading, setPlanLoading] = useState(() => !initialPlan);
  const [metrics, setMetrics] = useState({
    lastSource: initialPlan ? 'cache' : 'live',
    lastDurationMs: null,
    retries: 0,
  });
  const [lastPremiumAt, setLastPremiumAt] = useState(initialPremiumAt);

  const planRef = useRef(initialPlan || null);
  const fetchStateRef = useRef({
    promise: null,
    controller: null,
    lastFetchAt: initialLastFetchAt,
    lastVisibilityRefresh: 0,
    lastOnlineRefresh: 0,
    retries: 0,
  });

  const updatePlanState = useCallback((nextPlan) => {
    if (!nextPlan) {
      planRef.current = null;
      setPlan(null);
      clearPlanInfo();
      return;
    }

    const shaped = {
      ...defaultPlan,
      ...nextPlan,
      plan: nextPlan.plan || 'free',
      fetchedAt: nextPlan.fetchedAt || new Date().toISOString(),
    };

    planRef.current = shaped;
    setPlan(shaped);
    savePlanInfo(shaped);

    const fetchedTime = parseTimestamp(shaped.fetchedAt);
    if (isPremiumPlan(shaped.plan)) {
      setLastPremiumAt(fetchedTime || Date.now());
    } else if (!shaped.stale) {
      setLastPremiumAt(0);
    }
  }, []);

  const refreshPlan = useCallback(async ({ force = false } = {}) => {
    if (!user) {
      setPlanLoading(false);
      return null;
    }

    const state = fetchStateRef.current;
    const now = Date.now();
    const cachedPlan = planRef.current || loadPlanInfo();

    if (state.promise) {
      return state.promise;
    }

    if (!force && cachedPlan && state.lastFetchAt && now - state.lastFetchAt < PLAN_TTL_MS) {
      setPlanLoading(false);
      setMetrics((prev) => ({ ...prev, lastSource: 'cache' }));
      return cachedPlan;
    }

    const controller = new AbortController();
    state.controller = controller;
    const startedAt = Date.now();

    setPlanLoading(true);

    const promise = (async () => {
      try {
        const response = await secureFetch(withApiBase('/api/me/usage'), {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Plan fetch failed (${response.status})`);
        }

        const payload = await response.json();
        const shaped = shapePlan(payload);

        state.lastFetchAt = Date.now();
        state.retries = 0;

        updatePlanState(shaped);
        setMetrics({
          lastSource: 'live',
          lastDurationMs: Date.now() - startedAt,
          retries: 0,
        });

        return shaped;
      } catch (error) {
        if (!controller.signal.aborted) {
          state.retries = Math.min((state.retries || 0) + 1, 10);
          state.lastFetchAt = Date.now();
        }

        const fallback = planRef.current || cachedPlan || loadPlanInfo() || { ...defaultPlan };
        const fallbackTimestamp = fallback.fetchedAt || fallback.cachedAt || new Date().toISOString();

        const staleFallback = {
          ...fallback,
          fetchedAt: fallbackTimestamp,
          stale: true,
        };

        updatePlanState(staleFallback);
        setMetrics({
          lastSource: 'cache',
          lastDurationMs: Date.now() - startedAt,
          retries: state.retries,
        });

        return staleFallback;
      } finally {
        if (fetchStateRef.current.promise === promise) {
          fetchStateRef.current.promise = null;
        }
        if (fetchStateRef.current.controller === controller) {
          fetchStateRef.current.controller = null;
        }
        setPlanLoading(false);
      }
    })();

    state.promise = promise;
    return promise;
  }, [updatePlanState, user]);

  useEffect(() => {
    if (authLoading) return;

    const state = fetchStateRef.current;

    if (!user) {
      state.controller?.abort();
      fetchStateRef.current = {
        promise: null,
        controller: null,
        lastFetchAt: 0,
        lastVisibilityRefresh: 0,
        lastOnlineRefresh: 0,
        retries: 0,
      };
      planRef.current = null;
      setPlan(null);
      setPlanLoading(false);
      setMetrics({ lastSource: 'cache', lastDurationMs: null, retries: 0 });
      setLastPremiumAt(0);
      clearPlanInfo();
      return;
    }

    const cached = planRef.current || loadPlanInfo();
    if (cached) {
      planRef.current = cached;
      setPlan(cached);
      const cachedTs = parseTimestamp(cached.fetchedAt || cached.cachedAt);
      state.lastFetchAt = cachedTs;
      if (isPremiumPlan(cached.plan)) {
        setLastPremiumAt(cachedTs || Date.now());
      }
    }

    const needsRefresh = !cached || isPlanInfoStale(cached, PLAN_TTL_MS);
    if (needsRefresh) {
      refreshPlan({ force: !cached });
    } else {
      setPlanLoading(false);
    }
  }, [authLoading, refreshPlan, updatePlanState, user]);

  useEffect(() => {
    if (!user) return undefined;

    const handleVisibility = () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
      const state = fetchStateRef.current;
      const now = Date.now();
      if (now - state.lastVisibilityRefresh >= POLITE_REFRESH_MS) {
        state.lastVisibilityRefresh = now;
        refreshPlan({ force: false });
      }
    };

    const handleOnline = () => {
      if (typeof window === 'undefined') return;
      const state = fetchStateRef.current;
      const now = Date.now();
      if (now - state.lastOnlineRefresh >= POLITE_REFRESH_MS) {
        state.lastOnlineRefresh = now;
        refreshPlan({ force: false });
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [refreshPlan, user]);

  useEffect(() => () => {
    const state = fetchStateRef.current;
    state.controller?.abort();
    state.promise = null;
  }, []);

  const stale = plan ? (Boolean(plan.stale) || isPlanInfoStale(plan, PLAN_TTL_MS)) : true;
  const now = Date.now();
  const isPremiumEffective = Boolean(isPremiumPlan(plan?.plan) || (lastPremiumAt && now - lastPremiumAt < PREMIUM_GRACE_MS));

  const contextValue = useMemo(() => ({
    plan,
    planLoading,
    stale,
    isPremiumEffective,
    refreshPlan,
    metrics,
  }), [plan, planLoading, stale, isPremiumEffective, refreshPlan, metrics]);

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
