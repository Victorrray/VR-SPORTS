import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Loader2, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMe } from '../../hooks/useMe';
import { debugLog, debugPricingClick, debugCheckoutResult, debugPlanUpdate } from '../../lib/debug';
import './Pricing.css';

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

  const handleUpgrade = async () => {
    try {
      setError('');
      setLoading(true);
      
      if (!supabase) {
        // No Supabase configured, redirect to login
        navigate('/login?returnTo=/sportsbooks&intent=upgrade');
        return;
      }
      
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthenticated = !!sessionData.session;
      
      debugPricingClick('upgrade', isAuthenticated, 'upgrade');
      
      if (!isAuthenticated) {
        debugLog('PRICING', 'User not authenticated, redirecting to login');
        saveIntent('upgrade', '/sportsbooks');
        navigate('/login?returnTo=/sportsbooks&intent=upgrade');
        return;
      }

      // Create Stripe checkout session
      debugLog('PRICING', 'Creating Stripe checkout session');
      const { withApiBase } = require('../../config/api');
      const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      debugCheckoutResult(data);
      
      if (data?.url) {
        debugLog('PRICING', 'Redirecting to Stripe checkout');
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'No checkout URL received');
      }
      
    } catch (error) {
      console.error('Failed to handle upgrade:', error);
      setError(error.message || 'Failed to start checkout. Please try again.');
    } finally {
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
            <div className="free-badge" style={{background: 'linear-gradient(135deg, #FFD700, #FFA500)'}}>
              <Crown size={16} />
              <span>Best Value</span>
            </div>

            {/* Card Header */}
            <div className="card-header">
              <div className="plan-icon-wrapper" style={{background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)'}}>
                <div className="plan-icon">
                  <Crown size={28} />
                </div>
              </div>
              <div className="plan-info">
                <h3 className="plan-title">Gold Plan</h3>
                <p className="plan-tagline">Perfect for serious bettors</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="pricing-display">
              <div className="price-main">
                <span className="currency">$</span>
                <span className="amount">15</span>
                <span className="period">/month</span>
              </div>
              <div className="price-note">
                <span className="savings">Save 25% vs daily subscriptions</span>
              </div>
            </div>

            {/* Benefits List */}
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Live odds from 10+ major sportsbooks</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Real-time line movement tracking</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Basic +EV bet finder</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Player props and game lines</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Email support</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              data-testid="pricing-signup"
              onClick={handleUpgrade}
              className="signup-button"
              style={{background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 10px 30px rgba(255, 215, 0, 0.35)'}}
            >
              <div className="button-content">
                <span>Start Gold Plan</span>
                <ArrowRight size={20} className="button-arrow" />
              </div>
            </button>

            {/* Trust Signals */}
            <div className="trust-signals">
              <div className="trust-item">
                <span>✓ Cancel anytime</span>
              </div>
              <div className="trust-item">
                <span>•</span>
              </div>
              <div className="trust-item">
                <span>7-day money back</span>
              </div>
            </div>
          </div>

          <div className="platinum-card">
            {/* Premium Badge */}
            <div className="premium-badge">
              <Crown size={16} />
              <span>Most Popular</span>
            </div>

            {/* Card Header */}
            <div className="card-header">
              <div className="plan-icon-wrapper">
                <div className="plan-icon">
                  <Zap size={28} />
                </div>
              </div>
              <div className="plan-info">
                <h3 className="plan-title">Platinum Access</h3>
                <p className="plan-tagline">Everything you need to win</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="pricing-display">
              <div className="price-main">
                <span className="currency">$</span>
                <span className="amount">25</span>
                <span className="period">/month</span>
              </div>
              <div className="price-note">
                <span className="savings">Save 40% vs daily subscriptions</span>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="value-prop">
              <div className="value-item">
                <div className="value-number">15+</div>
                <div className="value-label">Sportsbooks</div>
              </div>
              <div className="value-item">
                <div className="value-number">24/7</div>
                <div className="value-label">Live Updates</div>
              </div>
              <div className="value-item">
                <div className="value-number">4.2%</div>
                <div className="value-label">Avg Edge</div>
              </div>
            </div>

            {/* Benefits List */}
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Live odds from DraftKings, FanDuel, BetMGM + 12 more</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Expected value (+EV) bet finder with edge calculations</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Player props, spreads, totals, and live betting markets</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Arbitrage opportunities and line shopping alerts</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Advanced filtering by sport, market, and edge %</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Check size={12} />
                </div>
                <span>Priority support and feature requests</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              data-testid="pricing-upgrade"
              onClick={handleUpgrade}
              disabled={loading}
              className="upgrade-button"
            >
              <div className="button-content">
                {loading ? (
                  <>
                    <Loader2 size={20} className="button-spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Start Winning Today</span>
                    <ArrowRight size={20} className="button-arrow" />
                  </>
                )}
              </div>
            </button>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
