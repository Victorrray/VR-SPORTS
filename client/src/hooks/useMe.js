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
  const { planInfo, refreshPlan, authLoading, planLoading: authPlanLoading, session } = useAuth();
  const initialPlan = planInfo || loadPlanInfo();

  const [me, setMe] = useState(() => planInfoToUsage(initialPlan));
  const [localLoading, setLocalLoading] = useState(() => authPlanLoading || !initialPlan);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const refreshingRef = useRef(false);
  const lastUsageRefreshRef = useRef(0);

  const syncUsage = useCallback((info) => {
    setMe(planInfoToUsage(info));
    setError(null);
  }, []);

  const forceRefresh = useCallback(async ({ force = false } = {}) => {
    if (!refreshPlan || refreshingRef.current || !session) {
      return planInfo || loadPlanInfo();
    }

    refreshingRef.current = true;
    setLocalLoading(true);

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
        setLocalLoading(false);
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
      setLocalLoading(false);
    }
  }, [planInfo, syncUsage]);

  useEffect(() => {
    if (authLoading) return;

    const current = planInfo || loadPlanInfo();
    if (!session) {
      setLocalLoading(false);
      syncUsage(current);
      return;
    }

    if (!current) {
      forceRefresh({ force: true });
    } else if (isPlanInfoStale(current)) {
      forceRefresh({ force: false });
    } else {
      setLocalLoading(false);
    }
  }, [authLoading, session, planInfo, forceRefresh, syncUsage]);

  useEffect(() => {
    const handleUsage = () => {
      const now = Date.now();
      if (now - lastUsageRefreshRef.current >= 120000) {
        lastUsageRefreshRef.current = now;
        forceRefresh({ force: false });
      }
    };

    apiUsageEvents.addEventListener('apiCallMade', handleUsage);
    return () => apiUsageEvents.removeEventListener('apiCallMade', handleUsage);
  }, [forceRefresh]);

  const combinedLoading = authPlanLoading || localLoading;

  return {
    me,
    loading: combinedLoading,
    planLoading: combinedLoading,
    error,
    refresh: forceRefresh,
  };
}
