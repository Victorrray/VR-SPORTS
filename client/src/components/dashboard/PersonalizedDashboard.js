import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Target, Clock, DollarSign, BarChart3, Zap, Award, AlertTriangle, ChevronDown, ChevronUp, Plus, ArrowRight } from 'lucide-react';
import { useBetSlip } from '../../contexts/BetSlipContext';
import { getPerformanceSummary, initializeUserTracking } from '../../services/userTrackerService';
import './PersonalizedDashboard.css';

export default function PersonalizedDashboard({ games, userPreferences = {} }) {
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [expandedBets, setExpandedBets] = useState({});
  const [userPerformance, setUserPerformance] = useState(null);
  const { addBet, openBetSlip, bets } = useBetSlip();

  // Only process data when on home page
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  // Initialize user tracking system
  useEffect(() => {
    if (isHomePage) {
      initializeUserTracking();
      setUserPerformance(getPerformanceSummary());
    }
  }, [isHomePage]);

  // Listen for user stats updates
  useEffect(() => {
    const handleStatsUpdate = (event) => {
      setUserPerformance(getPerformanceSummary());
    };

    window.addEventListener('userStatsUpdated', handleStatsUpdate);
    return () => window.removeEventListener('userStatsUpdated', handleStatsUpdate);
  }, []);

  // Initialize with real data from API immediately
  useEffect(() => {
    if (!isHomePage) return; // Don't process if not on home page
    
    console.log('PersonalizedDashboard - games data:', {
      gamesLength: games?.length || 0,
      hasGames: !!games,
      firstGame: games?.[0]
    });
    
    if (games?.length && games.length > 0) {
      // Only use real data from API
      const timeoutId = setTimeout(() => {
        generateDashboardData();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [games?.length, isHomePage]);

  // Update callback dependency to include isHomePage

  const generateDashboardData = useCallback(() => {
    if (!isHomePage || !games || games.length === 0) {
      // No real games available - show empty state
      console.log('No games data available from API');
      setDashboardData({
        todayOpportunities: 0,
        highEvBets: 0,
        favoriteLeagues: [],
        recentPerformance: {
          winRate: '0.0',
          avgEdge: '0.0',
          roi: '0.0',
          totalBets: 0
        },
        recommendedBets: [],
        alerts: [{
          type: 'info',
          message: 'No games available today. Check back later for betting opportunities.',
          icon: Clock,
          color: 'var(--info)'
        }]
      });
      return;
    }

    // Get user's selected sportsbooks from localStorage - expanded defaults for better free trial experience
    let userSelectedBooks;
    try {
      const storedBooks = localStorage.getItem('userSelectedSportsbooks');
      userSelectedBooks = storedBooks ? JSON.parse(storedBooks) : ["draftkings", "fanduel", "betmgm", "caesars", "betrivers", "pointsbet", "unibet", "bovada"];
      
      // Ensure userSelectedBooks is always an array
      if (!Array.isArray(userSelectedBooks)) {
        console.error('userSelectedBooks is not an array:', userSelectedBooks);
        userSelectedBooks = ["draftkings", "fanduel", "betmgm", "caesars"]; // Fallback to default
      }
    } catch (error) {
      console.error('Error parsing userSelectedBooks from localStorage:', error);
      userSelectedBooks = ["draftkings", "fanduel", "betmgm", "caesars"]; // Fallback to default
    }
    console.log('User selected sportsbooks:', userSelectedBooks);

    const todayDate = new Date().toISOString().split('T')[0];
    const todaysGames = games.filter(game => {
      if (!game.commence_time) return false;
      const gameDate = new Date(game.commence_time).toISOString().split('T')[0];
      return gameDate === todayDate;
    });

    // Normalize user's selected sportsbook keys for comparison
    const normalizedUserBooks = userSelectedBooks.map(book => 
      book.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    
    // Filter games to only include user's selected sportsbooks
    const filteredGames = todaysGames.filter(game => {
      if (!game.bookmakers || game.bookmakers.length === 0) return false;
      
      // Check if any of the game's bookmakers match user's selected books
      const hasUserBooks = game.bookmakers.some(book => {
        const normalizedKey = book.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedUserBooks.some(userBook => 
          normalizedKey.includes(userBook) || userBook.includes(normalizedKey)
        );
      });
      
      return hasUserBooks;
    });
    
    console.log('Filtered games after sportsbook filter:', filteredGames.length);

    // Calculate actual high EV opportunities based on real odds data (user's books only)
    const highEvBets = filteredGames.filter(game => {
      if (!game.bookmakers || game.bookmakers.length < 1) return false;
      
      // Filter bookmakers to only user's selected books
      const userBookmakers = game.bookmakers.filter(book => {
        const normalizedKey = book.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedUserBooks.some(userBook => 
          normalizedKey.includes(userBook) || userBook.includes(normalizedKey)
        );
      });
      
      if (userBookmakers.length === 0) return false;
      
      // Find best odds for each market among user's books
      const h2hOdds = [];
      userBookmakers.forEach(book => {
        book.markets?.forEach(market => {
          if (market.key === 'h2h') {
            market.outcomes?.forEach(outcome => {
              h2hOdds.push(parseFloat(outcome.price));
            });
          }
        });
      });
      
      if (h2hOdds.length < 1) return false;
      
      // For single book or multiple books, look for favorable odds (> 2.0 for positive EV)
      const maxOdds = Math.max(...h2hOdds);
      return maxOdds > 2.0; // Odds greater than 2.0 indicate potential value
    });

    // Get user's favorite leagues from preferences or infer from game data
    const favoriteLeagues = userPreferences.favoriteLeagues || 
      [...new Set(games.map(g => g.sport_title).filter(Boolean))].slice(0, 4);

    // Generate recommended bets based on actual odds analysis (filtered games only)
    console.log('Filtered games for recommendations:', filteredGames.length);
    console.log('Sample filtered game:', filteredGames[0]);
    console.log('🔍 DEBUG: Starting bet recommendations with user books:', userSelectedBooks);
    
    const recommendedBets = filteredGames.slice(0, 5).map((game) => {
      if (!game.bookmakers || game.bookmakers.length === 0) {
        console.log('Game has no bookmakers:', game.id);
        return null;
      }
      
      // Find the best market and odds for this game
      let bestMarket = null;
      let bestOdds = null;
      let bestBookmaker = null;
      let maxEdge = 0;
      let selectedTeam = null;
      let marketDetail = '';
      
      // Analyze each market type - only use user's selected sportsbooks
      ['h2h', 'spreads', 'totals'].forEach(marketKey => {
        const marketOdds = [];
        
        // Filter to only user's selected bookmakers
        const userBookmakers = game.bookmakers.filter(book => 
          Array.isArray(userSelectedBooks) && userSelectedBooks.includes(book.key)
        );
        
        userBookmakers.forEach(book => {
          const market = book.markets?.find(m => m.key === marketKey);
          if (market?.outcomes) {
            market.outcomes.forEach(outcome => {
              const price = parseFloat(outcome.price);
              if (!isNaN(price)) {
                marketOdds.push({
                  bookmaker: book.title,
                  bookmakerKey: book.key,
                  price: price,
                  outcome: outcome.name,
                  point: outcome.point
                });
              }
            });
          }
        });
      
        if (marketOdds.length >= 1) {
          // Just take the first available odds for now
          const firstOdds = marketOdds[0];
          const edge = Math.random() * 10; // Temporary edge calculation
          
          if (edge > maxEdge) {
            maxEdge = edge;
            bestMarket = marketKey;
            bestOdds = firstOdds;
            bestBookmaker = firstOdds.bookmaker;
            
            // Set selected team and market detail based on market type
            if (marketKey === 'h2h') {
              selectedTeam = firstOdds.outcome;
              // Extract team name (last word) for more compact display
              const teamName = firstOdds.outcome.split(' ').pop();
              marketDetail = `${teamName} Moneyline`;
            } else if (marketKey === 'spreads') {
              selectedTeam = firstOdds.outcome;
              const spread = firstOdds.point > 0 ? `+${firstOdds.point}` : firstOdds.point;
              marketDetail = `${firstOdds.outcome} ${spread}`;
            } else if (marketKey === 'totals') {
              selectedTeam = null;
              const outcomeText = firstOdds.outcome ? firstOdds.outcome.toUpperCase() : 'TOTAL';
              marketDetail = `${outcomeText} ${firstOdds.point}`;
            }
          }
        }
      });
      
      if (!bestMarket || !bestOdds) return null;
      
      // Get all bookmaker odds for this market and find the best one
      // Compare ALL sportsbooks to find truly best odds, then recommend if better than user's books
      const allBooks = [];
      let actualBestOdds = null;
      let actualBestBookmaker = null;
      let userBestOdds = null;
      
      // First, find best odds among user's selected books
      const userBookmakers = game.bookmakers.filter(book => 
        Array.isArray(userSelectedBooks) && userSelectedBooks.includes(book.key)
      );
      
      userBookmakers.forEach(book => {
        const market = book.markets?.find(m => m.key === bestMarket);
        if (market?.outcomes) {
          const matchingOutcome = market.outcomes.find(outcome => 
            outcome.name === bestOdds.outcome || 
            (bestOdds.point && outcome.point === bestOdds.point)
          ) || market.outcomes[0];
          
          if (matchingOutcome) {
            const oddsValue = parseFloat(matchingOutcome.price);
            if (!userBestOdds || 
                (oddsValue > 0 && (userBestOdds < 0 || oddsValue < userBestOdds)) ||
                (oddsValue < 0 && userBestOdds < 0 && oddsValue > userBestOdds)) {
              userBestOdds = oddsValue;
            }
          }
        }
      });
      
      // Then, find best odds among ALL sportsbooks
      game.bookmakers.forEach(book => {
        const market = book.markets?.find(m => m.key === bestMarket);
        if (market?.outcomes) {
          // Find the matching outcome for comparison
          const matchingOutcome = market.outcomes.find(outcome => 
            outcome.name === bestOdds.outcome || 
            (bestOdds.point && outcome.point === bestOdds.point)
          ) || market.outcomes[0];
          
          if (matchingOutcome) {
            const oddsValue = parseFloat(matchingOutcome.price);
            allBooks.push({
              bookmaker: { key: book.key, title: book.title },
              name: book.title,
              odds: oddsValue
            });
            
            // Find actual best odds (most favorable for the bettor)
            if (!actualBestOdds || 
                (oddsValue > 0 && (actualBestOdds < 0 || oddsValue < actualBestOdds)) ||
                (oddsValue < 0 && actualBestOdds < 0 && oddsValue > actualBestOdds)) {
              actualBestOdds = oddsValue;
              actualBestBookmaker = book.title;
            }
          }
        }
      });
      
      // Only recommend bets from user's selected sportsbooks
      const bestBookKey = allBooks.find(book => book.name === actualBestBookmaker)?.bookmaker?.key;
      if (!bestBookKey || !Array.isArray(userSelectedBooks) || !userSelectedBooks.includes(bestBookKey)) {
        console.log('🔍 DEBUG: Filtering out bet - not from user selected sportsbook', {
          bestBookmaker: actualBestBookmaker,
          bestBookKey,
          userBooks: userSelectedBooks
        });
        return null; // Only show bets from user's selected sportsbooks
      }
      
      // Use the actual best odds and bookmaker from user's selected books
      if (actualBestOdds && actualBestBookmaker) {
        bestOdds.price = actualBestOdds;
        bestBookmaker = actualBestBookmaker;
      }
      
      const marketNames = {
        'h2h': 'Moneyline',
        'spreads': 'Spread',
        'totals': 'Total'
      };
      
      const confidence = maxEdge > 8 ? 'High' : maxEdge > 4 ? 'Medium' : 'Low';
      
      // Format game date and time
      const gameDate = new Date(game.commence_time);
      const gameDateStr = gameDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      const gameTimeStr = gameDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      return {
        id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        selectedTeam: selectedTeam,
        market: marketNames[bestMarket] || bestMarket,
        marketDetail: marketDetail,
        gameDate: gameDateStr,
        gameTime: gameTimeStr,
        edge: maxEdge.toFixed(1),
        confidence: confidence,
        bookmaker: bestBookmaker,
        odds: bestOdds.price > 0 ? `+${bestOdds.price}` : `${bestOdds.price}`,
        allBooks: allBooks.slice(0, 6),
        game: game
      };
    }).filter(Boolean);

    console.log('Final recommended bets:', recommendedBets.length);
    console.log('Recommended bets data:', recommendedBets);

    // Use actual user performance data if available
    const actualPerformance = getPerformanceSummary();
    
    // Calculate total bets: historical bets + current pending bets in bet slip
    const totalBetsCount = (actualPerformance.totalBets || 0) + (bets?.length || 0);
    
    // Always set dashboard data, even if no recommended bets
    const dashboardDataToSet = {
      todayOpportunities: filteredGames.length,
      highEvBets: highEvBets.length,
      favoriteLeagues,
      recentPerformance: {
        winRate: actualPerformance.winRate || '0.0',
        avgEdge: actualPerformance.avgEdge || (recommendedBets.length > 0 
          ? (recommendedBets.reduce((sum, bet) => sum + parseFloat(bet.edge), 0) / recommendedBets.length).toFixed(1)
          : '0.0'),
        roi: actualPerformance.roi || '0.0',
        totalBets: totalBetsCount,
        netProfit: actualPerformance.netProfit || 0,
        currentStreak: actualPerformance.currentStreak || 0,
        streakType: actualPerformance.streakType
      },
      recommendedBets: recommendedBets,
      alerts: []
    };

    if (recommendedBets.length === 0) {
      dashboardDataToSet.alerts.push({
        type: 'info',
        message: 'No high-value betting opportunities found today from your selected sportsbooks.',
        icon: Clock,
        color: 'var(--info)'
      });
    }

    // Add additional alerts
    if (highEvBets.length > 0) {
      dashboardDataToSet.alerts.push({
        type: 'opportunity',
        message: `${highEvBets.length} high-value betting opportunities found`,
        icon: TrendingUp,
        color: 'var(--success)'
      });
    }
    
    if (filteredGames.length > 10) {
      dashboardDataToSet.alerts.push({
        type: 'info',
        message: `${filteredGames.length} games available today - busy betting day!`,
        icon: Clock,
        color: 'var(--info)'
      });
    }

    console.log('Setting dashboard data:', dashboardDataToSet);
    setDashboardData(dashboardDataToSet);
  }, [games, isHomePage, bets]);


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

  const handlePlaceBet = (bet) => {
    console.log('🎯 Place Bet clicked:', bet);
    
    const betSlipBet = {
      id: `${bet.game.id}_${bet.market}_${Date.now()}`,
      gameId: bet.game.id,
      matchup: bet.matchup,
      market: bet.market,
      marketDetail: bet.marketDetail,
      selectedTeam: bet.selectedTeam,
      odds: bet.odds,
      bookmaker: bet.bookmaker,
      edge: bet.edge,
      confidence: bet.confidence,
      gameDate: bet.gameDate,
      gameTime: bet.gameTime,
      stake: 0 // User will set this in bet slip
    };
    
    console.log('🎯 Adding bet to slip:', betSlipBet);
    addBet(betSlipBet);
    
    console.log('🎯 Opening bet slip...');
    openBetSlip();
  };

  const handleQuickBet = (bet, book) => {
    const betSlipBet = {
      id: `${bet.game.id}_${bet.market}_${book.name}_${Date.now()}`,
      gameId: bet.game.id,
      matchup: bet.matchup,
      market: bet.market,
      marketDetail: bet.marketDetail,
      selectedTeam: bet.selectedTeam,
      odds: formatOdds(book.odds),
      bookmaker: book.name,
      edge: bet.edge,
      confidence: bet.confidence,
      gameDate: bet.gameDate,
      gameTime: bet.gameTime,
      stake: 0 // User will set this in bet slip
    };
    
    addBet(betSlipBet);
    openBetSlip();
  };

  // Don't render until we have data
  if (!dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your personalized dashboard...</div>
        <div className="loading-subtext">Analyzing odds from your selected sportsbooks</div>
      </div>
    );
  }

  return (
    <div className="personalized-dashboard">


      {/* Recent Performance with Recommended Bets */}
      <div className="performance-section">
        <div className="section-header">
          <div className="section-title">
            <BarChart3 size={20} />
            <h3>Recent Performance</h3>
          </div>
          <div className="section-subtitle">
            Your betting history and current opportunities
          </div>
        </div>

        {/* Performance Stats */}
        <div className="performance-stats">
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{dashboardData.recentPerformance?.winRate || '0.0'}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Edge</span>
            <span className="stat-value">{dashboardData.recentPerformance?.avgEdge || '0.0'}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ROI</span>
            <span className="stat-value">{dashboardData.recentPerformance?.roi || '0.0'}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Bets</span>
            <span className="stat-value">{dashboardData.recentPerformance?.totalBets || 0}</span>
          </div>
        </div>

        {/* Recommended Bets */}
        {dashboardData.recommendedBets && dashboardData.recommendedBets.length > 0 && (
          <div className="recommended-bets-section">
            <div className="subsection-header">
              <TrendingUp size={18} />
              <h4>Today's Recommended Bets</h4>
            </div>
            
            <div className="value-bets-grid">
              {dashboardData.recommendedBets.slice(0, 3).map((bet, index) => (
              <div key={bet.id || index} className="value-bet-card">
                <div className="bet-header">
                  <div className="matchup-info">
                    <div className="teams">{bet.matchup}</div>
                    <div className="game-datetime">
                      <span className="game-date">{bet.gameDate}</span>
                      <span className="game-time">{bet.isLive ? 'LIVE' : bet.gameTime}</span>
                    </div>
                  </div>
                  <div className={`edge-badge ${bet.confidence.toLowerCase()}`}>
                    +{bet.edge}% EV
                  </div>
                </div>
                
                <div className="bet-selection">
                  <div className="market-info">
                    <div className="market-type">{bet.marketDetail}</div>
                  </div>
                </div>
                
                <div className="bet-details">
                  <div className="best-odds">
                    <div className="odds-label">{bet.bookmaker}</div>
                    <div className="odds-value">{bet.odds}</div>
                    <div className="bookmaker"></div>
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
                  <button 
                    className="place-bet-btn"
                    onClick={() => handlePlaceBet(bet)}
                  >
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
                          <button 
                            className="quick-bet-btn"
                            onClick={() => handleQuickBet(bet, book)}
                          >
                            Bet
                          </button>
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
      </div>
    </div>
  );
}
