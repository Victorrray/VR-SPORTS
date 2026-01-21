import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Check, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/SimpleAuth';
import { Button } from '../components/design12/ui/button';
import { Card } from '../components/design12/ui/card';
import { SITE_CONFIG } from '../utils/seo';
import './BillingSuccess.css';

const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan') || 'platinum'; // Default to platinum for backwards compatibility
  const isGold = plan === 'gold';

  useEffect(() => {
    // Clear plan cache immediately on success page load (preserve user preferences)
    console.log('🎉 Payment successful - clearing plan cache and refreshing');
    
    try {
      // Clear ONLY plan-related cache (NOT user preferences like bankroll/sportsbooks)
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      
      // Clear sessionStorage plan cache
      sessionStorage.removeItem('userPlan');
      sessionStorage.removeItem('me');
      sessionStorage.removeItem('plan');
      
      console.log('✅ Plan cache cleared after successful payment (preserved bankroll & sportsbooks)');
    } catch (e) {
      console.warn('⚠️ Could not clear cache:', e);
    }
    
    // Track Google Ads conversion
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-17783188669/PURCHASE',
        'transaction_id': sessionId || ''
      });
      console.log('📊 Google Ads conversion tracked');
    }
    
    // Trigger plan refresh event so useMe hook refetches
    console.log('📢 Dispatching planUpdated event');
    window.dispatchEvent(new Event('planUpdated'));
    
    // Simple timeout to show success state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="billing-success-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Processing your upgrade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-success-container billing-success-bg min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>Payment Successful — OddSightSeer</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${SITE_CONFIG.domain}/billing/success`} />
      </Helmet>
      <div className="billing-success-card max-w-lg w-full bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10 shadow-2xl">
        {/* Success Animation */}
        <div className="crown-container relative mb-8">
          <div className={`crown-icon w-20 h-20 ${isGold ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-yellow-400 to-orange-500'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            {isGold ? <Sparkles size={36} className="text-white" /> : <Crown size={36} className="text-white" />}
          </div>
          <div className="sparkle-1 absolute -top-2 -right-2">
            <Sparkles size={24} className={isGold ? "text-yellow-500" : "text-yellow-400"} />
          </div>
          <div className="sparkle-2 absolute -bottom-2 -left-2">
            <Sparkles size={20} className="text-purple-400" />
          </div>
        </div>
        
        <h1 className="welcome-title text-3xl font-bold text-white mb-2">
          Welcome to {isGold ? 'Gold' : 'Platinum'}!
        </h1>
        
        <p className="congratulations-text text-purple-200 text-lg mb-2">
          🎉 Congratulations!
        </p>
        
        <p className="description-text text-gray-300 mb-8 leading-relaxed">
          Your subscription has been activated successfully. {isGold 
            ? 'You now have access to all Gold features including unlimited picks and advanced analytics.'
            : 'You now have unlimited access to all premium features and advanced analytics.'}
        </p>
        
        {/* Features */}
        <div className="features-container bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
            {isGold ? <Sparkles size={18} className="text-yellow-500 mr-2" /> : <Crown size={18} className="text-yellow-400 mr-2" />}
            {isGold ? 'Gold Features Unlocked' : 'Premium Features Unlocked'}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {isGold ? (
              <>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Unlimited picks & recommendations</span>
                </div>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Advanced analytics & EV calculations</span>
                </div>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Bet tracking & history</span>
                </div>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Email & chat support</span>
                </div>
              </>
            ) : (
              <>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Everything in Gold</span>
                </div>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Bankroll management & betting calculator</span>
                </div>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Sharp book access & API access</span>
                </div>
                <div className="feature-item flex items-center text-sm text-gray-300">
                  <Check size={16} className="text-green-400 mr-3 flex-shrink-0" />
                  <span>Priority support & custom alerts</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons space-y-3">
          <Link
            to="/dashboard"
            className="primary-button w-full inline-flex items-center justify-center px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Using {isGold ? 'Gold' : 'Premium'} Features
            <ArrowRight size={18} className="ml-2" />
          </Link>
          
          <Link
            to="/dashboard?view=account"
            className="secondary-button w-full inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
          >
            View Your Account
          </Link>
        </div>
        
        {/* Session Info */}
        {sessionId && (
          <div className="session-info mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 font-mono">
              Session: {sessionId.slice(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingSuccess;
