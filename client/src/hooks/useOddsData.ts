import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { useAuth } from './SimpleAuth';

export interface OddsBook {
  name: string;
  odds: string;
  team2Odds: string;
  ev: string;
  isBest: boolean;
}

export interface OddsPick {
  id: number;
  ev: string;
  sport: string;
  game: string;
  team1: string;
  team2: string;
  pick: string;
  bestOdds: string;
  bestBook: string;
  avgOdds: string;
  isHot: boolean;
  books: OddsBook[];
  gameTime?: string;  // ISO 8601 format (e.g., "2025-11-18T19:00:00Z")
  commenceTime?: string;  // Alias for gameTime
}

export interface UseOddsDataOptions {
  sport?: string;
  date?: string;
  marketType?: string;
  betType?: string;
  sportsbooks?: string[];
  limit?: number;
  enabled?: boolean;
}

export interface UseOddsDataResult {
  picks: OddsPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Transform TheOddsAPI format to OddsPick format
// Normalize American odds so positive numbers always have a leading '+'
function normalizeAmericanOdds(raw: any): string {
  const n = parseInt(String(raw), 10);
  if (isNaN(n)) return String(raw ?? '');
  return n > 0 ? `+${n}` : String(n);
}

function transformOddsApiToOddsPick(games: any[]): OddsPick[] {
  if (!Array.isArray(games)) return [];
  
  // Log first game structure to debug
  if (games.length > 0) {
    console.log('📋 First game structure:', games[0]);
    console.log('📋 First game keys:', Object.keys(games[0]));
  }
  
  return games.map((game, idx) => {
    const team1 = game.away_team || 'Team A';
    const team2 = game.home_team || 'Team B';
    const bookmakers = game.bookmakers || [];
    
    // Log first game's bookmakers
    if (idx === 0) {
      console.log(`📋 First game bookmakers:`, bookmakers);
      console.log(`📋 First game bookmakers length:`, bookmakers.length);
    }
    
    // Get best odds from all bookmakers
    let bestOdds = '-110';
    let bestBook = 'N/A';
    let ev = '0%';
    const booksArray: any[] = [];
    
    // Find odds from all bookmakers - try h2h first, then spreads, then any market
    bookmakers.forEach((bm, bmIdx) => {
      let marketToUse = null;
      const bookName = bm.title || bm.key;
      
      // Debug first bookmaker - log entire structure
      if (idx === 0 && bmIdx === 0) {
        console.log(`📚 FIRST BOOKMAKER FULL OBJECT:`, bm);
        console.log(`📚 First bookmaker keys:`, Object.keys(bm));
        console.log(`📚 First bookmaker: ${bookName}, markets:`, bm.markets?.length || 0);
        if (bm.markets && bm.markets.length > 0) {
          console.log(`📚 First market:`, bm.markets[0]);
          console.log(`📚 First market key: ${bm.markets[0].key}`);
          console.log(`📚 First market outcomes:`, bm.markets[0].outcomes);
        }
      }
      
      // Try to find h2h market first (moneyline)
      if (bm.markets && Array.isArray(bm.markets)) {
        if (idx === 0 && bmIdx === 0) {
          console.log(`🔎 Available markets for ${bookName}:`, bm.markets.map((m: any) => m.key));
        }
        
        marketToUse = bm.markets.find((m: any) => m.key === 'h2h');
        if (idx === 0 && bmIdx === 0 && marketToUse) {
          console.log(`✅ Found h2h market`);
        }
        
        // If no h2h, try spreads
        if (!marketToUse) {
          marketToUse = bm.markets.find((m: any) => m.key === 'spreads');
          if (idx === 0 && bmIdx === 0 && marketToUse) {
            console.log(`✅ Found spreads market (h2h not available)`);
          }
        }
        
        // If no spreads, try totals (last resort)
        if (!marketToUse) {
          marketToUse = bm.markets.find((m: any) => m.key === 'totals');
          if (idx === 0 && bmIdx === 0 && marketToUse) {
            console.log(`✅ Found totals market (h2h and spreads not available)`);
          }
        }
        
        // If still nothing, use first available market
        if (!marketToUse && bm.markets.length > 0) {
          marketToUse = bm.markets[0];
          if (idx === 0 && bmIdx === 0) {
            console.log(`✅ Using first available market: ${marketToUse.key}`);
          }
        }
      }
      
      if (marketToUse && marketToUse.outcomes && marketToUse.outcomes.length > 0) {
        // Get the first outcome (usually the away team for h2h, or the first side for spreads/totals)
        const outcome0 = marketToUse.outcomes[0];
        const outcome1 = marketToUse.outcomes[1];
        
        if (idx === 0 && bmIdx === 0) {
          console.log(`🔍 Outcome 0 FULL:`, outcome0);
          console.log(`🔍 Outcome 0 keys:`, Object.keys(outcome0));
          console.log(`🔍 Outcome 1 FULL:`, outcome1);
          if (outcome1) {
            console.log(`🔍 Outcome 1 keys:`, Object.keys(outcome1));
          }
        }
        
        // Try different property names for odds
        const odds = outcome0.odds !== undefined ? outcome0.odds : 
                     outcome0.price !== undefined ? outcome0.price :
                     outcome0.value !== undefined ? outcome0.value : undefined;
        const team2Odds = outcome1 ? (outcome1.odds !== undefined ? outcome1.odds :
                                       outcome1.price !== undefined ? outcome1.price :
                                       outcome1.value !== undefined ? outcome1.value : '-110') : '-110';
        
        if (idx === 0 && bmIdx === 0) {
          console.log(`🔍 Extracted odds: ${odds}, team2Odds: ${team2Odds}`);
        }
        
        if (odds !== undefined && odds !== null) {
          booksArray.push({
            name: bookName,
            odds: normalizeAmericanOdds(odds),
            team2Odds: normalizeAmericanOdds(team2Odds),
            ev: '0%',
            isBest: bmIdx === 0
          });
          
          // Set best odds from first bookmaker with valid odds
          if (bmIdx === 0 && bestOdds === '-110') {
            bestOdds = normalizeAmericanOdds(odds);
            bestBook = bookName;
          }
          
          if (idx === 0 && bmIdx === 0) {
            console.log(`✅ Found odds for ${bookName}: ${odds} (market: ${marketToUse.key})`);
          }
        } else {
          if (idx === 0 && bmIdx === 0) {
            console.log(`⚠️ Market found but no odds for ${bookName}, odds value: ${odds}`);
          }
        }
      } else {
        // No markets found for this bookmaker - skip adding mock odds
        if (idx === 0 && bmIdx === 0) {
          console.log(`⚠️ No market data for ${bookName}, skipping bookmaker (no fallback odds)`);
        }
      }
    });

    // After collecting all bookmaker odds, compute a simple EV% based on
    // the best price vs the average price across all books for this side.
    const numericOdds = booksArray
      .map(b => parseInt(b.odds, 10))
      .filter(o => !isNaN(o));

    if (numericOdds.length > 0) {
      // Convert American odds to implied probability
      const toProb = (american: number) => {
        if (american > 0) {
          return 100 / (american + 100);
        }
        return -american / (-american + 100);
      };

      const probs = numericOdds.map(toProb);
      const avgProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;

      const bestOddsNum = parseInt(bestOdds, 10);
      if (!isNaN(bestOddsNum)) {
        const bestProb = toProb(bestOddsNum);
        // Positive EV when bestProb < avgProb (better price than market average)
        const edge = ((avgProb - bestProb) / bestProb) * 100;
        const roundedEdge = Math.round(edge * 100) / 100;
        ev = `${roundedEdge.toFixed(2)}%`;

        // Apply per-book EVs relative to the same fair (average) probability
        booksArray.forEach(b => {
          const o = parseInt(b.odds, 10);
          if (!isNaN(o)) {
            const p = toProb(o);
            const bookEdge = ((avgProb - p) / p) * 100;
            const roundedBookEdge = Math.round(bookEdge * 100) / 100;
            b.ev = `${roundedBookEdge.toFixed(2)}%`;
          } else {
            b.ev = '0%';
          }
        });
      }
    }

    if (idx === 0) {
      console.log(`📊 Game: ${team1} @ ${team2}, Books found: ${booksArray.length}, Best odds: ${bestOdds}, EV: ${ev}`);
    }

    return {
      id: game.id || idx + 1,
      ev: ev,
      // Use sport_key in lowercase so UI helpers (getSportLabel) can map to clean league labels like NFL/NBA
      sport: (game.sport_key || game.sport_title || 'Unknown').toLowerCase(),
      game: `${team1} @ ${team2}`,
      team1,
      team2,
      pick: `${team1} ML`,
      bestOdds,
      bestBook,
      avgOdds: bestOdds,
      isHot: false,
      books: booksArray,
      gameTime: game.commence_time || game.gameTime || undefined,
      commenceTime: game.commence_time || game.gameTime || undefined
    };
  });
}

export function useOddsData(options: UseOddsDataOptions = {}): UseOddsDataResult {
  const {
    sport = 'all',
    date = 'today',
    marketType = 'all',
    betType = 'straight',
    sportsbooks = [],
    limit = 50,
    enabled = true,
  } = options;

  const { user, authLoading } = useAuth();
  const [picks, setPicks] = useState<OddsPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOddsData = async () => {
    if (!enabled || !user || authLoading) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters - match backend API expectations
      const params = new URLSearchParams();
      
      // Map frontend sport IDs to TheOddsAPI sport keys
      const sportKeyMap: { [key: string]: string } = {
        'nfl': 'americanfootball_nfl',
        'ncaa-football': 'americanfootball_ncaaf',
        'nba': 'basketball_nba',
        'ncaa-basketball': 'basketball_ncaab',
        'nhl': 'icehockey_nhl',
        'mlb': 'baseball_mlb',
      };
      
      // Map frontend filters to backend parameter names
      // Default sports if not specified
      const sportsList = sport && sport !== 'all' 
        ? (sportKeyMap[sport] || sport)
        : 'americanfootball_nfl,basketball_nba,baseball_mlb,icehockey_nhl';
      params.append('sports', sportsList);
      
      // Backend expects 'markets' not 'marketType'
      const marketsList = marketType && marketType !== 'all'
        ? marketType
        : 'h2h,spreads,totals';
      params.append('markets', marketsList);
      
      // Add other parameters the backend expects
      params.append('regions', 'us');
      params.append('oddsFormat', 'american');
      
      // Optional: date, betType, sportsbooks (if backend supports them)
      if (date && date !== 'all') params.append('date', date);
      if (betType && betType !== 'all') params.append('betType', betType);
      if (sportsbooks && sportsbooks.length > 0) {
        params.append('sportsbooks', sportsbooks.join(','));
      }
      if (limit) params.append('limit', limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/odds${queryString ? `?${queryString}` : ''}`;

      console.log('📊 Fetching odds data from:', endpoint);

      const response = await apiClient.get(endpoint);
      
      console.log('📦 API Response:', response.data);
      console.log('📦 Response type:', typeof response.data);
      console.log('📦 Is array?:', Array.isArray(response.data));
      if (response.data && typeof response.data === 'object') {
        console.log('📦 Response keys:', Object.keys(response.data));
      }

      if (response.data && Array.isArray(response.data)) {
        const transformedPicks = transformOddsApiToOddsPick(response.data);
        setPicks(transformedPicks);
        console.log('✅ Odds data fetched and transformed successfully:', transformedPicks.length, 'picks');
      } else if (response.data && response.data.picks && Array.isArray(response.data.picks)) {
        const transformedPicks = transformOddsApiToOddsPick(response.data.picks);
        setPicks(transformedPicks);
        console.log('✅ Odds data fetched and transformed successfully:', transformedPicks.length, 'picks');
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        setError('Invalid response format from API');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch odds data';
      console.error('❌ Error fetching odds data:', errorMessage);
      setError(errorMessage);
      setPicks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOddsData();
  }, [sport, date, marketType, betType, sportsbooks.join(','), limit, enabled, user, authLoading]);

  return {
    picks,
    loading,
    error,
    refetch: fetchOddsData,
  };
}
