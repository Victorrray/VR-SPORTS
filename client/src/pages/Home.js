import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import SEOHead from '../components/SEOHead';

// Components
import PersonalizedDashboard from '../components/PersonalizedDashboard';
import EdgeCalculator from '../components/EdgeCalculator';
import AlertSystem from '../components/AlertSystem';
import MobileBottomBar from '../components/MobileBottomBar';
import Footer from '../components/Footer';

// Hooks
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../auth/AuthProvider';

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
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  
  // Fetch live odds data for dashboard with reduced polling (only for logged-in users)
  const { games } = useMarkets(
    user ? ["americanfootball_nfl", "basketball_nba", "baseball_mlb"] : [], // sports
    user ? ["us"] : [], // regions
    user ? ["h2h", "spreads", "totals"] : [] // markets
  );

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <div className="home-page">
        <Helmet>
          <title>OddsSightSeer - Smart Sports Betting Odds Comparison & Analytics</title>
          <meta name="description" content="Compare live sports betting odds across major sportsbooks. Find the best lines, track player props, and make smarter bets with real-time analytics." />
          <meta name="keywords" content="sports betting, odds comparison, player props, betting analytics, sportsbook odds" />
          <meta property="og:title" content="OddsSightSeer - Smart Sports Betting Odds Comparison" />
          <meta property="og:description" content="Compare live sports betting odds across major sportsbooks and find the best lines with real-time analytics." />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="OddsSightSeer - Smart Sports Betting Odds Comparison" />
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
            <Link to="/sportsbooks" className="cta-primary">
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
                    to={action.link}
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

        {/* Edge Calculator Modal */}
        {showEdgeCalculator && (
          <EdgeCalculator onClose={() => setShowEdgeCalculator(false)} />
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
      paddingTop: '80px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Header Section */}
      <div style={{ 
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '28px',
            fontWeight: '700',
            margin: 0
          }}>
            {user.user_metadata?.username || user.email?.split('@')[0]}'s Dashboard
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowEdgeCalculator(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Calculator size={16} />
              Calculator
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {QUICK_ACTIONS.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                style={{
                  textDecoration: 'none',
                  padding: '20px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={24} color="white" />
                </div>
                <div>
                  <h3 style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Main Dashboard */}
        <PersonalizedDashboard games={games} />
      </div>

      {/* Edge Calculator Modal */}
      {showEdgeCalculator && (
        <EdgeCalculator onClose={() => setShowEdgeCalculator(false)} />
      )}

      <MobileBottomBar active="home" showFilter={false} />
    </main>
  );
}
