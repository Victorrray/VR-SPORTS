// Blocking plan selection gate for users without a plan
import React, { useState } from 'react';
import { useMe } from '../../hooks/useMe';
import { useNavigate } from 'react-router-dom';
import { Loader2, Star, Zap, Check } from 'lucide-react';

const DEBUG_PRICING = process.env.NODE_ENV === 'development';

export default function PlanGate({ children }) {
  const { me, loading, refresh } = useMe();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your account...</p>
        </div>
      </div>
    );
  }

  // If user has a plan, render children
  if (me?.plan) {
    return children;
  }

  const chooseFree = async () => {
    if (DEBUG_PRICING) console.log('🔍 PlanGate: Choosing free trial');
    
    try {
      setBusy(true);
      setError('');
      
      const { withApiBase } = require('../../config/api');
      const response = await fetch(withApiBase('/api/users/plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free_trial' }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to set plan');
      }
      
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      console.error('Failed to set free plan:', err);
      setError('Failed to set plan. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const choosePlatinum = async () => {
    if (DEBUG_PRICING) console.log('🔍 PlanGate: Choosing platinum');
    
    try {
      setBusy(true);
      setError('');
      
      const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Unable to start checkout');
      }
      
      window.location.href = data.url;
    } catch (err) {
      console.error('Failed to create checkout:', err);
      setError('Unable to start checkout. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Choose Your Plan
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Select a plan to continue using VR-Odds. You can upgrade or downgrade at any time.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#dc2626',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {/* Free Trial Card */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '32px',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Star size={24} color="var(--accent)" />
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Free Trial
              </h3>
            </div>
            
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              $0
              <span style={{
                fontSize: '16px',
                fontWeight: '400',
                color: 'var(--text-secondary)'
              }}>
                /month
              </span>
            </div>
            
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '24px'
            }}>
              Perfect for getting started
            </p>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 32px 0'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                <Check size={20} color="var(--success)" />
                1,000 API calls per month
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                <Check size={20} color="var(--success)" />
                Basic odds comparison
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                <Check size={20} color="var(--success)" />
                Player props analysis
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--text-primary)'
              }}>
                <Check size={20} color="var(--success)" />
                Live scores & updates
              </li>
            </ul>

            <button
              data-testid="gate-start-free"
              onClick={chooseFree}
              disabled={busy}
              style={{
                width: '100%',
                padding: '16px',
                background: 'transparent',
                border: '2px solid var(--accent)',
                borderRadius: '12px',
                color: busy ? '#999' : 'var(--accent)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: busy ? 0.6 : 1
              }}
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Start Free
            </button>
          </div>

          {/* Platinum Card */}
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '1px solid #8b5cf6',
            borderRadius: '16px',
            padding: '32px',
            position: 'relative',
            transform: 'scale(1.05)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              MOST POPULAR
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Zap size={24} color="white" />
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'white',
                margin: 0
              }}>
                Platinum
              </h3>
            </div>
            
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '8px'
            }}>
              $25
              <span style={{
                fontSize: '16px',
                fontWeight: '400',
                opacity: 0.8
              }}>
                /month
              </span>
            </div>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px'
            }}>
              Unlimited access for serious bettors
            </p>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 32px 0'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'white'
              }}>
                <Check size={20} color="#10b981" />
                Unlimited API calls
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'white'
              }}>
                <Check size={20} color="#10b981" />
                Advanced analytics
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'white'
              }}>
                <Check size={20} color="#10b981" />
                Priority data updates
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                color: 'white'
              }}>
                <Check size={20} color="#10b981" />
                Premium support
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'white'
              }}>
                <Check size={20} color="#10b981" />
                All future features
              </li>
            </ul>

            <button
              data-testid="gate-upgrade"
              onClick={choosePlatinum}
              disabled={busy}
              style={{
                width: '100%',
                padding: '16px',
                background: busy ? '#f3f4f6' : 'white',
                border: 'none',
                borderRadius: '12px',
                color: busy ? '#999' : '#7c3aed',
                fontSize: '16px',
                fontWeight: '600',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: busy ? 0.6 : 1
              }}
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Upgrade to Platinum
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
