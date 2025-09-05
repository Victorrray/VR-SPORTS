import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Target, Clock, DollarSign, BarChart3, Zap, Award, AlertTriangle, ChevronDown, ChevronUp, Plus, ArrowRight } from 'lucide-react';
import './PersonalizedDashboard.css';

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
    if (!games || games.length === 0) {
      setDashboardData({
        todayOpportunities: 0,
        highEvBets: 0,
        favoriteLeagues: [],
        recentPerformance: null,
        recommendedBets: [],
        alerts: []
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayGames = games.filter(game => 
      game.commence_time && game.commence_time.startsWith(today)
    );

    // Calculate actual high EV opportunities based on real odds data
    const highEvBets = games.filter(game => {
      if (!game.bookmakers || game.bookmakers.length < 2) return false;
      
      // Find best odds for each market
      const h2hOdds = [];
      game.bookmakers.forEach(book => {
        book.markets?.forEach(market => {
          if (market.key === 'h2h') {
            market.outcomes?.forEach(outcome => {
              h2hOdds.push(parseFloat(outcome.price));
            });
          }
        });
      });
      
      if (h2hOdds.length < 2) return false;
      
      // Calculate if there's significant odds difference (potential +EV)
      const maxOdds = Math.max(...h2hOdds);
      const minOdds = Math.min(...h2hOdds);
      const oddsSpread = ((maxOdds - minOdds) / minOdds) * 100;
      
      return oddsSpread > 5; // 5% or more difference indicates potential value
    });

    // Get user's favorite leagues from preferences or infer from game data
    const favoriteLeagues = userPreferences.favoriteLeagues || 
      [...new Set(games.map(g => g.sport_title).filter(Boolean))].slice(0, 4);

    // Generate recommended bets based on actual odds analysis
    const recommendedBets = highEvBets.slice(0, 5).map((game) => {
      if (!game.bookmakers || game.bookmakers.length === 0) return null;
      
      // Find the best market and odds for this game
      let bestMarket = null;
      let bestOdds = null;
      let bestBookmaker = null;
      let maxEdge = 0;
      
      // Analyze each market type
      ['h2h', 'spreads', 'totals'].forEach(marketKey => {
        const marketOdds = [];
        game.bookmakers.forEach(book => {
          const market = book.markets?.find(m => m.key === marketKey);
          if (market?.outcomes) {
            market.outcomes.forEach(outcome => {
              marketOdds.push({
                bookmaker: book.title,
                bookmakerKey: book.key,
                price: parseFloat(outcome.price),
                outcome: outcome.name
              });
            });
          }
        });
        
        if (marketOdds.length >= 2) {
          const maxPrice = Math.max(...marketOdds.map(o => o.price));
          const avgPrice = marketOdds.reduce((sum, o) => sum + o.price, 0) / marketOdds.length;
          const edge = ((maxPrice - avgPrice) / avgPrice) * 100;
          
          if (edge > maxEdge) {
            maxEdge = edge;
            bestMarket = marketKey;
            bestOdds = marketOdds.find(o => o.price === maxPrice);
            bestBookmaker = bestOdds?.bookmaker;
          }
        }
      });
      
      if (!bestMarket || !bestOdds) return null;
      
      // Get all bookmaker odds for this market
      const allBooks = [];
      game.bookmakers.forEach(book => {
        const market = book.markets?.find(m => m.key === bestMarket);
        if (market?.outcomes) {
          const outcome = market.outcomes[0]; // Take first outcome for comparison
          if (outcome) {
            allBooks.push({
              bookmaker: { key: book.key, title: book.title },
              name: book.title,
              odds: parseFloat(outcome.price)
            });
          }
        }
      });
      
      const marketNames = {
        'h2h': 'Moneyline',
        'spreads': 'Spread',
        'totals': 'Total'
      };
      
      const confidence = maxEdge > 8 ? 'High' : maxEdge > 4 ? 'Medium' : 'Low';
      
      return {
        id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        market: marketNames[bestMarket] || bestMarket,
        edge: maxEdge.toFixed(1),
        confidence: confidence,
        bookmaker: bestBookmaker,
        odds: bestOdds.price > 0 ? `+${bestOdds.price}` : `${bestOdds.price}`,
        allBooks: allBooks.slice(0, 6),
        game: game
      };
    }).filter(Boolean);

    // Generate dynamic alerts based on actual data
    const alerts = [];
    
    if (highEvBets.length > 0) {
      alerts.push({
        type: 'opportunity',
        message: `${highEvBets.length} high-value betting opportunities found`,
        icon: TrendingUp,
        color: 'var(--success)'
      });
    }
    
    if (todayGames.length > 10) {
      alerts.push({
        type: 'info',
        message: `${todayGames.length} games available today - busy betting day!`,
        icon: Clock,
        color: 'var(--info)'
      });
    }
    
    const uniqueBooks = new Set();
    games.forEach(game => {
      game.bookmakers?.forEach(book => uniqueBooks.add(book.key));
    });
    
    if (uniqueBooks.size < 5) {
      alerts.push({
        type: 'warning',
        message: 'Consider checking more sportsbooks for better odds',
        icon: AlertTriangle,
        color: 'var(--warning)'
      });
    }

    // Calculate actual average edge from recommended bets
    const actualAvgEdge = recommendedBets.length > 0 
      ? (recommendedBets.reduce((sum, bet) => sum + parseFloat(bet.edge), 0) / recommendedBets.length).toFixed(1)
      : '0.0';

    setDashboardData({
      todayOpportunities: todayGames.length,
      highEvBets: highEvBets.length,
      favoriteLeagues,
      recentPerformance: {
        winRate: '0.0', // Will be replaced with real data when user tracking is implemented
        avgEdge: actualAvgEdge,
        roi: '0.0', // Will be replaced with real data when user tracking is implemented
        totalBets: 0 // Will be replaced with real data when user tracking is implemented
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


      {/* Top Value Bets */}
      {dashboardData.recommendedBets.length > 0 && (
        <div className="top-value-bets">
          <div className="section-header">
            <div className="section-title">
              <TrendingUp size={20} />
              <h3>Top Value Bets</h3>
            </div>
            <div className="section-subtitle">
              Best opportunities based on odds analysis
            </div>
          </div>
          
          <div className="value-bets-grid">
            {dashboardData.recommendedBets.slice(0, 3).map((bet, index) => (
              <div key={bet.id || index} className="value-bet-card">
                <div className="bet-header">
                  <div className="matchup-info">
                    <div className="teams">{bet.matchup}</div>
                    <div className="market-type">{bet.market}</div>
                  </div>
                  <div className={`edge-badge ${bet.confidence.toLowerCase()}`}>
                    +{bet.edge}% EV
                  </div>
                </div>
                
                <div className="bet-details">
                  <div className="best-odds">
                    <div className="odds-label">Best Odds</div>
                    <div className="odds-value">{bet.odds}</div>
                    <div className="bookmaker">{bet.bookmaker}</div>
                  </div>
                  
                  <div className="confidence-indicator">
                    <div className="confidence-label">Confidence</div>
                    <div className={`confidence-level ${bet.confidence.toLowerCase()}`}>
                      {bet.confidence}
                    </div>
                  </div>
                </div>
                
                <div className="bet-actions">
                  <button 
                    className="view-all-odds-btn"
                    onClick={() => toggleBetExpansion(bet.id || index)}
                  >
                    {expandedBets[bet.id || index] ? 'Hide' : 'Compare'} Odds
                  </button>
                  <button className="place-bet-btn">
                    Place Bet
                  </button>
                </div>
                
                {/* Expanded Odds Comparison */}
                {expandedBets[bet.id || index] && (
                  <div className="odds-comparison">
                    <div className="comparison-header">
                      <span>Sportsbook Comparison</span>
                    </div>
                    <div className="odds-grid">
                      {bet.allBooks.slice(0, 6).map((book, bookIndex) => (
                        <div key={bookIndex} className="odds-row">
                          <div className="book-name">{book.name}</div>
                          <div className="book-odds">{formatOdds(book.odds)}</div>
                          <button className="quick-bet-btn">Bet</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {dashboardData.recommendedBets.length > 3 && (
            <div className="view-more-bets">
              <button className="view-more-btn">
                View All {dashboardData.recommendedBets.length} Opportunities
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

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
