import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Loader2, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMe } from '../../hooks/useMe';
import { debugLog, debugPricingClick, debugCheckoutResult, debugPlanUpdate } from '../../lib/debug';
import './Pricing-Simple.css';

// Intent persistence helpers
function saveIntent(intent, returnTo) {
  localStorage.setItem('pricingIntent', JSON.stringify({ intent, returnTo, ts: Date.now() }));
}

function getIntent() {
  try {
    const stored = localStorage.getItem('pricingIntent');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Expire after 30 minutes
    if (Date.now() - parsed.ts > 30 * 60 * 1000) {
      localStorage.removeItem('pricingIntent');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearIntent() {
  localStorage.removeItem('pricingIntent');
}

const Pricing = ({ onUpgrade }) => {
  const { me } = useMe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoStarting, setAutoStarting] = useState(false);
  
  const DEBUG_PRICING = process.env.NODE_ENV === 'development' || 
                       searchParams.has('debug') || 
                       localStorage.getItem('DEBUG_PRICING') === '1';

  // Removed handleStartFree since free trial card is removed

  const handleUpgrade = async (plan = 'platinum') => {
    try {
      setError('');
      setLoading(true);
      
      if (!supabase) {
        // No Supabase configured, redirect to login
        setLoading(false);
        navigate('/login?returnTo=/subscribe&intent=upgrade');
        return;
      }
      
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthenticated = !!sessionData.session;
      
      debugPricingClick('upgrade', isAuthenticated, plan);
      
      if (!isAuthenticated) {
        debugLog('PRICING', 'User not authenticated, redirecting to login');
        saveIntent('upgrade', '/subscribe');
        setLoading(false);
        navigate('/login?returnTo=/subscribe&intent=upgrade');
        return;
      }

      // Create Stripe checkout session
      debugLog('PRICING', `Creating Stripe checkout session for ${plan} plan`);
      const { withApiBase } = require('../../config/api');
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan })
      });
      
      const data = await response.json();
      debugCheckoutResult(data);
      
      if (!response.ok) {
        console.error('❌ Checkout failed:', data);
        const errorMsg = data.message || data.detail || data.error || data.code || 'Checkout failed';
        throw new Error(errorMsg);
      }
      
      if (data?.url) {
        debugLog('PRICING', 'Redirecting to Stripe checkout');
        window.location.href = data.url;
      } else {
        setLoading(false);
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('❌ Failed to handle upgrade:', error);
      setError(error.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };
  

  // Auto-continue upgrade flow if user just logged in with intent=upgrade
  useEffect(() => {
    const urlIntent = searchParams.get('intent');
    const autoStart = searchParams.get('autostart');
    const storedIntent = getIntent();
    
    if (DEBUG_PRICING) {
      console.log('🔍 Pricing useEffect:', {
        urlIntent,
        autoStart,
        storedIntent,
        me,
        loading,
        autoStarting
      });
    }
    
    // Auto-start upgrade if conditions are met
    if ((urlIntent === 'upgrade' || storedIntent?.intent === 'upgrade') && 
        me?.plan !== 'platinum' && 
        !loading && 
        !autoStarting && 
        autoStart === '1') {
      
      if (DEBUG_PRICING) console.log('🔍 Auto-starting upgrade after authentication');
      setAutoStarting(true);
      clearIntent();
      
      // Small delay to show the "Opening checkout..." message
      setTimeout(async () => {
        try {
          const { withApiBase } = require('../../config/api');
          const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
            method: 'POST',
            credentials: 'include'
          });
          const data = await response.json();
          if (data?.url) {
            window.location.href = data.url;
          } else {
            throw new Error('No checkout URL received');
          }
        } catch (error) {
          console.error('Auto-start checkout failed:', error);
          setError(`Auto-start failed: ${error.message}`);
          setAutoStarting(false);
        }
      }, 1000);
    }
  }, [me, loading, searchParams]);
  
  // Debug helper
  useEffect(() => {
    if (DEBUG_PRICING) {
      console.log('🔍 Pricing component mounted/updated:', {
        me,
        loading,
        autoStarting,
        searchParams: Object.fromEntries(searchParams.entries()),
        storedIntent: getIntent()
      });
    }
  }, [me, loading, autoStarting, searchParams]);

  return (
    <section className="pricing-section">
      <div className="pricing-container">
        {/* Hero Header */}
        <div className="pricing-hero">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Premium Sports Intelligence</span>
          </div>
          <h2 className="hero-title">
            Unlock Your <span className="gradient-text">Winning Edge</span>
          </h2>
          <p className="hero-subtitle">
            Join thousands of winning bettors with real-time odds, advanced analytics, and premium insights
          </p>
        </div>

        {/* Status Messages */}
        {(error || autoStarting) && (
          <div className="status-message">
            <div className={`status-content ${autoStarting ? 'loading' : 'error'}`}>
              {autoStarting && <Loader2 size={16} className="status-spinner" />}
              <span>{autoStarting ? 'Opening secure checkout...' : error}</span>
              {error && !autoStarting && (
                <button 
                  onClick={() => setError('')}
                  className="status-retry"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards - Brand New Design */}
        <div className="pricing-showcase two-cards">
          {/* Gold Plan Card */}
          <div className="pricing-card gold-card">
            {/* Gold Badge */}
            <div className="card-badge gold-badge">
              <span>Best Value</span>
            </div>

            {/* Card Header - Simplified */}
            <div className="card-header-simple">
              <h3 className="plan-title-simple">Gold Plan</h3>
              <p className="plan-tagline-simple">Perfect for serious bettors</p>
            </div>

            {/* Pricing - Simplified */}
            <div className="pricing-display-simple">
              <div className="price-main-simple">
                <span className="currency-simple">$</span>
                <span className="amount-simple">10</span>
                <span className="period-simple">/month</span>
              </div>
            </div>

            {/* Benefits List - Simplified */}
            <div className="features-grid-simple">
              <div className="feature-item-simple">
                <Check size={16} />
                <span>10+ sportsbooks</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Line movement tracking</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>+EV bet finder</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Player props</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Email support</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              data-testid="pricing-signup"
              onClick={() => handleUpgrade('gold')}
              disabled={loading}
              className="signup-button-simple"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="button-spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Start Gold Plan</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Trust Signal */}
            <div className="trust-signal-simple">
              ✓ Cancel anytime
            </div>
          </div>

          <div className="pricing-card platinum-card-simple">
            {/* Premium Badge */}
            <div className="card-badge platinum-badge">
              <span>Most Popular</span>
            </div>

            {/* Card Header - Simplified */}
            <div className="card-header-simple">
              <h3 className="plan-title-simple">Platinum Access</h3>
              <p className="plan-tagline-simple">Everything you need to win</p>
            </div>

            {/* Pricing - Simplified */}
            <div className="pricing-display-simple">
              <div className="price-main-simple">
                <span className="currency-simple">$</span>
                <span className="amount-simple">25</span>
                <span className="period-simple">/month</span>
              </div>
              <div className="savings-note">Save 40% vs daily subscriptions</div>
            </div>

            {/* Benefits List - Simplified */}
            <div className="features-grid-simple">
              <div className="feature-item-simple">
                <Check size={16} />
                <span>15+ sportsbooks</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>+EV bet finder with edge</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Player props & spreads</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Arbitrage alerts</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Advanced filters</span>
              </div>
              <div className="feature-item-simple">
                <Check size={16} />
                <span>Priority support</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              data-testid="pricing-upgrade"
              onClick={() => handleUpgrade('platinum')}
              disabled={loading}
              className="upgrade-button-simple"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="button-spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Start Winning Today</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
