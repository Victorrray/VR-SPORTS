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

          // Get best odds from all bookmakers
          const bestBookmaker = game.bookmakers[0];
          if (!bestBookmaker.markets || bestBookmaker.markets.length === 0) return picks;

          // Create picks from available markets
          bestBookmaker.markets.forEach((market) => {
            if (!market.outcomes || market.outcomes.length === 0) return;

            market.outcomes.forEach((outcome) => {
              // Calculate real EV based on actual odds
              const ev = calculateEV(outcome.price, game.bookmakers);

              // Log EV calculation for debugging
              if (picks.length === 0 && market === bestBookmaker.markets[0]) {
                console.log(`  EV for ${outcome.name}: ${ev.toFixed(2)}% (threshold: ${minEV}%)`);
              }

              if (ev >= minEV) {
                // Format pick description based on market type
                let pickDescription = outcome.name;
                if (market.key === 'h2h') {
                  // Moneyline - add "ML" suffix
                  pickDescription = `${outcome.name} ML`;
                } else if (market.key === 'spreads') {
                  // Spread - add point value
                  const point = outcome.point;
                  const pointStr = point > 0 ? `+${point}` : `${point}`;
                  pickDescription = `${outcome.name} ${pointStr}`;
                } else if (market.key === 'totals') {
                  // Totals - Over/Under with point
                  const point = outcome.point;
                  pickDescription = `${outcome.name} ${point}`;
                }

                picks.push({
                  id: `${game.id}-${market.key}-${outcome.name}`,
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
                  odds: outcome.price,
                  sportsbook: normalizeBookName(bestBookmaker.title || bestBookmaker.key),
                  ev: `${ev.toFixed(2)}%`,
                  sport: getSportLabel(game.sport_key),
                  status: new Date(game.commence_time) <= new Date() ? 'live' : 'active',
                  confidence: ev > 10 ? 'High' : ev > 7 ? 'Medium' : 'Low',
                  bookmakers: game.bookmakers, // Include all bookmakers for odds comparison
                  marketKey: market.key, // Include market type for reference
                });
              }
            });
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
 * Calculate real EV (Expected Value) based on actual odds from multiple bookmakers
 * EV = (Probability of Winning * Potential Profit) - (Probability of Losing * Stake) * 100
 * 
 * @param {number} odds - The odds for this outcome (American format)
 * @param {Array} bookmakers - All bookmakers with their odds for comparison
 * @returns {number} EV percentage
 */
function calculateEV(odds, bookmakers) {
  if (!odds || !bookmakers || bookmakers.length === 0) return 0;

  try {
    // Convert American odds to implied probability
    const impliedProb = americanOddsToProb(odds);
    
    // Find the BEST odds for this outcome across all bookmakers
    // Best means highest probability (lowest risk) for the bettor
    let bestOdds = odds;
    let bestProb = impliedProb;
    
    bookmakers.forEach((book) => {
      if (book.markets) {
        book.markets.forEach((market) => {
          if (market.outcomes) {
            market.outcomes.forEach((outcome) => {
              if (outcome.price) {
                const outcomeProb = americanOddsToProb(outcome.price);
                // Keep the odds with the HIGHEST probability (best for bettor)
                if (outcomeProb > bestProb) {
                  bestOdds = outcome.price;
                  bestProb = outcomeProb;
                }
              }
            });
          }
        });
      }
    });

    // Calculate actual probability from best odds
    const actualProb = bestProb;
    
    // EV = (Actual Probability - Implied Probability) * 100
    // If actual prob is higher than implied, there's positive EV
    const ev = (actualProb - impliedProb) * 100;
    
    // Debug logging
    if (ev > 0) {
      console.log(`    [EV Debug] Input odds: ${odds}, Best odds: ${bestOdds}, Implied: ${(impliedProb*100).toFixed(1)}%, Actual: ${(actualProb*100).toFixed(1)}%, EV: ${ev.toFixed(2)}%`);
    }
    
    // Return max of 0 (no negative EV picks) and calculated EV
    return Math.max(0, ev);
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
