// Hook to expose cached usage/plan information across the app
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { loadPlanInfo, isPlanInfoStale } from '../utils/planCache';
import { apiUsageEvents } from './useMarkets';

const DEFAULT_ME = {
  plan: 'free',
  remaining: 250,
  limit: 250,
  calls_made: 0,
  stale: false,
};

function planInfoToUsage(info) {
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
  const { planInfo, refreshPlan, loading: authLoading, session } = useAuth();
  const initialPlan = planInfo || loadPlanInfo();

  const [me, setMe] = useState(() => planInfoToUsage(initialPlan));
  const [loading, setLoading] = useState(() => !initialPlan);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const refreshingRef = useRef(false);

  const syncUsage = useCallback((info) => {
    setMe(planInfoToUsage(info));
    setError(null);
  }, []);

  const forceRefresh = useCallback(async () => {
    if (!refreshPlan || refreshingRef.current || !session) {
      return planInfo || loadPlanInfo();
    }

    refreshingRef.current = true;
    setLoading(true);

    try {
      const result = await refreshPlan({ force: true });
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
  }, [refreshPlan, session, planInfo, syncUsage]);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    if (planInfo) {
      syncUsage(planInfo);
      setLoading(false);
    }
  }, [planInfo, syncUsage]);

  useEffect(() => {
    if (authLoading) return;

    const current = planInfo || loadPlanInfo();
    if (!session) {
      setLoading(false);
      syncUsage(current);
      return;
    }

    if (!current || isPlanInfoStale(current)) {
      forceRefresh();
    } else {
      setLoading(false);
    }
  }, [authLoading, session, planInfo, forceRefresh, syncUsage]);

  useEffect(() => {
    const handleUsage = () => {
      setTimeout(() => {
        forceRefresh();
      }, 1000);
    };

    apiUsageEvents.addEventListener('apiCallMade', handleUsage);
    return () => apiUsageEvents.removeEventListener('apiCallMade', handleUsage);
  }, [forceRefresh]);

  return {
    me,
    loading,
    error,
    refresh: forceRefresh,
  };
}
