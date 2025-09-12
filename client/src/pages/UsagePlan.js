import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, TrendingUp, Shield, Check, ArrowLeft } from 'lucide-react';
import UsagePlanCard from '../components/UsagePlanCard';
import MobileBottomBar from '../components/MobileBottomBar';
import { withApiBase } from '../config/api';
import { secureFetch } from '../utils/security';
import './UsagePlan.css';

export default function UsagePlan() {
  const { user } = useAuth();
  const { me, loading } = useMe();
  const navigate = useNavigate();

  console.log('🔍 UsagePlan: Component render', { user: !!user, me, loading });

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    console.log('🔍 UsagePlan: Still loading, showing spinner');
    return (
      <div className="usage-plan-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your plan details...</p>
        </div>
      </div>
    );
  }

  console.log('🔍 UsagePlan: Loading complete, rendering main content');

  const isPlatinum = me?.plan === 'platinum';

  return (
    <div className="usage-plan-page">
      <div className="page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/account')}
          aria-label="Back to Account"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-content">
          <div className="header-icon">
            {isPlatinum ? <Crown size={24} /> : <Zap size={24} />}
          </div>
          <div className="header-text">
            <h1>Usage & Plan</h1>
            <p>Manage your subscription and monitor API usage</p>
          </div>
        </div>
      </div>

      <div className="plan-overview">
        <div className={`current-plan-card ${isPlatinum ? 'platinum' : 'free-trial'}`}>
          <div className="plan-header">
            <div className="plan-icon">
              {isPlatinum ? <Crown size={20} /> : <Zap size={20} />}
            </div>
            <div className="plan-info">
              <h3>{isPlatinum ? 'Platinum Plan' : 'Free Trial'}</h3>
              <p className="plan-description">
                {isPlatinum 
                  ? 'Unlimited access to all premium features'
                  : 'Limited access with basic features'
                }
              </p>
            </div>
          </div>
          
          <div className="plan-features">
            <div className="feature-list">
              {isPlatinum ? (
                <>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>Unlimited API calls</span>
                  </div>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>Real-time odds updates</span>
                  </div>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>Arbitrage opportunities</span>
                  </div>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>Premium support</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>250 API calls per month</span>
                  </div>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>Basic odds data</span>
                  </div>
                  <div className="feature-item">
                    <Check size={16} />
                    <span>Limited sportsbooks</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="usage-section">
        <UsagePlanCard />
      </div>

      {!isPlatinum && (
        <div className="upgrade-section">
          <div className="upgrade-card">
            <div className="upgrade-header">
              <TrendingUp size={24} />
              <h3>Upgrade to Platinum</h3>
            </div>
            <p>Get unlimited access to all features and real-time data</p>
            <div className="upgrade-benefits">
              <div className="benefit-item">
                <Shield size={16} />
                <span>Unlimited API calls</span>
              </div>
              <div className="benefit-item">
                <Crown size={16} />
                <span>Premium features</span>
              </div>
              <div className="benefit-item">
                <Zap size={16} />
                <span>Priority support</span>
              </div>
            </div>
            <button 
              className="upgrade-button"
              onClick={async (e) => {
                e.preventDefault();
                console.log('🔍 Upgrade button clicked, user ID:', user?.id);
                
                try {
                  console.log('🔍 Making request to:', withApiBase('/api/billing/create-checkout-session'));
                  const response = await secureFetch(withApiBase('/api/billing/create-checkout-session'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      supabaseUserId: user?.id
                    })
                  });
                  
                  console.log('🔍 Response status:', response.status);
                  console.log('🔍 Response ok:', response.ok);
                  
                  const data = await response.json();
                  console.log('🔍 Response data:', data);
                  
                  if (data?.url) {
                    console.log('🔍 Redirecting to Stripe:', data.url);
                    window.location.href = data.url;
                  } else {
                    console.error('🔍 No checkout URL returned, data:', data);
                    window.location.href = "/pricing";
                  }
                } catch (error) {
                  console.error('🔍 Failed to create checkout:', error);
                  window.location.href = "/pricing";
                }
              }}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      <MobileBottomBar showFilter={false} />
    </div>
  );
}
