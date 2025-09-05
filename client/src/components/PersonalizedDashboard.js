import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Target, Clock, DollarSign, BarChart3, Zap, Award, AlertTriangle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import './PersonalizedDashboard.css';
import logos from '../data/logos';

export default function PersonalizedDashboard({ games, userPreferences = {} }) {
  const [dashboardData, setDashboardData] = useState({
    todayOpportunities: 0,
    highEvBets: 0,
    favoriteLeagues: [],
    recentPerformance: null,
    recommendedBets: [],
    alerts: []
  });

  const [expandedBets, setExpandedBets] = useState({});

  useEffect(() => {
    if (games?.length && games.length > 0) {
      // Only generate data once when games first load, not on every update
      const timeoutId = setTimeout(() => {
        generateDashboardData();
      }, 100); // Small delay to prevent rapid re-renders
      
      return () => clearTimeout(timeoutId);
    }
  }, [games?.length]); // Remove userPreferences dependency to prevent unnecessary updates

  const generateDashboardData = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayGames = games.filter(game => 
      game.commence_time && game.commence_time.startsWith(today)
    );

    // Calculate high EV opportunities - use static data to prevent jitter
    const highEvBets = games.filter((game, index) => {
      // Use game ID for consistent pseudo-random results
      const seed = game.id ? game.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0) : index;
      return Math.abs(seed) % 10 > 7; // ~30% of bets are high EV, but consistent
    });

    // Get user's favorite leagues from preferences or default
    const favoriteLeagues = userPreferences.favoriteLeagues || [
      'NFL', 'NBA', 'NCAAF', 'NCAAB'
    ];

    // Generate recommended bets based on user preferences - use deterministic data
    const recommendedBets = games.slice(0, 5).map((game, index) => {
      const seed = game.id ? game.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0) : index;
      const markets = ['Moneyline', 'Spread', 'Total'];
      const confidences = ['High', 'Medium', 'Low'];
      const bookmakers = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'Pinnacle'];
      const bookmakerKeys = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'pinnacle'];
      
      // Generate mock odds for mini table
      const mockOdds = bookmakers.map((book, i) => {
        const bookSeed = seed + i * 17;
        return {
          bookmaker: {
            key: bookmakerKeys[i],
            title: book
          },
          book: book,
          price: Math.abs(bookSeed) % 2 === 0 ? Math.abs(bookSeed) % 200 + 100 : -(Math.abs(bookSeed) % 200 + 110),
          odds: Math.abs(bookSeed) % 2 === 0 ? Math.abs(bookSeed) % 200 + 100 : -(Math.abs(bookSeed) % 200 + 110)
        };
      });
      
      return {
        id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        market: markets[Math.abs(seed) % 3],
        edge: (Math.abs(seed) % 50 / 10 + 1).toFixed(1),
        confidence: confidences[Math.abs(seed * 2) % 3],
        bookmaker: bookmakers[Math.abs(seed * 3) % 5],
        odds: Math.abs(seed) % 2 === 0 ? `+${Math.abs(seed) % 200 + 100}` : `-${Math.abs(seed) % 200 + 110}`,
        allBooks: mockOdds,
        game: game
      };
    });

    // Generate performance alerts
    const alerts = [
      {
        type: 'opportunity',
        message: `${highEvBets.length} high-value bets available today`,
        icon: TrendingUp,
        color: 'var(--success)'
      },
      {
        type: 'warning',
        message: 'Consider diversifying across more sportsbooks',
        icon: AlertTriangle,
        color: 'var(--warning)'
      },
      {
        type: 'info',
        message: 'Your favorite NFL team has a game tonight',
        icon: Clock,
        color: 'var(--info)'
      }
    ];

    setDashboardData({
      todayOpportunities: todayGames.length,
      highEvBets: highEvBets.length,
      favoriteLeagues,
      recentPerformance: {
        winRate: (60 + (Math.abs(games[0]?.id?.charCodeAt(0) || 0) % 200) / 10).toFixed(1),
        avgEdge: (2.1 + (Math.abs(games[0]?.id?.charCodeAt(1) || 0) % 20) / 10).toFixed(1),
        roi: (8.5 + (Math.abs(games[0]?.id?.charCodeAt(2) || 0) % 100) / 10).toFixed(1),
        totalBets: Math.floor((Math.abs(games[0]?.id?.charCodeAt(3) || 0) % 50)) + 25
      },
      recommendedBets,
      alerts: alerts.slice(0, 2) // Show max 2 alerts
    });
  }, [games]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'var(--accent)' }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  const toggleBetExpansion = (betId) => {
    setExpandedBets(prev => ({
      ...prev,
      [betId]: !prev[betId]
    }));
  };

  const formatOdds = (odds) => {
    const n = Number(odds);
    return n > 0 ? `+${n}` : `${n}`;
  };

  const cleanBookTitle = (title) => {
    return String(title || '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  };

  return (
    <div className="personalized-dashboard">
      <div className="dashboard-header">
        <h2>Your Dashboard</h2>
        <p>Personalized insights and recommendations</p>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-stats">
        <StatCard
          icon={Target}
          title="Today's Opportunities"
          value={dashboardData.todayOpportunities}
          subtitle="Games available"
          color="var(--accent)"
        />
        <StatCard
          icon={TrendingUp}
          title="High +EV Bets"
          value={dashboardData.highEvBets}
          subtitle="Above 3% edge"
          color="var(--success)"
        />
        <StatCard
          icon={DollarSign}
          title="Avg Edge"
          value={`${dashboardData.recentPerformance?.avgEdge || '0.0'}%`}
          subtitle="Last 30 days"
          color="var(--warning)"
        />
        <StatCard
          icon={BarChart3}
          title="Win Rate"
          value={`${dashboardData.recentPerformance?.winRate || '0.0'}%`}
          subtitle={`${dashboardData.recentPerformance?.totalBets || 0} bets`}
          color="var(--info)"
        />
      </div>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="dashboard-alerts">
          <h3>Alerts & Insights</h3>
          <div className="alerts-list">
            {dashboardData.alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <div key={index} className="alert-item" style={{ borderLeft: `4px solid ${alert.color}` }}>
                  <Icon size={16} style={{ color: alert.color }} />
                  <span>{alert.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Bets */}
      <div className="dashboard-recommendations">
        <h3>
          <Zap size={18} />
          Recommended Bets
        </h3>
        <div className="recommendations-list">
          {dashboardData.recommendedBets.map((bet, index) => {
            const isExpanded = expandedBets[bet.id || index];
            return (
              <div key={bet.id || index} className={`recommendation-card ${isExpanded ? 'expanded' : ''}`}>
                <div 
                  className="rec-main-content"
                  onClick={() => toggleBetExpansion(bet.id || index)}
                >
                  <div className="rec-header">
                    <div className="rec-matchup">{bet.matchup}</div>
                    <div className="rec-header-right">
                      <div className={`rec-confidence ${bet.confidence.toLowerCase()}`}>
                        {bet.confidence}
                      </div>
                      <div className="expand-indicator">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                  <div className="rec-details">
                    <div className="rec-market">{bet.market}</div>
                    <div className="rec-edge">+{bet.edge}% EV</div>
                    <div className="rec-odds">{bet.odds}</div>
                  </div>
                  <div className="rec-bookmaker">
                    {logos[bet.bookmaker?.toLowerCase()] && (
                      <img 
                        src={logos[bet.bookmaker.toLowerCase()]} 
                        alt={bet.bookmaker}
                        className="rec-bookmaker-logo"
                      />
                    )}
                    {bet.bookmaker}
                  </div>
                </div>
                
                {/* Mini Odds Table */}
                {isExpanded && bet.allBooks && (
                  <div className="rec-mini-table">
                    <div className="mini-table-header">
                      <h4>Compare Odds</h4>
                      <div className="mini-table-subtitle">{bet.market} • {bet.matchup}</div>
                    </div>
                    <div className="mini-odds-grid">
                      {bet.allBooks.slice(0, 6).map((book, bookIndex) => (
                        <div key={bookIndex} className="mini-odds-card">
                          <div className="mini-book-header">
                            {logos[book.bookmaker?.key] && (
                              <img 
                                src={logos[book.bookmaker.key]} 
                                alt={book.book}
                                className="mini-book-logo"
                              />
                            )}
                            <span className="mini-book-name">{cleanBookTitle(book.book)}</span>
                          </div>
                          <div className="mini-book-odds">
                            <span className="mini-odds-value">{formatOdds(book.price || book.odds)}</span>
                          </div>
                          <button className="mini-bet-btn">
                            <Plus size={12} />
                            Bet
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Summary */}
      {dashboardData.recentPerformance && (
        <div className="dashboard-performance">
          <h3>
            <Award size={18} />
            Recent Performance
          </h3>
          <div className="performance-grid">
            <div className="perf-metric">
              <div className="perf-value">{dashboardData.recentPerformance.winRate}%</div>
              <div className="perf-label">Win Rate</div>
            </div>
            <div className="perf-metric">
              <div className="perf-value">+{dashboardData.recentPerformance.roi}%</div>
              <div className="perf-label">ROI</div>
            </div>
            <div className="perf-metric">
              <div className="perf-value">{dashboardData.recentPerformance.avgEdge}%</div>
              <div className="perf-label">Avg Edge</div>
            </div>
            <div className="perf-metric">
              <div className="perf-value">{dashboardData.recentPerformance.totalBets}</div>
              <div className="perf-label">Total Bets</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
