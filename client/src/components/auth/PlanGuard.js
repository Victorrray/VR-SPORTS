import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../../hooks/useMe';
import { useAuth } from '../../hooks/useAuth';
import PlanGate from './PlanGate';
import { debugLog } from '../../lib/debug';

const PlanGuard = ({ children, requiresPlatinum = false }) => {
  const { user } = useAuth();
  const { me, planLoading } = useMe();

  // If user is not authenticated, redirect to home page
  if (!user) {
    debugLog('PLAN_GUARD', 'User not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Auto-assign free trial to all authenticated users
  const userPlan = me?.plan || 'free_trial';
  const hasPlatinum = userPlan === 'platinum';
  
  debugLog('PLAN_GUARD', 'Checking plan status', {
    userId: user?.id,
    plan: userPlan,
    hasPlatinum,
    requiresPlatinum,
    meData: me,
    planLoading
  });
  
  console.log('🔍 PlanGuard render:', { 
    user: !!user, 
    me, 
    userPlan, 
    hasPlatinum, 
    requiresPlatinum,
    planLoading 
  });

  // If this component requires platinum and user doesn't have it, show PlanGate
  // Don't wait for loading to complete - show PlanGate immediately if user needs upgrade
  if (requiresPlatinum && !hasPlatinum && !planLoading) {
    return <PlanGate user={user} onPlanSelected={(plan) => {
      debugLog('PLAN_GUARD', 'Plan selected', { userId: user?.id, plan });
      // The PlanGate component handles navigation after plan selection
    }} />;
  }

  // Show loading only if we're still checking user data AND user has sufficient access
  if (planLoading && (!requiresPlatinum || hasPlatinum)) {
    return (
      <div className="loading-fallback">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // User has sufficient access, render children
  return children;
};

export default PlanGuard;
