// Arbitrage Detection System
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/SimpleAuth';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { bankrollManager } from '../../utils/bankrollManager';
import SportMultiSelect from './SportMultiSelect';
import { 
  TrendingUp, Calculator, DollarSign, Clock, 
  AlertTriangle, Target, Zap, Filter, RefreshCw 
} from 'lucide-react';
import './ArbitrageDetector.css';
import '../betting/FormControls.css';

const ArbitrageDetector = ({ 
  sport = ['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'baseball_mlb', 'icehockey_nhl'], 
  games = [], 
  bookFilter = [], 
  compact = false,
  minProfit: propMinProfit,
  maxStake: propMaxStake,
  selectedMarkets: propSelectedMarkets,
  sortBy: propSortBy
}) => {
  const { user, profile } = useAuth();
  
  // Convert sport prop to array if it's a string
  const initialSports = Array.isArray(sport) ? sport : [sport];
  
  // Use props if provided, otherwise use internal state
  const [internalMinProfit, setInternalMinProfit] = useState(0.5);
  const [internalMaxStake, setInternalMaxStake] = useState(bankrollManager.getBankroll());
  const [internalSelectedMarkets, setInternalSelectedMarkets] = useState([
    // Game markets
    'h2h', 'spreads', 'totals', 'team_totals', 'alternate_spreads', 'alternate_totals',
    // NFL/NCAAF player props
    'player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions', 'player_reception_yds',
    // NBA player props
    'player_points', 'player_rebounds', 'player_assists', 'player_threes',
    // MLB player props
    'player_hits', 'player_total_bases', 'player_strikeouts', 'pitcher_strikeouts'
  ]);
  const [internalSortBy, setInternalSortBy] = useState('profit');
  const [internalSelectedSports, setInternalSelectedSports] = useState(initialSports);
  
  // Draft state for filters (before applying)
  const [draftMinProfit, setDraftMinProfit] = useState(0.5);
  const [draftMaxStake, setDraftMaxStake] = useState(bankrollManager.getBankroll());
  const [draftSelectedMarkets, setDraftSelectedMarkets] = useState([
    // Game markets
    'h2h', 'spreads', 'totals', 'team_totals', 'alternate_spreads', 'alternate_totals',
    // NFL/NCAAF player props
    'player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions', 'player_reception_yds',
    // NBA player props
    'player_points', 'player_rebounds', 'player_assists', 'player_threes',
    // MLB player props
    'player_hits', 'player_total_bases', 'player_strikeouts', 'pitcher_strikeouts'
  ]);
  const [draftSortBy, setDraftSortBy] = useState('profit');
  const [draftSelectedSports, setDraftSelectedSports] = useState(initialSports);
  
  // Sports list for selection
  const sportsList = [
    { key: 'americanfootball_nfl', title: 'NFL' },
    { key: 'americanfootball_ncaaf', title: 'NCAAF' },
    { key: 'basketball_nba', title: 'NBA' },
    { key: 'basketball_ncaab', title: 'NCAAB' },
    { key: 'baseball_mlb', title: 'MLB' },
    { key: 'icehockey_nhl', title: 'NHL' },
    { key: 'soccer_epl', title: 'EPL' },
    { key: 'soccer_uefa_champs_league', title: 'Champions League' }
  ];
  
  // Use props or internal state
  const minProfit = propMinProfit !== undefined ? propMinProfit : internalMinProfit;
  const maxStake = propMaxStake !== undefined ? propMaxStake : internalMaxStake;
  const selectedMarkets = propSelectedMarkets !== undefined ? propSelectedMarkets : internalSelectedMarkets;
  const sortBy = propSortBy !== undefined ? propSortBy : internalSortBy;
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Apply filters function
  const applyFilters = () => {
    if (propMinProfit === undefined) setInternalMinProfit(draftMinProfit);
    if (propMaxStake === undefined) setInternalMaxStake(draftMaxStake);
    if (propSelectedMarkets === undefined) setInternalSelectedMarkets([...draftSelectedMarkets]);
    if (propSortBy === undefined) setInternalSortBy(draftSortBy);
    setInternalSelectedSports([...draftSelectedSports]);
  };

  // Reset filters function
  const resetFilters = () => {
    const defaultMinProfit = 0.5;
    const defaultMaxStake = bankrollManager.getBankroll();
    const defaultMarkets = [
      // Game markets
      'h2h', 'spreads', 'totals', 'team_totals', 'alternate_spreads', 'alternate_totals',
      // NFL/NCAAF player props
      'player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions', 'player_reception_yds',
      // NBA player props
      'player_points', 'player_rebounds', 'player_assists', 'player_threes',
      // MLB player props
      'player_hits', 'player_total_bases', 'player_strikeouts', 'pitcher_strikeouts'
    ];
    const defaultSortBy = 'profit';
    const defaultSports = [sport];
    
    setDraftMinProfit(defaultMinProfit);
    setDraftMaxStake(defaultMaxStake);
    setDraftSelectedMarkets([...defaultMarkets]);
    setDraftSortBy(defaultSortBy);
    setDraftSelectedSports([...defaultSports]);
    
    if (propMinProfit === undefined) setInternalMinProfit(defaultMinProfit);
    if (propMaxStake === undefined) setInternalMaxStake(defaultMaxStake);
    if (propSelectedMarkets === undefined) setInternalSelectedMarkets([...defaultMarkets]);
    if (propSortBy === undefined) setInternalSortBy(defaultSortBy);
    setInternalSelectedSports([...defaultSports]);
  };

  // Initialize draft state with current values
  useEffect(() => {
    setDraftMinProfit(minProfit);
    setDraftMaxStake(maxStake);
    setDraftSelectedMarkets([...selectedMarkets]);
    setDraftSortBy(sortBy);
    setDraftSelectedSports([...internalSelectedSports]);
  }, [minProfit, maxStake, selectedMarkets, sortBy, internalSelectedSports]);

  // Update internal maxStake when bankroll changes (only if not using props)
  useEffect(() => {
    if (propMaxStake === undefined) {
      const cleanup = bankrollManager.onBankrollChange((newBankroll) => {
        setInternalMaxStake(newBankroll);
        setDraftMaxStake(newBankroll);
      });
      return cleanup;
    }
  }, [propMaxStake]);

  // Fetch game odds data for arbitrage analysis
  const { data: oddsData, loading: oddsLoading, refresh, lastUpdate } = useCachedFetch((() => { const { withApiBase } = require('../../config/api'); return withApiBase('/api/odds'); })(), {
    params: { 
      sports: internalSelectedSports.join(','),
      markets: selectedMarkets.join(','),
      regions: 'us,uk,eu,au'
    },
    pollingInterval: autoRefresh ? 120000 : null, // 2 minutes when auto-refresh is on
    transform: (data) => data || []
  });

  // Fetch player props data for arbitrage analysis (excluding DFS apps)
  // Note: Player props are fetched separately via /api/player-props endpoint
  const { data: propsData, loading: propsLoading } = useCachedFetch((() => { const { withApiBase } = require('../../config/api'); return withApiBase('/api/player-props'); })(), {
    params: { 
      sports: internalSelectedSports.join(','),
      date: '', // Empty date to get all upcoming games
      bookFilter: 'draftkings,fanduel,betmgm,caesars,pointsbet,betrivers,unibet,wynnbet,superbook,twinspires,betfred_us,espnbet,fanatics,hardrock,fliff,novig,circasports,lowvig,bovada,mybookie,betonline,pinnacle' // Exclude DFS apps
    },
    pollingInterval: autoRefresh ? 120000 : null,
    transform: (data) => {
      console.log('🎯 Player props data received:', data?.length || 0, 'games');
      return data || [];
    }
  });

  // Combine game odds and player props data
  const loading = oddsLoading || propsLoading;
  const combinedData = [...(oddsData || []), ...(propsData || [])];
  
  // Use real games data passed from parent component, or combined fetched data
  const realGamesData = games && games.length > 0 ? games : combinedData;

  // Helper function to format bet selection text
  const formatBetSelection = (outcome, marketKey) => {
    if (!outcome || !outcome.name) return 'Unknown';
    
    // Debug logging to help verify data structure
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Formatting bet selection:', {
        marketKey,
        outcomeName: outcome.name,
        outcomePoint: outcome.point,
        fullOutcome: outcome
      });
    }
    
    // For spreads and totals, include the point/line information
    if (marketKey === 'spreads') {
      // For spreads, the point is usually in the outcome.point field or embedded in the name
      if (outcome.point !== undefined && outcome.point !== null) {
        const point = parseFloat(outcome.point);
        const sign = point > 0 ? '+' : '';
        return `${outcome.name} ${sign}${point}`;
      } else {
        // Try to extract point from name if not in separate field
        const pointMatch = outcome.name.match(/([+-]?\d+\.?\d*)/);
        if (pointMatch) {
          return outcome.name; // Already includes the point
        }
      }
    } else if (marketKey === 'totals') {
      // For totals, include the total line
      if (outcome.point !== undefined && outcome.point !== null) {
        return `${outcome.name} ${outcome.point}`;
      } else {
        // Try to extract total from name
        const totalMatch = outcome.name.match(/(\d+\.?\d*)/);
        if (totalMatch) {
          return outcome.name; // Already includes the total
        }
      }
    }
    
    // For moneyline or when no point info is available, just return the name
    return outcome.name;
  };

  // Calculate arbitrage opportunities from real data
  const calculateArbitrage = (games) => {
    const opportunities = [];
    
    games.forEach(game => {
      if (!Array.isArray(game.bookmakers) || game.bookmakers.length < 2) return;

      // Process both upcoming AND live games for arbitrage opportunities
      // Live games often have the BEST arbitrage due to rapid line movements
      // Only skip completed games if we have that status
      if (game.status === 'final' || game.completed) return;

      // DFS apps to exclude from arbitrage (can't arbitrage on DFS)
      const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au', 'sleeper', 'prophetx'];
      
      // Collect all market keys available across bookmakers
      const marketKeys = new Set();
      game.bookmakers.forEach(bookmaker => {
        // Skip DFS apps
        if (dfsApps.includes(bookmaker.key?.toLowerCase())) return;
        if (bookFilter.length > 0 && !bookFilter.includes(bookmaker.key)) return; // Apply book filter
        bookmaker?.markets?.forEach(market => {
          if (market?.key && selectedMarkets.includes(market.key)) {
            marketKeys.add(market.key);
          }
        });
      });

      marketKeys.forEach(marketKey => {
        // Find best odds for each outcome across all bookmakers
        const outcomeOdds = {};
        
        game.bookmakers.forEach(bookmaker => {
          // Skip DFS apps
          if (dfsApps.includes(bookmaker.key?.toLowerCase())) return;
          if (bookFilter.length > 0 && !bookFilter.includes(bookmaker.key)) return; // Apply book filter
          
          const gameMarket = bookmaker?.markets?.find(m => m.key === marketKey);
          if (!gameMarket || !gameMarket.outcomes) return;
          
          gameMarket.outcomes.forEach(outcome => {
            if (!outcome.name || typeof outcome.price !== 'number') return;
            
            const key = outcome.name;
            // For arbitrage, we want the BEST odds for each outcome (highest positive, least negative)
            if (!outcomeOdds[key] || 
                (outcome.price > 0 && outcome.price > outcomeOdds[key].price) ||
                (outcome.price < 0 && Math.abs(outcome.price) < Math.abs(outcomeOdds[key].price))) {
              outcomeOdds[key] = {
                ...outcome,
                bookmaker: bookmaker.title || bookmaker.key
              };
            }
          });
        });
        
        // Calculate arbitrage for two-way markets (moneyline, totals, spreads)
        const outcomes = Object.values(outcomeOdds);
        if (outcomes.length === 2) {
          // For spreads, require EXACT opposite lines for true arbitrage
          // Example: +3.5 and -3.5 (guaranteed profit regardless of outcome)
          if (marketKey === 'spreads') {
            const point1 = outcomes[0].point;
            const point2 = outcomes[1].point;
            
            // Skip if points don't exist or aren't exact opposites
            // Middles (0.5-1.5 point gaps) will be handled by the Middles tool
            if (!point1 || !point2 || Math.abs(point1 + point2) > 0.01) {
              console.log(`⚠️ Skipping spread arbitrage: ${outcomes[0].name} ${point1} vs ${outcomes[1].name} ${point2} (lines don't match - use Middles tool for gaps)`);
              return;
            }
          }
          
          // For totals, require EXACT matching lines for true arbitrage
          // Example: Over 45.5 and Under 45.5 (guaranteed profit regardless of outcome)
          if (marketKey === 'totals') {
            const point1 = outcomes[0].point;
            const point2 = outcomes[1].point;
            
            // Skip if points don't exist or don't match exactly
            // Middles (0.5-1.5 point gaps) will be handled by the Middles tool
            if (!point1 || !point2 || Math.abs(point1 - point2) > 0.01) {
              console.log(`⚠️ Skipping totals arbitrage: Over ${point1} vs Under ${point2} (lines don't match - use Middles tool for gaps)`);
              return;
            }
          }
          
          const arb = calculateTwoWayArbitrage(outcomes, game, { key: marketKey });
          if (arb && arb.profit_percentage >= minProfit) {
            opportunities.push({
              id: `${game.id}-${marketKey}-${Date.now()}`,
              game: `${game.away_team} @ ${game.home_team}`,
              market: marketKey,
              sport: game.sport_key,
              commence_time: game.commence_time,
              opportunities: [arb]
            });
          }
        }
      });
    });
    
    console.log('🎯 Found', opportunities.length, 'real arbitrage opportunities');
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
    const userBankroll = bankrollManager.getBankroll();
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
          selection: formatBetSelection(outcome1, market.key),
          odds: outcome1.price,
          stake: stake1,
          payout: payout1,
          implied_prob: prob1 * 100
        },
        {
          bookmaker: outcome2.bookmaker,
          selection: formatBetSelection(outcome2, market.key),
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
    if (realGamesData && realGamesData.length > 0) {
      console.log('🎯 Calculating arbitrage from real data:', realGamesData.length, 'games');
      return calculateArbitrage(realGamesData);
    }
    return [];
  }, [realGamesData, selectedMarkets, minProfit, maxStake]);

  // Only use real arbitrage opportunities - no mock data
  const allOpportunities = realArbitrageOpportunities;

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

  // Check if we should show controls (only when not using props and not compact)
  const showControls = !compact && propMinProfit === undefined && propMaxStake === undefined && propSelectedMarkets === undefined && propSortBy === undefined;

  return (
    <div className={`arbitrage-detector ${compact ? 'compact' : ''}`}>
      {showControls && (
        <div className="arbitrage-controls">
          <div className="controls-header">
            <h3>🎯 Real-Time Arbitrage Scanner</h3>
            <p>Analyzing live odds across all 6 sports and multiple sportsbooks</p>
          </div>
          <div className="controls-grid">
            <div className="control-group">
              <label>🏈 Sports</label>
              <SportMultiSelect
                list={sportsList}
                selected={draftSelectedSports}
                onChange={setDraftSelectedSports}
              />
            </div>
            <div className="control-group">
              <label>Minimum Profit %</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={draftMinProfit}
                onChange={(e) => setDraftMinProfit(Number(e.target.value))}
                className="form-control"
              />
            </div>
            <div className="control-group">
              <label>Max Stake</label>
              <input
                type="number"
                min="100"
                max={bankrollManager.getBankroll()}
                step="10"
                value={draftMaxStake}
                onChange={(e) => setDraftMaxStake(Number(e.target.value))}
                className="form-control"
              />
            </div>
            <div className="control-group">
              <label>Markets</label>
              <select 
                value={draftSelectedMarkets}
                onChange={(e) => setDraftSelectedMarkets(Array.from(e.target.selectedOptions, option => option.value))}
                className="form-control"
              >
                <option value="h2h">Moneyline</option>
                <option value="spreads">Point Spread</option>
                <option value="totals">Over/Under</option>
              </select>
            </div>
            <div className="control-group">
              <label>Sort By</label>
              <select value={draftSortBy} onChange={(e) => setDraftSortBy(e.target.value)} className="form-control">
                <option value="profit">Profit %</option>
                <option value="amount">Profit Amount</option>
                <option value="time">Time Found</option>
                <option value="expires">Expires Soon</option>
              </select>
            </div>
            
            {/* Apply and Reset Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button 
                onClick={applyFilters} 
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                  color: '#fff', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
              <button 
                onClick={resetFilters} 
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)', 
                  color: '#fff', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`opportunities-list ${compact ? 'compact' : ''}`}>
        {loading && filteredOpportunities.length === 0 ? (
          <div className="loading-state">
            <RefreshCw className="spinning" />
            <p>{compact ? 'Scanning...' : 'Scanning for arbitrage opportunities...'}</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="empty-state">
            <Target className="empty-icon" />
            <h3>{compact ? 'No Opportunities' : 'No Real Arbitrage Opportunities Found'}</h3>
            {!compact && (
              <div>
                <p>Scanning live odds across all 6 sports (NFL, NCAA, NBA, NCAA Basketball, MLB, NHL) and {bookFilter && bookFilter.length > 0 ? bookFilter.length : 'all'} sportsbooks.</p>
                <p>Try lowering the minimum profit threshold or check back as odds update.</p>
                {realGamesData?.length === 0 && <p>No games data available. Please check your sports selection.</p>}
              </div>
            )}
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

      {lastUpdate && !compact && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ArbitrageDetector;
