import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Shield, 
  ArrowRight, 
  ChevronRight,
  Calculator,
  Bell,
  Users,
  Trophy,
  Flame,
  Activity,
  DollarSign,
  BarChart3,
  Clock,
  Star,
  TrendingDown,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Award
} from 'lucide-react';

// Components
import PersonalizedDashboard from '../components/PersonalizedDashboard';
import EdgeCalculator from '../components/EdgeCalculator';
import AlertSystem from '../components/AlertSystem';
import MobileBottomBar from '../components/MobileBottomBar';
import Footer from '../components/Footer';

// Hooks
import useMarkets from '../hooks/useMarkets';
import { useAuth } from '../auth/AuthProvider';

// Styles
import styles from './Home.module.css';

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
    link: "/sportsbooks",
    color: "var(--info)"
  }
];

// +EV Opportunities preview
const EV_OPPORTUNITIES = [
  { 
    id: "ev1", 
    league: "NFL", 
    game: "Chiefs vs Bills", 
    market: "Spread", 
    line: "Chiefs -3.5", 
    book: "DraftKings", 
    odds: "+102", 
    edge: "+4.2%",
    profit: "$42 per $100"
  },
  { 
    id: "ev2", 
    league: "NBA", 
    game: "Lakers vs Warriors", 
    market: "Total", 
    line: "Over 225.5", 
    book: "FanDuel", 
    odds: "+105", 
    edge: "+3.1%",
    profit: "$31 per $100"
  },
  { 
    id: "ev3", 
    league: "MLB", 
    game: "Dodgers vs Giants", 
    market: "Moneyline", 
    line: "Dodgers ML", 
    book: "Caesars", 
    odds: "-108", 
    edge: "+2.8%",
    profit: "$28 per $100"
  }
];

// Success stories with specific results
const SUCCESS_STORIES = [
  {
    name: "Mike Chen",
    role: "Professional Bettor",
    result: "$2,400 profit in 30 days",
    quote: "The edge detection found opportunities I never would have spotted manually.",
    avatar: "MC",
    verified: true
  },
  {
    name: "Sarah Rodriguez",
    role: "Sports Analyst", 
    result: "40% CLV improvement",
    quote: "Finally, a tool that actually finds real value instead of just tracking odds.",
    avatar: "SR",
    verified: true
  },
  {
    name: "David Park",
    role: "Weekend Bettor",
    result: "From -$500 to +$1,200",
    quote: "Went from consistently losing to making steady profits every month.",
    avatar: "DP",
    verified: true
  }
];

// Trust signals
const TRUST_SIGNALS = [
  { icon: Star, text: "4.9/5 rating", subtext: "2,847 reviews" },
  { icon: Shield, text: "Bank-level security", subtext: "256-bit encryption" },
  { icon: Users, text: "50K+ users", subtext: "Growing daily" },
  { icon: Award, text: "30-day guarantee", subtext: "Risk-free trial" }
];

// Landing Page Component for non-authenticated users
export default function Home() {
  const { user } = useAuth();
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  
  // Fetch live odds data for dashboard
  const { games, loading, error } = useMarkets({
    sports: ["americanfootball_nfl", "basketball_nba", "baseball_mlb"],
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:10000",
    refreshKey: 0
  });

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      paddingTop: '80px'
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
            {user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'VR-Odds Dashboard'}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertSystem games={games} />
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
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
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
      <Footer />
    </main>
  );
}
