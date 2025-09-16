import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Zap, Crown, Sparkles, ArrowRight, Star, Shield, Clock, Award, BarChart2, TrendingUp, CheckCircle } from 'lucide-react';
import { useMe } from '../hooks/useMe';
import { supabase } from '../lib/supabase';
import './NewPricing.css';

const NewPricing = () => {
  const { me } = useMe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!supabase) {
        navigate('/login?returnTo=/pricing&intent=upgrade');
        return;
      }
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        navigate('/login?returnTo=/pricing&intent=upgrade');
        return;
      }
      
      // For demo, redirect to sportsbooks
      navigate('/sportsbooks');
      
    } catch (error) {
      console.error('Upgrade error:', error);
      setError('Failed to process upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = {
    free: [
      'Live scores for NFL, NBA, MLB',
      'Basic team stats',
      'Game schedules',
      '24-hour delay on premium features'
    ],
    premium: [
      'Live odds from 15+ sportsbooks',
      'Expected value (+EV) bet finder',
      'Player props & live betting',
      'Arbitrage opportunities',
      'Advanced filtering',
      'Priority support',
      'No ads, no limits'
    ]
  };

  return (
    <section className="pricing-section">
      <div className="pricing-container">
        {/* Header */}
        <header className="pricing-header">
          <div className="pricing-badge">
            <Sparkles size={16} />
            <span>Start Winning Today</span>
          </div>
          <h1 className="pricing-title">Simple, Transparent Pricing</h1>
          <p className="pricing-subtitle">
            Choose the perfect plan for your betting strategy. No hidden fees, no surprises.
          </p>
        </header>

        {/* Pricing Grid */}
        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="pricing-card">
            <div className="card-header">
              <span className="card-badge badge-free">Free Forever</span>
              <h2 className="card-title">Starter</h2>
              <p className="card-subtitle">Perfect for casual bettors</p>
              
              <div className="price-display">
                <div className="price-amount">
                  <span className="price-currency">$</span>
                  <span>0</span>
                </div>
                <div className="price-period">No credit card required</div>
              </div>
            </div>
            
            <div className="features-list">
              {features.free.map((feature, index) => (
                <div key={index} className="feature-item">
                  <CheckCircle size={16} className="feature-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <button 
              className="button button-secondary"
              onClick={() => navigate('/login')}
            >
              Get Started Free
            </button>
          </div>

          {/* Premium Plan */}
          <div className="pricing-card" style={{
            border: '2px solid var(--primary)',
            boxShadow: '0 0 0 1px var(--primary)'
          }}>
            <div className="card-header">
              <span className="card-badge badge-premium">Most Popular</span>
              <h2 className="card-title">Premium</h2>
              <p className="card-subtitle">For serious bettors</p>
              
              <div className="price-display">
                <div className="price-amount">
                  <span className="price-currency">$</span>
                  <span>25</span>
                </div>
                <div className="price-period">per month, cancel anytime</div>
              </div>
              
              <div className="value-metrics">
                <div className="value-metric">
                  <div className="metric-value">15+</div>
                  <div className="metric-label">Sportsbooks</div>
                </div>
                <div className="value-metric">
                  <div className="metric-value">24/7</div>
                  <div className="metric-label">Live Updates</div>
                </div>
                <div className="value-metric">
                  <div className="metric-value">4.2%</div>
                  <div className="metric-label">Avg Edge</div>
                </div>
              </div>
            </div>
            
            <div className="features-list">
              {features.premium.map((feature, index) => (
                <div key={index} className="feature-item">
                  <CheckCircle size={16} className="feature-icon" style={{ color: 'var(--primary-light)' }} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <button 
              className="button button-primary"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{
                    display: 'inline-block',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    marginRight: '0.5rem',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  Start Winning Now
                  <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '3rem',
          flexWrap: 'wrap',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} />
            <span>Secure Payments</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} />
            <span>Cancel Anytime</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} />
            <span>30-Day Money Back</span>
          </div>
        </div>
        
        {error && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            borderRadius: '0.5rem',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '2rem auto 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewPricing;
