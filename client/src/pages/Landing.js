import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { 
  Target, 
  Shield, 
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Play,
  ArrowRight,
  Zap,
  Eye,
  DollarSign,
  CheckCircle,
  Star,
  Sparkles,
  Trophy,
  Clock
} from 'lucide-react';

// Components
import EdgeCalculator from '../components/betting/EdgeCalculator';
import Pricing from '../components/billing/Pricing';

// Styles
import '../styles/landing-revamp.css';

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

// Stats for social proof
const STATS = [
  { number: "50K+", label: "Active Users" },
  { number: "15+", label: "Sportsbooks" },
  { number: "4.2%", label: "Avg Edge" },
  { number: "24/7", label: "Live Updates" }
];

// Features showcase
const FEATURES = [
  {
    icon: Eye,
    title: "Real-Time Odds Comparison",
    description: "Compare odds across 15+ major sportsbooks instantly. Never miss the best line again.",
    color: "#8b5cf6"
  },
  {
    icon: TrendingUp,
    title: "+EV Bet Finder",
    description: "Our algorithm identifies positive expected value bets with edge calculations in real-time.",
    color: "#10b981"
  },
  {
    icon: Target,
    title: "Player Props Analysis",
    description: "Deep dive into player props with historical data, trends, and line movement tracking.",
    color: "#f59e0b"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track your betting performance with detailed stats, ROI tracking, and insights.",
    color: "#3b82f6"
  },
  {
    icon: Zap,
    title: "Arbitrage Detection",
    description: "Automatically find arbitrage opportunities across sportsbooks for guaranteed profits.",
    color: "#ec4899"
  },
  {
    icon: Shield,
    title: "Line Movement Alerts",
    description: "Get notified when odds shift significantly so you can capitalize on market movements.",
    color: "#14b8a6"
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    name: "Mike Johnson",
    role: "Professional Bettor",
    content: "OddSightSeer helped me increase my ROI by 15% in just 3 months. The +EV finder is a game-changer.",
    rating: 5
  },
  {
    name: "Sarah Chen",
    role: "Sports Analyst",
    content: "Best odds comparison tool I've used. The player props analysis is incredibly detailed and accurate.",
    rating: 5
  },
  {
    name: "David Martinez",
    role: "Casual Bettor",
    content: "Finally found a platform that makes line shopping easy. Saved hundreds on better odds already.",
    rating: 5
  }
];

// Landing Page Component for non-authenticated users
export default function Landing() {
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSignOutMessage, setShowSignOutMessage] = useState(false);
  const navigate = useNavigate();

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

  // Scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page-revamp">
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
        <div className="success-toast">
          ✅ You have been signed out successfully
        </div>
      )}
      
      {/* Hero Section - Revamped */}
      <section className="hero-revamp">
        <div className="hero-background-effects">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-grid"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-badge-new">
            <Sparkles size={14} />
            <span>Trusted by 50,000+ Sports Bettors</span>
          </div>
          
          <h1 className="hero-title-new">
            Win More Bets with
            <span className="gradient-text"> Smart Odds Comparison</span>
          </h1>
          
          <p className="hero-subtitle-new">
            Compare live odds across 15+ sportsbooks, find +EV bets instantly, and track your performance with advanced analytics. Join thousands of winning bettors.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group">
            <button onClick={() => navigate('/subscribe')} className="cta-btn-primary">
              <TrendingUp size={20} />
              Start Winning Today
              <ArrowRight size={20} />
            </button>
            <button onClick={() => navigate('/login')} className="cta-btn-secondary">
              <Play size={18} />
              Watch Demo
            </button>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-item">
              <CheckCircle size={16} />
              <span>No credit card required</span>
            </div>
            <div className="trust-item">
              <CheckCircle size={16} />
              <span>Cancel anytime</span>
            </div>
            <div className="trust-item">
              <CheckCircle size={16} />
              <span>7-day money back</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section animate-on-scroll">
        <div className="stats-container">
          {STATS.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section-new animate-on-scroll">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Everything You Need to <span className="gradient-text">Win More</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools designed for serious sports bettors
            </p>
          </div>

          <div className="features-grid-new">
            {FEATURES.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="feature-card-new">
                  <div className="feature-icon-wrapper" style={{background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`}}>
                    <IconComponent size={28} />
                  </div>
                  <h3 className="feature-title-new">{feature.title}</h3>
                  <p className="feature-desc-new">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section-landing animate-on-scroll">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Choose Your <span className="gradient-text">Winning Plan</span>
            </h2>
            <p className="section-subtitle">
              Start free, upgrade when you're ready
            </p>
          </div>
          <Pricing />
        </div>
      </section>

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
    </div>
  );
}
