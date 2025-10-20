import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Crown, Zap } from 'lucide-react';

// Components
import PersonalizedDashboard from '../components/dashboard/PersonalizedDashboard';
import EdgeCalculator from '../components/betting/EdgeCalculator';
import BetSlip from '../components/betting/BetSlip';
import MobileBottomBar from '../components/layout/MobileBottomBar';
import PremiumGiftNotification from '../components/PremiumGiftNotification';

// Hooks
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../hooks/SimpleAuth';
import { useMe } from '../hooks/useMe';
import { useBetSlip } from '../contexts/BetSlipContext';

// Dashboard Component for authenticated users
export default function Dashboard() {
  const { user, profile } = useAuth();
  const { me } = useMe();
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  const [showGiftNotification, setShowGiftNotification] = useState(false);
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();

  // Check for gifted premium membership
  useEffect(() => {
    if (me && user) {
      const userId = user.id;
      const hasSeenGiftKey = `hasSeenGiftNotification_${userId}`;
      const hasSeenNotification = localStorage.getItem(hasSeenGiftKey);
      
      // Check if user has platinum plan and is_gifted flag
      const isGiftedPremium = me.plan === 'platinum' && me.is_gifted === true;
      
      console.log('Gift notification check:', {
        plan: me.plan,
        isGifted: me.is_gifted,
        hasSeenNotification,
        shouldShow: isGiftedPremium && !hasSeenNotification
      });
      
      if (isGiftedPremium && !hasSeenNotification) {
        setShowGiftNotification(true);
      }
    }
  }, [me, user]);

  const handleCloseGiftNotification = () => {
    setShowGiftNotification(false);
    if (user?.id) {
      const hasSeenGiftKey = `hasSeenGiftNotification_${user.id}`;
      localStorage.setItem(hasSeenGiftKey, 'true');
    }
  };

  // Get plan badge component
  const getPlanBadge = () => {
    const planId = me?.plan || null;
    
    switch (planId) {
      case 'gold':
        return (
          <span style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(255, 165, 0, 0.4)'
          }}>
            <Crown size={16} />
            GOLD
          </span>
        );
      case 'platinum':
        return (
          <span style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)'
          }}>
            <Crown size={16} style={{ color: 'white' }} />
            PLATINUM
          </span>
        );
      default:
        return (
          <span style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)',
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
  // Allow guest users to see dashboard with recommended bets (preview)
  const location = useLocation();
  const isDashboardPage = location.pathname === '/' || location.pathname === '/dashboard';
  const enableDashboardMarkets = Boolean(isDashboardPage); // Enable for all users on dashboard
  const { games, loading, error } = useMarkets(
    enableDashboardMarkets ? ["americanfootball_nfl", "basketball_nba", "baseball_mlb"] : [],
    enableDashboardMarkets ? ["us"] : [],
    enableDashboardMarkets ? ["h2h", "spreads", "totals"] : [],
    { enabled: enableDashboardMarkets }
  );

  // Debug: Log games data
  React.useEffect(() => {
    console.log('Dashboard - useMarkets data:', {
      gamesCount: games?.length || 0,
      loading,
      error,
      enableDashboardMarkets,
      isDashboardPage,
      firstGame: games?.[0]
    });
  }, [games, loading, error, enableDashboardMarkets, isDashboardPage]);

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      paddingTop: '20px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Premium Gift Notification */}
      {showGiftNotification && (
        <PremiumGiftNotification 
          expirationDate={me?.subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          onClose={handleCloseGiftNotification}
        />
      )}

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
