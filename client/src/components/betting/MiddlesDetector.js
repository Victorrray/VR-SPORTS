// Middles Detection System - Find middle betting opportunities
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/SimpleAuth';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { bankrollManager } from '../../utils/bankrollManager';
import { 
  TrendingUp, Calculator, DollarSign, Clock, 
  AlertTriangle, Target, Zap, Filter, RefreshCw, Activity
} from 'lucide-react';
import './MiddlesDetector.css'; // Enhanced middle-specific styles

const MiddlesDetector = ({ 
  sport = ['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'baseball_mlb', 'icehockey_nhl'], 
  games = [], 
  bookFilter = [], 
  compact = false, 
  autoRefresh = true 
}) => {
  const { user, profile } = useAuth();
  
  // Convert sport prop to array if it's a string
  const initialSports = Array.isArray(sport) ? sport : [sport];
  const [internalSelectedSports, setInternalSelectedSports] = useState(initialSports);
  
  const [minMiddleGap, setMinMiddleGap] = useState(3); // Minimum 3 point gap for totals/spreads
  const [minProbability, setMinProbability] = useState(15); // Minimum 15% chance of hitting middle
  
  const [maxStake, setMaxStake] = useState(bankrollManager.getBankroll());
  const [selectedMarkets, setSelectedMarkets] = useState(['spreads', 'totals', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals']);
  const [sortBy, setSortBy] = useState('probability');
  
  // Fetch game odds data for middles analysis
  const { data: oddsData, loading: oddsLoading, lastUpdate } = useCachedFetch((() => { const { withApiBase } = require('../../config/api'); return withApiBase('/api/odds'); })(), {
    params: { 
      sports: internalSelectedSports.join(','),
      markets: selectedMarkets.join(','),
      regions: 'us,uk,eu,au'
    },
    pollingInterval: autoRefresh ? 120000 : null, // 2 minutes when auto-refresh is on
    transform: (data) => data || []
  });
  
  // Use real games data passed from parent component, or fetched data
  const realGamesData = games && games.length > 0 ? games : (oddsData || []);

  // Update maxStake when bankroll changes
  useEffect(() => {
    const cleanup = bankrollManager.onBankrollChange((newBankroll) => {
      setMaxStake(newBankroll);
    });
    return cleanup;
  }, []);

  // Calculate middle opportunities from real data
  const calculateMiddles = (gamesData) => {
    const opportunities = [];
    
    gamesData.forEach(game => {
      if (!Array.isArray(game.bookmakers) || game.bookmakers.length < 2) return;

      // Only process games that haven't started yet
      const gameTime = new Date(game.commence_time);
      const now = new Date();
      if (gameTime <= now) return;

      // Stale threshold - skip bookmakers with data older than 30 minutes
      const STALE_THRESHOLD_MS = 30 * 60 * 1000;
      const nowMs = Date.now();
      
      // Helper to check if bookmaker data is stale
      const isBookmakerStale = (bookmaker) => {
        if (!bookmaker.last_update) return false; // If no timestamp, assume fresh
        const lastUpdate = new Date(bookmaker.last_update).getTime();
        return (nowMs - lastUpdate) > STALE_THRESHOLD_MS;
      };

      selectedMarkets.forEach(marketKey => {
        // Collect all lines for this market across bookmakers
        const marketLines = [];
        
        game.bookmakers.forEach(bookmaker => {
          if (bookFilter.length > 0 && !bookFilter.includes(bookmaker.key)) return;
          if (isBookmakerStale(bookmaker)) return; // Skip stale bookmakers
          
          const gameMarket = bookmaker?.markets?.find(m => m.key === marketKey);
          if (!gameMarket || !gameMarket.outcomes) return;
          
          if (marketKey === 'totals') {
            // For totals, look for Over/Under pairs
            const overOutcome = gameMarket.outcomes.find(o => o.name?.toLowerCase().includes('over'));
            const underOutcome = gameMarket.outcomes.find(o => o.name?.toLowerCase().includes('under'));
            
            if (overOutcome && underOutcome) {
              const line = parseFloat(overOutcome.name.match(/[\d.]+/)?.[0] || 0);
              if (line > 0) {
                marketLines.push({
                  bookmaker: bookmaker.title || bookmaker.key,
                  line: line,
                  overOdds: overOutcome.price,
                  underOdds: underOutcome.price,
                  type: 'totals'
                });
              }
            }
          } else if (marketKey === 'spreads') {
            // For spreads, look for team spread pairs
            const outcomes = gameMarket.outcomes;
            if (outcomes.length >= 2) {
              const spread1 = outcomes[0];
              const spread2 = outcomes[1];
              
              const line1 = parseFloat(spread1.name.match(/[+-]?[\d.]+/)?.[0] || 0);
              const line2 = parseFloat(spread2.name.match(/[+-]?[\d.]+/)?.[0] || 0);
              
              if (Math.abs(line1) > 0) {
                marketLines.push({
                  bookmaker: bookmaker.title || bookmaker.key,
                  line: Math.abs(line1),
                  team1: spread1.name,
                  team2: spread2.name,
                  odds1: spread1.price,
                  odds2: spread2.price,
                  type: 'spreads'
                });
              }
            }
          }
        });

        // Find middle opportunities
        if (marketLines.length >= 2) {
          const middles = findMiddleOpportunities(marketLines, game, marketKey);
          opportunities.push(...middles);
        }
      });
    });
    
    console.log('🎪 Found', opportunities.length, 'middle opportunities from', gamesData.length, 'games');
    return opportunities;
  };

  const findMiddleOpportunities = (marketLines, game, marketKey) => {
    const opportunities = [];
    
    // Sort lines to find gaps
    const sortedLines = marketLines.sort((a, b) => a.line - b.line);
    
    for (let i = 0; i < sortedLines.length - 1; i++) {
      for (let j = i + 1; j < sortedLines.length; j++) {
        const line1 = sortedLines[i];
        const line2 = sortedLines[j];
        
        // Skip if same bookmaker
        if (line1.bookmaker === line2.bookmaker) continue;
        
        const gap = Math.abs(line2.line - line1.line);
        
        // Check if gap meets minimum requirement
        if (gap >= minMiddleGap) {
          const middle = calculateMiddleOpportunity(line1, line2, gap, game, marketKey);
          if (middle && middle.probability >= minProbability) {
            opportunities.push(middle);
          }
        }
      }
    }
    
    return opportunities;
  };

  const calculateMiddleOpportunity = (line1, line2, gap, game, marketKey) => {
    try {
      let bets = [];
      let middleRange = '';
      let probability = 0;
      
      if (marketKey === 'totals') {
        // For totals: bet Over on lower line, Under on higher line
        const lowerLine = line1.line < line2.line ? line1 : line2;
        const higherLine = line1.line < line2.line ? line2 : line1;
        
        middleRange = `${lowerLine.line + 0.5} - ${higherLine.line - 0.5}`;
        
        // Estimate probability based on gap (rough approximation)
        probability = Math.min(gap * 8, 45); // Cap at 45%
        
        // Calculate optimal stakes
        const decimal1 = lowerLine.overOdds > 0 ? (lowerLine.overOdds / 100) + 1 : (100 / Math.abs(lowerLine.overOdds)) + 1;
        const decimal2 = higherLine.underOdds > 0 ? (higherLine.underOdds / 100) + 1 : (100 / Math.abs(higherLine.underOdds)) + 1;
        
        const totalStake = Math.min(maxStake, bankrollManager.getBankroll() * 0.1); // Max 10% of bankroll
        const stake1 = totalStake * 0.5; // Equal stakes for simplicity
        const stake2 = totalStake * 0.5;
        
        const payout1 = stake1 * decimal1;
        const payout2 = stake2 * decimal2;
        const middleProfit = Math.min(payout1, payout2) - totalStake;
        
        bets = [
          {
            bookmaker: lowerLine.bookmaker,
            selection: `Over ${lowerLine.line}`,
            odds: lowerLine.overOdds,
            stake: stake1,
            payout: payout1
          },
          {
            bookmaker: higherLine.bookmaker,
            selection: `Under ${higherLine.line}`,
            odds: higherLine.underOdds,
            stake: stake2,
            payout: payout2
          }
        ];
        
        return {
          id: `${game.id}-${marketKey}-middle-${Date.now()}`,
          game: `${game.away_team} @ ${game.home_team}`,
          market: marketKey,
          sport: game.sport_key,
          commence_time: game.commence_time,
          type: 'middle',
          gap: gap,
          middleRange: middleRange,
          probability: probability,
          maxProfit: middleProfit,
          totalStake: totalStake,
          bets: bets,
          time_found: new Date(),
          expires_in: 1800000 // 30 minutes estimated
        };
        
      } else if (marketKey === 'spreads') {
        // For spreads: similar logic but with point spreads
        const gap = Math.abs(line2.line - line1.line);
        middleRange = `${Math.min(line1.line, line2.line)} - ${Math.max(line1.line, line2.line)}`;
        
        probability = Math.min(gap * 6, 40); // Slightly lower probability for spreads
        
        const decimal1 = line1.odds1 > 0 ? (line1.odds1 / 100) + 1 : (100 / Math.abs(line1.odds1)) + 1;
        const decimal2 = line2.odds2 > 0 ? (line2.odds2 / 100) + 1 : (100 / Math.abs(line2.odds2)) + 1;
        
        const totalStake = Math.min(maxStake, bankrollManager.getBankroll() * 0.1);
        const stake1 = totalStake * 0.5;
        const stake2 = totalStake * 0.5;
        
        const payout1 = stake1 * decimal1;
        const payout2 = stake2 * decimal2;
        const middleProfit = Math.min(payout1, payout2) - totalStake;
        
        bets = [
          {
            bookmaker: line1.bookmaker,
            selection: line1.team1,
            odds: line1.odds1,
            stake: stake1,
            payout: payout1
          },
          {
            bookmaker: line2.bookmaker,
            selection: line2.team2,
            odds: line2.odds2,
            stake: stake2,
            payout: payout2
          }
        ];
        
        return {
          id: `${game.id}-${marketKey}-middle-${Date.now()}`,
          game: `${game.away_team} @ ${game.home_team}`,
          market: marketKey,
          sport: game.sport_key,
          commence_time: game.commence_time,
          type: 'middle',
          gap: gap,
          middleRange: middleRange,
          probability: probability,
          maxProfit: middleProfit,
          totalStake: totalStake,
          bets: bets,
          time_found: new Date(),
          expires_in: 1800000
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Error calculating middle opportunity:', error);
      return null;
    }
  };

  const realMiddleOpportunities = useMemo(() => {
    if (realGamesData && realGamesData.length > 0) {
      console.log(' Calculating middles from real data:', realGamesData.length, 'games');
      return calculateMiddles(realGamesData);
    }
    return [];
  }, [realGamesData, selectedMarkets, minMiddleGap, minProbability, maxStake]);

  const filteredOpportunities = useMemo(() => {
    let filtered = realMiddleOpportunities.filter(opp => 
      opp.probability >= minProbability && opp.gap >= minMiddleGap
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'probability':
          return b.probability - a.probability;
        case 'profit':
          return b.maxProfit - a.maxProfit;
        case 'gap':
          return b.gap - a.gap;
        case 'time':
          return new Date(b.time_found) - new Date(a.time_found);
        default:
          return 0;
      }
    });

    return filtered;
  }, [realMiddleOpportunities, minProbability, minMiddleGap, sortBy]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getMarketLabel = (market) => {
    switch (market) {
      case 'spreads':
        return 'Point Spread';
      case 'totals':
        return 'Over/Under';
      default:
        return market;
    }
  };

  const MiddleCard = ({ opportunity, compact = false }) => {
    return (
      <div className={`arbitrage-card ${compact ? 'compact' : ''}`}>
        <div className="card-header">
          <div className="game-info">
            <h4>{compact ? opportunity.game.split(' @ ')[0].split(' ').slice(-1)[0] + ' @ ' + opportunity.game.split(' @ ')[1].split(' ').slice(-1)[0] : opportunity.game}</h4>
            <span className="market-type">{getMarketLabel(opportunity.market)}</span>
          </div>
          <div className="profit-info">
            <div className="profit-percentage">
              <Activity className="profit-icon" />
              {opportunity.probability.toFixed(1)}%
            </div>
            {!compact && (
              <div className="profit-amount">
                <DollarSign className="dollar-icon" />
                ${opportunity.maxProfit.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="middle-info">
          <div className="middle-range">
            <strong>Middle Range:</strong> {opportunity.middleRange}
          </div>
          <div className="gap-info">
            <strong>Gap:</strong> {opportunity.gap} points
          </div>
        </div>

        <div className="bets-grid">
          {opportunity.bets.map((bet, betIndex) => (
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
            Found {new Date(opportunity.time_found).toLocaleTimeString()}
          </div>
          <div className="meta-item">
            <Target size={14} />
            Win Probability: {opportunity.probability.toFixed(1)}%
          </div>
          <div className="meta-item">
            <Calculator size={14} />
            Max Profit: {formatCurrency(opportunity.maxProfit)}
          </div>
        </div>

        <div className="opportunity-actions">
          <button 
            className="execute-btn"
            onClick={() => handleExecuteMiddle(opportunity)}
          >
            <Zap size={16} />
            Execute Middle
          </button>
        </div>
      </div>
    );
  };

  const handleExecuteMiddle = (opportunity) => {
    console.log('Executing middle:', opportunity);
    alert(`Middle opportunity added to bet slip!\nProbability: ${opportunity.probability.toFixed(1)}%\nMax Profit: ${formatCurrency(opportunity.maxProfit)}`);
  };

  return (
    <div className={`arbitrage-detector ${compact ? 'compact' : ''}`}>
      <div className={`opportunities-list ${compact ? 'compact' : ''}`}>
        {filteredOpportunities.length === 0 ? (
          <div className="empty-state">
            <Target className="empty-icon" />
            <h3>{compact ? 'No Middles' : 'No Middle Opportunities Found'}</h3>
            {!compact && (
              <div>
                <p>Scanning {realGamesData?.length || 0} games across all sports and {bookFilter && bookFilter.length > 0 ? bookFilter.length : 'all'} sportsbooks for middle opportunities.</p>
                <p>Try lowering the minimum gap or probability threshold.</p>
                {realGamesData?.length === 0 && <p>No games data available. Please check your sports selection.</p>}
              </div>
            )}
          </div>
        ) : (
          filteredOpportunities.map((opportunity, index) => (
            <MiddleCard 
              key={opportunity.id || index} 
              opportunity={opportunity} 
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MiddlesDetector;
