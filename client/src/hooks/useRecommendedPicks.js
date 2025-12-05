import { useState, useEffect, useCallback } from 'react';
import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';

/**
 * Hook to fetch recommended picks for the dashboard
 * Gets high EV picks from the odds API
 */
export function useRecommendedPicks(options = {}) {
  const {
    limit = 4,
    minEV = 5, // Minimum 5% EV
    enabled = true,
  } = options;

  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendedPicks = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch odds data with high EV filter
      // Only fetch today's and future games (filter out past games)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const params = new URLSearchParams({
        sports: 'americanfootball_nfl,basketball_nba,baseball_mlb,icehockey_nhl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso',
        _t: Date.now(),
      });

      const url = withApiBase(`/api/odds?${params.toString()}`);
      console.log('📊 Fetching recommended picks from:', url);

      const response = await secureFetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
      }

      const data = await response.json();
      let games = Array.isArray(data) ? data : [];

      console.log(`📥 API returned ${games.length} games`);
      if (games.length > 0) {
        console.log(`  First game: ${games[0].away_team} @ ${games[0].home_team}`);
        console.log(`  Commence: ${games[0].commence_time}`);
        console.log(`  Bookmakers: ${games[0].bookmakers?.length || 0}`);
      }

      // Filter out games that have already started or are in the past
      const now = new Date();
      const beforeFilter = games.length;
      games = games.filter((game) => {
        if (!game.commence_time) return false;
        const gameTime = new Date(game.commence_time);
        return gameTime > now; // Only include future games
      });

      console.log(`📅 Filtered ${beforeFilter} games down to ${games.length} upcoming games`);

      // Transform games into picks with EV calculation
      const recommendedPicks = games
        .slice(0, limit * 2) // Get more than needed to filter
        .flatMap((game) => {
          const picks = [];
          
          if (!game.bookmakers || game.bookmakers.length === 0) return picks;

          // Collect all unique market/outcome combinations across ALL bookmakers
          // and find the best odds for each
          const bestOddsMap = new Map(); // key: "marketKey|outcomeName|point" -> { odds, bookmaker, market, outcome }
          
          game.bookmakers.forEach((bookmaker) => {
            if (!bookmaker.markets) return;
            
            bookmaker.markets.forEach((market) => {
              if (!market.outcomes) return;
              
              market.outcomes.forEach((outcome) => {
                const key = `${market.key}|${outcome.name}|${outcome.point || 'null'}`;
                const existing = bestOddsMap.get(key);
                
                // Determine if this is better odds
                const isBetter = !existing || 
                  (outcome.price > 0 && existing.odds > 0 && outcome.price > existing.odds) ||
                  (outcome.price < 0 && existing.odds < 0 && outcome.price > existing.odds) ||
                  (outcome.price > 0 && existing.odds < 0);
                
                if (isBetter) {
                  bestOddsMap.set(key, {
                    odds: outcome.price,
                    bookmaker: bookmaker,
                    market: market,
                    outcome: outcome
                  });
                }
              });
            });
          });

          // Now create picks from the best odds we found
          bestOddsMap.forEach((best, key) => {
            const { odds, bookmaker, market, outcome } = best;
            
            // Calculate real EV based on actual odds
            const ev = calculateEV(odds, game.bookmakers, market.key, outcome.name, outcome.point);

            if (ev >= minEV) {
              // Format pick description based on market type
              let pickDescription = outcome.name;
              if (market.key === 'h2h') {
                pickDescription = `${outcome.name} ML`;
              } else if (market.key === 'spreads') {
                const point = outcome.point;
                const pointStr = point > 0 ? `+${point}` : `${point}`;
                pickDescription = `${outcome.name} ${pointStr}`;
              } else if (market.key === 'totals') {
                const point = outcome.point;
                pickDescription = `${outcome.name} ${point}`;
              } else if (market.key.includes('player_') || market.key.includes('alternate')) {
                // Player props - include point value
                const point = outcome.point;
                if (point !== null && point !== undefined) {
                  pickDescription = `${outcome.name} ${point}`;
                }
              }

              picks.push({
                id: `${game.id}-${market.key}-${outcome.name}-${outcome.point || ''}`,
                teams: `${game.away_team} @ ${game.home_team}`,
                time: new Date(game.commence_time).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                }),
                pick: pickDescription,
                odds: odds,
                sportsbook: normalizeBookName(bookmaker.title || bookmaker.key),
                ev: `${ev.toFixed(2)}%`,
                sport: getSportLabel(game.sport_key),
                status: new Date(game.commence_time) <= new Date() ? 'live' : 'active',
                confidence: ev > 10 ? 'High' : ev > 7 ? 'Medium' : 'Low',
                bookmakers: game.bookmakers,
                marketKey: market.key,
                point: outcome.point,
              });
            }
          });

          return picks;
        })
        .sort((a, b) => {
          // Sort by EV descending
          const evA = parseFloat(a.ev);
          const evB = parseFloat(b.ev);
          return evB - evA;
        })
        .slice(0, limit);

      console.log(`✅ Found ${recommendedPicks.length} recommended picks`);
      if (recommendedPicks.length > 0) {
        console.log('  Top picks:');
        recommendedPicks.slice(0, 3).forEach((pick, idx) => {
          console.log(`    ${idx + 1}. ${pick.teams} - ${pick.pick} @ ${pick.sportsbook} (${pick.ev})`);
        });
      }
      setPicks(recommendedPicks);
    } catch (err) {
      console.error('Error fetching recommended picks:', err);
      setError(err.message);
      setPicks([]);
    } finally {
      setLoading(false);
    }
  }, [limit, minEV, enabled]);

  useEffect(() => {
    fetchRecommendedPicks();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRecommendedPicks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRecommendedPicks]);

  return {
    picks,
    loading,
    error,
    refetch: fetchRecommendedPicks,
  };
}

