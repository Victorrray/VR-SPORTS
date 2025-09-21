import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { usePlan } from './usePlan';
import { loadPlanInfo, isPlanInfoStale } from '../utils/planCache';
import { apiUsageEvents } from './useMarkets';

const DEFAULT_ME = {
  plan: 'free',
  remaining: 250,
  limit: 250,
  calls_made: 0,
  stale: false,
};

function planToUsage(info) {
  if (!info) return DEFAULT_ME;
  const quota = info.quota ?? info.limit ?? 250;
  const used = info.used ?? info.calls_made ?? 0;
  const remaining = info.remaining ?? (quota ? Math.max(0, quota - used) : 250);
  return {
    plan: info.plan || 'free',
    remaining,
    limit: quota,
    calls_made: used,
    stale: Boolean(info.stale),
  };
}

export function useMe() {
  const { session, authLoading } = useAuth();
  const { plan, planLoading, refreshPlan } = usePlan();
  const initialPlan = plan || loadPlanInfo();

  const [me, setMe] = useState(() => {
    // Check if user is demo user and should have platinum access
    const isDemoUser = session?.user?.id === '54276b6c-5255-4117-be95-70c22132591c';
    if (isDemoUser) {
      console.log('🎯 useMe: Demo user detected, setting platinum plan immediately');
      return {
        plan: 'platinum',
        remaining: null,
        limit: null,
        calls_made: 0,
        stale: false,
      };
    }

    return planToUsage(initialPlan);
  });
  const [loading, setLoading] = useState(() => planLoading || !initialPlan);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const refreshingRef = useRef(false);
  const lastUsageRefreshRef = useRef(0);

  const syncUsage = useCallback((info) => {
    setMe(planToUsage(info));
    setError(null);
  }, []);

  const runRefresh = useCallback(async ({ force = false } = {}) => {
    if (!refreshPlan || refreshingRef.current || !session) {
      return plan || loadPlanInfo();
    }

    refreshingRef.current = true;
    setLoading(true);

    try {
      const result = await refreshPlan({ force });
      if (result && mountedRef.current) {
        syncUsage(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to refresh usage');
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      refreshingRef.current = false;
    }
  }, [refreshPlan, session, plan, syncUsage]);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    if (plan) {
      syncUsage(plan);
      setLoading(planLoading);
    }
  }, [plan, planLoading, syncUsage]);

  useEffect(() => {
    if (authLoading) return;

    const currentPlan = plan || loadPlanInfo();
    if (!session) {
      setLoading(false);
      syncUsage(currentPlan);
      return;
    }

    if (!currentPlan) {
      runRefresh({ force: true });
    } else if (isPlanInfoStale(currentPlan)) {
      runRefresh({ force: false });
    } else {
      setLoading(planLoading);
    }
  }, [authLoading, session, plan, planLoading, runRefresh, syncUsage]);

  useEffect(() => {
    const handleUsage = () => {
      const now = Date.now();
      if (now - lastUsageRefreshRef.current >= 120000) {
        lastUsageRefreshRef.current = now;
        runRefresh({ force: false });
      }
    };

    apiUsageEvents.addEventListener('apiCallMade', handleUsage);
    return () => apiUsageEvents.removeEventListener('apiCallMade', handleUsage);
  }, [runRefresh]);

  return {
    me,
    loading,
    error,
    refresh: runRefresh,
  };
}
