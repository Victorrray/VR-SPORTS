import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { 
  Target, 
  Shield, 
  Calculator,
  Users,
  Activity,
  BarChart3,
  Star,
  Award,
  TrendingUp,
  Play,
  ArrowRight
} from 'lucide-react';
import SEOHead from '../components/layout/SEOHead';

// Components
import PersonalizedDashboard from '../components/dashboard/PersonalizedDashboard';
import EdgeCalculator from '../components/betting/EdgeCalculator';
import AlertSystem from '../components/layout/AlertSystem';
import MobileBottomBar from '../components/layout/MobileBottomBar';
import Footer from '../components/layout/Footer';
import Pricing from '../components/billing/Pricing';

// Hooks
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';

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
export default function Home() {
  const { user } = useAuth();
  const { me } = useMe();
  const location = useLocation();
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);

  // Create memory for user preferences
  React.useEffect(() => {
    if (user?.user_metadata?.username || user?.email) {
      // Save user info to memory for personalization
    }
  }, [user?.user_metadata?.username, user?.email]);
  
  // Only fetch live odds data when actually on the home page
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const enableHomeMarkets = Boolean(user && isHomePage);
  const { games } = useMarkets(
    enableHomeMarkets ? ["americanfootball_nfl", "basketball_nba", "baseball_mlb"] : [],
    enableHomeMarkets ? ["us"] : [],
    enableHomeMarkets ? ["h2h", "spreads", "totals"] : [],
    { enabled: enableHomeMarkets }
  );

  // Landing page for non-authenticated users
  if (!user) {
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

  // Dashboard for authenticated users
  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      paddingTop: '20px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Header Section */}
      <div style={{ 
        padding: '16px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0'
          }}>
            {me?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}'s Dashboard
          </h1>
        </div>

        {/* Main Dashboard */}
        <PersonalizedDashboard games={games} />
      </div>

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

      <MobileBottomBar active="home" showFilter={false} />
    </main>
  );
}