// Normalize sportsbook display names
function normalizeBookName(bookName) {
  const nameMap = {
    'LowVig.ag': 'LowVig',
    'lowvig': 'LowVig',
    'BetOnline.ag': 'BetOnline',
    'betonlineag': 'BetOnline',
    'Betr DFS': 'Betr',
    'betrdfs': 'Betr',
    'DraftKings Pick6': 'DK Pick6',
    'draftkings_pick6': 'DK Pick6',
    'pick6': 'DK Pick6',
    'Hard Rock Bet': 'Hard Rock',
    'hardrockbet': 'Hard Rock',
    'Dabble AU': 'Dabble',
    'dabble_au': 'Dabble',
    'William Hill (US)': 'Caesars',
    'williamhill_us': 'Caesars',
    'theScore Bet': 'TheScore',
    'thescorebet': 'TheScore',
    'FanDuel': 'FanDuel',
    'fanduel': 'FanDuel',
    'DraftKings': 'DraftKings',
    'draftkings': 'DraftKings',
    'BetMGM': 'BetMGM',
    'betmgm': 'BetMGM',
    'Caesars': 'Caesars',
    'caesars': 'Caesars',
    'PointsBet (US)': 'PointsBet',
    'pointsbetus': 'PointsBet',
    'Fanatics': 'Fanatics',
    'fanatics': 'Fanatics',
  };
  return nameMap[bookName] || bookName;
}

function getSportLabel(sportKey) {
  const sportMap = {
    'americanfootball_nfl': 'NFL',
    'americanfootball_ncaaf': 'NCAAF',
    'basketball_nba': 'NBA',
    'basketball_ncaab': 'NCAAB',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL',
    'soccer_epl': 'EPL',
    'mma_mixed_martial_arts': 'MMA',
    'boxing_boxing': 'BOXING',
  };
  return sportMap[sportKey] || sportKey.toUpperCase();
}

