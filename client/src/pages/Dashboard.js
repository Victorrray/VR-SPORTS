import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

// Components
import PersonalizedDashboard from '../components/dashboard/PersonalizedDashboard';
import EdgeCalculator from '../components/betting/EdgeCalculator';
import MobileBottomBar from '../components/layout/MobileBottomBar';

// Hooks
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';

// Dashboard Component for authenticated users
export default function Dashboard() {
  const { user } = useAuth();
  const { me } = useMe();
  const location = useLocation();
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);

  // Create memory for user preferences
  React.useEffect(() => {
    if (user?.user_metadata?.username || user?.email) {
      // Save user info to memory for personalization
    }
  }, [user?.user_metadata?.username, user?.email]);
  
  // Only fetch live odds data when actually on the dashboard page
  const isDashboardPage = location.pathname === '/' || location.pathname === '/dashboard';
  const enableDashboardMarkets = Boolean(user && isDashboardPage);
  const { games } = useMarkets(
    enableDashboardMarkets ? ["americanfootball_nfl", "basketball_nba", "baseball_mlb"] : [],
    enableDashboardMarkets ? ["us"] : [],
    enableDashboardMarkets ? ["h2h", "spreads", "totals"] : [],
    { enabled: enableDashboardMarkets }
  );

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
