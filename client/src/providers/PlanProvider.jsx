import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loadPlanInfo, savePlanInfo, clearPlanInfo, isPlanInfoStale } from '../utils/planCache';
import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';

const PlanContext = createContext(null);

const PLAN_TTL_MS = 30_000;
const PREMIUM_GRACE_MS = 900_000;
const REFRESH_DEBOUNCE_MS = 60_000;

const PREMIUM_PLANS = new Set(['platinum', 'premium', 'vip']);
const isPremiumPlan = (plan) => PREMIUM_PLANS.has(String(plan || '').toLowerCase());

const defaultPlan = {
  plan: 'free',
  quota: null,
  used: null,
  remaining: null,
  fetchedAt: null,
  stale: true,
  source: 'default'
};

export const PlanProvider = ({ children }) => {
  const { user, authLoading } = useAuth();
  const [plan, setPlan] = useState(() => loadPlanInfo());
  const planRef = useRef(plan || null);
  const [planLoading, setPlanLoading] = useState(false);
  const [metrics, setMetrics] = useState({ lastSource: plan?.source || 'cache', lastDurationMs: null, retries: 0 });

  const fetchStateRef = useRef({
    promise: null,
    controller: null,
    currentToken: null,
    lastFetch: plan?.fetchedAt ? new Date(plan.fetchedAt).getTime() : 0,
    lastDurationMs: null,
    retries: 0,
    lastPremiumSeen: plan && isPremiumPlan(plan.plan) && plan.fetchedAt ? new Date(plan.fetchedAt).getTime() : 0,
    lastVisibilityRefresh: 0,
    lastOnlineRefresh: 0,
  });

  useEffect(() => {
    planRef.current = plan || null;
    if (plan && isPremiumPlan(plan.plan)) {
      const ts = plan.fetchedAt ? new Date(plan.fetchedAt).getTime() : Date.now();
      fetchStateRef.current.lastPremiumSeen = Math.max(fetchStateRef.current.lastPremiumSeen || 0, ts);
    }
  }, [plan]);

  const updatePlanState = useCallback((nextPlan) => {
    planRef.current = nextPlan;
    setPlan(nextPlan);
    if (nextPlan) {
      savePlanInfo(nextPlan);
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

    if (!force) {
      if (state.promise) {
        return state.promise;
      }
      if (state.lastFetch && now - state.lastFetch < PLAN_TTL_MS && cachedPlan) {
        return cachedPlan;
      }
    }

    if (state.promise) {
      state.controller?.abort();
    }

    const controller = new AbortController();
    state.controller = controller;
    const requestToken = Symbol('planFetch');
    state.currentToken = requestToken;

    setPlanLoading(true);

    const promise = (async () => {
      const started = Date.now();
      let finalPlan = cachedPlan || { ...defaultPlan };
      let finalSource = finalPlan?.source || 'cache';

      try {
        const response = await secureFetch(withApiBase('/api/me/usage'), {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Plan fetch failed (${response.status})`);
        }

        const data = await response.json();
        finalPlan = {
          plan: data.plan || 'free',
          quota: data.quota ?? null,
          used: data.used ?? null,
          remaining: data.remaining ?? null,
          fetchedAt: new Date().toISOString(),
          stale: !!data.stale,
          source: data.source || 'live'
        };

        state.lastFetch = Date.now();
        state.retries = 0;
        if (isPremiumPlan(finalPlan.plan)) {
          state.lastPremiumSeen = state.lastFetch;
        }

        updatePlanState(finalPlan);
        finalSource = finalPlan.source || 'live';
      } catch (error) {
        if (!controller.signal.aborted) {
          state.retries = Math.min((state.retries || 0) + 1, 10);
        }

        const fallback = planRef.current || loadPlanInfo();
        if (fallback) {
          finalPlan = {
            ...fallback,
            stale: true,
            source: fallback.source || (controller.signal.aborted ? 'aborted' : 'cache'),
          };
          updatePlanState(finalPlan);
          finalSource = finalPlan.source;
        } else {
          finalPlan = {
            ...defaultPlan,
            fetchedAt: new Date().toISOString(),
            stale: true,
            source: controller.signal.aborted ? 'aborted' : 'default',
          };
          updatePlanState(finalPlan);
          finalSource = finalPlan.source;
        }
      } finally {
        if (state.currentToken === requestToken) {
          state.promise = null;
          state.controller = null;
          state.currentToken = null;
          state.lastDurationMs = Date.now() - started;
          setMetrics({
            lastSource: finalSource,
            lastDurationMs: state.lastDurationMs,
            retries: state.retries || 0,
          });
          setPlanLoading(false);
        }
      }

      return finalPlan;
    })();

    state.promise = promise;
    return promise;
  }, [updatePlanState, user]);

  useEffect(() => {
    if (authLoading) return;

    const state = fetchStateRef.current;
    if (!user) {
      if (state.controller) state.controller.abort();
      setPlan(null);
      planRef.current = null;
      setPlanLoading(false);
      setMetrics({ lastSource: 'default', lastDurationMs: null, retries: 0 });
      clearPlanInfo();
      fetchStateRef.current = {
        promise: null,
        controller: null,
        currentToken: null,
        lastFetch: 0,
        lastDurationMs: null,
        retries: 0,
        lastPremiumSeen: 0,
        lastVisibilityRefresh: 0,
        lastOnlineRefresh: 0,
      };
      return;
    }

    const cached = planRef.current || loadPlanInfo();
    if (!cached) {
      refreshPlan({ force: true });
    } else if (isPlanInfoStale(cached)) {
      refreshPlan({ force: false });
    }
  }, [authLoading, refreshPlan, user]);

  useEffect(() => {
    if (!user) return undefined;

    const handleVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState !== 'visible') return;
      const state = fetchStateRef.current;
      const now = Date.now();
      if (now - (state.lastVisibilityRefresh || 0) >= REFRESH_DEBOUNCE_MS) {
        state.lastVisibilityRefresh = now;
        refreshPlan({ force: false });
      }
    };

    const handleOnline = () => {
      const state = fetchStateRef.current;
      const now = Date.now();
      if (now - (state.lastOnlineRefresh || 0) >= REFRESH_DEBOUNCE_MS) {
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

  const now = Date.now();
  const lastPremiumSeen = fetchStateRef.current.lastPremiumSeen || 0;
  const isPremiumEffective = Boolean(
    (plan && isPremiumPlan(plan.plan)) ||
    (lastPremiumSeen && now - lastPremiumSeen < PREMIUM_GRACE_MS)
  );

  const contextValue = useMemo(() => ({
    plan,
    planLoading,
    stale: Boolean(plan?.stale),
    isPremiumEffective,
    metrics,
    refreshPlan,
  }), [plan, planLoading, isPremiumEffective, metrics, refreshPlan]);

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
