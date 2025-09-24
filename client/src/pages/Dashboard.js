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
  const location = useLocation();
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();

  // Get plan badge component
  const getPlanBadge = () => {
    const planId = me?.plan || 'free';
    
    switch (planId) {
      case 'platinum':
        return (
          <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.2))',
            color: '#fcd34d',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px'
          }}>
            <Crown size={12} />
            PLATINUM
          </span>
        );
      case 'free_trial':
        return (
          <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px'
          }}>
            <Zap size={12} />
            FREE TRIAL
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
            marginTop: '8px'
          }}>
            FREE
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
            {profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}'s Dashboard
          </h1>
          {getPlanBadge()}
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
