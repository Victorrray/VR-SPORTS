import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, TrendingUp, Shield, Check, ArrowLeft, Calendar, CreditCard, X, AlertTriangle } from 'lucide-react';
import MobileBottomBar from '../components/layout/MobileBottomBar';
import { withApiBase } from '../config/api';
import { secureFetch } from '../utils/security';
import './UsagePlan.css';

export default function UsagePlan() {
  const { user } = useAuth();
  const { me, loading } = useMe();
  const navigate = useNavigate();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  console.log('🔍 UsagePlan: Component render', { user: !!user, me, loading });

  // Define isPlatinum based on user plan
  const isPlatinum = me?.plan === 'platinum';

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

  const hasGoldPlan = me?.plan === 'gold' || me?.plan === 'platinum';

  // Subscription data for Gold plan
  const subscriptionData = {
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    amount: '$10.00',
    status: 'active'
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      // Add your cancel subscription API call here
      console.log('🔍 Canceling subscription for user:', user?.id);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message or redirect
      alert('Subscription canceled successfully. You will retain access until your current billing period ends.');
      setShowCancelConfirm(false);
      
      // Optionally refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancelLoading(false);
    }
  };

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
            {hasGoldPlan ? <Crown size={24} /> : <Zap size={24} />}
          </div>
          <div className="header-text">
            <h1>Subscription Plan</h1>
            <p>Manage your Gold subscription</p>
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


      {isPlatinum && (
        <div className="subscription-management">
          <div className="subscription-card">
            <div className="subscription-header">
              <div className="subscription-icon">
                <CreditCard size={24} />
              </div>
              <div className="subscription-info">
                <h3>Subscription Management</h3>
                <p>Manage your Platinum subscription</p>
              </div>
            </div>
            
            <div className="subscription-details">
              <div className="detail-row">
                <div className="detail-item">
                  <Calendar size={16} />
                  <div className="detail-content">
                    <span className="detail-label">Next Renewal</span>
                    <span className="detail-value">
                      {subscriptionData.renewalDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <CreditCard size={16} />
                  <div className="detail-content">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value">{subscriptionData.amount}/month</span>
                  </div>
                </div>
              </div>
              
              <div className="subscription-status">
                <div className={`status-badge ${subscriptionData.status}`}>
                  <div className="status-indicator"></div>
                  <span>Active Subscription</span>
                </div>
              </div>
            </div>
            
            <div className="subscription-actions">
              <button 
                className="cancel-subscription-btn"
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelLoading}
              >
                <X size={16} />
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="cancel-modal">
            <div className="modal-header">
              <AlertTriangle size={24} color="#f59e0b" />
              <h3>Cancel Subscription</h3>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to cancel your Platinum subscription?</p>
              <div className="cancel-details">
                <div className="cancel-info">
                  <Check size={16} />
                  <span>You'll keep access until {subscriptionData.renewalDate.toLocaleDateString()}</span>
                </div>
                <div className="cancel-info">
                  <Check size={16} />
                  <span>No additional charges after cancellation</span>
                </div>
                <div className="cancel-info warning">
                  <X size={16} />
                  <span>You'll lose unlimited API access and premium features</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelLoading}
              >
                Keep Subscription
              </button>
              <button 
                className="modal-btn danger"
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

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
