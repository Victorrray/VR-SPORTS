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
  id: number | string;
  ev: string;
  sport: string;
  game: string;
  team1: string;
  team2: string;
  pick: string;
  bestOdds: string;
  bestBook: string;
  avgOdds?: string;
  isHot?: boolean;
  books: OddsBook[];
  gameTime?: string;  // ISO 8601 format (e.g., "2025-11-18T19:00:00Z")
  commenceTime?: string;  // Alias for gameTime
  // Player props specific fields
  isPlayerProp?: boolean;
  playerName?: string;
  marketKey?: string;
  line?: number;
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

// Map sport keys to readable league names
function getSportLabel(sportKey: string): string {
  const sportLabelMap: { [key: string]: string } = {
    'americanfootball_nfl': 'NFL',
    'americanfootball_ncaaf': 'NCAA Football',
    'basketball_nba': 'NBA',
    'basketball_ncaab': 'NCAA Basketball',
    'icehockey_nhl': 'NHL',
    'baseball_mlb': 'MLB',
  };
  return sportLabelMap[sportKey] || sportKey;
}

// Transform TheOddsAPI format to OddsPick format
// Normalize American odds so positive numbers always have a leading '+'
function normalizeAmericanOdds(raw: any): string {
  const n = parseInt(String(raw), 10);
  if (isNaN(n)) return String(raw ?? '');
  return n > 0 ? `+${n}` : String(n);
}

// Check if a market key is a player prop
function isPlayerPropMarket(marketKey: string): boolean {
  return marketKey?.startsWith('player_') || marketKey?.startsWith('batter_') || marketKey?.startsWith('pitcher_');
}

