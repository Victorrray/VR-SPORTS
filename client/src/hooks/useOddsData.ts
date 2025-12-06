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
  allBooks?: OddsBook[];  // For compatibility with mini table
  gameTime?: string;  // ISO 8601 format (e.g., "2025-11-18T19:00:00Z")
  commenceTime?: string;  // Alias for gameTime
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
}

export interface UseOddsDataResult {
  picks: OddsPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
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
    'DraftKings Pick6': 'DK Pick6',
    'draftkings_pick6': 'DK Pick6',
    'pick6': 'DK Pick6',
    'Hard Rock Bet': 'Hard Rock',
    'hardrockbet': 'Hard Rock',
    'theScore Bet': 'TheScore',
    'thescorebet': 'TheScore',
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
      const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au', 'sleeper'];
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
      
      // Filter out stale bookmakers (odds not updated in the last 30 minutes)
      const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();
      
      // Collect ALL books for the mini table (no filtering here)
      bookmakers.forEach((bm: any) => {
        const bookKey = bm.key || '';
        const bookName = normalizeBookName(bm.title || bm.key);
        
        // Check if bookmaker data is stale
        const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
        const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
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
            
            // Debug: Log when Under is missing or same as Over
            if (overOutcome && !underOutcome) {
              console.log(`⚠️ Missing Under for ${playerName} at ${bookName}:`, outcomes.map(o => o.name));
            }
            
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
              const dfsApps = ['prizepicks', 'underdog', 'pick6', 'betr_us_dfs', 'dabble_au', 'sleeper'];
              const isDFS = dfsApps.includes(bookKey?.toLowerCase());
              const overOdds = isDFS ? '-119' : normalizeAmericanOdds(overOutcome.price);
              const underOdds = isDFS ? '-119' : (underOutcome ? normalizeAmericanOdds(underOutcome.price) : null);
              
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
      
      // Log player props summary
      console.log(`🏈 Player props found: ${playerPropsMap.size} unique props`);
      if (playerPropsMap.size > 0) {
        const firstProp = playerPropsMap.values().next().value;
        console.log(`🏈 Sample prop books count: ${firstProp?.books?.length}, books:`, firstProp?.books?.map((b: any) => b.name));
      }
      
      // Convert player props map to picks
      playerPropsMap.forEach((propData, pickKey) => {
        if (propData.books.length === 0) return;
        
        // DFS apps that offer pick'em style betting (not traditional odds)
        // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds
        const dfsAppKeys = ['prizepicks', 'underdog', 'pick6', 'betr_us_dfs', 'dabble_au', 'sleeper'];
        
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
        
        // CRITICAL: If user filtered for specific sportsbooks but none of them have this prop, skip it
        if (userHasFilter && !hasFilteredBooks) {
          return; // Don't show picks where the filtered sportsbook doesn't offer the line
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
        
        if (booksForMainCard.length === 0) return; // Skip if no books at consensus line
        
        // Calculate EV for BOTH Over and Under to determine which side is better
        const MIN_BOOKS_FOR_EV = 4;
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
        
        if (allBooksWithValidOverOdds.length === 0) return; // Skip if no valid odds
        
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
        
        // Determine which side is better (higher EV)
        // DFS apps only offer Over bets, so if the best book is a DFS app, force Over
        const bestOverBookIsDFS = dfsAppKeys.includes(bestOverBook?.key?.toLowerCase());
        const bestUnderBookIsDFS = bestUnderBook ? dfsAppKeys.includes(bestUnderBook?.key?.toLowerCase()) : false;
        
        // Check if we have a forced side from the filter logic
        const forcedSide = (propData as any).forceSide;
        
        // If Under would be chosen but the best Under book is a DFS app (which doesn't offer Under), use Over instead
        let isOverBetter = overEV >= underEV || !hasEnoughUnderData;
        
        // Force Over if the best book for the card would be a DFS app and we'd pick Under
        // DFS apps don't offer Under bets
        if (!isOverBetter && bestUnderBookIsDFS) {
          console.log(`⚠️ Forcing Over for ${propData.playerName}: Under was better EV but best Under book is DFS app`);
          isOverBetter = true;
        }
        
        // If user has a filter and the filtered book only has best odds for one side,
        // we MUST use that side. If EV says otherwise, skip this pick.
        if (forcedSide) {
          const evWantsSide = isOverBetter ? 'Over' : 'Under';
          if (evWantsSide !== forcedSide) {
            // EV calculation wants a different side than what the filtered book has best odds for
            // Skip this pick - the filtered book doesn't have the best odds for the better EV side
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
        
        const displayBooks = booksAtExactConsensus.map((b: any) => {
          return {
            name: b.name,
            rawName: b.name,
            line: b.line,
            odds: b.overOdds,
            team2Odds: b.underOdds || '--',
            ev: hasEnoughData ? '0%' : '--',
            isBest: b.name === bestBookForCard.name && b.line === bestBookForCard.line,
            isAtConsensus: true
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
        
        // Get the best odds for the chosen side
        const bestOddsForPick = isOverBetter ? bestBookForCard.overOdds : bestBookForCard.underOdds;
        
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
      
      // Filter out stale bookmakers (odds not updated in the last 30 minutes)
      const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
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
          
          // Check if bookmaker data is stale
          const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
          if (isStale) return; // Skip stale bookmakers
          
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
          
          // Get the point/line for spreads and totals
          if ((marketKey === 'spreads' || marketKey === 'totals') && awayOutcome?.point !== undefined) {
            marketPoint = awayOutcome.point;
          }
          
          const odds = awayOutcome?.price !== undefined ? awayOutcome.price : awayOutcome?.odds;
          const team2Odds = homeOutcome ? (homeOutcome.price !== undefined ? homeOutcome.price : homeOutcome.odds) : null;
          
          // Normalize and validate odds
          const normalizedOdds = normalizeAmericanOdds(odds);
          const normalizedTeam2Odds = team2Odds ? normalizeAmericanOdds(team2Odds) : null;
          
          // Skip books with invalid odds
          if (normalizedOdds && odds !== undefined && odds !== null) {
            const bookData = {
              name: bookName,
              key: bookKey,
              odds: normalizedOdds,
              team2Odds: normalizedTeam2Odds || '--',
              ev: '0%',
              isBest: false
            };
            
            booksArray.push(bookData);
            if (isBookIncluded(bookKey, bookName)) {
              filteredBooksArray.push({ ...bookData });
            }
          }
        });
        
        // Skip this market if no books have odds for it
        if (booksArray.length === 0) return;
        
        // ALWAYS find the best odds across ALL books (not just filtered ones)
        const bestBookDataOverall = booksArray.reduce((best: any, book: any) => {
          const bestOddsNum = parseInt(best.odds, 10);
          const bookOddsNum = parseInt(book.odds, 10);
          // Higher is better for American odds (both positive and negative)
          return bookOddsNum > bestOddsNum ? book : best;
        }, booksArray[0]);
        
        let bestOdds = bestBookDataOverall.odds;
        let bestBook = bestBookDataOverall.name;
        let ev = '0%';
        
        // Check if user has a filter applied
        const userHasFilter = selectedSportsbooks && selectedSportsbooks.length > 0;
        const hasFilteredBooks = filteredBooksArray.length > 0;
        
        // If user filtered for specific books, only show picks where filtered book has the BEST odds
        if (userHasFilter) {
          if (!hasFilteredBooks) {
            return; // Skip - the filtered book doesn't have this market at all
          }
          
          // Find the best book among filtered books
          const bestFilteredBook = filteredBooksArray.reduce((best: any, book: any) => {
            const bestOddsNum = parseInt(best.odds, 10);
            const bookOddsNum = parseInt(book.odds, 10);
            return bookOddsNum > bestOddsNum ? book : best;
          }, filteredBooksArray[0]);
          
          const filteredOdds = parseInt(bestFilteredBook.odds, 10);
          const overallBestOdds = parseInt(bestOdds, 10);
          
          // Skip if filtered book doesn't have the best odds
          if (filteredOdds < overallBestOdds) {
            return; // Skip - another book has better odds
          }
          
          // Use the filtered book as the best book for display
          bestOdds = bestFilteredBook.odds;
          bestBook = bestFilteredBook.name;
        }
        
        // Calculate EV - require minimum 4 books for meaningful EV calculation
        const MIN_BOOKS_FOR_EV = 4;
        const numericOdds = booksArray.map(b => parseInt(b.odds, 10)).filter(o => !isNaN(o));
        const hasEnoughData = numericOdds.length >= MIN_BOOKS_FOR_EV;
        
        if (hasEnoughData) {
          const toProb = (american: number) => american > 0 ? 100 / (american + 100) : -american / (-american + 100);
          const probs = numericOdds.map(toProb);
          const avgProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
          const bestOddsNum = parseInt(bestOdds, 10);
          if (!isNaN(bestOddsNum)) {
            const bestProb = toProb(bestOddsNum);
            const edge = ((avgProb - bestProb) / bestProb) * 100;
            ev = `${Math.abs(Math.round(edge * 100) / 100).toFixed(2)}%`;
            
            booksArray.forEach(b => {
              const o = parseInt(b.odds, 10);
              if (!isNaN(o)) {
                const p = toProb(o);
                const bookEdge = ((avgProb - p) / p) * 100;
                b.ev = `${(Math.round(bookEdge * 100) / 100).toFixed(2)}%`;
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
          commenceTime: game.commence_time || game.gameTime || undefined
        });
      });
      
      // Process soccer-specific markets (h2h_3_way, draw_no_bet, btts)
      soccerMarkets.forEach(marketKey => {
        const booksArray: any[] = [];
        
        bookmakers.forEach((bm: any) => {
          const bookKey = bm.key || '';
          const bookName = normalizeBookName(bm.title || bm.key);
          
          // Check if bookmaker data is stale
          const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
          if (isStale) return;
          
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
            
            const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
            const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
            if (isStale) return;
            
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
            
            const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
            const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
            if (isStale) return;
            
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
          
          const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
          if (isStale) return;
          
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
          
          const lastUpdate = bm.last_update ? new Date(bm.last_update).getTime() : now;
          const isStale = (now - lastUpdate) > STALE_THRESHOLD_MS;
          if (isStale) return;
          
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
        // Soccer - major leagues with player props support (limited to avoid rate limits)
        'soccer': 'soccer_epl,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_italy_serie_a,soccer_france_ligue_one,soccer_usa_mls,soccer_uefa_champs_league,soccer_uefa_europa_league,soccer_mexico_ligamx,soccer_netherlands_eredivisie,soccer_portugal_primeira_liga,soccer_spl',
      };
      
      // Map frontend filters to backend parameter names
      // Default sports if not specified (include NCAA sports and major soccer leagues)
      const sportsList = sport && sport !== 'all' 
        ? (sportKeyMap[sport] || sport)
        : 'americanfootball_nfl,americanfootball_ncaaf,basketball_nba,basketball_ncaab,baseball_mlb,icehockey_nhl,soccer_epl,soccer_usa_mls,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_italy_serie_a,soccer_france_ligue_one,soccer_uefa_champs_league';
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
          
          // 1st Half markets (all sports)
          case '1st_half': return 'h2h_h1,spreads_h1,totals_h1';
          
          // 2nd Half markets
          case '2nd_half': return 'h2h_h2,spreads_h2,totals_h2';
          
          // 1st Quarter markets (NFL, NBA)
          case '1st_quarter': return 'h2h_q1,spreads_q1,totals_q1';
          
          // 1st Period markets (NHL)
          case '1st_period': return 'h2h_p1,spreads_p1,totals_p1';
          
          // Soccer markets
          case 'btts': return 'btts';
          case 'draw_no_bet': return 'draw_no_bet';
          case 'double_chance': return 'double_chance';
          case 'alternate_totals_corners': return 'alternate_totals_corners';
          case 'alternate_totals_cards': return 'alternate_totals_cards';
          
          // All markets - request ALL available markets for the sport
          case 'all':
          default: {
            // Base markets for all sports
            const baseMarkets = ['h2h', 'spreads', 'totals', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'];
            
            // Sport-specific period markets
            const sportMarkets: { [key: string]: string[] } = {
              // NFL & NCAAF - quarters and halves
              'americanfootball_nfl': [
                'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4', 'h2h_h1', 'h2h_h2',
                'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4', 'spreads_h1', 'spreads_h2',
                'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4', 'totals_h1', 'totals_h2',
                'alternate_spreads_q1', 'alternate_spreads_h1',
                'alternate_totals_q1', 'alternate_totals_h1',
                'team_totals_q1', 'team_totals_h1'
              ],
              'americanfootball_ncaaf': [
                'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4', 'h2h_h1', 'h2h_h2',
                'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4', 'spreads_h1', 'spreads_h2',
                'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4', 'totals_h1', 'totals_h2',
                'alternate_spreads_q1', 'alternate_spreads_h1',
                'alternate_totals_q1', 'alternate_totals_h1',
                'team_totals_q1', 'team_totals_h1'
              ],
              // NBA & NCAAB - quarters and halves
              'basketball_nba': [
                'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4', 'h2h_h1', 'h2h_h2',
                'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4', 'spreads_h1', 'spreads_h2',
                'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4', 'totals_h1', 'totals_h2',
                'alternate_spreads_q1', 'alternate_spreads_h1',
                'alternate_totals_q1', 'alternate_totals_h1',
                'team_totals_q1', 'team_totals_h1'
              ],
              'basketball_ncaab': [
                'h2h_h1', 'h2h_h2',
                'spreads_h1', 'spreads_h2',
                'totals_h1', 'totals_h2',
                'alternate_spreads_h1', 'alternate_totals_h1',
                'team_totals_h1'
              ],
              // NHL - periods
              'icehockey_nhl': [
                'h2h_p1', 'h2h_p2', 'h2h_p3',
                'spreads_p1', 'spreads_p2', 'spreads_p3',
                'totals_p1', 'totals_p2', 'totals_p3',
                'alternate_spreads_p1', 'alternate_totals_p1',
                'team_totals_p1'
              ],
              // MLB - innings
              'baseball_mlb': [
                'h2h_1st_1_innings', 'h2h_1st_3_innings', 'h2h_1st_5_innings',
                'spreads_1st_1_innings', 'spreads_1st_3_innings', 'spreads_1st_5_innings',
                'totals_1st_1_innings', 'totals_1st_3_innings', 'totals_1st_5_innings'
              ],
              // Soccer leagues - halves and soccer-specific markets
              'soccer_epl': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards'],
              'soccer_usa_mls': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards'],
              'soccer_spain_la_liga': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards'],
              'soccer_germany_bundesliga': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards'],
              'soccer_italy_serie_a': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards'],
              'soccer_france_ligue_one': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards'],
              'soccer_uefa_champs_league': ['h2h_h1', 'h2h_h2', 'spreads_h1', 'totals_h1', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance', 'alternate_totals_corners', 'alternate_totals_cards']
            };
            
            // Get sport-specific markets
            const additionalMarkets = sportMarkets[sportKey] || [];
            
            // If multiple sports (all), include common period markets
            if (sportKey.includes(',') || !sportKey) {
              // For "all sports", include quarter and half markets (most common)
              const allSportsMarkets = [
                'h2h_q1', 'h2h_h1', 'spreads_q1', 'spreads_h1', 'totals_q1', 'totals_h1',
                'h2h_p1', 'spreads_p1', 'totals_p1' // NHL periods
              ];
              return [...baseMarkets, ...allSportsMarkets].join(',');
            }
            
            return [...baseMarkets, ...additionalMarkets].join(',');
          }
        }
      };
      
      const marketsList = getMarketsForFilter(marketType || 'all', sportsList);
      params.append('markets', marketsList);
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

      // DFS apps that only offer Over bets (no Under)
      // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds
      const dfsAppsNoUnder = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'betr', 'betr_us_dfs', 'dabble', 'dabble_au', 'sleeper'];
      const isDFSOnlyFilter = sportsbooks && sportsbooks.length > 0 && 
        sportsbooks.every(sb => dfsAppsNoUnder.includes(sb.toLowerCase()));
      
      // Filter function to remove Under picks when only DFS apps are selected
      const filterUnderForDFS = (picks: OddsPick[]) => {
        if (!isDFSOnlyFilter) return picks;
        
        const filtered = picks.filter(pick => {
          // For player props, check if it's an Under pick
          if (pick.isPlayerProp && pick.pickSide === 'Under') {
            console.log(`🚫 Filtering out Under pick for DFS filter: ${pick.pick}`);
            return false;
          }
          return true;
        });
        
        console.log(`🎮 DFS filter: Removed ${picks.length - filtered.length} Under picks`);
        return filtered;
      };
      
      // Filter picks by minimum data points (book count)
      const filterByMinDataPoints = (picks: OddsPick[]) => {
        if (minDataPoints <= 1) return picks; // No filtering needed
        return picks.filter(pick => {
          const bookCount = pick.books?.length || pick.bookCount || 0;
          return bookCount >= minDataPoints;
        });
      };
      
      if (response.data && Array.isArray(response.data)) {
        let transformedPicks = transformOddsApiToOddsPick(response.data, sportsbooks);
        transformedPicks = filterUnderForDFS(transformedPicks);
        transformedPicks = filterByMinDataPoints(transformedPicks);
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
        let transformedPicks = transformOddsApiToOddsPick(response.data.picks, sportsbooks);
        transformedPicks = filterUnderForDFS(transformedPicks);
        transformedPicks = filterByMinDataPoints(transformedPicks);
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
