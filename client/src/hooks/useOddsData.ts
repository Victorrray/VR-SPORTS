import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';
import { useAuth } from './SimpleAuth';

// Disable verbose logging in production for performance
const DEBUG_LOGGING = process.env.NODE_ENV === 'development';

export interface OddsBook {
  name: string;
  odds: string;
  team2Odds: string;
  ev: string;
  isBest: boolean;
  line?: number | null;
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
  allBooks?: OddsBook[];  // For compatibility with mini table
  gameTime?: string;  // ISO 8601 format (e.g., "2025-11-18T19:00:00Z")
  commenceTime?: string;  // Alias for gameTime
  // For bet grading
  eventId?: string;  // TheOddsAPI event ID for fetching scores
  sportKey?: string;  // Sport key for API calls (e.g., "americanfootball_nfl")
  // Market data fields
  bookCount?: number;  // Number of books with odds for this market
  hasEnoughData?: boolean;  // Whether there's enough data for EV calculation (min 4 books)
  // Player props specific fields
  isPlayerProp?: boolean;
  playerName?: string;
  marketKey?: string;
  line?: number | null;
  allLines?: number[];  // All unique lines offered by different books
  hasMultipleLines?: boolean;  // Whether different books offer different lines
  pickSide?: 'Over' | 'Under';  // Which side (Over/Under) was chosen for player props
  // Alternate market fields
  isAlternate?: boolean;  // Flag for alternate spreads/totals markets
}

export interface UseOddsDataOptions {
  sport?: string;
  date?: string;
  marketType?: string;
  betType?: string;
  sportsbooks?: string[];
  limit?: number;
  enabled?: boolean;
  minDataPoints?: number;
  autoRefresh?: boolean;  // Enable auto-refresh (default: true)
  refreshInterval?: number;  // Refresh interval in ms (default: 45000 = 45 seconds)
}

export interface UseOddsDataResult {
  picks: OddsPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;  // Timestamp of last successful fetch
  isRefreshing: boolean;  // True when auto-refreshing (not initial load)
}

// Book weighting for EV calculations
// Sharp books and exchanges get higher weights because their lines are more accurate
const BOOK_WEIGHTS: { [key: string]: number } = {
  // Exchanges (highest weight - no vig, true market prices)
  'kalshi': 3.0,
  'novig': 3.0,
  'prophetx': 3.0,
  'prophet': 3.0,
  'betfair': 3.0,
  'betfair_ex_us': 3.0,
  'matchbook': 3.0,
  
  // Sharp books (high weight - accurate lines, low margins)
  'pinnacle': 3.0,
  'circa': 3.0,
  'bookmaker': 2.5,
  'bookmaker_us': 2.5,
  'bovada': 2.0,
  'betonline': 2.0,
  'betonlineag': 2.0,
  
  // Major US sportsbooks (moderate weight)
  'fanduel': 1.5,
  'draftkings': 1.5,
  'caesars': 1.5,
  'betmgm': 1.5,
  'bet365': 1.5,
  'williamhill': 1.5,
  'williamhill_us': 1.5,
  'betrivers': 1.2,
  'unibet': 1.2,
  'unibet_us': 1.2,
  
  // Default weight for all other books
  'default': 1.0
};

// Get weight for a book by key or name
function getBookWeight(bookKey: string): number {
  const key = (bookKey || '').toLowerCase().replace(/\s+/g, '');
  
  // Check for exact match first
  if (BOOK_WEIGHTS[key]) return BOOK_WEIGHTS[key];
  
  // Check for partial matches
  for (const [weightKey, weight] of Object.entries(BOOK_WEIGHTS)) {
    if (key.includes(weightKey) || weightKey.includes(key)) {
      return weight;
    }
  }
  
  return BOOK_WEIGHTS['default'];
}

// Calculate weighted average probability from odds array
function calculateWeightedAvgProb(
  oddsArray: number[], 
  bookKeys: string[],
  toProb: (american: number) => number
): number {
  if (oddsArray.length === 0) return 0.5;
  
  let totalWeightedProb = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < oddsArray.length; i++) {
    const odds = oddsArray[i];
    const bookKey = bookKeys[i] || '';
    const weight = getBookWeight(bookKey);
    const prob = toProb(odds);
    
    totalWeightedProb += prob * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalWeightedProb / totalWeight : 0.5;
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
  // Check for soccer leagues - return "Soccer" for any soccer_ key
  if (sportKey?.toLowerCase().startsWith('soccer_')) {
    return 'Soccer';
  }
  return sportLabelMap[sportKey] || sportKey;
}

// Transform TheOddsAPI format to OddsPick format
// Normalize American odds so positive numbers always have a leading '+'
// American odds must be at least +100 or -100 (values between -99 and +99 are invalid)
function normalizeAmericanOdds(raw: any): string | null {
  const n = parseInt(String(raw), 10);
  if (isNaN(n)) return null;
  // Invalid odds: values between -99 and +99 (exclusive of 0)
  if (n > -100 && n < 100 && n !== 0) return null;
  return n > 0 ? `+${n}` : String(n);
}

// Check if odds value is valid (at least ±100)
function isValidOdds(odds: string | number | null | undefined): boolean {
  if (odds === null || odds === undefined) return false;
  const n = parseInt(String(odds).replace('+', ''), 10);
  if (isNaN(n)) return false;
  return n <= -100 || n >= 100;
}

// Check if a market key is a player prop
function isPlayerPropMarket(marketKey: string): boolean {
  return marketKey?.startsWith('player_') || marketKey?.startsWith('batter_') || marketKey?.startsWith('pitcher_');
}

// Format market key to readable name (e.g., "player_assists" -> "Assists")
function formatMarketName(marketKey: string): string {
  if (!marketKey) return '';
  
  // Handle combo markets with explicit mappings
  const marketNameMap: { [key: string]: string } = {
    'player_rebounds_assists': 'Rebounds + Assists',
    'player_points_rebounds': 'Points + Rebounds',
    'player_points_assists': 'Points + Assists',
    'player_points_rebounds_assists': 'Points + Rebounds + Assists',
    'player_pass_rush_yds': 'Pass + Rush Yards',
    'player_rush_reception_yds': 'Rush + Receiving Yards',
    'player_pass_rush_reception_yds': 'Pass + Rush + Receiving Yards',
    'player_pass_rush_reception_tds': 'Pass + Rush + Receiving TDs',
    'player_rush_reception_tds': 'Rush + Receiving TDs',
    'player_blocks_steals': 'Blocks + Steals',
  };
  
  if (marketNameMap[marketKey]) {
    return marketNameMap[marketKey];
  }
  
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
    'LowVig.ag': 'LowVig',
    'lowvig': 'LowVig',
    'BetOnline.ag': 'BetOnline',
    'betonlineag': 'BetOnline',
    'Betr DFS': 'Betr',
    'betrdfs': 'Betr',
    'betr_us_dfs': 'Betr',
    'DraftKings Pick6': 'Pick 6',
    'draftkings_pick6': 'Pick 6',
    'pick6': 'Pick 6',
    'Hard Rock Bet': 'Hard Rock',
    'hardrockbet': 'Hard Rock',
    'theScore Bet': 'TheScore',
    'thescorebet': 'TheScore',
  };
  return nameMap[bookName] || bookName;
}