// Format market key to readable name (e.g., "player_assists" -> "Assists")
function formatMarketName(marketKey: string): string {
  if (!marketKey) return '';
  return marketKey
    .replace('player_', '')
    .replace('batter_', '')
    .replace('pitcher_', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Normalize sportsbook display names
function normalizeBookName(bookName: string): string {
  const nameMap: { [key: string]: string } = {
    'Dabble AU': 'Dabble',
    'dabble_au': 'Dabble',
    'William Hill (US)': 'Caesars',
    'williamhill_us': 'Caesars',
  };
  return nameMap[bookName] || bookName;
}

function transformOddsApiToOddsPick(games: any[], selectedSportsbooks: string[] = []): OddsPick[] {
  if (!Array.isArray(games)) return [];
  
  // Helper to check if a book should be included based on filter
  const isBookIncluded = (bookKey: string, bookName: string): boolean => {
    if (selectedSportsbooks.length === 0) return true; // No filter = include all
    const normalizedKey = bookKey?.toLowerCase();
    const normalizedName = bookName?.toLowerCase();
    return selectedSportsbooks.some(sb => {
      const normalizedSb = sb.toLowerCase();
      return normalizedKey === normalizedSb || normalizedName === normalizedSb || 
             normalizedKey?.includes(normalizedSb) || normalizedName?.includes(normalizedSb);
    });
  };
  
  // Log first game structure to debug
  if (games.length > 0) {
    console.log('📋 First game structure:', games[0]);
    console.log('📋 First game keys:', Object.keys(games[0]));
  }
  
  const allPicks: OddsPick[] = [];
  
  games.forEach((game, gameIdx) => {
    const team1 = game.away_team || 'Team A';
    const team2 = game.home_team || 'Team B';
    const bookmakers = game.bookmakers || [];
    const gameMatchup = `${team1} @ ${team2}`;
    
    // Log first game's bookmakers
    if (gameIdx === 0) {
      console.log(`📋 First game bookmakers:`, bookmakers);
      console.log(`📋 First game bookmakers length:`, bookmakers.length);
      const bookKeys = bookmakers.map((b: any) => b.key);
      console.log(`📋 Bookmaker keys in response:`, bookKeys);
      // Check for DFS apps specifically
      const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au', 'sleeper', 'fliff'];
      const foundDFS = bookKeys.filter((key: string) => dfsApps.includes(key?.toLowerCase()));
      console.log(`🎮 DFS Apps in response:`, foundDFS.length > 0 ? foundDFS : 'NONE - API not returning DFS apps');
    }
    
    // Check if this game has player prop markets
    const hasPlayerProps = bookmakers.some((bm: any) => 
      bm.markets?.some((m: any) => isPlayerPropMarket(m.key))
    );
    
    if (hasPlayerProps) {
      // PLAYER PROPS MODE: Create one pick per player per market
      const playerPropsMap = new Map<string, any>(); // key: "playerName-marketKey"
      
      // Collect ALL books for the mini table (no filtering here)
      bookmakers.forEach((bm: any) => {
        const bookKey = bm.key || '';
        const bookName = normalizeBookName(bm.title || bm.key);
        
        bm.markets?.forEach((market: any) => {
          if (!isPlayerPropMarket(market.key)) return;
          
          // Group outcomes by player (description field)
          const playerOutcomes = new Map<string, any[]>();
          
          market.outcomes?.forEach((outcome: any) => {
            const playerName = outcome.description || 'Unknown Player';
            if (!playerOutcomes.has(playerName)) {
              playerOutcomes.set(playerName, []);
            }
            playerOutcomes.get(playerName)!.push({ ...outcome, bookName, bookKey, marketKey: market.key });
          });
          
          // Create picks for each player
          playerOutcomes.forEach((outcomes, playerName) => {
            const overOutcome = outcomes.find(o => o.name === 'Over');
            const underOutcome = outcomes.find(o => o.name === 'Under');
            
            if (overOutcome) {
              const pickKey = `${playerName}-${market.key}-${overOutcome.point}`;
              
              if (!playerPropsMap.has(pickKey)) {
                playerPropsMap.set(pickKey, {
                  playerName,
                  marketKey: market.key,
                  point: overOutcome.point,
                  books: [],
                  filteredBooks: [] // Books matching the filter for main card display
                });
              }
              
              const propData = playerPropsMap.get(pickKey)!;
              // Use actual odds from API
              const bookData = {
                name: bookName,
                key: bookKey,
                overOdds: normalizeAmericanOdds(overOutcome.price),
                underOdds: underOutcome ? normalizeAmericanOdds(underOutcome.price) : null
              };
              
              // Add to ALL books (for mini table)
              propData.books.push(bookData);
              
              // Also add to filtered books if it matches the filter (for main card)
              if (isBookIncluded(bookKey, bookName)) {
                propData.filteredBooks.push(bookData);
              }
            }
          });
        });
      });
      
      // Convert player props map to picks
      playerPropsMap.forEach((propData, pickKey) => {
        if (propData.books.length === 0) return;
        
        // Skip this pick if no filtered books match (user has a filter but none match)
        const hasFilteredBooks = propData.filteredBooks.length > 0;
        const booksForMainCard = hasFilteredBooks ? propData.filteredBooks : propData.books;
        
        // Find best odds from FILTERED books (for main card display)
        const bestBookForCard = booksForMainCard.reduce((best: any, book: any) => {
          const bestOddsNum = parseInt(best.overOdds, 10);
          const bookOddsNum = parseInt(book.overOdds, 10);
          return bookOddsNum > bestOddsNum ? book : best;
        }, booksForMainCard[0]);
        
        // Calculate EV using ALL books (for accurate EV calculation)
        const numericOdds = propData.books.map((b: any) => parseInt(b.overOdds, 10)).filter((o: number) => !isNaN(o));
        let ev = '0%';
        if (numericOdds.length > 0) {
          const toProb = (american: number) => american > 0 ? 100 / (american + 100) : -american / (-american + 100);
          const probs = numericOdds.map(toProb);
          const avgProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
          const bestOddsNum = parseInt(bestBookForCard.overOdds, 10);
          if (!isNaN(bestOddsNum)) {
            const bestProb = toProb(bestOddsNum);
            const edge = ((avgProb - bestProb) / bestProb) * 100;
            ev = `${(Math.round(edge * 100) / 100).toFixed(2)}%`;
          }
        }
        
        const marketName = formatMarketName(propData.marketKey);
        const pickDescription = `${propData.playerName} Over ${propData.point} ${marketName}`;
        
        allPicks.push({
          id: `${game.id}-${pickKey}`,
          ev,
          sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
          game: gameMatchup,
          team1,
          team2,
          pick: pickDescription,
          bestOdds: bestBookForCard.overOdds,
          bestBook: bestBookForCard.name,
          // Mini table shows ALL books with actual odds
          books: propData.books.map((b: any) => ({
            name: b.name,
            odds: b.overOdds,
            team2Odds: b.underOdds || b.overOdds,
            ev: '0%',
            isBest: b.name === bestBookForCard.name
          })),
          isPlayerProp: true,
          playerName: propData.playerName,
          marketKey: propData.marketKey,
          line: propData.point,
          gameTime: game.commence_time || undefined,
          commenceTime: game.commence_time || undefined
        });
      });
    } else {
      // GAME ODDS MODE: Original logic for h2h/spreads/totals
      let ev = '0%';
      const booksArray: any[] = []; // ALL books for mini table
      const filteredBooksArray: any[] = []; // Filtered books for main card
      
      // Find odds from all bookmakers - try h2h first, then spreads, then any market
      bookmakers.forEach((bm: any, bmIdx: number) => {
        let marketToUse = null;
        const bookKey = bm.key || '';
        const bookName = normalizeBookName(bm.title || bm.key);
        
        // Debug first bookmaker - log entire structure
        if (gameIdx === 0 && bmIdx === 0) {
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
          if (gameIdx === 0 && bmIdx === 0) {
            console.log(`🔎 Available markets for ${bookName}:`, bm.markets.map((m: any) => m.key));
          }
          
          marketToUse = bm.markets.find((m: any) => m.key === 'h2h');
          if (gameIdx === 0 && bmIdx === 0 && marketToUse) {
            console.log(`✅ Found h2h market`);
          }
          
          // If no h2h, try spreads
          if (!marketToUse) {
            marketToUse = bm.markets.find((m: any) => m.key === 'spreads');
            if (gameIdx === 0 && bmIdx === 0 && marketToUse) {
              console.log(`✅ Found spreads market (h2h not available)`);
            }
          }
          
          // If no spreads, try totals (last resort)
          if (!marketToUse) {
            marketToUse = bm.markets.find((m: any) => m.key === 'totals');
            if (gameIdx === 0 && bmIdx === 0 && marketToUse) {
              console.log(`✅ Found totals market (h2h and spreads not available)`);
            }
          }
          
          // If still nothing, use first available market (but not player props)
          if (!marketToUse && bm.markets.length > 0) {
            marketToUse = bm.markets.find((m: any) => !isPlayerPropMarket(m.key)) || bm.markets[0];
            if (gameIdx === 0 && bmIdx === 0) {
              console.log(`✅ Using first available market: ${marketToUse.key}`);
            }
          }
        }
      
        if (marketToUse && marketToUse.outcomes && marketToUse.outcomes.length > 0) {
          // Get the first outcome (usually the away team for h2h, or the first side for spreads/totals)
          const outcome0 = marketToUse.outcomes[0];
          const outcome1 = marketToUse.outcomes[1];
          
          if (gameIdx === 0 && bmIdx === 0) {
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
          
          if (gameIdx === 0 && bmIdx === 0) {
            console.log(`🔍 Extracted odds: ${odds}, team2Odds: ${team2Odds}`);
          }
          
          if (odds !== undefined && odds !== null) {
            const bookData = {
              name: bookName,
              key: bookKey,
              odds: normalizeAmericanOdds(odds),
              team2Odds: normalizeAmericanOdds(team2Odds),
              ev: '0%',
              isBest: false
            };
            
            // Add to ALL books (for mini table)
            booksArray.push(bookData);
            
            // Also add to filtered books if it matches the filter (for main card)
            if (isBookIncluded(bookKey, bookName)) {
              filteredBooksArray.push({ ...bookData });
            }
            
            if (gameIdx === 0 && bmIdx === 0) {
              console.log(`✅ Found odds for ${bookName}: ${odds} (market: ${marketToUse.key})`);
            }
          } else {
            if (gameIdx === 0 && bmIdx === 0) {
              console.log(`⚠️ Market found but no odds for ${bookName}, odds value: ${odds}`);
            }
          }
        } else {
          // No markets found for this bookmaker - skip adding mock odds
          if (gameIdx === 0 && bmIdx === 0) {
            console.log(`⚠️ No market data for ${bookName}, skipping bookmaker (no fallback odds)`);
          }
        }
      });

      // Determine best book from FILTERED books (for main card display)
      const hasFilteredBooks = filteredBooksArray.length > 0;
      const booksForMainCard = hasFilteredBooks ? filteredBooksArray : booksArray;
      
      let bestOdds = '-110';
      let bestBook = 'N/A';
      
      if (booksForMainCard.length > 0) {
        const bestBookData = booksForMainCard.reduce((best: any, book: any) => {
          const bestOddsNum = parseInt(best.odds, 10);
          const bookOddsNum = parseInt(book.odds, 10);
          return bookOddsNum > bestOddsNum ? book : best;
        }, booksForMainCard[0]);
        
        bestOdds = bestBookData.odds;
        bestBook = bestBookData.name;
      }

      // After collecting all bookmaker odds, compute a simple EV% based on
      // the best price vs the average price across ALL books for this side.
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
            // Mark the best book
            b.isBest = b.name === bestBook;
          });
        }
      }

      if (gameIdx === 0) {
        console.log(`📊 Game: ${team1} @ ${team2}, Books found: ${booksArray.length}, Filtered: ${filteredBooksArray.length}, Best odds: ${bestOdds}, EV: ${ev}`);
      }

      allPicks.push({
        id: game.id || gameIdx + 1,
        ev: ev,
        // Use getSportLabel to convert sport_key to readable league name (NFL, NBA, etc.)
        sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
        game: gameMatchup,
        team1,
        team2,
        pick: `${team1} ML`,
        bestOdds,
        bestBook,
        avgOdds: bestOdds,
        isHot: false,
        // Mini table shows ALL books
        books: booksArray,
        gameTime: game.commence_time || game.gameTime || undefined,
        commenceTime: game.commence_time || game.gameTime || undefined
      });
    }
  });
  
  return allPicks;
}

