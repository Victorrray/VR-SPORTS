// Arbitrage Detection System
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { 
  TrendingUp, Calculator, DollarSign, Clock, 
  AlertTriangle, Target, Zap, Filter, RefreshCw 
} from 'lucide-react';
import './ArbitrageDetector.css';

const ArbitrageDetector = ({ sport = 'americanfootball_nfl', games = [], bookFilter = [], compact = false }) => {
  const { user, profile } = useAuth();
  const [minProfit, setMinProfit] = useState(2); // Minimum 2% profit
  
  // Get user's bankroll from localStorage, default to 1000 if not set
  const getUserBankroll = () => {
    const saved = localStorage.getItem('userBankroll');
    return saved ? Number(saved) : 1000;
  };
  
  const [maxStake, setMaxStake] = useState(getUserBankroll());
  const [selectedMarkets, setSelectedMarkets] = useState(['h2h', 'spreads', 'totals']);
  const [sortBy, setSortBy] = useState('profit');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update maxStake when bankroll changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newBankroll = getUserBankroll();
      setMaxStake(newBankroll);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch odds data for arbitrage analysis
  const { data: oddsData, loading, refresh, lastUpdate } = useCachedFetch((() => { const { withApiBase } = require('../config/api'); return withApiBase('/api/odds'); })(), {
    params: { 
      sports: sport,
      markets: selectedMarkets.join(','),
      regions: 'us,uk,eu,au'
    },
    pollingInterval: autoRefresh ? 120000 : null, // 2 minutes when auto-refresh is on
    transform: (data) => data || []
  });

  // Mock arbitrage opportunities for demonstration
  const mockArbitrageData = useMemo(() => {
    if (!oddsData || oddsData.length === 0) {
      return [
        {
          id: 'arb-1',
          game: 'Kansas City Chiefs @ Buffalo Bills',
          market: 'h2h',
          sport: sport,
          commence_time: new Date(Date.now() + 86400000).toISOString(),
          opportunities: [
            {
              type: 'two_way',
              profit_percentage: 4.2,
              profit_amount: 42.15,
              total_stake: 1000,
              bets: [
                {
                  bookmaker: 'DraftKings',
                  selection: 'Kansas City Chiefs',
                  odds: 180,
                  stake: 357.14,
                  payout: 642.86,
                  implied_prob: 35.7
                },
                {
                  bookmaker: 'FanDuel', 
                  selection: 'Buffalo Bills',
                  odds: -165,
                  stake: 642.86,
                  payout: 389.61,
                  implied_prob: 62.3
                }
              ],
              total_implied_prob: 98.0,
              time_found: new Date(Date.now() - 300000),
              expires_in: 1800000 // 30 minutes
            }
          ]
        },
        {
          id: 'arb-2',
          game: 'Los Angeles Lakers @ Golden State Warriors',
          market: 'totals',
          sport: 'basketball_nba',
          commence_time: new Date(Date.now() + 172800000).toISOString(),
          opportunities: [
            {
              type: 'two_way',
              profit_percentage: 3.1,
              profit_amount: 31.05,
              total_stake: 1000,
              bets: [
                {
                  bookmaker: 'BetMGM',
                  selection: 'Over 225.5',
                  odds: -108,
                  stake: 519.23,
                  payout: 480.77,
                  implied_prob: 51.9
                },
                {
                  bookmaker: 'Caesars',
                  selection: 'Under 225.5', 
                  odds: -105,
                  stake: 480.77,
                  payout: 457.88,
                  implied_prob: 48.1
                }
              ],
              total_implied_prob: 100.0,
              time_found: new Date(Date.now() - 600000),
              expires_in: 2700000 // 45 minutes
            }
          ]
        },
        {
          id: 'arb-3',
          game: 'Green Bay Packers @ Chicago Bears',
          market: 'spreads',
          sport: sport,
          commence_time: new Date(Date.now() + 259200000).toISOString(),
          opportunities: [
            {
              type: 'two_way',
              profit_percentage: 2.8,
              profit_amount: 28.42,
              total_stake: 1000,
              bets: [
                {
                  bookmaker: 'PointsBet',
                  selection: 'Green Bay Packers -3.5',
                  odds: 105,
                  stake: 487.80,
                  payout: 512.19,
                  implied_prob: 48.8
                },
                {
                  bookmaker: 'WynnBET',
                  selection: 'Chicago Bears +3.5',
                  odds: -102,
                  stake: 512.20,
                  payout: 502.16,
                  implied_prob: 50.5
                }
              ],
              total_implied_prob: 99.3,
              time_found: new Date(Date.now() - 900000),
              expires_in: 3600000 // 1 hour
            }
          ]
        }
      ];
    }
    return [];
  }, [oddsData, sport]);

  // Calculate arbitrage opportunities from real data
  const calculateArbitrage = (games) => {
    const opportunities = [];
    
    games.forEach(game => {
      if (!Array.isArray(game.bookmakers) || game.bookmakers.length < 2) return;

      // Collect all market keys available across bookmakers to avoid undefined access on empty arrays
      const marketKeys = new Set();
      game.bookmakers.forEach(bookmaker => {
        bookmaker?.markets?.forEach(market => {
          if (market?.key) marketKeys.add(market.key);
        });
      });

      marketKeys.forEach(marketKey => {
        if (!selectedMarkets.includes(marketKey)) return;

        const availableMarkets = game.bookmakers
          .map(bookmaker => bookmaker?.markets?.find(m => m.key === marketKey))
          .filter(Boolean);
        if (!availableMarkets.length) return;

        const market = availableMarkets[0];
        
        // Find best odds for each outcome across all bookmakers
        const outcomeOdds = {};
        
        game.bookmakers.forEach(bookmaker => {
          const gameMarket = bookmaker?.markets?.find(m => m.key === marketKey);
          if (!gameMarket) return;
          
          gameMarket.outcomes?.forEach(outcome => {
            const key = outcome.name;
            if (!outcomeOdds[key] || outcome.price > outcomeOdds[key].price) {
              outcomeOdds[key] = {
                ...outcome,
                bookmaker: bookmaker.title
              };
            }
          });
        });
        
        // Calculate arbitrage for two-way markets
        const outcomes = Object.values(outcomeOdds);
        if (outcomes.length === 2) {
          const arb = calculateTwoWayArbitrage(outcomes, game, market);
          if (arb && arb.profit_percentage >= minProfit) {
            opportunities.push({
              id: `${game.id}-${market.key}`,
              game: `${game.away_team} @ ${game.home_team}`,
              market: market.key,
              sport: game.sport_key,
              commence_time: game.commence_time,
              opportunities: [arb]
            });
          }
        }
      });
    });
    
    return opportunities;
  };

  const calculateTwoWayArbitrage = (outcomes, game, market) => {
    const [outcome1, outcome2] = outcomes;
    
    // Convert odds to decimal
    const decimal1 = outcome1.price > 0 ? (outcome1.price / 100) + 1 : (100 / Math.abs(outcome1.price)) + 1;
    const decimal2 = outcome2.price > 0 ? (outcome2.price / 100) + 1 : (100 / Math.abs(outcome2.price)) + 1;
    
    // Calculate implied probabilities
    const prob1 = 1 / decimal1;
    const prob2 = 1 / decimal2;
    const totalProb = prob1 + prob2;
    
    // Check if arbitrage exists
    if (totalProb >= 1) return null;
    
    // Calculate optimal stakes with bankroll constraint
    const userBankroll = getUserBankroll();
    const effectiveMaxStake = Math.min(maxStake, userBankroll);
  
    const stake1 = (prob1 / totalProb) * effectiveMaxStake;
    const stake2 = (prob2 / totalProb) * effectiveMaxStake;
    const totalStake = stake1 + stake2;
    
    // Calculate payouts
    const payout1 = stake1 * decimal1;
    const payout2 = stake2 * decimal2;
    const guaranteedProfit = Math.min(payout1, payout2) - totalStake;
    const profitPercentage = (guaranteedProfit / totalStake) * 100;
    
    return {
      type: 'two_way',
      profit_percentage: profitPercentage,
      profit_amount: guaranteedProfit,
      total_stake: totalStake,
      bets: [
        {
          bookmaker: outcome1.bookmaker,
          selection: outcome1.name,
          odds: outcome1.price,
          stake: stake1,
          payout: payout1,
          implied_prob: prob1 * 100
        },
        {
          bookmaker: outcome2.bookmaker,
          selection: outcome2.name,
          odds: outcome2.price,
          stake: stake2,
          payout: payout2,
          implied_prob: prob2 * 100
        }
      ],
      total_implied_prob: totalProb * 100,
      time_found: new Date(),
      expires_in: 1800000 // 30 minutes estimated
    };
  };

  const realArbitrageOpportunities = useMemo(() => {
    if (oddsData && oddsData.length > 0) {
      return calculateArbitrage(oddsData);
    }
    return [];
  }, [oddsData, selectedMarkets, minProfit, maxStake]);

  const allOpportunities = realArbitrageOpportunities.length > 0 ? realArbitrageOpportunities : mockArbitrageData;

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = allOpportunities.filter(opp => 
      opp.opportunities.some(arb => arb.profit_percentage >= minProfit)
    );

    // Sort opportunities
    filtered.sort((a, b) => {
      const arbA = a.opportunities[0];
      const arbB = b.opportunities[0];
      
      switch (sortBy) {
        case 'profit':
          return arbB.profit_percentage - arbA.profit_percentage;
        case 'amount':
          return arbB.profit_amount - arbA.profit_amount;
        case 'time':
          return new Date(arbB.time_found) - new Date(arbA.time_found);
        case 'expires':
          return arbA.expires_in - arbB.expires_in;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allOpportunities, minProfit, sortBy]);

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimeRemaining = (expiresIn) => {
    const minutes = Math.floor(expiresIn / 60000);
    const seconds = Math.floor((expiresIn % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMarketLabel = (market) => {
    switch (market) {
      case 'h2h':
        return 'Moneyline';
      case 'spreads':
        return 'Point Spread';
      case 'totals':
        return 'Over/Under';
      default:
        return market;
    }
  };

  const ArbitrageCard = ({ opportunity, onExecute, compact = false }) => {
    return (
      <div className={`arbitrage-card ${compact ? 'compact' : ''}`}>
        <div className="card-header">
          <div className="game-info">
            <h4>{compact ? opportunity.game.split(' @ ')[0].split(' ').slice(-1)[0] + ' @ ' + opportunity.game.split(' @ ')[1].split(' ').slice(-1)[0] : opportunity.game}</h4>
            <span className="market-type">{getMarketLabel(opportunity.market)}</span>
          </div>
          <div className="profit-info">
            <div className="profit-percentage">
              <TrendingUp className="profit-icon" />
              {opportunity.opportunities[0].profit_percentage.toFixed(2)}%
            </div>
            {!compact && (
              <div className="profit-amount">
                <DollarSign className="dollar-icon" />
                ${opportunity.opportunities[0].profit_amount.toFixed(2)}
              </div>
            )}
          </div>
        </div>
        <div className="bets-grid">
          {opportunity.opportunities[0].bets.map((bet, betIndex) => (
            <div key={betIndex} className="bet-card">
              <div className="bet-header">
                <div className="bookmaker">{bet.bookmaker}</div>
                <div className="odds">{formatOdds(bet.odds)}</div>
              </div>
              <div className="bet-selection">{bet.selection}</div>
              <div className="bet-details">
                <div className="stake">Stake: {formatCurrency(bet.stake)}</div>
                <div className="payout">Payout: {formatCurrency(bet.payout)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="opportunity-meta">
          <div className="meta-item">
            <Clock size={14} />
            Found {new Date(opportunity.opportunities[0].time_found).toLocaleTimeString()}
          </div>
          <div className="meta-item expires">
            <AlertTriangle size={14} />
            Expires in {formatTimeRemaining(opportunity.opportunities[0].expires_in)}
          </div>
          <div className="meta-item">
            <Calculator size={14} />
            Total Prob: {opportunity.opportunities[0].total_implied_prob.toFixed(1)}%
          </div>
        </div>
        <div className="opportunity-actions">
          <button 
            className="execute-btn"
            onClick={() => onExecute(opportunity.opportunities[0])}
          >
            <Zap size={16} />
            Execute Arbitrage
          </button>
        </div>
      </div>
    );
  };

  const handleExecuteArbitrage = (opportunity) => {
    // This would integrate with your bet placement system
    console.log('Executing arbitrage:', opportunity);
    alert(`Arbitrage opportunity added to bet slip!\nProfit: ${opportunity.profit_percentage.toFixed(2)}%`);
  };

  return (
    <div className={`arbitrage-detector ${compact ? 'compact' : ''}`}>

      <div className={`opportunities-list ${compact ? 'compact' : ''}`}>
        {loading && filteredOpportunities.length === 0 ? (
          <div className="loading-state">
            <RefreshCw className="spinning" />
            <p>{compact ? 'Scanning...' : 'Scanning for arbitrage opportunities...'}</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="empty-state">
            <Target className="empty-icon" />
            <h3>{compact ? 'No Opportunities' : 'No Arbitrage Opportunities Found'}</h3>
            {!compact && <p>Try adjusting your filters or check back later.</p>}
          </div>
        ) : (
          filteredOpportunities.map((opportunity, index) => (
            <ArbitrageCard 
              key={opportunity.id || index} 
              opportunity={opportunity} 
              onExecute={handleExecuteArbitrage}
              compact={compact}
            />
          ))
        )}
      </div>

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ArbitrageDetector;
