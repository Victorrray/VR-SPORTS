import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import PlanGate from '../auth/PlanGate';
import { debugLog } from '../../lib/debug';

const PlanGuard = ({ children, requiresPlatinum = false }) => {
  const { user } = useAuth();
  const { plan, planLoading, isPremiumEffective, refreshPlan, stale } = usePlan();

  useEffect(() => {
    if (user && !plan && !planLoading) {
      refreshPlan({ force: true });
    }
  }, [user, plan, planLoading, refreshPlan]);

  useEffect(() => {
    if (user && stale && !planLoading) {
      refreshPlan({ force: false });
    }
  }, [user, stale, planLoading, refreshPlan]);

  if (!user) {
    debugLog('PLAN_GUARD', 'User not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  const planId = (plan?.plan || 'free').toLowerCase();
  const hasPlatinum = planId === 'platinum';
  const premiumAllowed = hasPlatinum || isPremiumEffective;

  debugLog('PLAN_GUARD', 'PlanGuard evaluation', {
    userId: user?.id,
    plan: planId,
    hasPlatinum,
    isPremiumEffective,
    requiresPlatinum,
    planLoading,
    stale,
  });

  if (requiresPlatinum && !premiumAllowed && !planLoading) {
    return (
      <PlanGate
        user={user}
        onPlanSelected={(selectedPlan) => {
          debugLog('PLAN_GUARD', 'Plan selected', { userId: user?.id, plan: selectedPlan });
          refreshPlan({ force: true });
        }}
      />
    );
  }

  if (planLoading && requiresPlatinum) {
    return (
      <div className="loading-fallback">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return children;
};

export default PlanGuard;