function transformOddsApiToOddsPick(games: any[], selectedSportsbooks: string[] = []): OddsPick[] {
  if (!Array.isArray(games)) return [];
  
  // DFS apps list - these have faster-changing lines and need stricter stale thresholds
  // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds
  const DFS_BOOK_KEYS = [
    'dabble', 'dabble_au', 'prizepicks', 'underdog', 'sleeper',
    'chalkboard', 'parlay', 'pick6', 'betr_us_dfs'
  ];
  
  // Books to exclude from alternate markets (their alternate lines are often stale/unavailable)
  const EXCLUDE_FROM_ALTERNATES = ['dabble', 'dabble_au'];
  
  // Stale thresholds - DFS apps change lines much faster (reduced for fresher data)
  const STALE_THRESHOLD_DFS_MS = 3 * 60 * 1000;  // 3 minutes for DFS apps (was 5)
  const STALE_THRESHOLD_STANDARD_MS = 15 * 60 * 1000;  // 15 minutes for standard books (was 30)
  
  // Helper to check if a book is a DFS app
  const isDFSBook = (bookKey: string): boolean => {
    const normalizedKey = bookKey?.toLowerCase() || '';
    return DFS_BOOK_KEYS.some(dfs => normalizedKey.includes(dfs));
  };
  
  // Helper to check if a book should be excluded from alternate markets
  const shouldExcludeFromAlternates = (bookKey: string): boolean => {
    const normalizedKey = bookKey?.toLowerCase() || '';
    return EXCLUDE_FROM_ALTERNATES.some(excluded => normalizedKey.includes(excluded));
  };
  
  // Helper to get appropriate stale threshold for a book
  const getStaleThreshold = (bookKey: string): number => {
    return isDFSBook(bookKey) ? STALE_THRESHOLD_DFS_MS : STALE_THRESHOLD_STANDARD_MS;
  };
  
  // Helper to check if a book should be included based on filter
  const isBookIncluded = (bookKey: string, bookName: string): boolean => {
    if (selectedSportsbooks.length === 0) return true; // No filter = include all
    const normalizedKey = bookKey?.toLowerCase();
    const normalizedName = bookName?.toLowerCase();
    
    // Map of filter names to API bookmaker keys
    const filterToApiKeyMap: { [key: string]: string[] } = {
      'betr': ['betr_us_dfs', 'betr'],
      'pick6': ['pick6', 'draftkings_pick6'],
      'draftkings_pick6': ['pick6', 'draftkings_pick6'],
      'betr_us_dfs': ['betr_us_dfs', 'betr'],
      'prizepicks': ['prizepicks'],
      'underdog': ['underdog'],
      'dabble': ['dabble', 'dabble_au'],
      'dabble_au': ['dabble', 'dabble_au']
    };
    
    const result = selectedSportsbooks.some(sb => {
      const normalizedSb = sb.toLowerCase();
      
      // Exact key match
      if (normalizedKey === normalizedSb) return true;
      
      // Exact name match
      if (normalizedName === normalizedSb) return true;
      
      // Check if this filter has mapped API keys
      const mappedKeys = filterToApiKeyMap[normalizedSb];
      if (mappedKeys && mappedKeys.includes(normalizedKey)) return true;
      
      // Key includes filter (e.g., 'betr_us_dfs' includes 'betr')
      if (normalizedKey?.includes(normalizedSb)) return true;
      
      // Name includes filter
      if (normalizedName?.includes(normalizedSb)) return true;
      
      // Filter includes key (reverse match for DFS apps)
      if (normalizedSb?.includes(normalizedKey)) return true;
      
      return false;
    });
    
    return result;
  };
  
  // Log first game structure to debug (only in dev)
  if (DEBUG_LOGGING && games.length > 0) {
    console.log('📋 First game structure:', games[0]);
    console.log('📋 First game keys:', Object.keys(games[0]));
  }
  
  const allPicks: OddsPick[] = [];
  
  games.forEach((game, gameIdx) => {
    const team1 = game.away_team || 'Team A';
    const team2 = game.home_team || 'Team B';
    const bookmakers = game.bookmakers || [];
    const gameMatchup = `${team1} @ ${team2}`;
    
    // Log first game's bookmakers (only in dev)
    if (DEBUG_LOGGING && gameIdx === 0) {
      console.log(`📋 First game bookmakers:`, bookmakers);
      console.log(`📋 First game bookmakers length:`, bookmakers.length);
      const bookKeys = bookmakers.map((b: any) => b.key);
      console.log(`📋 Bookmaker keys in response:`, bookKeys);
      // Check for DFS apps specifically
      const dfsApps = ['prizepicks', 'underdog', 'pick6', 'betr_us_dfs', 'dabble_au', 'sleeper'];
      const foundDFS = bookKeys.filter((key: string) => dfsApps.includes(key?.toLowerCase()));
      console.log(`🎮 DFS Apps in response:`, foundDFS.length > 0 ? foundDFS : 'NONE - API not returning DFS apps');
    }
    
    // Check if this game has player prop markets
    const hasPlayerProps = bookmakers.some((bm: any) => 
      bm.markets?.some((m: any) => isPlayerPropMarket(m.key))
    );
    
    if (hasPlayerProps) {
      // PLAYER PROPS MODE: Create one pick per player per market (combining all lines)
      const playerPropsMap = new Map<string, any>(); // key: "playerName-marketKey" (no line in key)
      
      const now = Date.now();
      
      // Collect ALL books for the mini table (no filtering here)
      bookmakers.forEach((bm: any) => {
        const bookKey = bm.key || '';
        const bookName = normalizeBookName(bm.title || bm.key);
        
        // Check if bookmaker data is stale (DFS apps have stricter 5-min threshold)
        const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
        const staleThreshold = getStaleThreshold(bookKey);
        const isStale = (now - lastUpdate) > staleThreshold;
        if (isStale) return; // Skip stale bookmakers
        
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
              // Group by player + market only (NOT by line) to combine all books
              const pickKey = `${playerName}-${market.key}`;
              
              if (!playerPropsMap.has(pickKey)) {
                playerPropsMap.set(pickKey, {
                  playerName,
                  marketKey: market.key,
                  point: overOutcome.point, // Will be updated to best/most common line
                  allLines: new Set<number>(), // Track all unique lines
                  books: [],
                  filteredBooks: [] // Books matching the filter for main card display
                });
              }
              
              const propData = playerPropsMap.get(pickKey)!;
              propData.allLines.add(overOutcome.point);
              
              // DFS apps always have -119 odds, traditional sportsbooks use actual odds
              // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds
              // Note: BetRivers is NOT a DFS app - it's a traditional sportsbook
              const dfsApps = ['prizepicks', 'underdog', 'pick6', 'betr_us_dfs', 'dabble_au', 'sleeper', 'dabble'];
              const isDFS = dfsApps.includes(bookKey?.toLowerCase());
              const overOdds = isDFS ? '-119' : normalizeAmericanOdds(overOutcome.price);
              
              // CRITICAL: Create synthetic Under with -119 odds when Under is missing
              // This allows EV calculation for both sides even when API only returns Over
              let underOdds: string | null;
              if (underOutcome) {
                underOdds = isDFS ? '-119' : normalizeAmericanOdds(underOutcome.price);
              } else if (isDFS) {
                // Create synthetic Under for DFS apps that only return Over
                underOdds = '-119';
              } else {
                // For traditional sportsbooks without Under, set to null
                underOdds = null;
              }
              
              // Only add books with valid odds
              if (overOdds) {
                const bookData = {
                  name: bookName,
                  key: bookKey,
                  line: overOutcome.point, // Include the line for this specific book
                  overOdds,
                  underOdds
                };
                
                // Add to ALL books (for mini table)
                propData.books.push(bookData);
                
                // Also add to filtered books if it matches the filter (for main card)
                if (isBookIncluded(bookKey, bookName)) {
                  propData.filteredBooks.push(bookData);
                }
              }
            }
          });
        });
      });
      
      
      // Convert player props map to picks
      let skippedNoBooks = 0;
      let skippedNoFilteredBooks = 0;
      let skippedNoConsensusBooks = 0;
      let skippedNoValidOdds = 0;
      let skippedNoFilteredBestOdds = 0;
      let skippedForcedSide = 0;
      let successfulPicks = 0;
      
      playerPropsMap.forEach((propData, pickKey) => {
        if (propData.books.length === 0) {
          skippedNoBooks++;
          return;
        }
        
        // DFS apps that offer pick'em style betting (not traditional odds)
        // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds
        const dfsAppKeys = ['prizepicks', 'underdog', 'pick6', 'betr_us_dfs', 'dabble_au', 'sleeper', 'dabble'];
        
        // Separate traditional sportsbooks from DFS apps
        const traditionalBooks = propData.books.filter((b: any) => !dfsAppKeys.includes(b.key?.toLowerCase()));
        const dfsBooks = propData.books.filter((b: any) => dfsAppKeys.includes(b.key?.toLowerCase()));
        
        // Find the CONSENSUS LINE from traditional sportsbooks (most common line)
        // This is the "main" line that we should compare against
        let consensusLine = propData.point;
        if (traditionalBooks.length > 0) {
          const lineCount = new Map<number, number>();
          traditionalBooks.forEach((b: any) => {
            const line = b.line;
            lineCount.set(line, (lineCount.get(line) || 0) + 1);
          });
          // Find the most common line
          let maxCount = 0;
          lineCount.forEach((count, line) => {
            if (count > maxCount) {
              maxCount = count;
              consensusLine = line;
            }
          });
        }
        
        // Filter books to only show those at the consensus line (or close to it)
        // DFS apps: only include if their line matches the consensus line
        const booksAtConsensusLine = propData.books.filter((b: any) => {
          const isDFS = dfsAppKeys.includes(b.key?.toLowerCase());
          if (isDFS) {
            // For DFS apps, only show if their line matches the consensus
            return b.line === consensusLine;
          }
          // For traditional books, show all (they'll be labeled with their line)
          return true;
        });
        
        // Skip this pick if user has a sportsbook filter and the filtered book doesn't have this prop
        const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
        const hasFilteredBooks = propData.filteredBooks.length > 0;
        const hasAllBooks = propData.books.length > 0;
        
        // CRITICAL: If user filtered for specific sportsbooks but none of them have this prop, skip it
        if (userHasFilter && !hasFilteredBooks) {
          skippedNoFilteredBooks++;
          return; // Don't show picks where the filtered sportsbook doesn't offer the line
        }
        
        // If no filter is active but we have no books at all, skip this prop
        if (!userHasFilter && !hasAllBooks) {
          skippedNoBooks++;
          return;
        }
        
        const filteredBooksAtConsensus = hasFilteredBooks 
          ? propData.filteredBooks.filter((b: any) => {
              const isDFS = dfsAppKeys.includes(b.key?.toLowerCase());
              return !isDFS || b.line === consensusLine;
            })
          : booksAtConsensusLine;
        
        // If user has a filter, only use filtered books; don't fall back to all books
        const booksForMainCard = userHasFilter 
          ? filteredBooksAtConsensus 
          : (filteredBooksAtConsensus.length > 0 ? filteredBooksAtConsensus : booksAtConsensusLine);
        
        if (booksForMainCard.length === 0) {
          skippedNoConsensusBooks++;
          return; // Skip if no books at consensus line
        }
        
        // Calculate EV for BOTH Over and Under to determine which side is better
        // When user has a sportsbook filter, require fewer books since they're filtering for specific books
        // When viewing all sports, require more books for confidence
        // CRITICAL: For synthetic Unders (DFS apps), we need to allow EV calculation with fewer books
        const MIN_BOOKS_FOR_EV = userHasFilter ? 1 : 2; // Lowered from 4 to 1 for filtered views
        const booksForEV = booksAtConsensusLine.filter((b: any) => b.line === consensusLine);
        
        const toProb = (american: number) => american > 0 ? 100 / (american + 100) : -american / (-american + 100);
        
        // Get Over odds
        const overOddsArray = booksForEV.map((b: any) => parseInt(b.overOdds, 10)).filter((o: number) => !isNaN(o));
        const hasEnoughOverData = overOddsArray.length >= MIN_BOOKS_FOR_EV;
        
        // Get Under odds (filter out missing '--' values)
        const underOddsArray = booksForEV
          .map((b: any) => b.underOdds)
          .filter((o: any) => o && o !== '--')
          .map((o: any) => parseInt(o, 10))
          .filter((o: number) => !isNaN(o));
        const hasEnoughUnderData = underOddsArray.length >= MIN_BOOKS_FOR_EV;
        
        // Calculate WEIGHTED average implied probability for both sides
        // Get book keys for weighting
        const overBookKeys = booksForEV
          .filter((b: any) => !isNaN(parseInt(b.overOdds, 10)))
          .map((b: any) => b.key || b.name || '');
        const underBookKeys = booksForEV
          .filter((b: any) => b.underOdds && b.underOdds !== '--' && !isNaN(parseInt(b.underOdds, 10)))
          .map((b: any) => b.key || b.name || '');
        
        let overAvgProb = 0.5;
        let underAvgProb = 0.5;
        
        if (hasEnoughOverData) {
          // Use weighted average based on book sharpness
          overAvgProb = calculateWeightedAvgProb(overOddsArray, overBookKeys, toProb);
        }
        
        if (hasEnoughUnderData) {
          // Use weighted average based on book sharpness
          underAvgProb = calculateWeightedAvgProb(underOddsArray, underBookKeys, toProb);
        }
        
        // Find best odds for each side across ALL books at consensus line
        const allBooksWithValidOverOdds = booksAtConsensusLine.filter((b: any) => {
          const odds = parseInt(b.overOdds, 10);
          return !isNaN(odds) && b.overOdds && b.overOdds !== '--';
        });
        
        if (allBooksWithValidOverOdds.length === 0) {
          skippedNoValidOdds++;
          return; // Skip if no valid odds
        }
        
        // Find the OVERALL best Over book (across all books)
        const overallBestOverBook = allBooksWithValidOverOdds.reduce((best: any, book: any) => {
          const bestOddsNum = parseInt(best.overOdds, 10);
          const bookOddsNum = parseInt(book.overOdds, 10);
          return bookOddsNum > bestOddsNum ? book : best;
        }, allBooksWithValidOverOdds[0]);
        
        const allBooksWithUnder = booksAtConsensusLine.filter((b: any) => {
          const odds = parseInt(b.underOdds, 10);
          return !isNaN(odds) && b.underOdds && b.underOdds !== '--';
        });
        const overallBestUnderBook = allBooksWithUnder.length > 0 
          ? allBooksWithUnder.reduce((best: any, book: any) => {
              const bestOddsNum = parseInt(best.underOdds, 10);
              const bookOddsNum = parseInt(book.underOdds, 10);
              return bookOddsNum > bestOddsNum ? book : best;
            }, allBooksWithUnder[0])
          : null;
        
        // Now find best odds from FILTERED books (if filter is applied)
        const filteredBooksWithValidOverOdds = booksForMainCard.filter((b: any) => {
          const odds = parseInt(b.overOdds, 10);
          return !isNaN(odds) && b.overOdds && b.overOdds !== '--';
        });
        
        const filteredBooksWithUnder = booksForMainCard.filter((b: any) => {
          const odds = parseInt(b.underOdds, 10);
          return !isNaN(odds) && b.underOdds && b.underOdds !== '--';
        });
        
        // If user has a filter, check if filtered book has the best odds
        if (userHasFilter) {
          // Find best Over from filtered books
          const bestFilteredOver = filteredBooksWithValidOverOdds.length > 0
            ? filteredBooksWithValidOverOdds.reduce((best: any, book: any) => {
                const bestOddsNum = parseInt(best.overOdds, 10);
                const bookOddsNum = parseInt(book.overOdds, 10);
                return bookOddsNum > bestOddsNum ? book : best;
              }, filteredBooksWithValidOverOdds[0])
            : null;
          
          // Find best Under from filtered books
          const bestFilteredUnder = filteredBooksWithUnder.length > 0
            ? filteredBooksWithUnder.reduce((best: any, book: any) => {
                const bestOddsNum = parseInt(best.underOdds, 10);
                const bookOddsNum = parseInt(book.underOdds, 10);
                return bookOddsNum > bestOddsNum ? book : best;
              }, filteredBooksWithUnder[0])
            : null;
          
          // Check if filtered book has the best odds for EITHER side
          const overallBestOverOdds = parseInt(overallBestOverBook.overOdds, 10);
          const overallBestUnderOdds = overallBestUnderBook ? parseInt(overallBestUnderBook.underOdds, 10) : -9999;
          
          const filteredBestOverOdds = bestFilteredOver ? parseInt(bestFilteredOver.overOdds, 10) : -9999;
          const filteredBestUnderOdds = bestFilteredUnder ? parseInt(bestFilteredUnder.underOdds, 10) : -9999;
          
          const hasOverBestOdds = filteredBestOverOdds >= overallBestOverOdds;
          const hasUnderBestOdds = filteredBestUnderOdds >= overallBestUnderOdds;
          
          // Skip if filtered book doesn't have the best odds for either side
          if (!hasOverBestOdds && !hasUnderBestOdds) {
            skippedNoFilteredBestOdds++;
            return; // Skip - another book has better odds
          }
          
          // If filtered book only has best odds for one side, we must use that side
          // This will be checked again after EV calculation
          if (hasOverBestOdds && !hasUnderBestOdds) {
            // Force Over - filtered book only has best Over odds
            (propData as any).forceSide = 'Over';
          } else if (hasUnderBestOdds && !hasOverBestOdds) {
            // Force Under - filtered book only has best Under odds
            (propData as any).forceSide = 'Under';
          }
        }
        
        // Use filtered books if filter is applied, otherwise use all books
        const bestOverBook = filteredBooksWithValidOverOdds.length > 0
          ? filteredBooksWithValidOverOdds.reduce((best: any, book: any) => {
              const bestOddsNum = parseInt(best.overOdds, 10);
              const bookOddsNum = parseInt(book.overOdds, 10);
              return bookOddsNum > bestOddsNum ? book : best;
            }, filteredBooksWithValidOverOdds[0])
          : overallBestOverBook;
        
        const bestUnderBook = filteredBooksWithUnder.length > 0
          ? filteredBooksWithUnder.reduce((best: any, book: any) => {
              const bestOddsNum = parseInt(best.underOdds, 10);
              const bookOddsNum = parseInt(book.underOdds, 10);
              return bookOddsNum > bestOddsNum ? book : best;
            }, filteredBooksWithUnder[0])
          : overallBestUnderBook;
        
        // Calculate EV for both sides
        let overEV = 0;
        let underEV = 0;
        
        if (hasEnoughOverData) {
          const bestOverOdds = parseInt(bestOverBook.overOdds, 10);
          if (!isNaN(bestOverOdds)) {
            const bestOverProb = toProb(bestOverOdds);
            overEV = ((overAvgProb - bestOverProb) / bestOverProb) * 100;
          }
        }
        
        if (hasEnoughUnderData && bestUnderBook) {
          const bestUnderOdds = parseInt(bestUnderBook.underOdds, 10);
          if (!isNaN(bestUnderOdds)) {
            const bestUnderProb = toProb(bestUnderOdds);
            underEV = ((underAvgProb - bestUnderProb) / bestUnderProb) * 100;
          }
        }
        
        // Debug logging for EV comparison
        if (DEBUG_LOGGING) {
          console.log(`📊 EV COMPARISON for ${propData.playerName} ${formatMarketName(propData.marketKey)}:`, {
            overEV: overEV.toFixed(2) + '%',
            underEV: underEV.toFixed(2) + '%',
            hasEnoughOverData,
            hasEnoughUnderData,
            overAvgProb: overAvgProb.toFixed(3),
            underAvgProb: underAvgProb.toFixed(3),
            bestOverOdds: bestOverBook?.overOdds,
            bestUnderOdds: bestUnderBook?.underOdds,
            bestOverBook: bestOverBook?.name,
            bestUnderBook: bestUnderBook?.name
          });
        }
        
        // Determine which side is better (higher EV)
        // DFS apps only offer Over bets, so if the best book is a DFS app, force Over
        const bestOverBookIsDFS = dfsAppKeys.includes(bestOverBook?.key?.toLowerCase());
        const bestUnderBookIsDFS = bestUnderBook ? dfsAppKeys.includes(bestUnderBook?.key?.toLowerCase()) : false;
        
        // Check if we have a forced side from the filter logic
        const forcedSide = (propData as any).forceSide;
        
        // Determine which side has better EV (strictly greater than, not equal)
        // This allows Unders to show when they have better EV than Overs
        let isOverBetter = overEV > underEV;
        
        // If both sides have insufficient data, default to Over
        if (!hasEnoughOverData && !hasEnoughUnderData) {
          isOverBetter = true;
        }
        // If only Over has enough data, use Over
        else if (hasEnoughOverData && !hasEnoughUnderData) {
          isOverBetter = true;
        }
        // If only Under has enough data, use Under
        else if (!hasEnoughOverData && hasEnoughUnderData) {
          isOverBetter = false;
        }
        // If both have data, use the one with better EV (already determined above)
        
        // DFS apps now support Unders with -119 odds, so don't force Over anymore
        // Allow Unders to show when they have better EV, even from DFS apps
        // Removed forced Over logic since DFS apps return both Over and Under outcomes
        
        // If user has a filter and the filtered book only has best odds for one side,
        // we MUST use that side. If EV says otherwise, skip this pick.
        if (forcedSide) {
          const evWantsSide = isOverBetter ? 'Over' : 'Under';
          if (evWantsSide !== forcedSide) {
            // EV calculation wants a different side than what the filtered book has best odds for
            // Skip this pick - the filtered book doesn't have the best odds for the better EV side
            skippedForcedSide++;
            return;
          }
        }
        
        const pickSide = isOverBetter ? 'Over' : 'Under';
        const bestBookForCard = isOverBetter ? bestOverBook : bestUnderBook || bestOverBook;
        const bestEV = isOverBetter ? overEV : underEV;
        const hasEnoughData = isOverBetter ? hasEnoughOverData : hasEnoughUnderData;
        
        let ev = '--';
        if (hasEnoughData && bestEV > 0) {
          // Cap EV at 50% - anything higher is almost certainly bad data or calculation error
          const cappedEV = Math.min(50, Math.abs(bestEV));
          ev = `${Math.round(cappedEV * 100) / 100}%`;
        }
        
        const marketName = formatMarketName(propData.marketKey);
        // Use the CONSENSUS line for the pick description with the better side
        const pickDescription = `${propData.playerName} ${pickSide} ${consensusLine} ${marketName}`;
        
        // Check if there are multiple different lines across all books
        const uniqueLines: number[] = propData.allLines ? Array.from(propData.allLines) : [consensusLine];
        const hasMultipleLines = uniqueLines.length > 1;
        
        // For the books list, ONLY show books at the consensus line
        // Filter out books with different lines to avoid confusion
        const booksAtExactConsensus = booksAtConsensusLine.filter((b: any) => b.line === consensusLine);
        
        // CRITICAL: displayBooks should always show Over in first column, Under in second
        // The header says "Over" / "Under" so we keep consistent column order
        // But we highlight the correct side based on pickSide
        const displayBooks = booksAtExactConsensus.map((b: any) => {
          return {
            name: b.name,
            key: b.key, // CRITICAL: Include the book key for filtering
            rawName: b.name,
            line: b.line,
            odds: b.overOdds,
            team2Odds: b.underOdds || '--',
            overOdds: b.overOdds,
            underOdds: b.underOdds || '--',
            ev: hasEnoughData ? '0%' : '--',
            isBest: b.name === bestBookForCard.name && b.line === bestBookForCard.line,
            isAtConsensus: true,
            pickSide: pickSide // Track which side is the pick
          };
        }).sort((a: any, b: any) => {
          // Best book should always be first
          if (a.isBest && !b.isBest) return -1;
          if (!a.isBest && b.isBest) return 1;
          // Books at consensus line come before those at different lines
          if (a.isAtConsensus && !b.isAtConsensus) return -1;
          if (!a.isAtConsensus && b.isAtConsensus) return 1;
          // Then sort by odds (highest first)
          const aOdds = parseInt(a.odds, 10);
          const bOdds = parseInt(b.odds, 10);
          if (isNaN(aOdds)) return 1;
          if (isNaN(bOdds)) return -1;
          return bOdds - aOdds;
        });
        
        // For middles: include ALL books with their lines (not just consensus)
        // CRITICAL: Use the correct odds based on pickSide (Over or Under)
        // This ensures exchanges mode compares the right side's odds
        const allBooksWithLines = propData.books.map((b: any) => {
          // Use the odds for the chosen side (Over or Under)
          const primaryOdds = isOverBetter ? b.overOdds : (b.underOdds || b.overOdds);
          const secondaryOdds = isOverBetter ? (b.underOdds || '--') : b.overOdds;
          return {
            name: b.name,
            rawName: b.name,
            key: b.key, // Include key for DFS detection in Discrepancy tool
            line: b.line,
            odds: primaryOdds,
            team2Odds: secondaryOdds,
            overOdds: b.overOdds,
            underOdds: b.underOdds || '--',
            ev: hasEnoughData ? '0%' : '--',
            isBest: b.name === bestBookForCard.name && b.line === bestBookForCard.line,
            isAtConsensus: b.line === consensusLine
          };
        }).sort((a: any, b: any) => {
          // Sort by line difference from consensus (closest first)
          const aDiff = Math.abs(a.line - consensusLine);
          const bDiff = Math.abs(b.line - consensusLine);
          if (aDiff !== bDiff) return aDiff - bDiff;
          // Then by odds
          const aOdds = parseInt(a.odds, 10);
          const bOdds = parseInt(b.odds, 10);
          if (isNaN(aOdds)) return 1;
          if (isNaN(bOdds)) return -1;
          return bOdds - aOdds;
        });
        
        // Get the best odds for the chosen side
        const bestOddsForPick = isOverBetter ? bestBookForCard.overOdds : bestBookForCard.underOdds;
        
        successfulPicks++;
        allPicks.push({
          id: `${game.id}-${pickKey}`,
          ev,
          sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
          game: gameMatchup,
          team1,
          team2,
          pick: pickDescription,
          bestOdds: bestOddsForPick,
          bestBook: bestBookForCard.name,
          pickSide: pickSide, // Track which side was chosen
          // Mini table shows books at consensus line, with line labeled if different
          books: displayBooks,
          // All books with their lines for middles detection
          allBooks: allBooksWithLines,
          isPlayerProp: true,
          playerName: propData.playerName,
          marketKey: propData.marketKey,
          line: consensusLine,
          allLines: uniqueLines,
          hasMultipleLines,
          bookCount: booksAtExactConsensus.length,
          hasEnoughData,
          gameTime: game.commence_time || undefined,
          commenceTime: game.commence_time || undefined
        });
      });
      
    } else {
      // GAME ODDS MODE: Create separate picks for each market type
      // Standard markets: h2h, spreads, totals
      // Additional markets: alternate_spreads, alternate_totals, team_totals, alternate_team_totals
      // Soccer markets: h2h_3_way, draw_no_bet, btts
      // Period markets: quarters, halves, periods, innings
      const standardMarkets = ['h2h', 'spreads', 'totals'];
      const alternateMarkets = ['alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'];
      const soccerMarkets = ['h2h_3_way', 'draw_no_bet', 'btts'];
      
      // Game period markets - these work like standard markets but for specific periods
      const periodMarkets = [
        // Quarter markets (NFL, NBA, NCAAF)
        'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
        'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
        'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
        // Half markets (NFL, NBA, NCAAF, NCAAB)
        'h2h_h1', 'h2h_h2',
        'spreads_h1', 'spreads_h2',
        'totals_h1', 'totals_h2',
        // Period markets (NHL)
        'h2h_p1', 'h2h_p2', 'h2h_p3',
        'spreads_p1', 'spreads_p2', 'spreads_p3',
        'totals_p1', 'totals_p2', 'totals_p3',
        // Innings markets (MLB)
        'h2h_1st_1_innings', 'h2h_1st_3_innings', 'h2h_1st_5_innings', 'h2h_1st_7_innings',
        'spreads_1st_1_innings', 'spreads_1st_3_innings', 'spreads_1st_5_innings', 'spreads_1st_7_innings',
        'totals_1st_1_innings', 'totals_1st_3_innings', 'totals_1st_5_innings', 'totals_1st_7_innings'
      ];
      
      // Alternate period markets
      const alternatePeriodMarkets = [
        // Quarter alternates
        'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
        'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
        'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
        'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
        // Half alternates
        'alternate_spreads_h1', 'alternate_spreads_h2',
        'alternate_totals_h1', 'alternate_totals_h2',
        'team_totals_h1', 'team_totals_h2',
        'alternate_team_totals_h1', 'alternate_team_totals_h2',
        // Period alternates (NHL)
        'alternate_spreads_p1', 'alternate_spreads_p2', 'alternate_spreads_p3',
        'alternate_totals_p1', 'alternate_totals_p2', 'alternate_totals_p3',
        'team_totals_p1', 'team_totals_p2', 'team_totals_p3',
        'alternate_team_totals_p1', 'alternate_team_totals_p2', 'alternate_team_totals_p3',
        // Innings alternates (MLB)
        'alternate_spreads_1st_1_innings', 'alternate_spreads_1st_3_innings', 'alternate_spreads_1st_5_innings', 'alternate_spreads_1st_7_innings',
        'alternate_totals_1st_1_innings', 'alternate_totals_1st_3_innings', 'alternate_totals_1st_5_innings', 'alternate_totals_1st_7_innings'
      ];
      
      // 3-way period markets
      const threeWayPeriodMarkets = [
        'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
        'h2h_3_way_h1', 'h2h_3_way_h2',
        'h2h_3_way_p1', 'h2h_3_way_p2', 'h2h_3_way_p3',
        'h2h_3_way_1st_1_innings', 'h2h_3_way_1st_3_innings', 'h2h_3_way_1st_5_innings', 'h2h_3_way_1st_7_innings'
      ];
      
      const now = Date.now();
      
      // Process standard markets (h2h, spreads, totals)
      standardMarkets.forEach(marketKey => {
        const booksArray: any[] = [];
        const filteredBooksArray: any[] = [];
        let marketPoint: number | null = null; // For spreads/totals line
        
        // Collect odds from all bookmakers for this specific market
        bookmakers.forEach((bm: any) => {
          const bookKey = bm.key || '';
          const bookName = normalizeBookName(bm.title || bm.key);
          
          // Check if bookmaker data is stale (DFS apps have stricter 5-min threshold)
          
          if (!bm.markets || !Array.isArray(bm.markets)) return;
          
          const market = bm.markets.find((m: any) => m.key === marketKey);
          if (!market || !market.outcomes || market.outcomes.length === 0) return;
          
          // Match outcomes to correct teams (API may return in any order)
          // team1 = away_team, team2 = home_team
          let awayOutcome = market.outcomes.find((o: any) => o.name === team1);
          let homeOutcome = market.outcomes.find((o: any) => o.name === team2);
          
          // Fallback to index-based if names don't match exactly
          if (!awayOutcome || !homeOutcome) {
            awayOutcome = market.outcomes[0];
            homeOutcome = market.outcomes[1];
          }
          
          // Get the point/line for spreads and totals - store per book for middles
          let bookLine: number | null = null;
          if ((marketKey === 'spreads' || marketKey === 'totals') && awayOutcome?.point !== undefined) {
            bookLine = awayOutcome.point;
            if (marketPoint === null) {
              marketPoint = awayOutcome.point; // Set first line as default
            }
          }
          
          const odds = awayOutcome?.price !== undefined ? awayOutcome.price : awayOutcome?.odds;
          const team2Odds = homeOutcome ? (homeOutcome.price !== undefined ? homeOutcome.price : homeOutcome.odds) : null;
          
          // Normalize and validate odds
          const normalizedOdds = normalizeAmericanOdds(odds);
          const normalizedTeam2Odds = team2Odds ? normalizeAmericanOdds(team2Odds) : null;
          
          // Skip books with invalid or extreme odds (e.g., -100000 is placeholder/invalid data)
          const numericOdds = parseInt(normalizedOdds || '0', 10);
          const isValidOdds = normalizedOdds && odds !== undefined && odds !== null && 
            Math.abs(numericOdds) < 50000; // Filter out extreme odds like -100000
          
          if (isValidOdds) {
            const bookData = {
              name: bookName,
              key: bookKey,
              odds: normalizedOdds,
              team2Odds: normalizedTeam2Odds || '--',
              ev: '0%',
              isBest: false,
              line: bookLine // Store line per book for middles detection
            };
            
            booksArray.push(bookData);
            if (isBookIncluded(bookKey, bookName)) {
              filteredBooksArray.push({ ...bookData });
            }
          }
        });
        
        // Skip this market if no books have odds for it
        if (booksArray.length === 0) return;
        
        // For spreads, find the CONSENSUS line (most common line among books)
        // This prevents comparing +1.5 vs -1.5 which are completely different bets
        if (marketKey === 'spreads') {
          const lineCount = new Map<number, number>();
          booksArray.forEach(b => {
            if (b.line !== null && b.line !== undefined) {
              lineCount.set(b.line, (lineCount.get(b.line) || 0) + 1);
            }
          });
          
          // Find the most common line
          let maxCount = 0;
          lineCount.forEach((count, line) => {
            if (count > maxCount) {
              maxCount = count;
              marketPoint = line; // Update to consensus line
            }
          });
        }
        
        // For spreads, ONLY consider books with the SAME spread line for best odds
        // This prevents comparing +1.5 vs -1.5 which gives false +EV
        const strictTolerance = 0.01;
        const booksForComparison = (marketKey === 'spreads' && marketPoint !== null)
          ? booksArray.filter(b => b.line !== null && b.line !== undefined && Math.abs(Number(b.line) - Number(marketPoint)) < strictTolerance)
          : booksArray;
        
        // Skip if no books have the consensus line
        if (booksForComparison.length === 0) return;
        
        // ALWAYS find the best odds across books with the SAME LINE (not just filtered ones)
        const bestBookDataOverall = booksForComparison.reduce((best: any, book: any) => {
          const bestOddsNum = parseInt(best.odds, 10);
          const bookOddsNum = parseInt(book.odds, 10);
          // Higher is better for American odds (both positive and negative)
          return bookOddsNum > bestOddsNum ? book : best;
        }, booksForComparison[0]);
        
        let bestOdds = bestBookDataOverall.odds;
        let bestBook = bestBookDataOverall.name;
        let ev = '0%';
        
        // Check if user has a filter applied
        const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
        const hasFilteredBooks = filteredBooksArray.length > 0;
        
        // If user filtered for specific books, show picks where filtered book has odds
        // For straight bets, we show ALL picks available at the filtered book (not just best odds)
        if (userHasFilter) {
          if (!hasFilteredBooks) {
            return; // Skip - the filtered book doesn't have this market at all
          }
          
          // Find the best book among filtered books for display
          const bestFilteredBook = filteredBooksArray.reduce((best: any, book: any) => {
            const bestOddsNum = parseInt(best.odds, 10);
            const bookOddsNum = parseInt(book.odds, 10);
            return bookOddsNum > bestOddsNum ? book : best;
          }, filteredBooksArray[0]);
          
          // Find the overall best odds across ALL books
          const overallBestBook = booksArray.reduce((best: any, book: any) => {
            const bestOddsNum = parseInt(best.odds, 10);
            const bookOddsNum = parseInt(book.odds, 10);
            return bookOddsNum > bestOddsNum ? book : best;
          }, booksArray[0]);
          
          // Check if filtered book has competitive odds (at least as good as overall best)
          const filteredOddsNum = parseInt(bestFilteredBook.odds, 10);
          const overallBestOddsNum = parseInt(overallBestBook.odds, 10);
          
          // Skip if filtered book's odds are worse than the best available odds
          if (!isNaN(filteredOddsNum) && !isNaN(overallBestOddsNum) && filteredOddsNum < overallBestOddsNum) {
            return; // Skip - filtered book has worse odds than available elsewhere
          }
          
          // Use the filtered book as the best book for display
          // (Show the best odds from the user's selected sportsbooks)
          bestOdds = bestFilteredBook.odds;
          bestBook = bestFilteredBook.name;
        }
        
        // Calculate EV - require minimum 4 books for meaningful EV calculation
        // For spreads, ONLY use books with the SAME spread line to avoid comparing +1.5 vs -1.5
        const MIN_BOOKS_FOR_EV = 4;
        // Use booksForComparison which already filters by same line for spreads
        const booksForEV = booksForComparison;
        const numericOdds = booksForEV.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
        const hasEnoughData = numericOdds.length >= MIN_BOOKS_FOR_EV;
        
        if (hasEnoughData) {
          const toProb = (american: number) => american > 0 ? 100 / (american + 100) : -american / (-american + 100);
          const probs = numericOdds.map(toProb);
          const avgProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
          const bestOddsNum = parseInt(bestOdds, 10);
          if (!isNaN(bestOddsNum)) {
            const bestProb = toProb(bestOddsNum);
            const edge = ((avgProb - bestProb) / bestProb) * 100;
            // Don't use Math.abs - show negative EV when odds are worse than fair value
            const roundedEdge = Math.round(edge * 100) / 100;
            ev = `${roundedEdge >= 0 ? '' : ''}${roundedEdge.toFixed(2)}%`;
            
            booksArray.forEach(b => {
              const o = parseInt(b.odds, 10);
              // Only calculate EV for books with the same spread line
              const isSameLine = marketKey !== 'spreads' || marketPoint === null || 
                (b.line !== null && b.line !== undefined && Math.abs(Number(b.line) - Number(marketPoint)) < 0.01);
              if (!isNaN(o) && isSameLine) {
                const p = toProb(o);
                const bookEdge = ((avgProb - p) / p) * 100;
                const roundedBookEdge = Math.round(bookEdge * 100) / 100;
                b.ev = `${roundedBookEdge.toFixed(2)}%`;
              } else if (!isSameLine) {
                b.ev = '--'; // Different spread line, can't compare
              }
              b.isBest = b.name === bestBook;
            });
          }
        } else {
          // Not enough books for EV calculation - mark as insufficient data
          ev = '--';
          booksArray.forEach(b => {
            b.ev = '--';
            b.isBest = b.name === bestBook;
          });
        }
        
        // Sort books so the best book (highest odds) appears first
        booksArray.sort((a, b) => {
          // Best book should always be first
          if (a.isBest && !b.isBest) return -1;
          if (!a.isBest && b.isBest) return 1;
          // Then sort by odds (highest first)
          const aOdds = parseInt(a.odds, 10);
          const bOdds = parseInt(b.odds, 10);
          if (isNaN(aOdds)) return 1;
          if (isNaN(bOdds)) return -1;
          return bOdds - aOdds;
        });
        
        // Create pick description based on market type
        let pickDescription = '';
        if (marketKey === 'h2h') {
          pickDescription = `${team1} ML`;
        } else if (marketKey === 'spreads') {
          const pointStr = marketPoint !== null ? (marketPoint > 0 ? `+${marketPoint}` : `${marketPoint}`) : '';
          pickDescription = `${team1} ${pointStr}`;
        } else if (marketKey === 'totals') {
          pickDescription = marketPoint !== null ? `Over ${marketPoint}` : 'Over';
        }
        
        allPicks.push({
          id: `${game.id || gameIdx + 1}-${marketKey}`,
          ev,
          sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
          game: gameMatchup,
          team1,
          team2,
          pick: pickDescription,
          bestOdds,
          bestBook,
          avgOdds: bestOdds,
          isHot: false,
          books: booksArray,
          allBooks: booksArray, // For compatibility
          marketKey,
          line: marketPoint,
          bookCount: booksArray.length, // Number of books with odds for this market
          hasEnoughData, // Whether there's enough data for EV calculation
          gameTime: game.commence_time || game.gameTime || undefined,
          commenceTime: game.commence_time || game.gameTime || undefined,
          // For bet grading
          eventId: game.id || undefined,
          sportKey: game.sport_key || undefined
        });
      });
      
      // Process soccer-specific markets (h2h_3_way, draw_no_bet, btts)
      // CRITICAL: Only process these for SOCCER sports - skip for NBA/NFL/NHL
      const gameSportKey = game.sport_key || '';
      const isSoccerGame = gameSportKey.startsWith('soccer_');
      
      // Only process soccer markets if this is a soccer game
      if (isSoccerGame) {
        soccerMarkets.forEach(marketKey => {
        const booksArray: any[] = [];
        
        bookmakers.forEach((bm: any) => {
          const bookKey = bm.key || '';
          const bookName = normalizeBookName(bm.title || bm.key);
          
          // Check if bookmaker data is stale (DFS apps have stricter 5-min threshold)
          // DISABLED: Stale check was filtering out all books for game odds
          // const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          // const staleThreshold = getStaleThreshold(bookKey);
          // const isStale = (now - lastUpdate) > staleThreshold;
          // if (isStale) return;
          
          if (!bm.markets || !Array.isArray(bm.markets)) return;
          
          const market = bm.markets.find((m: any) => m.key === marketKey);
          if (!market || !market.outcomes || market.outcomes.length === 0) return;
          
          // For BTTS, outcomes are "Yes" and "No"
          // For h2h_3_way, outcomes are team1, team2, and draw
          // For draw_no_bet, outcomes are team1 and team2
          // Match outcomes to correct teams (API may return in any order)
          let awayOutcome = market.outcomes.find((o: any) => o.name === team1);
          let homeOutcome = market.outcomes.find((o: any) => o.name === team2);
          const drawOutcome = market.outcomes.find((o: any) => o.name === 'Draw'); // Draw for h2h_3_way
          
          // Fallback to index-based if names don't match exactly
          if (!awayOutcome || !homeOutcome) {
            awayOutcome = market.outcomes[0];
            homeOutcome = market.outcomes[1];
          }
          
          const odds = awayOutcome?.price !== undefined ? awayOutcome.price : awayOutcome?.odds;
          const team2Odds = homeOutcome ? (homeOutcome.price !== undefined ? homeOutcome.price : homeOutcome.odds) : null;
          
          // Normalize and validate odds
          const normalizedOdds = normalizeAmericanOdds(odds);
          const normalizedTeam2Odds = team2Odds ? normalizeAmericanOdds(team2Odds) : null;
          
          if (normalizedOdds && odds !== undefined && odds !== null) {
            booksArray.push({
              name: bookName,
              key: bookKey,
              odds: normalizedOdds,
              team2Odds: normalizedTeam2Odds || '--',
              drawOdds: drawOutcome ? normalizeAmericanOdds(drawOutcome.price || drawOutcome.odds) : null,
              ev: '0%',
              isBest: false
            });
          }
        });
        
        if (booksArray.length === 0) return;
        
        // Find best odds across ALL books
        const bestBookDataOverall = booksArray.reduce((best, book) => {
          const bestOddsNum = parseInt(best.odds, 10);
          const bookOddsNum = parseInt(book.odds, 10);
          return bookOddsNum > bestOddsNum ? book : best;
        }, booksArray[0]);
        
        let bestBook = bestBookDataOverall.name;
        let bestOdds = bestBookDataOverall.odds;
        
        // Check if user has a filter applied
        const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
        const filteredBooks = booksArray.filter(b => isBookIncluded(b.key, b.name));
        const hasFilteredBooks = filteredBooks.length > 0;
        
        // If user filtered for specific books, check if any have the best odds
        if (userHasFilter) {
          if (!hasFilteredBooks) {
            return; // Skip - filtered book doesn't have this market
          }
          
          const bestFilteredBook = filteredBooks.reduce((best, book) => {
            const bestOddsNum = parseInt(best.odds, 10);
            const bookOddsNum = parseInt(book.odds, 10);
            return bookOddsNum > bestOddsNum ? book : best;
          }, filteredBooks[0]);
          
          const filteredOdds = parseInt(bestFilteredBook.odds, 10);
          const overallBestOdds = parseInt(bestOdds, 10);
          
          // Skip if filtered book doesn't have the best odds
          if (filteredOdds < overallBestOdds) {
            return;
          }
          
          bestBook = bestFilteredBook.name;
          bestOdds = bestFilteredBook.odds;
        }
        
        const hasEnoughData = booksArray.length >= 4;
        let ev = '--';
        
        if (hasEnoughData) {
          const oddsValues = booksArray.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
          const bookKeys = booksArray.map(b => b.key || b.name || '');
          const toProb = (o: number) => o > 0 ? 100 / (o + 100) : -o / (-o + 100);
          // Use weighted average based on book sharpness
          const avgProb = calculateWeightedAvgProb(oddsValues, bookKeys, toProb);
          const bestProb = toProb(parseInt(bestOdds, 10));
          const evValue = ((avgProb - bestProb) / bestProb) * 100;
          ev = `${Math.abs(Math.round(evValue * 100) / 100).toFixed(2)}%`;
        }
        
        // Create pick description
        let pickDescription = '';
        if (marketKey === 'h2h_3_way') {
          pickDescription = `${team1} (3-Way)`;
        } else if (marketKey === 'draw_no_bet') {
          pickDescription = `${team1} DNB`;
        } else if (marketKey === 'btts') {
          pickDescription = 'Both Teams to Score - Yes';
        }
        
        booksArray.forEach(b => {
          b.isBest = b.name === bestBook;
        });
        
        allPicks.push({
          id: `${game.id || gameIdx + 1}-${marketKey}`,
          ev,
          sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
          game: gameMatchup,
          team1,
          team2,
          pick: pickDescription,
          bestOdds,
          bestBook,
          avgOdds: bestOdds,
          isHot: false,
          books: booksArray,
          allBooks: booksArray,
          marketKey,
          line: null,
          bookCount: booksArray.length,
          hasEnoughData,
          gameTime: game.commence_time || game.gameTime || undefined,
          commenceTime: game.commence_time || game.gameTime || undefined
        });
      });
      } // End of if (isSoccerGame) block
      
      // Helper function to get period label from market key
      const getPeriodLabel = (marketKey: string): string => {
        if (marketKey.includes('_q1')) return '1Q';
        if (marketKey.includes('_q2')) return '2Q';
        if (marketKey.includes('_q3')) return '3Q';
        if (marketKey.includes('_q4')) return '4Q';
        if (marketKey.includes('_h1')) return '1H';
        if (marketKey.includes('_h2')) return '2H';
        if (marketKey.includes('_p1')) return '1P';
        if (marketKey.includes('_p2')) return '2P';
        if (marketKey.includes('_p3')) return '3P';
        if (marketKey.includes('1st_1_innings')) return '1st Inn';
        if (marketKey.includes('1st_3_innings')) return 'F3 Inn';
        if (marketKey.includes('1st_5_innings')) return 'F5 Inn';
        if (marketKey.includes('1st_7_innings')) return 'F7 Inn';
        return '';
      };
      
      // Process period markets (like standard markets but with period labels)
      // For totals/spreads period markets, group by line since API returns multiple lines
      periodMarkets.forEach(marketKey => {
        const isTotalsOrSpreads = marketKey.includes('totals_') || marketKey.includes('spreads_');
        
        if (isTotalsOrSpreads) {
          // Group by line for totals/spreads period markets
          const lineGroups = new Map<number, any[]>();
          
          bookmakers.forEach((bm: any) => {
            const bookKey = bm.key || '';
            const bookName = normalizeBookName(bm.title || bm.key);
            
            // Check if bookmaker data is stale (DFS apps have stricter 5-min threshold)
            // DISABLED: Stale check was filtering out all books for game odds
            // const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
            // const staleThreshold = getStaleThreshold(bookKey);
            // const isStale = (now - lastUpdate) > staleThreshold;
            // if (isStale) return;
            
            if (!bm.markets || !Array.isArray(bm.markets)) return;
            
            const market = bm.markets.find((m: any) => m.key === marketKey);
            if (!market || !market.outcomes || market.outcomes.length === 0) return;
            
            // Process all outcomes and group by line
            market.outcomes.forEach((outcome: any) => {
              const line = outcome.point;
              if (line === undefined) return;
              
              const isOver = outcome.name === 'Over';
              const odds = outcome.price !== undefined ? outcome.price : outcome.odds;
              const normalizedOdds = normalizeAmericanOdds(odds);
              
              if (!normalizedOdds) return;
              
              if (!lineGroups.has(line)) {
                lineGroups.set(line, []);
              }
              
              // Find or create book entry for this line
              const lineBooks = lineGroups.get(line)!;
              let bookEntry = lineBooks.find(b => b.name === bookName);
              
              if (!bookEntry) {
                bookEntry = {
                  name: bookName,
                  key: bookKey,
                  odds: '--',
                  team2Odds: '--',
                  ev: '0%',
                  isBest: false,
                  line: line
                };
                lineBooks.push(bookEntry);
              }
              
              if (isOver) {
                bookEntry.odds = normalizedOdds;
              } else {
                bookEntry.team2Odds = normalizedOdds;
              }
            });
          });
          
          // Create a pick for each line
          lineGroups.forEach((booksArray, line) => {
            // Filter to only books that have Over odds
            const validBooks = booksArray.filter(b => b.odds !== '--');
            if (validBooks.length === 0) return;
            
            // Find best odds across ALL books
            const bestBookDataOverall = validBooks.reduce((best, book) => {
              const bestOddsNum = parseInt(best.odds, 10);
              const bookOddsNum = parseInt(book.odds, 10);
              return bookOddsNum > bestOddsNum ? book : best;
            }, validBooks[0]);
            
            let bestBook = bestBookDataOverall.name;
            let bestOdds = bestBookDataOverall.odds;
            
            // Check if user has a filter applied
            const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
            const filteredBooks = validBooks.filter(b => isBookIncluded(b.key, b.name));
            const hasFilteredBooks = filteredBooks.length > 0;
            
            // If user filtered for specific books, check if any have the best odds
            if (userHasFilter) {
              if (!hasFilteredBooks) {
                return; // Skip - filtered book doesn't have this market
              }
              
              const bestFilteredBook = filteredBooks.reduce((best, book) => {
                const bestOddsNum = parseInt(best.odds, 10);
                const bookOddsNum = parseInt(book.odds, 10);
                return bookOddsNum > bestOddsNum ? book : best;
              }, filteredBooks[0]);
              
              const filteredOdds = parseInt(bestFilteredBook.odds, 10);
              const overallBestOdds = parseInt(bestOdds, 10);
              
              // Skip if filtered book doesn't have the best odds
              if (filteredOdds < overallBestOdds) {
                return;
              }
              
              bestBook = bestFilteredBook.name;
              bestOdds = bestFilteredBook.odds;
            }
            
            const hasEnoughData = validBooks.length >= 4;
            let ev = '--';
            
            if (hasEnoughData) {
              const oddsValues = validBooks.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
              const bookKeys = validBooks.map(b => b.key || b.name || '');
              const toProb = (o: number) => o > 0 ? 100 / (o + 100) : -o / (-o + 100);
              // Use weighted average based on book sharpness
              const avgProb = calculateWeightedAvgProb(oddsValues, bookKeys, toProb);
              const bestProb = toProb(parseInt(bestOdds, 10));
              const evValue = ((avgProb - bestProb) / bestProb) * 100;
              ev = `${Math.abs(Math.round(evValue * 100) / 100).toFixed(2)}%`;
            }
            
            const periodLabel = getPeriodLabel(marketKey);
            let pickDescription = '';
            
            if (marketKey.includes('spreads_')) {
              const pointStr = line > 0 ? `+${line}` : `${line}`;
              pickDescription = `${team1} ${pointStr} ${periodLabel}`;
            } else if (marketKey.includes('totals_')) {
              pickDescription = `Over ${line} ${periodLabel}`;
            }
            
            validBooks.forEach(b => { b.isBest = b.name === bestBook; });
            
            allPicks.push({
              id: `${game.id || gameIdx + 1}-${marketKey}-${line}`,
              ev,
              sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
              game: gameMatchup,
              team1,
              team2,
              pick: pickDescription,
              bestOdds,
              bestBook,
              avgOdds: bestOdds,
              isHot: false,
              books: validBooks,
              allBooks: validBooks,
              marketKey,
              line: line,
              bookCount: validBooks.length,
              hasEnoughData,
              gameTime: game.commence_time || game.gameTime || undefined,
              commenceTime: game.commence_time || game.gameTime || undefined
            });
          });
        } else {
          // H2H period markets - no line grouping needed
          const booksArray: any[] = [];
          
          bookmakers.forEach((bm: any) => {
            const bookKey = bm.key || '';
            const bookName = normalizeBookName(bm.title || bm.key);
            
            // Check if bookmaker data is stale (DFS apps have stricter 5-min threshold)
            // DISABLED: Stale check was filtering out all books for game odds
            // const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
            // const staleThreshold = getStaleThreshold(bookKey);
            // const isStale = (now - lastUpdate) > staleThreshold;
            // if (isStale) return;
            
            if (!bm.markets || !Array.isArray(bm.markets)) return;
            
            const market = bm.markets.find((m: any) => m.key === marketKey);
            if (!market || !market.outcomes || market.outcomes.length === 0) return;
            
            // Match outcomes to correct teams (API may return in any order)
            let awayOutcome = market.outcomes.find((o: any) => o.name === team1);
            let homeOutcome = market.outcomes.find((o: any) => o.name === team2);
            
            // Fallback to index-based if names don't match exactly
            if (!awayOutcome || !homeOutcome) {
              awayOutcome = market.outcomes[0];
              homeOutcome = market.outcomes[1];
            }
            
            const odds = awayOutcome?.price !== undefined ? awayOutcome.price : awayOutcome?.odds;
            const team2Odds = homeOutcome ? (homeOutcome.price !== undefined ? homeOutcome.price : homeOutcome.odds) : null;
            
            const normalizedOdds = normalizeAmericanOdds(odds);
            const normalizedTeam2Odds = team2Odds ? normalizeAmericanOdds(team2Odds) : null;
            
            if (normalizedOdds && odds !== undefined && odds !== null) {
              booksArray.push({
                name: bookName,
                key: bookKey,
                odds: normalizedOdds,
                team2Odds: normalizedTeam2Odds || '--',
                ev: '0%',
                isBest: false
              });
            }
          });
          
          if (booksArray.length === 0) return;
          
          // Find best odds across ALL books
          const bestBookDataOverall = booksArray.reduce((best, book) => {
            const bestOddsNum = parseInt(best.odds, 10);
            const bookOddsNum = parseInt(book.odds, 10);
            return bookOddsNum > bestOddsNum ? book : best;
          }, booksArray[0]);
          
          let bestBook = bestBookDataOverall.name;
          let bestOdds = bestBookDataOverall.odds;
          
          // Check if user has a filter applied
          const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
          const filteredBooks = booksArray.filter(b => isBookIncluded(b.key, b.name));
          const hasFilteredBooks = filteredBooks.length > 0;
          
          // If user filtered for specific books, check if any have the best odds
          if (userHasFilter) {
            if (!hasFilteredBooks) {
              return; // Skip - filtered book doesn't have this market
            }
            
            const bestFilteredBook = filteredBooks.reduce((best, book) => {
              const bestOddsNum = parseInt(best.odds, 10);
              const bookOddsNum = parseInt(book.odds, 10);
              return bookOddsNum > bestOddsNum ? book : best;
            }, filteredBooks[0]);
            
            const filteredOdds = parseInt(bestFilteredBook.odds, 10);
            const overallBestOdds = parseInt(bestOdds, 10);
            
            // Skip if filtered book doesn't have the best odds
            if (filteredOdds < overallBestOdds) {
              return;
            }
            
            bestBook = bestFilteredBook.name;
            bestOdds = bestFilteredBook.odds;
          }
          
          const hasEnoughData = booksArray.length >= 4;
          let ev = '--';
          
          if (hasEnoughData) {
            const oddsValues = booksArray.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
            const bookKeys = booksArray.map(b => b.key || b.name || '');
            const toProb = (o: number) => o > 0 ? 100 / (o + 100) : -o / (-o + 100);
            // Use weighted average based on book sharpness
            const avgProb = calculateWeightedAvgProb(oddsValues, bookKeys, toProb);
            const bestProb = toProb(parseInt(bestOdds, 10));
            const evValue = ((avgProb - bestProb) / bestProb) * 100;
            ev = `${Math.abs(Math.round(evValue * 100) / 100).toFixed(2)}%`;
          }
          
          const periodLabel = getPeriodLabel(marketKey);
          const pickDescription = `${team1} ML ${periodLabel}`;
          
          booksArray.forEach(b => { b.isBest = b.name === bestBook; });
          
          allPicks.push({
            id: `${game.id || gameIdx + 1}-${marketKey}`,
            ev,
            sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
            game: gameMatchup,
            team1,
            team2,
            pick: pickDescription,
            bestOdds,
            bestBook,
            avgOdds: bestOdds,
            isHot: false,
            books: booksArray,
            allBooks: booksArray,
            marketKey,
            line: null,
            bookCount: booksArray.length,
            hasEnoughData,
            gameTime: game.commence_time || game.gameTime || undefined,
            commenceTime: game.commence_time || game.gameTime || undefined
          });
        }
      });
      
      // Process alternate period markets (like alternate markets but with period labels)
      [...alternatePeriodMarkets, ...alternateMarkets].forEach(marketKey => {
        const lineGroups = new Map<number, any[]>();
        
        bookmakers.forEach((bm: any) => {
          const bookKey = bm.key || '';
          const bookName = normalizeBookName(bm.title || bm.key);
          
          // Skip books that should be excluded from alternate markets (e.g., Dabble)
          if (shouldExcludeFromAlternates(bookKey)) return;
          
          // Check if bookmaker data is stale (DFS apps have stricter threshold)
          // DISABLED: Stale check was filtering out all books for game odds
          // const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          // const staleThreshold = getStaleThreshold(bookKey);
          // const isStale = (now - lastUpdate) > staleThreshold;
          // if (isStale) return;
          
          if (!bm.markets || !Array.isArray(bm.markets)) return;
          
          const market = bm.markets.find((m: any) => m.key === marketKey);
          if (!market || !market.outcomes || market.outcomes.length === 0) return;
          
          market.outcomes.forEach((outcome: any) => {
            const point = outcome.point;
            if (point === undefined) return;
            
            if (!lineGroups.has(point)) {
              lineGroups.set(point, []);
            }
            
            const odds = outcome.price !== undefined ? outcome.price : outcome.odds;
            const normalizedOdds = normalizeAmericanOdds(odds);
            if (normalizedOdds && odds !== undefined && odds !== null) {
              lineGroups.get(point)!.push({
                name: bookName,
                key: bookKey,
                odds: normalizedOdds,
                team: outcome.name,
                description: outcome.description
              });
            }
          });
        });
        
        const periodLabel = getPeriodLabel(marketKey);
        
        lineGroups.forEach((books, point) => {
          if (books.length < 2) return;
          
          const bestBook = books.reduce((best, book) => {
            const bestOdds = parseInt(best.odds, 10);
            const bookOdds = parseInt(book.odds, 10);
            return bookOdds > bestOdds ? book : best;
          }, books[0]);
          
          let pickDescription = '';
          const pointStr = point > 0 ? `+${point}` : `${point}`;
          
          if (marketKey.includes('alternate_spreads')) {
            pickDescription = `${team1} Alt ${pointStr}${periodLabel ? ` ${periodLabel}` : ''}`;
          } else if (marketKey.includes('alternate_totals')) {
            pickDescription = `Alt Over ${point}${periodLabel ? ` ${periodLabel}` : ''}`;
          } else if (marketKey.includes('team_totals')) {
            const teamName = books[0]?.team || team1;
            pickDescription = `${teamName} Over ${point}${periodLabel ? ` ${periodLabel}` : ''}`;
          }
          
          const hasEnoughData = books.length >= 4;
          let ev = '--';
          
          if (hasEnoughData) {
            const oddsValues = books.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
            const bookKeys = books.map(b => b.key || b.name || '');
            const toProb = (o: number) => o > 0 ? 100 / (o + 100) : -o / (-o + 100);
            // Use weighted average based on book sharpness
            const avgProb = calculateWeightedAvgProb(oddsValues, bookKeys, toProb);
            const bestProb = toProb(parseInt(bestBook.odds, 10));
            const evValue = ((avgProb - bestProb) / bestProb) * 100;
            ev = `${Math.abs(Math.round(evValue * 100) / 100).toFixed(2)}%`;
          }
          
          allPicks.push({
            id: `${game.id || gameIdx + 1}-${marketKey}-${point}`,
            ev,
            sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
            game: gameMatchup,
            team1,
            team2,
            pick: pickDescription,
            bestOdds: bestBook.odds,
            bestBook: bestBook.name,
            avgOdds: bestBook.odds,
            isHot: false,
            books: books.map(b => ({ ...b, team2Odds: '--', ev: '--', isBest: b.name === bestBook.name })),
            allBooks: books.map(b => ({ ...b, team2Odds: '--', ev: '--', isBest: b.name === bestBook.name })),
            marketKey,
            line: point,
            bookCount: books.length,
            hasEnoughData,
            gameTime: game.commence_time || game.gameTime || undefined,
            commenceTime: game.commence_time || game.gameTime || undefined,
            isAlternate: true
          });
        });
      });
      
      // Process 3-way period markets
      threeWayPeriodMarkets.forEach(marketKey => {
        const booksArray: any[] = [];
        
        bookmakers.forEach((bm: any) => {
          const bookKey = bm.key || '';
          const bookName = normalizeBookName(bm.title || bm.key);
          
          // Check if bookmaker data is stale (DFS apps have stricter 5-min threshold)
          // DISABLED: Stale check was filtering out all books for game odds
          // const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          // const staleThreshold = getStaleThreshold(bookKey);
          // const isStale = (now - lastUpdate) > staleThreshold;
          // if (isStale) return;
          
          if (!bm.markets || !Array.isArray(bm.markets)) return;
          
          const market = bm.markets.find((m: any) => m.key === marketKey);
          if (!market || !market.outcomes || market.outcomes.length === 0) return;
          
          // Match outcomes to correct teams (API may return in any order)
          let awayOutcome = market.outcomes.find((o: any) => o.name === team1);
          let homeOutcome = market.outcomes.find((o: any) => o.name === team2);
          const drawOutcome = market.outcomes.find((o: any) => o.name === 'Draw');
          
          // Fallback to index-based if names don't match exactly
          if (!awayOutcome || !homeOutcome) {
            awayOutcome = market.outcomes[0];
            homeOutcome = market.outcomes[1];
          }
          
          const odds = awayOutcome?.price !== undefined ? awayOutcome.price : awayOutcome?.odds;
          const team2Odds = homeOutcome ? (homeOutcome.price !== undefined ? homeOutcome.price : homeOutcome.odds) : null;
          
          // Normalize and validate odds
          const normalizedOdds = normalizeAmericanOdds(odds);
          const normalizedTeam2Odds = team2Odds ? normalizeAmericanOdds(team2Odds) : null;
          
          if (normalizedOdds && odds !== undefined && odds !== null) {
            booksArray.push({
              name: bookName,
              key: bookKey,
              odds: normalizedOdds,
              team2Odds: normalizedTeam2Odds || '--',
              drawOdds: drawOutcome ? normalizeAmericanOdds(drawOutcome.price || drawOutcome.odds) : null,
              ev: '0%',
              isBest: false
            });
          }
        });
        
        if (booksArray.length === 0) return;
        
        // Find best odds across ALL books
        const bestBookDataOverall = booksArray.reduce((best, book) => {
          const bestOddsNum = parseInt(best.odds, 10);
          const bookOddsNum = parseInt(book.odds, 10);
          return bookOddsNum > bestOddsNum ? book : best;
        }, booksArray[0]);
        
        let bestBook = bestBookDataOverall.name;
        let bestOdds = bestBookDataOverall.odds;
        
        // Check if user has a filter applied
        const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
        const filteredBooks = booksArray.filter(b => isBookIncluded(b.key, b.name));
        const hasFilteredBooks = filteredBooks.length > 0;
        
        // If user filtered for specific books, check if any have the best odds
        if (userHasFilter) {
          if (!hasFilteredBooks) {
            return; // Skip - filtered book doesn't have this market
          }
          
          const bestFilteredBook = filteredBooks.reduce((best, book) => {
            const bestOddsNum = parseInt(best.odds, 10);
            const bookOddsNum = parseInt(book.odds, 10);
            return bookOddsNum > bestOddsNum ? book : best;
          }, filteredBooks[0]);
          
          const filteredOdds = parseInt(bestFilteredBook.odds, 10);
          const overallBestOdds = parseInt(bestOdds, 10);
          
          // Skip if filtered book doesn't have the best odds
          if (filteredOdds < overallBestOdds) {
            return;
          }
          
          bestBook = bestFilteredBook.name;
          bestOdds = bestFilteredBook.odds;
        }
        
        const hasEnoughData = booksArray.length >= 4;
        let ev = '--';
        
        if (hasEnoughData) {
          const oddsValues = booksArray.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
          const bookKeys = booksArray.map(b => b.key || b.name || '');
          const toProb = (o: number) => o > 0 ? 100 / (o + 100) : -o / (-o + 100);
          // Use weighted average based on book sharpness
          const avgProb = calculateWeightedAvgProb(oddsValues, bookKeys, toProb);
          const bestProb = toProb(parseInt(bestOdds, 10));
          const evValue = ((avgProb - bestProb) / bestProb) * 100;
          ev = `${Math.abs(Math.round(evValue * 100) / 100).toFixed(2)}%`;
        }
        
        const periodLabel = getPeriodLabel(marketKey);
        const pickDescription = `${team1} (3-Way) ${periodLabel}`;
        
        booksArray.forEach(b => { b.isBest = b.name === bestBook; });
        
        allPicks.push({
          id: `${game.id || gameIdx + 1}-${marketKey}`,
          ev,
          sport: getSportLabel((game.sport_key || game.sport_title || 'Unknown').toLowerCase()),
          game: gameMatchup,
          team1,
          team2,
          pick: pickDescription,
          bestOdds,
          bestBook,
          avgOdds: bestOdds,
          isHot: false,
          books: booksArray,
          allBooks: booksArray,
          marketKey,
          line: null,
          bookCount: booksArray.length,
          hasEnoughData,
          gameTime: game.commence_time || game.gameTime || undefined,
          commenceTime: game.commence_time || game.gameTime || undefined
        });
      });
    }
  });
  
  // Sort picks: bets with valid EV% at top (sorted by EV descending), bets without EV at bottom
  allPicks.sort((a, b) => {
    const aHasEV = a.ev !== '--' && a.ev !== '0%' && a.hasEnoughData !== false;
    const bHasEV = b.ev !== '--' && b.ev !== '0%' && b.hasEnoughData !== false;
    
    // Picks with EV come before picks without EV
    if (aHasEV && !bHasEV) return -1;
    if (!aHasEV && bHasEV) return 1;
    
    // If both have EV, sort by EV percentage (highest first)
    if (aHasEV && bHasEV) {
      const aEV = parseFloat(a.ev.replace('%', ''));
      const bEV = parseFloat(b.ev.replace('%', ''));
      if (!isNaN(aEV) && !isNaN(bEV)) {
        return bEV - aEV; // Higher EV first
      }
    }
    
    // If neither has EV, sort by book count (more books = more data = higher priority)
    const aBooks = a.bookCount || a.books?.length || 0;
    const bBooks = b.bookCount || b.books?.length || 0;
    return bBooks - aBooks;
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
    minDataPoints = 4,
    autoRefresh = true,
    refreshInterval = 45000,  // 45 seconds default
  } = options;

  const { user, authLoading } = useAuth();
  const [picks, setPicks] = useState<OddsPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 10000; // 10 second cooldown to prevent tab switch refreshes
  
  // Use refs to track auth state without causing re-renders
  const userRef = useRef(user);
  const authLoadingRef = useRef(authLoading);
  userRef.current = user;
  authLoadingRef.current = authLoading;

  const fetchOddsData = useCallback(async (isAutoRefresh = false) => {
    // Use refs to check auth state without depending on them
    if (!enabled || !userRef.current || authLoadingRef.current) {
      setLoading(false);
      return;
    }

    // Prevent fetches within cooldown window (prevents tab switch refreshes)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < COOLDOWN_MS && lastFetchTimeRef.current > 0) {
      console.log(`🔍 useOddsData: Skipping fetch - within ${COOLDOWN_MS/1000}s cooldown (${timeSinceLastFetch}ms since last fetch)`);
      setLoading(false);
      return;
    }

    try {
      // For auto-refresh, use isRefreshing instead of loading to avoid UI flicker
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      lastFetchTimeRef.current = now;

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
        // Soccer - top 5 leagues only (limited for performance)
        'soccer': 'soccer_epl,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_usa_mls,soccer_mexico_ligamx',
      };
      
      // Map frontend filters to backend parameter names
      // Default sports if not specified (include NCAA sports and major soccer leagues)
      let sportsList: string;
      if (sport && sport !== 'all') {
        // If sport contains comma, it's already a comma-separated list of API keys (from multiple selection)
        if (sport.includes(',')) {
          sportsList = sport;
        } else {
          // Single sport - map it through sportKeyMap
          sportsList = sportKeyMap[sport] || sport;
        }
      } else {
        // Default to all sports
        sportsList = 'americanfootball_nfl,americanfootball_ncaaf,basketball_nba,basketball_ncaab,baseball_mlb,icehockey_nhl,soccer_epl,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_usa_mls,soccer_mexico_ligamx';
      }
      params.append('sports', sportsList);
      
      // Map market types to API format
      // For special markets (periods, alternates), request those specific markets from the API
      const getMarketsForFilter = (filter: string, sportKey: string): string => {
        switch (filter) {
          // Standard markets
          case 'moneyline': return 'h2h';
          case 'spread': return 'spreads';
          case 'totals': return 'totals';
          
          // Alternate markets
          case 'alternate_spreads': return 'alternate_spreads';
          case 'alternate_totals': return 'alternate_totals';
          case 'team_totals': return 'team_totals';
          
          // 1st Half markets (NFL, NBA, NCAAF)
          // IMPORTANT: Always include base markets (h2h,spreads,totals) so API returns games
          // Period markets are fetched separately via /events/{eventId}/odds endpoint
          case '1st_half': return 'h2h,spreads,totals,h2h_h1,spreads_h1,totals_h1';
          
          // 2nd Half markets
          case '2nd_half': return 'h2h,spreads,totals,h2h_h2,spreads_h2,totals_h2';
          
          // 1st Quarter markets (NFL, NBA)
          case '1st_quarter': return 'h2h,spreads,totals,h2h_q1,spreads_q1,totals_q1';
          
          // 1st Period markets (NHL)
          case '1st_period': return 'h2h,spreads,totals,h2h_p1,spreads_p1,totals_p1';
          
          // Soccer markets
          case 'btts': return 'btts';
          case 'draw_no_bet': return 'draw_no_bet';
          case 'double_chance': return 'double_chance';
          case 'alternate_totals_corners': return 'alternate_totals_corners';
          case 'alternate_totals_cards': return 'alternate_totals_cards';
          
          // All markets - request available markets for the sport
          // NOTE: Main /odds endpoint only supports h2h, spreads, totals
          // Quarter/half/period markets are supported via /events/{eventId}/odds endpoint
          // The backend handles this separation - we send all desired markets and backend routes appropriately
          case 'all':
          default: {
            // Send ALL markets including period markets - backend handles routing to correct endpoints
            const allMarkets = [
              // Core markets
              'h2h', 'spreads', 'totals',
              // Alternate markets
              'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals',
              // Quarter markets (Basketball, Football)
              'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
              'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
              'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
              // Half markets (Basketball, Football)
              'h2h_h1', 'h2h_h2',
              'spreads_h1', 'spreads_h2',
              'totals_h1', 'totals_h2',
              // Period markets (Hockey)
              'h2h_p1', 'h2h_p2', 'h2h_p3',
              'spreads_p1', 'spreads_p2', 'spreads_p3',
              'totals_p1', 'totals_p2', 'totals_p3'
            ];
            
            // Soccer-specific markets
            const soccerMarkets = ['h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'];
            
            // Check if any soccer sports are included
            const hasSoccer = sportKey.includes('soccer_');
            
            if (hasSoccer) {
              return [...allMarkets, ...soccerMarkets].join(',');
            }
            
            return allMarkets.join(',');
          }
        }
      };
      
      const marketsList = getMarketsForFilter(marketType || 'all', sportsList);
      params.append('markets', marketsList);
      
      // Add other parameters the backend expects
      params.append('regions', 'us');
      params.append('oddsFormat', 'american');
      
      // Optional: date, betType, sportsbooks (if backend supports them)
      // Don't send date parameter if it's 'all_upcoming' - backend doesn't recognize it
      if (date && date !== 'all' && date !== 'all_upcoming') params.append('date', date);
      // For exchanges, arbitrage, and middles modes, fetch straight bets data
      // These modes filter client-side but need the base straight bets data
      const apiBetType = ['exchanges', 'arbitrage', 'middles'].includes(betType) ? 'straight' : betType;
      if (apiBetType && apiBetType !== 'all') params.append('betType', apiBetType);
      // For exchanges, arbitrage, middles, AND player props modes, DON'T filter by sportsbooks
      // - exchanges/arbitrage/middles need ALL books to find opportunities
      // - player props should return all books and filter client-side (backend doesn't properly filter DFS apps)
      const needsAllBooks = ['exchanges', 'arbitrage', 'middles', 'props'].includes(betType);
      if (!needsAllBooks && sportsbooks && sportsbooks.length > 0) {
        params.append('sportsbooks', sportsbooks.join(','));
      }
      if (limit) params.append('limit', limit.toString());

      // Add cache-busting timestamp to force fresh data
      params.append('_t', Date.now().toString());
      
      const queryString = params.toString();
      const endpoint = `/api/odds${queryString ? `?${queryString}` : ''}`;
      const fetchTimestamp = new Date().toISOString();


      // For exchanges mode, fetch both straight bets AND player props in parallel
      let response;
      if (betType === 'exchanges') {
        // Build player props endpoint
        const propsParams = new URLSearchParams(params);
        propsParams.set('betType', 'props');
        const propsEndpoint = `/api/odds?${propsParams.toString()}`;
        
        
        // Fetch both in parallel
        const [straightResponse, propsResponse] = await Promise.all([
          apiClient.get(endpoint),
          apiClient.get(propsEndpoint).catch(err => {
            console.warn('💱 Player props fetch failed (continuing with straight bets):', err.message);
            return { data: [] };
          })
        ]);
        
        // Combine the results
        const straightData = Array.isArray(straightResponse.data) ? straightResponse.data : 
          (straightResponse.data?.picks || []);
        const propsData = Array.isArray(propsResponse.data) ? propsResponse.data : 
          (propsResponse.data?.picks || []);
        
        
        // Merge into single response
        response = { data: [...straightData, ...propsData] };
      } else {
        response = await apiClient.get(endpoint);
        if (DEBUG_LOGGING) console.log(`🔍 useOddsData: Response received:`, {
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          length: Array.isArray(response.data) ? response.data.length : 'N/A',
          hasError: !!response.data?.error,
          error: response.data?.error
        });
      }
      

      // DFS apps that only offer Over bets (no Under) - DEPRECATED
      // Note: We now create synthetic Unders for DFS apps, so we should NOT filter them out
      // This allows users to see +EV Under opportunities even on DFS platforms
      const dfsAppsNoUnder = ['prizepicks', 'underdog', 'pick6', 'betr_us_dfs', 'dabble', 'dabble_au', 'sleeper'];
      const isDFSOnlyFilter = sportsbooks && sportsbooks.length > 0 && 
        sportsbooks.every(sb => dfsAppsNoUnder.includes(sb.toLowerCase()));
      
      // Filter function to remove Under picks when only DFS apps are selected
      // DISABLED: We now create synthetic Unders with -119 odds for DFS apps
      // This allows Unders to display when they have better EV than Overs
      const filterUnderForDFS = (picks: OddsPick[]) => {
        // CRITICAL: Do NOT filter out Unders anymore - we want to show them
        // DFS apps now have synthetic Unders created in the processing logic
        return picks; // Return all picks including Unders (synthetic Unders enabled for DFS)
      };
      
      // Filter picks by minimum data points (book count)
      // Skip for arbitrage, middles, and exchanges - they have their own filtering logic
      const filterByMinDataPoints = (picks: OddsPick[]) => {
        if (minDataPoints <= 1) return picks; // No filtering needed
        if (['arbitrage', 'middles', 'exchanges'].includes(betType)) return picks; // These don't need min data points
        return picks.filter(pick => {
          const bookCount = pick.books?.length || pick.bookCount || 0;
          return bookCount >= minDataPoints;
        });
      };

      // Filter out Unibet from arbitrage bets
      const filterUnibetForArbitrage = (picks: OddsPick[]) => {
        if (betType !== 'arbitrage') return picks;
        return picks.map(pick => {
          // Filter Unibet from books array
          const filteredBooks = (pick.books || []).filter((book: OddsBook) => 
            !book.name.toLowerCase().includes('unibet')
          );
          const filteredAllBooks = (pick.allBooks || []).filter((book: OddsBook) => 
            !book.name.toLowerCase().includes('unibet')
          );
          // Skip picks where bestBook is Unibet
          if (pick.bestBook?.toLowerCase().includes('unibet')) {
            // Find new best book from filtered list
            if (filteredBooks.length > 0) {
              const newBest = filteredBooks.reduce((best: OddsBook, b: OddsBook) => {
                const bestOdds = parseInt(best.odds, 10);
                const bOdds = parseInt(b.odds, 10);
                return bOdds > bestOdds ? b : best;
              }, filteredBooks[0]);
              return {
                ...pick,
                bestBook: newBest.name,
                bestOdds: newBest.odds,
                books: filteredBooks,
                allBooks: filteredAllBooks
              };
            }
            return null; // No valid books left
          }
          return {
            ...pick,
            books: filteredBooks,
            allBooks: filteredAllBooks
          };
        }).filter((pick) => pick !== null) as OddsPick[];
      };

      // Filter out arbitrage opportunities with less than 1% ROI
      const filterLowROIArbitrage = (picks: OddsPick[]) => {
        if (betType !== 'arbitrage') return picks;
        const filtered = picks.filter(pick => {
          const books = pick.allBooks || pick.books || [];
          const side1Odds = parseInt(String(pick.bestOdds).replace('+', ''), 10);
          const booksWithTeam2 = books.filter((b: OddsBook) => b.team2Odds && b.team2Odds !== '--');
          if (booksWithTeam2.length === 0) return false;
          
          const bestOppBook = booksWithTeam2.reduce((best: OddsBook, b: OddsBook) => {
            const bestOdds = parseInt(best.team2Odds, 10);
            const bOdds = parseInt(b.team2Odds, 10);
            return bOdds > bestOdds ? b : best;
          }, booksWithTeam2[0]);
          const side2Odds = parseInt(bestOppBook.team2Odds, 10);
          
          // Calculate ROI
          const toDecimal = (american: number) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
          const decimal1 = toDecimal(side1Odds);
          const decimal2 = toDecimal(side2Odds);
          const impliedProb1 = 1 / decimal1;
          const impliedProb2 = 1 / decimal2;
          const totalImplied = impliedProb1 + impliedProb2;
          const roi = totalImplied < 1 ? (1 - totalImplied) * 100 : 0;
          
          return roi >= 1; // Only keep picks with 1% or higher ROI
        });
        return filtered;
      };

      // DFS apps to exclude from middles (they don't offer traditional bets)
      // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds
      const DFS_APPS = ['underdog', 'prizepicks', 'sleeper', 'chalkboard', 'parlay', 'draftkings_pick6', 'betr', 'dabble', 'dabble_au'];
      
      // Filter for middles - find opportunities where you can bet OVER at a lower line
      // and UNDER at a higher line from DIFFERENT books, creating a "middle" gap
      const filterForMiddles = (picks: OddsPick[]) => {
        if (betType !== 'middles') return picks;
        
        // Group picks by game and market type
        const gameMarketGroups = new Map<string, any[]>();
        
        picks.forEach(pick => {
          const marketKey = pick.marketKey || '';
          const isSpread = marketKey.includes('spread');
          const isTotal = marketKey.includes('total') || pick.pick.includes('Over') || pick.pick.includes('Under');
          const isPlayerProp = pick.isPlayerProp || marketKey.includes('player_');
          
          if (!isSpread && !isTotal && !isPlayerProp) return;
          
          const marketType = isTotal ? 'total' : isSpread ? 'spread' : 'prop';
          const groupKey = `${pick.game}-${marketType}${isPlayerProp ? `-${pick.playerName || ''}` : ''}`;
          
          if (!gameMarketGroups.has(groupKey)) {
            gameMarketGroups.set(groupKey, []);
          }
          gameMarketGroups.get(groupKey)!.push(pick);
        });
        
        const filtered: any[] = [];
        
        gameMarketGroups.forEach((groupPicks, groupKey) => {
          // Collect all book offerings with their lines and sides (Over/Under)
          const offerings: { line: number; book: string; odds: string; isOver: boolean; pick: any }[] = [];
          
          groupPicks.forEach(pick => {
            const books = (pick.allBooks || pick.books || []).filter((b: any) => {
              const bookName = (b.name || '').toLowerCase();
              return !DFS_APPS.some(dfs => bookName.includes(dfs));
            });
            
            const isOver = pick.pick.includes('Over') || pick.pickSide === 'Over';
            const isUnder = pick.pick.includes('Under') || pick.pickSide === 'Under';
            
            // Only process if we can determine the side
            if (!isOver && !isUnder) return;
            
            books.forEach((b: any) => {
              const line = b.line ?? pick.line;
              if (line !== undefined && line !== null) {
                offerings.push({
                  line: Number(line),
                  book: b.name,
                  odds: b.odds,
                  isOver: isOver,
                  pick: pick
                });
              }
            });
          });
          
          if (offerings.length < 2) return;
          
          // Find OVER offerings and UNDER offerings
          const overOfferings = offerings.filter(o => o.isOver);
          const underOfferings = offerings.filter(o => !o.isOver);
          
          if (overOfferings.length === 0 || underOfferings.length === 0) return;
          
          // For a valid middle on totals:
          // - Need OVER at a LOWER line from one book
          // - Need UNDER at a HIGHER line from a DIFFERENT book
          // Example: Over 232.5 at BookA, Under 234.5 at BookB = 2 point middle
          
          let bestMiddle: { gap: number; overBook: any; underBook: any } | null = null;
          
          overOfferings.forEach(over => {
            underOfferings.forEach(under => {
              // Middle exists when Under line > Over line (from different books)
              const gap = under.line - over.line;
              
              // Must be different books and have a positive gap
              if (gap > 0 && over.book !== under.book) {
                if (!bestMiddle || gap > bestMiddle.gap) {
                  bestMiddle = { gap, overBook: over, underBook: under };
                }
              }
            });
          });
          
          // Only include if we found a valid middle with gap > 0
          if (!bestMiddle || bestMiddle.gap <= 0) return;
          
          const basePick = groupPicks[0];
          
          // Create the middle opportunity display
          filtered.push({
            ...basePick,
            middleGap: bestMiddle.gap,
            middleLines: [bestMiddle.overBook.line, bestMiddle.underBook.line],
            // Store the two sides of the middle for display
            middleSide1: {
              pick: `Over ${bestMiddle.overBook.line}`,
              book: bestMiddle.overBook.book,
              odds: bestMiddle.overBook.odds,
              line: bestMiddle.overBook.line
            },
            middleSide2: {
              pick: `Under ${bestMiddle.underBook.line}`,
              book: bestMiddle.underBook.book,
              odds: bestMiddle.underBook.odds,
              line: bestMiddle.underBook.line
            },
            books: [
              { name: bestMiddle.overBook.book, odds: bestMiddle.overBook.odds, line: bestMiddle.overBook.line, isBest: true, team2Odds: '--', ev: '--' },
              { name: bestMiddle.underBook.book, odds: bestMiddle.underBook.odds, line: bestMiddle.underBook.line, isBest: true, team2Odds: '--', ev: '--' }
            ],
            allBooks: offerings.map(o => ({
              name: o.book,
              line: o.line,
              odds: o.odds,
              team2Odds: '--',
              ev: '--',
              isBest: false,
              isOver: o.isOver
            }))
          });
        });
        
        // Sort by gap (highest first)
        filtered.sort((a, b) => (b.middleGap || 0) - (a.middleGap || 0));
        return filtered;
      };

      // Exchange books to use as sharp reference lines (Novig and ProphetX only)
      const EXCHANGE_BOOKS = ['novig', 'prophet', 'prophetx', 'prophet_exchange'];
      
      // Filter for exchanges - find bets where exchange books have worse odds than other sportsbooks
      // This works for both straight bets AND player props
      // This indicates +EV opportunities when you can get better odds elsewhere
      const filterForExchanges = (picks: OddsPick[]) => {
        if (betType !== 'exchanges') return picks;
        
        const filtered: OddsPick[] = [];
        let debugStats = { total: 0, noBooks: 0, noExchange: 0, noOther: 0, badOdds: 0, noBetter: 0, lowEdge: 0, passed: 0, pastGames: 0 };
        const now = new Date();
        
        picks.forEach(pick => {
          debugStats.total++;
          
          // Filter out past games - only show upcoming games
          const commenceTime = pick.commence_time || pick.commenceTime;
          if (commenceTime) {
            const gameTime = new Date(commenceTime);
            if (gameTime < now) {
              debugStats.pastGames++;
              return; // Skip past games
            }
          }
          
          const books = pick.allBooks || pick.books || [];
          if (books.length < 2) {
            debugStats.noBooks++;
            return;
          }
          
          // Find exchange book odds (these are the "sharp" reference lines)
          const exchangeBooks = books.filter((b: any) => {
            const bookName = (b.name || '').toLowerCase();
            return EXCHANGE_BOOKS.some(ex => bookName.includes(ex));
          });
          
          // Find non-exchange books
          const otherBooks = books.filter((b: any) => {
            const bookName = (b.name || '').toLowerCase();
            return !EXCHANGE_BOOKS.some(ex => bookName.includes(ex));
          });
          
          if (exchangeBooks.length === 0) {
            debugStats.noExchange++;
            return;
          }
          if (otherBooks.length === 0) {
            debugStats.noOther++;
            return;
          }
          
          const isPlayerProp = pick.isPlayerProp || pick.playerName;
          const toProb = (american: number) => american > 0 ? 100 / (american + 100) : -american / (-american + 100);
          
          // For player props, we need to check BOTH Over and Under sides
          // and pick the one with better edge vs the exchange
          if (isPlayerProp) {
            // Get exchange book's Over and Under odds
            const exchangeBook = exchangeBooks[0]; // Use first exchange book
            // For exchanges, we need the ACTUAL Over and Under odds, not the pre-selected side
            // The odds field contains the pre-selected side, team2Odds contains the other
            // overOdds/underOdds are the explicit Over/Under if available
            const exchOverRaw = exchangeBook.overOdds || exchangeBook.odds;
            const exchUnderRaw = exchangeBook.underOdds || exchangeBook.team2Odds;
            // Handle '--' string which means no odds available
            const exchangeOverOdds = (exchOverRaw && exchOverRaw !== '--') 
              ? (typeof exchOverRaw === 'string' ? parseInt(exchOverRaw, 10) : exchOverRaw)
              : NaN;
            const exchangeUnderOdds = (exchUnderRaw && exchUnderRaw !== '--')
              ? (typeof exchUnderRaw === 'string' ? parseInt(exchUnderRaw, 10) : exchUnderRaw)
              : NaN;
            const exchangeLine = exchangeBook.line;
            
            // SPECIAL CASE: One-sided market detection
            // If exchange only offers one side (e.g., Over at +134 but no Under),
            // the missing side is very likely to hit - they won't offer it
            const hasOnlyOver = !isNaN(exchangeOverOdds) && isNaN(exchangeUnderOdds);
            const hasOnlyUnder = isNaN(exchangeOverOdds) && !isNaN(exchangeUnderOdds);
            const isOneSidedMarket = hasOnlyOver || hasOnlyUnder;
            
            if (isNaN(exchangeOverOdds) && isNaN(exchangeUnderOdds)) {
              debugStats.badOdds++;
              return;
            }
            
            // Filter otherBooks by sportsbook filter if set (needed for both one-sided and normal processing)
            const filteredOtherBooks = sportsbooks && sportsbooks.length > 0
              ? otherBooks.filter((b: any) => {
                  const bookKey = (b.key || b.name || '').toLowerCase();
                  const bookName = (b.name || '').toLowerCase();
                  return sportsbooks.some(sb => {
                    const sbLower = sb.toLowerCase();
                    return bookKey.includes(sbLower) || bookName.includes(sbLower) || sbLower.includes(bookKey) || sbLower.includes(bookName);
                  });
                })
              : otherBooks;
            
            // If no filtered books match, skip this pick
            if (sportsbooks && sportsbooks.length > 0 && filteredOtherBooks.length === 0) {
              debugStats.noOther++;
              return;
            }
            
            // For one-sided markets, we want to bet the OPPOSITE side (the one exchange won't offer)
            if (isOneSidedMarket) {
              const missingSide = hasOnlyOver ? 'Under' : 'Over';
              const availableSide = hasOnlyOver ? 'Over' : 'Under';
              const exchangeAvailableOdds = hasOnlyOver ? exchangeOverOdds : exchangeUnderOdds;
              
              // Find the best odds for the MISSING side from filtered books
              let bestMissingSideBook: any = null;
              let bestMissingSideOdds = -9999;
              
              filteredOtherBooks.forEach((b: any) => {
                // Only compare books with same line
                if (exchangeLine !== undefined && b.line !== undefined) {
                  if (Math.abs(b.line - exchangeLine) > 0.5) return;
                }
                
                // Get the missing side odds
                const missingSideOddsRaw = missingSide === 'Under' 
                  ? (b.underOdds || b.team2Odds)
                  : (b.overOdds || b.odds);
                const missingSideOdds = (missingSideOddsRaw && missingSideOddsRaw !== '--')
                  ? (typeof missingSideOddsRaw === 'string' ? parseInt(missingSideOddsRaw, 10) : missingSideOddsRaw)
                  : NaN;
                
                if (!isNaN(missingSideOdds) && missingSideOdds > bestMissingSideOdds) {
                  bestMissingSideOdds = missingSideOdds;
                  bestMissingSideBook = { ...b, odds: missingSideOddsRaw };
                }
              });
              
              if (bestMissingSideBook) {
                // Calculate implied edge - exchange won't offer this side, so it's likely +EV
                // Use a high confidence indicator since exchange refuses to offer this side
                const impliedEdge = 15; // High confidence signal
                
                const line = pick.line || exchangeLine;
                let newPickDescription: string;
                
                if (pick.isPlayerProp && pick.playerName) {
                  // Player prop: "Player Name Over 6.5 Market"
                  const marketName = (pick as any).marketName || (pick.marketKey ? formatMarketName(pick.marketKey) : '') || '';
                  newPickDescription = `${pick.playerName} ${missingSide} ${line} ${marketName}`.trim();
                } else {
                  // Game market (totals): "Over 6.5" or spreads: "Team +3.5"
                  newPickDescription = `${missingSide} ${line}`;
                }
                
                
                debugStats.passed++;
                filtered.push({
                  ...pick,
                  pick: newPickDescription,
                  pickSide: missingSide,
                  bestOdds: String(bestMissingSideOdds),
                  bestBook: bestMissingSideBook.name,
                  ev: `${impliedEdge.toFixed(1)}%`,
                  exchangeOdds: `${availableSide} only: ${exchangeAvailableOdds}`,
                  exchangeBook: exchangeBook.name,
                  edgeVsExchange: impliedEdge,
                  isOneSidedMarket: true,
                  oneSidedInfo: `Exchange only offers ${availableSide}`,
                  books: [
                    { ...bestMissingSideBook, isBest: true, ev: `${impliedEdge.toFixed(1)}%` },
                    { ...exchangeBook, odds: `${availableSide}: ${exchangeAvailableOdds}`, isBest: false, ev: 'N/A', isExchange: true, oneSided: true },
                    ...filteredOtherBooks.filter((b: any) => b.name !== bestMissingSideBook.name).slice(0, 3)
                  ],
                  allBooks: books
                } as any);
              }
              return; // Skip normal processing for one-sided markets
            }
            
            // Find best Over and Under odds from other books (at same line)
            // filteredOtherBooks was already defined above for one-sided market check
            let bestOverBook: any = null;
            let bestUnderBook: any = null;
            let bestOverOdds = -9999;
            let bestUnderOdds = -9999;
            
            filteredOtherBooks.forEach((b: any) => {
              // Only compare books with same line
              if (exchangeLine !== undefined && b.line !== undefined) {
                if (Math.abs(b.line - exchangeLine) > 0.5) return;
              }
              
              // Parse odds - handle both string and number formats
              // For player props, overOdds/underOdds contain the actual Over/Under odds
              // Handle '--' string which means no odds available
              const overOddsRaw = b.overOdds || b.odds;
              const underOddsRaw = b.underOdds || b.team2Odds;
              const overOdds = (overOddsRaw && overOddsRaw !== '--')
                ? (typeof overOddsRaw === 'string' ? parseInt(overOddsRaw, 10) : overOddsRaw)
                : NaN;
              const underOdds = (underOddsRaw && underOddsRaw !== '--')
                ? (typeof underOddsRaw === 'string' ? parseInt(underOddsRaw, 10) : underOddsRaw)
                : NaN;
              
              if (!isNaN(overOdds) && overOdds > bestOverOdds) {
                bestOverOdds = overOdds;
                bestOverBook = { ...b, odds: b.overOdds || b.odds };
              }
              if (!isNaN(underOdds) && underOdds > bestUnderOdds) {
                bestUnderOdds = underOdds;
                bestUnderBook = { ...b, odds: b.underOdds || b.team2Odds };
              }
            });
            
            // Calculate edge for both sides
            // CRITICAL: For +EV, the filtered book must have BETTER odds than exchange
            // Better odds = higher number (less negative or more positive)
            // e.g., -104 is better than -119, so -104 > -119
            // We want: filteredBookOdds > exchangeOdds (filtered book beats exchange)
            let overEdge = 0;
            let underEdge = 0;
            
            // Only calculate edge if filtered book BEATS exchange (higher odds number)
            // CRITICAL: For +EV, filtered book odds must be HIGHER (less negative) than exchange
            // e.g., -104 (exchange) vs -119 (filtered) -> -119 > -104 is FALSE, no edge
            // e.g., -130 (exchange) vs -119 (filtered) -> -119 > -130 is TRUE, has edge
            if (bestOverBook && !isNaN(exchangeOverOdds) && bestOverOdds > exchangeOverOdds) {
              const exchangeProb = toProb(exchangeOverOdds);
              const otherProb = toProb(bestOverOdds);
              overEdge = ((exchangeProb - otherProb) / otherProb) * 100;
            }
            
            if (bestUnderBook && !isNaN(exchangeUnderOdds) && bestUnderOdds > exchangeUnderOdds) {
              const exchangeProb = toProb(exchangeUnderOdds);
              const otherProb = toProb(bestUnderOdds);
              underEdge = ((exchangeProb - otherProb) / otherProb) * 100;
            }
            
            // Pick the side with better edge - BOTH must be checked
            const bestEdge = Math.max(overEdge, underEdge);
            
            
            if (bestEdge < 1) {
              debugStats.lowEdge++;
              return;
            }
            
            const isOverBetter = overEdge >= underEdge;
            const bestBook = isOverBetter ? bestOverBook : bestUnderBook;
            const bestOdds = isOverBetter ? bestOverOdds : bestUnderOdds;
            const exchangeOddsForSide = isOverBetter ? exchangeOverOdds : exchangeUnderOdds;
            const pickSide = isOverBetter ? 'Over' : 'Under';
            
            if (!bestBook) {
              debugStats.noBetter++;
              return;
            }
            
            debugStats.passed++;
            
            // Update pick description to reflect correct side
            const line = pick.line || exchangeLine;
            let newPickDescription: string;
            
            if (pick.isPlayerProp && pick.playerName) {
              // Player prop: "Player Name Over 6.5 Market"
              const marketName = (pick as any).marketName || (pick.marketKey ? formatMarketName(pick.marketKey) : '') || '';
              newPickDescription = `${pick.playerName} ${pickSide} ${line} ${marketName}`.trim();
            } else {
              // Game market (totals): "Over 6.5" or spreads: "Team +3.5"
              newPickDescription = `${pickSide} ${line}`;
            }
            
            filtered.push({
              ...pick,
              pick: newPickDescription,
              pickSide: pickSide,
              bestOdds: String(bestOdds),
              bestBook: bestBook.name,
              ev: `${bestEdge.toFixed(1)}%`,
              exchangeOdds: String(exchangeOddsForSide),
              exchangeBook: exchangeBook.name,
              edgeVsExchange: bestEdge,
              books: [
                { ...bestBook, isBest: true, ev: `${bestEdge.toFixed(1)}%` },
                { ...exchangeBook, odds: String(exchangeOddsForSide), isBest: false, ev: '0%', isExchange: true },
                ...otherBooks.filter((b: any) => b.name !== bestBook.name).slice(0, 3)
              ],
              allBooks: books
            } as any);
          } else {
            // Non-player prop logic (straight bets) - use original logic
            const bestExchangeBook = exchangeBooks.reduce((best: any, book: any) => {
              const bestOdds = parseInt(best.odds, 10);
              const bookOdds = parseInt(book.odds, 10);
              return bookOdds > bestOdds ? book : best;
            }, exchangeBooks[0]);
            
            const exchangeOdds = parseInt(bestExchangeBook.odds, 10);
            
            if (isNaN(exchangeOdds)) {
              debugStats.badOdds++;
              return;
            }
            
            // Filter otherBooks by sportsbook filter if set (same as player props)
            const filteredOtherBooks = sportsbooks && sportsbooks.length > 0
              ? otherBooks.filter((b: any) => {
                  const bookKey = (b.key || b.name || '').toLowerCase();
                  const bookName = (b.name || '').toLowerCase();
                  return sportsbooks.some(sb => {
                    const sbLower = sb.toLowerCase();
                    return bookKey.includes(sbLower) || bookName.includes(sbLower) || sbLower.includes(bookKey) || sbLower.includes(bookName);
                  });
                })
              : otherBooks;
            
            // If no filtered books match, skip this pick
            if (sportsbooks && sportsbooks.length > 0 && filteredOtherBooks.length === 0) {
              debugStats.noOther++;
              return;
            }
            
            // Find books with better odds than the exchange
            const betterBooks = filteredOtherBooks.filter((b: any) => {
              const bookOdds = parseInt(b.odds, 10);
              if (isNaN(bookOdds)) return false;
              return bookOdds > exchangeOdds;
            });
            
            if (betterBooks.length === 0) {
              debugStats.noBetter++;
              return;
            }
            
            const bestOtherBook = betterBooks.reduce((best: any, book: any) => {
              const bestOdds = parseInt(best.odds, 10);
              const bookOdds = parseInt(book.odds, 10);
              return bookOdds > bestOdds ? book : best;
            }, betterBooks[0]);
            
            const bestOtherOdds = parseInt(bestOtherBook.odds, 10);
            const exchangeProb = toProb(exchangeOdds);
            const otherProb = toProb(bestOtherOdds);
            const edge = ((exchangeProb - otherProb) / otherProb) * 100;
            
            if (edge < 1) {
              debugStats.lowEdge++;
              return;
            }
            
            debugStats.passed++;
            
            filtered.push({
              ...pick,
              bestOdds: bestOtherBook.odds,
              bestBook: bestOtherBook.name,
              ev: `${edge.toFixed(1)}%`,
              exchangeOdds: bestExchangeBook.odds,
              exchangeBook: bestExchangeBook.name,
              edgeVsExchange: edge,
              books: [
                { ...bestOtherBook, isBest: true, ev: `${edge.toFixed(1)}%` },
                { ...bestExchangeBook, isBest: false, ev: '0%', isExchange: true },
                ...otherBooks.filter((b: any) => b.name !== bestOtherBook.name).slice(0, 3)
              ],
              allBooks: books
            } as any);
          }
        });
        
        // Sort by edge (highest first)
        filtered.sort((a: any, b: any) => (b.edgeVsExchange || 0) - (a.edgeVsExchange || 0));
        
        return filtered;
      };

      // Filter out Dabble from alternate market picks (their alternate lines are often stale/low EV)
      const filterDabbleFromAlternates = (picks: OddsPick[]) => {
        return picks.filter(pick => {
          // Completely exclude any alternate market pick where Dabble is involved
          if (pick.isAlternate) {
            const hasDabble = (pick.books || []).some((b: OddsBook) => 
              b.name.toLowerCase().includes('dabble')
            );
            if (hasDabble) {
              return false; // Filter out entire pick if Dabble is in the books
            }
          }
          return true;
        });
      };

      // Filter out player props for straight bets mode
      // This is a safeguard in case the server returns player props data
      const filterPlayerPropsForStraightBets = (picks: OddsPick[]) => {
        if (betType !== 'straight') return picks;
        return picks.filter(pick => !pick.isPlayerProp);
      };

      // Filter out stale/expired bets (those with game times in the past)
      const filterExpiredBets = (picks: OddsPick[]) => {
        const now = new Date();
        const filtered = picks.filter(pick => {
          // Skip filtering for player props - they don't have reliable game times
          if (pick.isPlayerProp) return true;
          
          const gameTime = pick.commenceTime || pick.gameTime;
          if (!gameTime) return true; // Keep picks without game time info
          
          const gameDate = new Date(gameTime);
          return gameDate > now; // Keep only future games
        });
        
        if (DEBUG_LOGGING && filtered.length < picks.length) {
          console.log(`⏰ filterExpiredBets: Removed ${picks.length - filtered.length} expired picks`);
        }
        return filtered;
      };
      
      if (response.data && Array.isArray(response.data)) {
        let transformedPicks = transformOddsApiToOddsPick(response.data, sportsbooks);
        transformedPicks = filterUnderForDFS(transformedPicks);
        transformedPicks = filterByMinDataPoints(transformedPicks);
        transformedPicks = filterDabbleFromAlternates(transformedPicks);
        transformedPicks = filterPlayerPropsForStraightBets(transformedPicks);
        transformedPicks = filterUnibetForArbitrage(transformedPicks);
        transformedPicks = filterLowROIArbitrage(transformedPicks);
        transformedPicks = filterForMiddles(transformedPicks);
        transformedPicks = filterForExchanges(transformedPicks);
        transformedPicks = filterExpiredBets(transformedPicks);
        setPicks(transformedPicks);
        setLastUpdated(new Date());
        if (DEBUG_LOGGING) {
          console.log('✅ Odds data fetched:', transformedPicks.length, 'picks');
        }
      } else if (response.data && response.data.picks && Array.isArray(response.data.picks)) {
        let transformedPicks = transformOddsApiToOddsPick(response.data.picks, sportsbooks);
        transformedPicks = filterUnderForDFS(transformedPicks);
        transformedPicks = filterByMinDataPoints(transformedPicks);
        transformedPicks = filterDabbleFromAlternates(transformedPicks);
        transformedPicks = filterPlayerPropsForStraightBets(transformedPicks);
        transformedPicks = filterUnibetForArbitrage(transformedPicks);
        transformedPicks = filterLowROIArbitrage(transformedPicks);
        transformedPicks = filterForMiddles(transformedPicks);
        transformedPicks = filterForExchanges(transformedPicks);
        transformedPicks = filterExpiredBets(transformedPicks);
        setPicks(transformedPicks);
        setLastUpdated(new Date());
        if (DEBUG_LOGGING) {
          console.log('✅ Odds data fetched:', transformedPicks.length, 'picks');
        }
      } else {
        console.warn('⚠️ Unexpected response format');
        setError('Invalid response format from API');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch odds data';
      console.error('❌ Error fetching odds:', errorMessage);
      if (DEBUG_LOGGING && betType === 'props') {
        console.error('🏈 Player props error - Status:', err.response?.status);
      }
      setError(errorMessage);
      // Only clear picks on initial load errors, preserve existing data during auto-refresh failures
      if (!isAutoRefresh) {
        setPicks([]);
      } else {
        console.log('⚠️ Auto-refresh failed, keeping existing data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isInitialLoadRef.current = false;
    }
  }, [enabled, sport, date, marketType, betType, sportsbooks, limit, minDataPoints]);

  // Initial fetch and when dependencies change
  useEffect(() => {
    isInitialLoadRef.current = true;
    fetchOddsData(false);
  }, [fetchOddsData]);

  // Auto-refresh interval
  useEffect(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Set up auto-refresh if enabled (use refs for auth state to prevent re-triggering)
    if (autoRefresh && enabled && userRef.current && !authLoadingRef.current) {
      if (DEBUG_LOGGING) console.log(`🔄 Auto-refresh enabled: refreshing every ${refreshInterval / 1000}s`);
      refreshTimerRef.current = setInterval(() => {
        fetchOddsData(true);
      }, refreshInterval);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, enabled, fetchOddsData]);

  return {
    picks,
    loading,
    error,
    refetch: () => fetchOddsData(false),
    lastUpdated,
    isRefreshing,
  };
}
