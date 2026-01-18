import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { X, ArrowLeft, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../hooks/SimpleAuth';
import { Button } from '../components/design12/ui/button';
import { Card } from '../components/design12/ui/card';
import { SITE_CONFIG } from '../utils/seo';
import './BillingCancel.css';

const BillingCancel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Check if this is a checkout abandonment (from Stripe redirect)
  const isCheckoutAbandonment = searchParams.get('from') !== 'account';

  const handleCancelSubscription = async () => {
    if (!user?.id) {
      setError('Please log in to cancel your subscription');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setCancelled(true);
        setShowConfirmation(false);
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user abandoned checkout (didn't complete payment)
  if (isCheckoutAbandonment) {
    return (
      <div className="billing-cancel-page">
        <Helmet>
          <title>Checkout Cancelled — OddSightSeer</title>
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${SITE_CONFIG.domain}/billing/cancel`} />
        </Helmet>
        <div className="cancel-container">
          <div className="icon-container">
            <AlertTriangle size={48} />
          </div>
          
          <h1>Checkout Cancelled</h1>
          
          <p className="description">
            You cancelled the checkout process. No charges were made to your account.
          </p>
          
          <p className="description">
            Ready to upgrade? You can try again anytime to unlock unlimited API calls, arbitrage detection, and premium features.
          </p>
          
          <div className="action-buttons">
            <Link to="/account?tab=changePlan" className="btn btn-primary">
              View Plans Again
            </Link>
            <Link to="/account" className="btn btn-secondary">
              Back to Account
            </Link>
          </div>
          
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="billing-cancel-page">
        <div className="cancel-container success">
          <div className="icon-container success">
            <CheckCircle size={48} />
          </div>
          
          <h1>Subscription Cancelled</h1>
          
          <p className="description">
            Your Platinum subscription has been cancelled. You'll continue to have access to premium features until the end of your current billing period.
          </p>
          
          <div className="action-buttons">
            <Link to="/account" className="btn btn-primary">
              Back to Account
            </Link>
            <Link to="/account?tab=changePlan" className="btn btn-secondary">
              View Plans
            </Link>
          </div>
          
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="billing-cancel-page">
        <div className="cancel-container warning">
          <div className="icon-container warning">
            <AlertTriangle size={48} />
          </div>
          
          <h1>Cancel Subscription?</h1>
          
          <p className="description">
            Are you sure you want to cancel your Platinum subscription? You'll lose access to:
          </p>

          <ul className="feature-list">
            <li>Unlimited API calls</li>
            <li>Advanced arbitrage detection</li>
            <li>Premium analytics</li>
            <li>Priority support</li>
          </ul>
          
          {error && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              onClick={handleCancelSubscription}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? (
                <>
                  <Loader size={16} className="spinning" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Subscription'
              )}
            </button>
            <button 
              onClick={() => setShowConfirmation(false)}
              className="btn btn-secondary"
            >
              Keep Subscription
            </button>
          </div>
          
          <Link to="/account" className="back-link">
            <ArrowLeft size={16} />
            Back to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-cancel-page">
      <div className="cancel-container">
        <div className="icon-container">
          <X size={48} />
        </div>
        
        <h1>Cancel Subscription</h1>
        
        <p className="description">
          We're sorry to see you go! Before you cancel, here's what you'll be missing out on with your Platinum subscription.
        </p>

        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">⚡</div>
            <div>
              <h3>Unlimited API Calls</h3>
              <p>No more 250 call limits</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🎯</div>
            <div>
              <h3>Arbitrage Detection</h3>
              <p>Find profitable opportunities</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <div>
              <h3>Advanced Analytics</h3>
              <p>Deep insights & trends</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🏆</div>
            <div>
              <h3>Priority Support</h3>
              <p>Get help when you need it</p>
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={() => setShowConfirmation(true)}
            className="btn btn-danger"
          >
            Continue Cancellation
          </button>
          <Link to="/account" className="btn btn-primary">
            Keep My Subscription
          </Link>
        </div>
        
        <Link to="/account" className="back-link">
          <ArrowLeft size={16} />
          Back to Account
        </Link>
      </div>
    </div>
  );
};

export default BillingCancel;