/**
 * Calculate Expected Value (EV) for a bet
 * @param {number} odds - The odds being offered
 * @param {Array} bookmakers - All bookmakers with their odds for comparison
 * @param {string} marketKey - The market type (h2h, spreads, totals, etc.)
 * @param {string} outcomeName - The outcome name (team name, Over, Under, etc.)
 * @param {number} point - The point value for spreads/totals (null for moneyline)
 * @returns {number} EV percentage
 */
function calculateEV(odds, bookmakers, marketKey = null, outcomeName = null, point = null) {
  if (!odds || !bookmakers || bookmakers.length === 0) return 0;

  try {
    // Convert American odds to implied probability
    const impliedProb = americanOddsToProb(odds);
    
    // Collect all odds for the SAME market type, outcome, and point value
    const comparableOdds = [];
    
    bookmakers.forEach((book) => {
      if (book.markets) {
        book.markets.forEach((market) => {
          // Only compare same market type
          if (marketKey && market.key !== marketKey) return;
          
          if (market.outcomes) {
            market.outcomes.forEach((outcome) => {
              // Only compare same outcome name (or similar - Over/Under, team names)
              if (outcomeName && outcome.name !== outcomeName) return;
              
              // CRITICAL: Only compare same point value for spreads/totals
              if (point !== null && outcome.point !== point) return;
              
              if (outcome.price) {
                comparableOdds.push(outcome.price);
              }
            });
          }
        });
      }
    });

    // Need at least 2 comparable odds to calculate meaningful EV
    if (comparableOdds.length < 2) {
      return 0;
    }

    // Calculate fair probability using power method (de-vig)
    // Average the implied probabilities and normalize
    const probs = comparableOdds.map(o => americanOddsToProb(o));
    const avgProb = probs.reduce((a, b) => a + b, 0) / probs.length;
    
    // The fair probability should be close to the average
    // EV = (Fair Probability / Implied Probability - 1) * 100
    // Or equivalently: how much better are our odds vs the fair line
    
    // Find the best (lowest juice) odds among comparable books
    const bestOdds = comparableOdds.reduce((best, current) => {
      // For negative odds, less negative is better (-110 > -120)
      // For positive odds, more positive is better (+150 > +130)
      if (current > 0 && best > 0) return current > best ? current : best;
      if (current < 0 && best < 0) return current > best ? current : best;
      if (current > 0) return current; // Positive is always better than negative
      return best;
    }, comparableOdds[0]);
    
    const bestProb = americanOddsToProb(bestOdds);
    
    // EV calculation: compare our odds to the consensus fair line
    // If our implied prob is LOWER than fair prob, we have +EV (getting better odds)
    // EV% = (Fair Prob / Our Implied Prob - 1) * 100
    const ev = ((avgProb / impliedProb) - 1) * 100;
    
    // Only show positive EV and cap at reasonable values
    // Anything over 20% EV is likely a data error
    if (ev > 0 && ev < 50) {
      console.log(`    [EV Debug] Odds: ${odds}, Comparable: ${comparableOdds.length} books, Fair: ${(avgProb*100).toFixed(1)}%, Implied: ${(impliedProb*100).toFixed(1)}%, EV: ${ev.toFixed(2)}%`);
    }
    
    // Cap EV at 50% - anything higher is almost certainly bad data
    return Math.min(50, Math.max(0, ev));
  } catch (err) {
    console.warn('Error calculating EV:', err);
    return 0;
  }
}

/**
 * Convert American odds format to probability
 * @param {number} americanOdds - Odds in American format (e.g., -110, +150)
 * @returns {number} Probability as decimal (0-1)
 */
function americanOddsToProb(americanOdds) {
  if (!americanOdds) return 0.5;
  
  if (americanOdds > 0) {
    // Positive odds: Probability = 100 / (Odds + 100)
    return 100 / (americanOdds + 100);
  } else {
    // Negative odds: Probability = -Odds / (-Odds + 100)
    return -americanOdds / (-americanOdds + 100);
  }
}