// Export getSportLabel for use in components
export { getSportLabel };

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
      
      // Map market types to API format and backend expects 'markets' not 'marketType'
      const marketKeyMap: { [key: string]: string } = {
        'moneyline': 'h2h',
        'spread': 'spreads',
        'totals': 'totals',
      };
      const marketsList = marketType && marketType !== 'all'
        ? (marketKeyMap[marketType] || marketType)
        : 'h2h,spreads,totals';
      // Only append markets if not 'all' - let backend use default
      if (marketType && marketType !== 'all') {
        params.append('markets', marketsList);
      }
      console.log('📊 Filters applied - Sport:', sport, '-> API:', sportsList, 'Market:', marketType, '-> API:', marketsList);
      
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

      if (betType === 'props') {
        console.log('🏈🏈🏈 PLAYER PROPS HOOK - FETCHING 🏈🏈🏈');
        console.log('🏈 betType:', betType);
        console.log('🏈 sport:', sport);
        console.log('🏈 Fetching from:', endpoint);
      }
      
      console.log('📊 Fetching odds data from:', endpoint);
      console.log('📊 Full filter params:', Object.fromEntries(params));
      console.log('📊 Sport filter details:', {
        selectedSport: sport,
        mappedToAPI: sportsList,
        marketFilter: marketsList,
        betType: betType,
        isNCAAFootball: sport === 'ncaa-football'
      });

      const response = await apiClient.get(endpoint);
      
      console.log('📦 API Response:', response.data);
      console.log('📦 Response type:', typeof response.data);
      console.log('📦 Is array?:', Array.isArray(response.data));
      if (response.data && typeof response.data === 'object') {
        console.log('📦 Response keys:', Object.keys(response.data));
      }

      if (response.data && Array.isArray(response.data)) {
        const transformedPicks = transformOddsApiToOddsPick(response.data, sportsbooks);
        setPicks(transformedPicks);
        console.log('✅ Odds data fetched and transformed successfully:', transformedPicks.length, 'picks');
        console.log('📊 Filtered results - Sport:', sport, 'Market:', marketType, 'BetType:', betType, 'Sportsbooks:', sportsbooks, 'Results:', transformedPicks.length);
        if (betType === 'props') {
          console.log('🏈 Player props response received:', transformedPicks.length, 'player prop picks');
        }
        if (transformedPicks.length === 0 && sport !== 'all') {
          console.warn('⚠️ No results found for sport:', sport, 'This could mean no upcoming games or API returned empty');
        }
      } else if (response.data && response.data.picks && Array.isArray(response.data.picks)) {
        const transformedPicks = transformOddsApiToOddsPick(response.data.picks, sportsbooks);
        setPicks(transformedPicks);
        console.log('✅ Odds data fetched and transformed successfully:', transformedPicks.length, 'picks');
        console.log('📊 Filtered results - Sport:', sport, 'Market:', marketType, 'BetType:', betType, 'Sportsbooks:', sportsbooks, 'Results:', transformedPicks.length);
        if (betType === 'props') {
          console.log('🏈 Player props response received:', transformedPicks.length, 'player prop picks');
        }
        if (transformedPicks.length === 0 && sport !== 'all') {
          console.warn('⚠️ No results found for sport:', sport, 'This could mean no upcoming games or API returned empty');
        }
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        if (betType === 'props') {
          console.error('🏈 Player props error - unexpected response format');
        }
        setError('Invalid response format from API');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch odds data';
      console.error('❌ Error fetching odds data:', errorMessage);
      if (betType === 'props') {
        console.error('🏈 Player props error:');
        console.error('🏈 Status:', err.response?.status);
        console.error('🏈 Message:', errorMessage);
        console.error('🏈 Full error:', err);
      }
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
