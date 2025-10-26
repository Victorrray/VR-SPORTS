import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/SimpleAuth';
import { usePlan } from '../hooks/SimplePlan';
import Pricing from '../components/billing/Pricing';
import MobileBottomBar from '../components/layout/MobileBottomBar';
import { CreditCard, Calendar, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const Subscribe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, planLoading } = usePlan();

  // Check if user has an active subscription
  const hasActivePlan = plan?.plan === 'gold' || plan?.plan === 'platinum';

  if (planLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // If user has active plan, show subscription details
  if (hasActivePlan) {
    const planName = plan?.plan === 'platinum' ? 'Platinum' : 'Gold';
    const planColor = plan?.plan === 'platinum' ? '#a78bfa' : '#fbbf24';

    return (
      <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'var(--bg)' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <button
              onClick={() => navigate('/account')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>My Subscription</h1>
          </div>

          {/* Active Plan Card */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <CheckCircle size={32} color={planColor} />
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: planColor }}>
                  {planName} Plan
                </h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                  Active Subscription
                </p>
              </div>
            </div>

            {/* Subscription Details */}
            <div style={{
              display: 'grid',
              gap: '16px',
              marginTop: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.1)'
              }}>
                <CreditCard size={20} color={planColor} />
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Plan Price
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    $10/month
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.1)'
              }}>
                <Calendar size={20} color={planColor} />
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Billing Cycle
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    Monthly (Auto-renews)
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Your Plan Includes:
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'Live odds from 25+ major sportsbooks',
                  'Advanced +EV bet finder',
                  'Player props and game lines',
                  'Arbitrage opportunities',
                  'Real-time odds updates',
                  'Unlimited API access'
                ].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <CheckCircle size={18} color={planColor} />
                    <span style={{ fontSize: '15px' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Manage Subscription */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Manage Subscription
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
            </p>
            <button
              onClick={() => navigate('/billing/cancel?from=subscribe')}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Cancel Subscription
            </button>
          </div>
        </div>
        <MobileBottomBar active="profile" showFilter={false} />
      </div>
    );
  }

  // If no active plan, show pricing page
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <Pricing />
      <MobileBottomBar active="profile" showFilter={false} />
    </div>
  );
};

export default Subscribe;
