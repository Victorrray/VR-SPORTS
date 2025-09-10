import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Star } from 'lucide-react';
import { debugLog, debugPlanUpdate } from '../lib/debug';
import './PlanGate.css';
import { withApiBase } from '../config/api';

const PlanGate = ({ user, onPlanSelected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleSelectPlatinum = async () => {
    try {
      setError('');
      setLoading(true);
      
      debugLog('PLAN_GATE', 'User selecting platinum plan', { userId: user?.id });
      
      // Get authenticated user from Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL || import.meta?.env?.VITE_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta?.env?.VITE_SUPABASE_ANON_KEY
      );
      
      if (!supabase) {
        setError('Authentication service not available. Please try again.');
        return;
      }
      
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !supabaseUser) {
        // Redirect to login if not authenticated
        window.location.href = '/login?next=/pricing';
        return;
      }
      
      // For development, show a message about Stripe setup
      if (process.env.NODE_ENV === 'development') {
        setError('Stripe checkout is not configured for local development. This would redirect to payment in production.');
        return;
      }
      
      const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ supabaseUserId: supabaseUser.id })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Checkout session error:', responseData);
        if (responseData.error === 'Stripe not configured') {
          setError('Payment processing is not configured. Please contact support.');
        } else if (responseData.error === 'CHECKOUT_START_FAILED') {
          setError(responseData.detail || 'Failed to start checkout. Please try again.');
        } else {
          setError(responseData.error || 'Checkout unavailable. Please try again.');
        }
        return;
      }
      
      if (responseData?.url) {
        // Redirect to Stripe checkout
        window.location.href = responseData.url;
      } else {
        setError('Checkout unavailable. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="upgrade-section">
      <div className="upgrade-wrapper">
        <div className="upgrade-hero">
          <h1 className="hero-title">
            Unlock Premium Features
          </h1>
          <p className="hero-subtitle">
            Get access to advanced analytics and exclusive tools
          </p>
        </div>

        {error && (
          <div className="upgrade-error">
            {error}
          </div>
        )}

        <div className="upgrade-container">
          {/* Single Platinum Plan */}
          <div className="upgrade-card">

            <div className="upgrade-header">
              <div className="upgrade-icon">
                <Star size={32} />
              </div>
              <h2 className="upgrade-title">Upgrade to Platinum</h2>
              <p className="upgrade-subtitle">
                Unlock premium features and advanced analytics
              </p>
            </div>
            
            <div className="upgrade-price">
              <span className="price-amount">$49</span>
              <span className="price-period">per month</span>
            </div>

            <div className="upgrade-features">
              <div className="feature-grid">
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <Check size={16} />
                  </div>
                  <span>Advanced +EV alerts</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <Check size={16} />
                  </div>
                  <span>Player props analysis</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <Check size={16} />
                  </div>
                  <span>Custom bankroll tracking</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <Check size={16} />
                  </div>
                  <span>Priority support</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSelectPlatinum}
              disabled={loading}
              className="upgrade-button"
            >
              {loading ? 'Opening checkout...' : 'Upgrade Now'}
            </button>
          </div>
        </div>

        <div className="upgrade-footer">
          <p className="upgrade-note">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </section>
  );
};

export default PlanGate;
