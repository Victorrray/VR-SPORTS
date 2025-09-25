import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Crown, Zap } from 'lucide-react';

// Components
import PersonalizedDashboard from '../components/dashboard/PersonalizedDashboard';
import EdgeCalculator from '../components/betting/EdgeCalculator';
import BetSlip from '../components/betting/BetSlip';
import MobileBottomBar from '../components/layout/MobileBottomBar';

// Hooks
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { useBetSlip } from '../contexts/BetSlipContext';

// Dashboard Component for authenticated users
export default function Dashboard() {
  const { user, profile } = useAuth();
  const { me } = useMe();
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();

  // Get plan badge component
  const getPlanBadge = () => {
    const planId = me?.plan || null;
    
    switch (planId) {
      case 'gold':
        return (
          <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Crown size={12} />
            GOLD
          </span>
        );
      case 'platinum':
        return (
          <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: '#fff',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Crown size={12} />
            PLATINUM
          </span>
        );
      default:
        return (
          <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '0px'
          }}>
            GUEST
          </span>
        );
    }
  };

  // Create memory for user preferences
  React.useEffect(() => {
    if (user?.user_metadata?.username || user?.email) {
      // Save user info to memory for personalization
    }
  }, [user?.user_metadata?.username, user?.email]);
  
  // Only fetch live odds data when actually on the dashboard page
  const location = useLocation();
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
          {getPlanBadge()}
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0',
            marginTop: '12px'
          }}>
            {profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}'s Dashboard
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

      {/* BetSlip Component */}
      <BetSlip
        isOpen={isOpen}
        onClose={closeBetSlip}
        bets={bets}
        onUpdateBet={updateBet}
        onRemoveBet={removeBet}
        onClearAll={clearAllBets}
        onPlaceBets={placeBets}
      />

      <MobileBottomBar active="home" showFilter={false} />
    </main>
  );
}
