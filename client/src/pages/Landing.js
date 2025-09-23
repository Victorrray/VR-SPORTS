import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { 
  Target, 
  Shield, 
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Play,
  ArrowRight
} from 'lucide-react';

// Components
import EdgeCalculator from '../components/betting/EdgeCalculator';
import Pricing from '../components/billing/Pricing';

// Styles
import '../styles/landing.css';

const QUICK_ACTIONS = [
  {
    title: "Odds Scanner",
    description: "Find the best lines across sportsbooks",
    icon: Target,
    link: "/sportsbooks",
    color: "var(--accent)"
  },
  {
    title: "Live Scores", 
    description: "Real-time scores with betting context",
    icon: Activity,
    link: "/scores",
    color: "var(--success)"
  },
  {
    title: "Analytics",
    description: "Advanced betting analytics", 
    icon: BarChart3,
    link: "/picks",
    color: "var(--info)"
  }
];

// Landing Page Component for non-authenticated users
export default function Landing() {
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSignOutMessage, setShowSignOutMessage] = useState(false);

  useEffect(() => {
    const signedOut = searchParams.get('signed_out');
    if (signedOut) {
      setShowSignOutMessage(true);
      // Clear the URL parameter after showing the message
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('signed_out');
      setSearchParams(newParams, { replace: true });
      
      // Hide the message after 5 seconds
      setTimeout(() => setShowSignOutMessage(false), 5000);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="home-page">
      <Helmet>
        <title>OddSightSeer - Smart Sports Betting Odds Comparison & Analytics</title>
        <meta name="description" content="Compare live sports betting odds across major sportsbooks. Find the best lines, track player props, and make smarter bets with real-time analytics." />
        <meta name="keywords" content="sports betting, odds comparison, player props, betting analytics, sportsbook odds" />
        <meta property="og:title" content="OddSightSeer - Smart Sports Betting Odds Comparison" />
        <meta property="og:description" content="Compare live sports betting odds across major sportsbooks and find the best lines with real-time analytics." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OddSightSeer - Smart Sports Betting Odds Comparison" />
        <meta name="twitter:description" content="Compare live sports betting odds across major sportsbooks and find the best lines with real-time analytics." />
      </Helmet>
      
      {/* Sign Out Success Message */}
      {showSignOutMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '600',
          animation: 'slideDown 0.3s ease-out'
        }}>
          ✅ You have been signed out successfully
        </div>
      )}
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Users size={16} />
              <span>Trusted by Sports Bettors</span>
            </div>
            
            <h1 className="hero-title">
              Find the Best <span className="highlight">Sports Betting Odds</span> Instantly
            </h1>
            
            <p className="hero-subtitle">
              Compare odds across all major sportsbooks, analyze player props, and track your betting performance with advanced analytics. 
              Make smarter bets with real-time data.
            </p>
          </div>

          {/* Value Props */}
          <div className="value-props">
            <div className="value-prop">
              <Shield size={20} />
              <span>Live Odds Comparison</span>
            </div>
            <div className="value-prop">
              <Users size={20} />
              <span>All Major Sportsbooks</span>
            </div>
            <div className="value-prop">
              <Activity size={20} />
              <span>Player Props Analysis</span>
            </div>
          </div>

        {/* CTA Buttons */}
        <div className="cta-buttons">
          <Link to="/login" className="cta-primary">
            <TrendingUp size={20} />
            Compare Odds Now
          </Link>
          <Link to="/login" className="cta-secondary">
            <Play size={20} />
            Get Started Free
          </Link>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {QUICK_ACTIONS.map((action) => {
            const IconComponent = action.icon;
            return (
              <div key={action.title} className="feature-card">
                <div className="feature-icon">
                  <IconComponent size={32} color="white" />
                </div>
                <h3 className="feature-title">
                  {action.title}
                </h3>
                <p className="feature-description">
                  {action.description}
                </p>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    marginTop: '16px'
                  }}
                >
                  Try Now
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Section - Temporarily removed for redesign
      <Pricing />
      */}

      {/* Edge Calculator Modal */}
      {showEdgeCalculator && (
        <EdgeCalculator 
          onClose={() => setShowEdgeCalculator(false)} 
          onNavigateToSportsbooks={() => {
            setShowEdgeCalculator(false);
            window.location.href = '/sportsbooks';
          }}
        />
      )}
      </section>
    </div>
  );
}
