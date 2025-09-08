import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Pricing = ({ onUpgrade }) => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleStartFree = async () => {
    try {
      if (!user) {
        // Redirect to signup if not authenticated
        navigate('/signup');
        return;
      }

      // Set user to free plan
      await updateProfile({ 
        subscription_plan: 'free',
        subscription_status: 'active',
        api_calls_limit: 1000,
        updated_at: new Date().toISOString()
      });

      console.log('✅ User started free plan');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to start free plan:', error);
      // Fallback: just redirect to signup
      navigate('/signup');
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!user) {
        // Redirect to signup first
        navigate('/signup');
        return;
      }

      // For now, simulate upgrade process
      // In production, this would integrate with Stripe or another payment processor
      const confirmed = window.confirm(
        'This would normally redirect to a payment processor. For demo purposes, would you like to simulate upgrading to Platinum?'
      );

      if (confirmed) {
        await updateProfile({ 
          subscription_plan: 'platinum',
          subscription_status: 'active',
          api_calls_limit: -1, // Unlimited
          updated_at: new Date().toISOString()
        });

        console.log('✅ User upgraded to Platinum plan');
        alert('Successfully upgraded to Platinum! You now have unlimited access.');
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Upgrade failed. Please try again.');
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
              onClick={handleStartFree}
              style={{
                width: '100%',
                padding: '16px',
                background: 'transparent',
                border: '2px solid var(--accent)',
                borderRadius: '12px',
                color: 'var(--accent)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--accent)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--accent)';
              }}
            >
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
              onClick={handleUpgrade}
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                border: 'none',
                borderRadius: '12px',
                color: '#7c3aed',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Upgrade to Platinum
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
