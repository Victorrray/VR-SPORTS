import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Shield, 
  Calculator,
  Users,
  Activity,
  BarChart3,
  Star,
  Award
} from 'lucide-react';

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
// import styles from './Home.module.css';

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
  
  // Fetch live odds data for dashboard with reduced polling
  const { games } = useMarkets(
    ["americanfootball_nfl", "basketball_nba", "baseball_mlb"], // sports
    ["us"], // regions
    ["h2h", "spreads", "totals"], // markets
    { pollingInterval: 10 * 60 * 1000, enabled: false } // 10 minutes, disabled auto-polling
  );

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
{user ? `${user.email?.split('@')[0]}'s Dashboard` : 'VR-Odds Dashboard'}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
{/* <AlertSystem games={games} /> */}
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
