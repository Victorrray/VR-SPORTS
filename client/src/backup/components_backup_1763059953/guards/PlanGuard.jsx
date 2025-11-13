import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';
import { usePlan } from '../../hooks/SimplePlan';
import MobileBottomBar from '../layout/MobileBottomBar';

const PlanGuard = ({ children, requiresPlatinum = false, requiresPaidPlan = false }) => {
  const { user } = useAuth();
  const { plan, planLoading } = usePlan();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (planLoading) {
    return (
      <div className="loading-fallback">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  const planId = (plan?.plan || 'free').toLowerCase();
  const hasPlatinum = planId === 'platinum' || plan?.unlimited;
  const hasGold = planId === 'gold';
  const hasPaidPlan = hasPlatinum || hasGold;

  // Check if user needs a paid plan (gold or platinum)
  if (requiresPaidPlan && !hasPaidPlan) {
    return (
      <>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Subscription Required</h2>
          <p style={{ marginBottom: '24px', color: '#9ca3af' }}>
            This feature requires a Gold or Platinum subscription.
          </p>
          <button 
            onClick={() => navigate('/subscribe')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Choose Your Plan
          </button>
        </div>
        <MobileBottomBar active="odds" showFilter={false} />
      </>
    );
  }

  // Check if user needs platinum specifically
  if (requiresPlatinum && !hasPlatinum) {
    return (
      <>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Platinum Plan Required</h2>
          <p style={{ marginBottom: '24px', color: '#9ca3af' }}>
            This feature requires a Platinum subscription.
          </p>
          <button 
            onClick={() => navigate('/subscribe')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Upgrade to Platinum
          </button>
        </div>
        <MobileBottomBar active="odds" showFilter={false} />
      </>
    );
  }

  return children;
};

export default PlanGuard;
