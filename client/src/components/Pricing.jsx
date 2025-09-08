import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Pricing = ({ onUpgrade }) => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isDev = process.env.NODE_ENV === 'development';

  const handleStartFree = async () => {
    if (isDev) console.log('🔍 Start Free clicked', { user: !!user });
    
    try {
      setError('');
      setLoading(true);
      
      if (!user) {
        if (isDev) console.log('🔍 User not authenticated, redirecting to signup');
        navigate('/login?returnTo=/pricing?intent=start-free');
        return;
      }

      if (isDev) console.log('🔍 Setting user to free plan');
      await updateProfile({ 
        subscription_plan: 'free',
        subscription_status: 'active',
        api_calls_limit: 1000,
        updated_at: new Date().toISOString()
      });

      console.log('✅ User started free plan');
      navigate('/app');
    } catch (error) {
      console.error('Failed to start free plan:', error);
      setError('Failed to start free plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (isDev) console.log('🔍 Upgrade clicked', { user: !!user });
    
    try {
      setError('');
      setLoading(true);
      
      if (!user) {
        if (isDev) console.log('🔍 User not authenticated, redirecting to login');
        navigate('/login?returnTo=/pricing?intent=upgrade');
        return;
      }

      if (isDev) console.log('🔍 Creating Stripe checkout session');
      
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id || 'demo-user'
        },
        credentials: 'include'
      });
      
      if (isDev) console.log('🔍 Checkout response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const { url } = await response.json();
      if (isDev) console.log('🔍 Redirecting to Stripe:', url);
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setError(`Upgrade failed: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-continue upgrade flow if user just logged in with intent=upgrade
  useEffect(() => {
    const intent = searchParams.get('intent');
    if (intent === 'upgrade' && user && !loading) {
      if (isDev) console.log('🔍 Auto-continuing upgrade after login');
      handleUpgrade();
    }
  }, [user, searchParams]);
  
  const continueUpgradeIfNeeded = () => {
    const intent = searchParams.get('intent');
    if (intent === 'upgrade' && user) {
      handleUpgrade();
    }
  };

  return (
    <section style={{
      padding: '60px 20px',
      background: 'var(--bg-primary)',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '16px'
        }}>
          Choose Your Plan
        </h2>
        
        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          marginBottom: '48px',
          maxWidth: '600px',
          margin: '0 auto 48px auto'
        }}>
          Start free and upgrade when you need unlimited access to premium odds data
        </p>
        
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#dc2626',
            fontSize: '14px',
            maxWidth: '600px',
            margin: '0 auto 24px auto'
          }}>
            {error}
            <button 
              onClick={() => setError('')}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Try again
            </button>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Free Trial Plan */}
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
              data-testid="start-free"
              onClick={handleStartFree}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'transparent',
                border: '2px solid var(--accent)',
                borderRadius: '12px',
                color: loading ? '#999' : 'var(--accent)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'var(--accent)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--accent)';
                }
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Start Free
            </button>
          </div>

          {/* Platinum Plan */}
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
              data-testid="upgrade-platinum"
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#f3f4f6' : 'white',
                border: 'none',
                borderRadius: '12px',
                color: loading ? '#999' : '#7c3aed',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Upgrade to Platinum
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
