import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';
import { usePlan } from '../../hooks/SimplePlan';

const PlanGuard = ({ children, requiresPlatinum = false }) => {
  const { user } = useAuth();
  const { plan, planLoading } = usePlan();

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

  if (requiresPlatinum && !hasPlatinum) {
    return (
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
        <Link 
          to="/pricing" 
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Upgrade to Platinum
        </Link>
      </div>
    );
  }

  return children;
};

export default PlanGuard;
