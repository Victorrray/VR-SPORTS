import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight, ArrowUp, ArrowDown, Check, Lock, Crown, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { useNavigate } from 'react-router-dom';
import { useOddsData, getSportLabel } from '../../hooks/useOddsData';
import { PlayerPropsPage } from './PlayerPropsPage';
import { toast } from 'sonner';
import { formatOdds as convertOdds } from '../../utils/oddsConverter';

// Generate date options: All Upcoming, Today (with day name), then next 6 days
function generateDateOptions() {
  const options = [{ id: 'all_upcoming', name: 'All Upcoming' }];
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = dayNames[date.getDay()];
    // Use local date format (YYYY-MM-DD) to match filtering
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (i === 0) {
      options.push({ id: dateStr, name: `Today (${dayName})` });
    } else if (i === 1) {
      options.push({ id: dateStr, name: `Tomorrow (${dayName})` });
    } else {
      options.push({ id: dateStr, name: dayName });
    }
  }
  
  return options;
}

// formatOdds is now imported from oddsConverter and used via the hook below

// Helper function to parse odds string/number to numeric value
const parseOdds = (odds: any): number => {
  if (typeof odds === 'number') return odds;
  if (typeof odds === 'string') {
    const cleaned = odds.replace('+', '');
    return parseInt(cleaned, 10);
  }
  return NaN;
};

// Helper function to calculate average odds from books array
// Uses implied probability to properly average odds (can't just average American odds directly)
const calculateAverageOdds = (books: any[]): string => {
  if (!books || books.length === 0) return '--';
  
  // Parse odds using the helper
  const numericOdds = books
    .map(b => parseOdds(b.odds))
    .filter(o => !isNaN(o) && (o <= -100 || o >= 100)); // Only valid American odds
  
  if (numericOdds.length === 0) return '--';
  
  // Convert to implied probability, average, then convert back
  const toProb = (american: number) => {
    if (american > 0) return 100 / (american + 100);
    return -american / (-american + 100);
  };
  
  const toAmerican = (prob: number) => {
    // Ensure valid American odds (minimum -100 or +100)
    if (prob >= 0.5) {
      const odds = Math.round(-100 * prob / (1 - prob));
      return Math.min(odds, -100); // Ensure at least -100
    }
    const odds = Math.round(100 * (1 - prob) / prob);
    return Math.max(odds, 100); // Ensure at least +100
  };
  
  // Average the probabilities
  const avgProb = numericOdds.reduce((sum, o) => sum + toProb(o), 0) / numericOdds.length;
  
  // Convert back to American odds
  const avgOdds = toAmerican(avgProb);
  return avgOdds > 0 ? `+${avgOdds}` : String(avgOdds);
};

// Helper function to calculate devig (no-vig/fair) odds
// Uses the multiplicative method to remove vig
const calculateDevigOdds = (books: any[]): string => {
  if (!books || books.length < 2) return '--';
  
  // Get all odds pairs (team1 and team2)
  const oddsPairs = books
    .filter(b => b.odds && b.team2Odds && b.odds !== '--' && b.team2Odds !== '--')
    .map(b => ({
      odds1: parseOdds(b.odds),
      odds2: parseOdds(b.team2Odds)
    }))
    .filter(p => !isNaN(p.odds1) && !isNaN(p.odds2) && 
                 (p.odds1 <= -100 || p.odds1 >= 100) && 
                 (p.odds2 <= -100 || p.odds2 >= 100)); // Only valid American odds
  
  if (oddsPairs.length === 0) return '--';
  
  // Convert American odds to implied probability
  const toProb = (american: number) => {
    if (american > 0) return 100 / (american + 100);
    return -american / (-american + 100);
  };
  
  // Convert probability back to American odds
  const toAmerican = (prob: number) => {
    // Ensure valid American odds (minimum -100 or +100)
    if (prob >= 0.5) {
      const odds = Math.round(-100 * prob / (1 - prob));
      return Math.min(odds, -100); // Ensure at least -100
    }
    const odds = Math.round(100 * (1 - prob) / prob);
    return Math.max(odds, 100); // Ensure at least +100
  };
  
  // Calculate average implied probabilities
  let totalProb1 = 0;
  let totalProb2 = 0;
  oddsPairs.forEach(p => {
    totalProb1 += toProb(p.odds1);
    totalProb2 += toProb(p.odds2);
  });
  const avgProb1 = totalProb1 / oddsPairs.length;
  const avgProb2 = totalProb2 / oddsPairs.length;
  
  // Remove vig by normalizing probabilities to sum to 1
  const totalProb = avgProb1 + avgProb2;
  const fairProb1 = avgProb1 / totalProb;
  
  // Convert fair probability back to American odds
  const fairOdds = toAmerican(fairProb1);
  return fairOdds > 0 ? `+${fairOdds}` : String(fairOdds);
};

export function OddsPage({ onAddPick, savedPicks = [] }: { onAddPick: (pick: any) => void, savedPicks?: any[] }) {
  const { colorMode, oddsFormat } = useTheme();
  const isLight = colorMode === 'light';
  
  // Format odds based on user's selected format
  const formatOdds = (odds: any): string => convertOdds(odds, oddsFormat);
  const { me, loading: meLoading } = useMe();
  const navigate = useNavigate();
  
  // Check if user has a paid plan (gold or platinum)
  const hasPaidPlan = me?.plan === 'gold' || me?.plan === 'platinum' || me?.unlimited === true;
  const hasPlatinum = me?.plan === 'platinum' || me?.unlimited === true;
  
  // Load cached filters from localStorage
  const FILTERS_CACHE_KEY = 'vr-odds-filters';
  const getCachedFilters = () => {
    try {
      const cached = localStorage.getItem(FILTERS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to load cached filters:', e);
    }
    return null;
  };
  const cachedFilters = getCachedFilters();
  
  const [selectedSport, setSelectedSport] = useState(cachedFilters?.sport || 'all');
  const [selectedMarket, setSelectedMarket] = useState(cachedFilters?.market || 'all');
  const [selectedBetType, setSelectedBetType] = useState(cachedFilters?.betType || 'straight');
  const [expandedRows, setExpandedRows] = useState<(string | number)[]>([]);
  const [expandedSportsbooks, setExpandedSportsbooks] = useState<(string | number)[]>([]);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [isBetTypeDropdownOpen, setIsBetTypeDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(cachedFilters?.date || 'all_upcoming');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>(cachedFilters?.sportsbooks || []);
  
  // Close filter with animation
  const closeFilterMenu = () => {
    setIsFilterClosing(true);
    setTimeout(() => {
      setIsFilterMenuOpen(false);
      setIsFilterClosing(false);
    }, 280);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [arbitrageStake, setArbitrageStake] = useState(100);
  const [sortBy, setSortBy] = useState<'ev' | 'time' | null>('ev');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateExpanded, setDateExpanded] = useState(false);
  const [dateClosing, setDateClosing] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [sportClosing, setSportClosing] = useState(false);
  const [betTypeExpanded, setBetTypeExpanded] = useState(false);
  const [marketExpanded, setMarketExpanded] = useState(false);
  const [marketClosing, setMarketClosing] = useState(false);
  const [sportsbooksExpanded, setSportsbooksExpanded] = useState(false);
  const [sportsbooksClosing, setSportsbooksClosing] = useState(false);
  const [addedPicks, setAddedPicks] = useState<(string | number)[]>([]); // Track which picks have been added
  
  // Close handlers with animation for sub-filters
  const closeDateDrawer = () => {
    setDateClosing(true);
    setTimeout(() => { setDateExpanded(false); setDateClosing(false); }, 280);
  };
  const closeSportDrawer = () => {
    setSportClosing(true);
    setTimeout(() => { setSportExpanded(false); setSportClosing(false); }, 280);
  };
  const closeMarketDrawer = () => {
    setMarketClosing(true);
    setTimeout(() => { setMarketExpanded(false); setMarketClosing(false); }, 280);
  };
  const closeSportsbooksDrawer = () => {
    setSportsbooksClosing(true);
    setTimeout(() => { setSportsbooksExpanded(false); setSportsbooksClosing(false); }, 280);
  };
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [minDataPoints, setMinDataPoints] = useState(cachedFilters?.minDataPoints || 4);

  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      const filtersToCache = {
        sport: selectedSport,
        market: selectedMarket,
        betType: selectedBetType,
        date: selectedDate,
        sportsbooks: selectedSportsbooks,
        minDataPoints: minDataPoints
      };
      localStorage.setItem(FILTERS_CACHE_KEY, JSON.stringify(filtersToCache));
    } catch (e) {
      console.warn('Failed to cache filters:', e);
    }
  }, [selectedSport, selectedMarket, selectedBetType, selectedDate, selectedSportsbooks, minDataPoints]);

  // Generate date options dynamically
  const dateOptions = useMemo(() => generateDateOptions(), []);

  // Fetch real odds data from API
  const { picks: apiPicks, loading: apiLoading, error: apiError, refetch } = useOddsData({
    sport: selectedSport,
    marketType: selectedMarket,
    betType: selectedBetType,
    sportsbooks: selectedSportsbooks,
    date: selectedDate,
    minDataPoints: minDataPoints,
    enabled: true
  });

  // Filter picks by selected date
  const dateFilteredPicks = useMemo(() => {
    if (!apiPicks || apiPicks.length === 0) return [];
    
    // If "all_upcoming" is selected, show all games (no date filter)
    if (selectedDate === 'all_upcoming') {
      return apiPicks;
    }
    
    // Debug: Log all game dates
    console.log('🗓️ Selected date:', selectedDate);
    console.log('🗓️ All picks with dates:', apiPicks.map(p => ({
      game: p.game,
      commenceTime: p.commenceTime,
      gameTime: p.gameTime
    })));
    
    // Filter by specific date (YYYY-MM-DD format in local timezone)
    const filtered = apiPicks.filter(pick => {
      // If no game time, include the pick (don't filter it out)
      if (!pick.commenceTime && !pick.gameTime) return true;
      
      const gameDate = new Date(pick.commenceTime || pick.gameTime || '');
      // Use local date to match user's timezone
      const year = gameDate.getFullYear();
      const month = String(gameDate.getMonth() + 1).padStart(2, '0');
      const day = String(gameDate.getDate()).padStart(2, '0');
      const gameDateStr = `${year}-${month}-${day}`;
      
      return gameDateStr === selectedDate;
    });
    
    console.log('🗓️ Filtered picks count:', filtered.length);
    return filtered;
  }, [apiPicks, selectedDate]);

  // Use date-filtered picks
  const topPicks = dateFilteredPicks;
  const isLoading = apiLoading;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedSport, selectedMarket, selectedBetType, selectedDate]);

  // Auto-refresh effect - refresh odds every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing odds data...');
      refetch();
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [autoRefresh, refetch]);

  const sports = [
    { id: 'all', name: 'All Sports', count: 124, active: true },
    { id: 'ncaa-football', name: 'NCAA Football', count: 45, active: false },
    { id: 'nfl', name: 'NFL', count: 12, active: false },
    { id: 'nba', name: 'NBA', count: 18, active: false },
    { id: 'nhl', name: 'NHL', count: 24, active: false },
    { id: 'ncaa-basketball', name: 'NCAA Basketball', count: 25, active: false },
    { id: 'soccer', name: 'Soccer', count: 50, active: false },
  ];

  const betTypes = [
    { id: 'straight', name: 'Straight Bets' },
    { id: 'props', name: 'Player Props' },
    { id: 'arbitrage', name: 'Arbitrage' },
    { id: 'middles', name: 'Middles' }
  ];

  const marketTypes = [
    { id: 'all', name: 'All Markets' },
    // Standard Markets
    { id: 'moneyline', name: 'Moneyline' },
    { id: 'spread', name: 'Spread' },
    { id: 'totals', name: 'Totals (Over/Under)' },
    // Alternate Markets
    { id: 'alternate_spreads', name: 'Alternate Spreads' },
    { id: 'alternate_totals', name: 'Alternate Totals' },
    { id: 'team_totals', name: 'Team Totals' },
    // Period Markets
    { id: '1st_half', name: '1st Half' },
    { id: '2nd_half', name: '2nd Half' },
    { id: '1st_quarter', name: '1st Quarter' },
    { id: '1st_period', name: '1st Period (NHL)' },
    // Soccer Markets
    { id: 'btts', name: 'Both Teams to Score' },
    { id: 'draw_no_bet', name: 'Draw No Bet' },
    { id: 'double_chance', name: 'Double Chance' },
    { id: 'alternate_totals_corners', name: 'Total Corners' },
    { id: 'alternate_totals_cards', name: 'Total Cards' },
  ];

  const sportsbooksByTier = [
    {
      tier: '🎮 DFS & Pick\'em',
      books: [
        { id: 'prizepicks', name: 'PrizePicks' },
        { id: 'underdog', name: 'Underdog' },
        { id: 'pick6', name: 'DK Pick6' },
        { id: 'dabble_au', name: 'Dabble' },
        { id: 'betr_us_dfs', name: 'Betr' },
      ]
    },
    {
      tier: '📱 Major Sportsbooks',
      books: [
        { id: 'draftkings', name: 'DraftKings' },
        { id: 'fanduel', name: 'FanDuel' },
        { id: 'betmgm', name: 'BetMGM' },
        { id: 'caesars', name: 'Caesars' },
        { id: 'espnbet', name: 'ESPN BET' },
        { id: 'fanatics', name: 'Fanatics' },
      ]
    },
    {
      tier: '🏆 More Sportsbooks',
      books: [
        { id: 'hardrock', name: 'Hard Rock' },
        { id: 'betrivers', name: 'BetRivers' },
        { id: 'pointsbet', name: 'PointsBet' },
        { id: 'wynnbet', name: 'WynnBET' },
        { id: 'unibet', name: 'Unibet' },
        { id: 'fliff', name: 'Fliff' },
      ]
    },
    {
      tier: '📊 Sharp Books',
      books: [
        { id: 'pinnacle', name: 'Pinnacle' },
        { id: 'novig', name: 'NoVig' },
        { id: 'circa', name: 'Circa Sports' },
      ]
    },
    {
      tier: '💱 Exchanges',
      books: [
        { id: 'kalshi', name: 'Kalshi' },
        { id: 'prophetx', name: 'ProphetX' },
        { id: 'rebet', name: 'ReBet' },
        { id: 'betopenly', name: 'BetOpenly' },
      ]
    },
    {
      tier: '🌐 Offshore',
      books: [
        { id: 'bovada', name: 'Bovada' },
        { id: 'betonline', name: 'BetOnline' },
        { id: 'mybookie', name: 'MyBookie' },
      ]
    }
  ];

  const toggleRow = (id: string | number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSportsbook = (id: string | number) => {
    setExpandedSportsbooks(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSportsbookFilter = (bookId: string) => {
    setSelectedSportsbooks(prev =>
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };

  // Check if a pick has been added
  const isPickAdded = (pickData: any, bookName: string) => {
    return savedPicks.some(savedPick => 
      savedPick.pick === pickData.pick && 
      savedPick.sportsbook === bookName &&
      savedPick.teams === pickData.game
    );
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Create a map of sportsbook IDs to names and API keys for matching
  const sportsbookMap: Record<string, string[]> = {};
  // Map filter IDs to all possible API keys and display names
  const apiKeyAliases: Record<string, string[]> = {
    'pick6': ['pick6', 'draftkings_pick6', 'dk pick6', 'dkpick6'],
    'betr_us_dfs': ['betr', 'betrdfs', 'betr_us_dfs', 'betr dfs'],
    'dabble_au': ['dabble', 'dabble_au'],
    'prizepicks': ['prizepicks'],
    'underdog': ['underdog'],
    'draftkings': ['draftkings'],
    'fanduel': ['fanduel'],
    'betmgm': ['betmgm'],
    'caesars': ['caesars', 'williamhill_us'],
    'espnbet': ['espnbet', 'espn_bet'],
    'fanatics': ['fanatics'],
    'hardrock': ['hardrock', 'hardrockbet', 'hard rock'],
    'betrivers': ['betrivers'],
    'pointsbet': ['pointsbet', 'pointsbetus'],
    'wynnbet': ['wynnbet'],
    'unibet': ['unibet', 'unibet_us'],
    'fliff': ['fliff'],
    'pinnacle': ['pinnacle'],
    'novig': ['novig'],
    'circa': ['circa', 'circasports'],
    'kalshi': ['kalshi'],
    'prophetx': ['prophetx', 'prophet_exchange'],
    'rebet': ['rebet'],
    'betopenly': ['betopenly'],
    'bovada': ['bovada'],
    'betonline': ['betonline', 'betonlineag'],
    'mybookie': ['mybookie', 'mybookieag'],
    'lowvig': ['lowvig', 'lowvig.ag'],
  };
  
  sportsbooksByTier.forEach(tier => {
    tier.books.forEach(book => {
      if (!sportsbookMap[book.id]) {
        sportsbookMap[book.id] = [];
      }
      // Add the display name
      sportsbookMap[book.id].push(book.name.toLowerCase());
      // Add all API key aliases
      const aliases = apiKeyAliases[book.id] || [book.id];
      aliases.forEach(alias => {
        if (!sportsbookMap[book.id].includes(alias.toLowerCase())) {
          sportsbookMap[book.id].push(alias.toLowerCase());
        }
      });
    });
  });

  // Filter picks based on selections
  const filteredPicks = topPicks.filter(pick => {
    // Filter by sport - compare against readable sport label from getSportLabel
    if (selectedSport !== 'all') {
      // Map filter IDs to readable sport labels (as returned by getSportLabel)
      const sportLabelMap: Record<string, string[]> = {
        'nfl': ['NFL'],
        'nba': ['NBA'],
        'nhl': ['NHL'],
        'mlb': ['MLB'],
        'ncaa-football': ['NCAA Football'],
        'ncaa-basketball': ['NCAA Basketball'],
        'soccer': ['Soccer']  // Soccer label
      };
      
      const allowedLabels = sportLabelMap[selectedSport] || [];
      // For soccer, also check if sport starts with 'soccer_' (API key format)
      const matches = allowedLabels.some(label => pick.sport === label) || 
        (selectedSport === 'soccer' && pick.sport?.toLowerCase().startsWith('soccer'));
      
      if (!matches) {
        return false;
      }
    }
    
    // Filter by market type
    if (selectedMarket !== 'all') {
      const marketKey = pick.marketKey || '';
      
      // Map filter IDs to market keys
      const marketMatches = (() => {
        switch (selectedMarket) {
          case 'moneyline':
            return marketKey === 'h2h' || marketKey.startsWith('h2h_') && !marketKey.includes('3_way');
          case 'spread':
            return marketKey === 'spreads' || (marketKey.startsWith('spreads_') && !marketKey.includes('alternate'));
          case 'totals':
            return marketKey === 'totals' || (marketKey.startsWith('totals_') && !marketKey.includes('alternate') && !marketKey.includes('team'));
          case 'alternate_spreads':
            return marketKey.includes('alternate_spreads');
          case 'alternate_totals':
            return marketKey.includes('alternate_totals') && !marketKey.includes('team');
          case 'team_totals':
            return marketKey.includes('team_totals');
          case '1st_half':
            return marketKey.includes('_h1');
          case '2nd_half':
            return marketKey.includes('_h2');
          case '1st_quarter':
            return marketKey.includes('_q1');
          case '1st_period':
            return marketKey.includes('_p1');
          case 'btts':
            return marketKey === 'btts';
          case 'draw_no_bet':
            return marketKey === 'draw_no_bet';
          default:
            return true;
        }
      })();
      
      if (!marketMatches) {
        return false;
      }
    }
    
    // Filter by sportsbooks (if any selected, check if pick has at least one selected book)
    if (selectedSportsbooks.length > 0) {
      const hasSelectedBook = pick.books.some(book => {
        const bookNameLower = book.name.toLowerCase();
        return selectedSportsbooks.some(selectedId => {
          const matchingNames = sportsbookMap[selectedId] || [];
          return matchingNames.some(name => bookNameLower.includes(name) || name.includes(bookNameLower));
        });
      });
      
      if (!hasSelectedBook) {
        return false;
      }
    }
    
    return true;
  });

  // Create display picks with filtered books for main table, but keep original books for expanded view
  const displayPicks = filteredPicks.map(pick => {
    let displayBooks = pick.books;
    if (selectedSportsbooks.length > 0) {
      displayBooks = pick.books.filter(book => {
        const bookNameLower = book.name.toLowerCase();
        return selectedSportsbooks.some(selectedId => {
          const matchingNames = sportsbookMap[selectedId] || [];
          return matchingNames.some(name => bookNameLower.includes(name) || name.includes(bookNameLower));
        });
      });
    }

    // Recalculate bestBook and bestOdds based on filtered books
    let bestBook = pick.bestBook;
    let bestOdds = pick.bestOdds;
    
    if (displayBooks.length > 0) {
      // Find the best odds from filtered books
      const bestBookData = displayBooks.reduce((best, current) => {
        const currentOdds = typeof current.odds === 'number' ? current.odds : parseInt(current.odds) || 0;
        const bestOddsNum = typeof best.odds === 'number' ? best.odds : parseInt(best.odds) || 0;
        // For positive odds, higher is better. For negative odds, closer to 0 is better
        if (currentOdds > 0 && bestOddsNum > 0) {
          return currentOdds > bestOddsNum ? current : best;
        } else if (currentOdds < 0 && bestOddsNum < 0) {
          return currentOdds > bestOddsNum ? current : best;
        } else if (currentOdds > 0) {
          return current;
        }
        return best;
      });
      
      bestBook = bestBookData.name;
      bestOdds = typeof bestBookData.odds === 'number' ? (bestBookData.odds > 0 ? `+${bestBookData.odds}` : bestBookData.odds) : (typeof bestBookData.odds === 'string' && !bestBookData.odds.startsWith('-') && !bestBookData.odds.startsWith('+') && bestBookData.odds !== '--' ? `+${bestBookData.odds}` : bestBookData.odds);
    } else {
      // Format bestOdds even if no filtered books (use original)
      bestOdds = typeof bestOdds === 'number' ? (bestOdds > 0 ? `+${bestOdds}` : bestOdds) : (typeof bestOdds === 'string' && !bestOdds.startsWith('-') && !bestOdds.startsWith('+') && bestOdds !== '--' ? `+${bestOdds}` : bestOdds);
    }

    // Sort allBooks to put the best book first
    const sortedAllBooks = [...pick.books].sort((a, b) => {
      // Best book (matching bestBook name) should always be first
      const aIsBest = a.name === bestBook;
      const bIsBest = b.name === bestBook;
      if (aIsBest && !bIsBest) return -1;
      if (!aIsBest && bIsBest) return 1;
      // Then sort by odds (highest/best first)
      const aOdds = typeof a.odds === 'number' ? a.odds : parseInt(a.odds) || 0;
      const bOdds = typeof b.odds === 'number' ? b.odds : parseInt(b.odds) || 0;
      return bOdds - aOdds;
    });

    return {
      ...pick,
      displayBooks: displayBooks,
      allBooks: sortedAllBooks, // Sorted with best book first
      bestBook: bestBook,
      bestOdds: bestOdds
    };
  });

  // Sort display picks
  const sortedPicks = [...displayPicks].sort((a, b) => {
    if (!sortBy) return 0;
    
    if (sortBy === 'ev') {
      const aEV = parseFloat(a.ev.replace('%', ''));
      const bEV = parseFloat(b.ev.replace('%', ''));
      return sortDirection === 'desc' ? bEV - aEV : aEV - bEV;
    }
    
    return 0;
  });

  // Paginate sorted picks
  const paginatedPicks = sortedPicks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(sortedPicks.length / itemsPerPage);

  // Skeleton Loader Component
  const SkeletonRow = () => (
    <div className={`p-4 ${isLight ? 'bg-white' : 'bg-white/5'} animate-pulse`}>
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-2">
          <div className={`h-6 w-16 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
        </div>
        <div className="lg:col-span-3">
          <div className={`h-4 w-20 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg mb-2`}></div>
          <div className={`h-5 w-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
        </div>
        <div className="lg:col-span-3">
          <div className={`h-5 w-32 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
        </div>
        <div className="lg:col-span-2">
          <div className={`h-5 w-24 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
        </div>
        <div className="lg:col-span-2">
          <div className={`h-5 w-16 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
        </div>
      </div>
      <div className="lg:hidden space-y-3">
        <div className={`h-8 w-48 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
        <div className={`h-6 w-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-lg`}></div>
      </div>
    </div>
  );

  // Empty State Component
  const EmptyState = () => (
    <div className="py-16 px-4 text-center">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isLight ? 'bg-gray-100' : 'bg-white/5'} flex items-center justify-center`}>
        <Search className={`w-8 h-8 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
      </div>
      <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-xl mb-2`}>
        No odds found
      </h3>
      <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold mb-4`}>
        Try adjusting your filters to see more betting opportunities
      </p>
      <button
        onClick={() => {
          setSelectedSport('all');
          setSelectedMarket('all');
          setSelectedBetType('straight');
          setSelectedDate('all_upcoming');
        }}
        className={`px-6 py-2.5 ${isLight ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-white hover:from-purple-500/30 hover:to-indigo-500/30'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
      >
        Clear All Filters
      </button>
    </div>
  );

  // Paywall Component for Free Users
  const PaywallOverlay = () => (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className={`max-w-lg w-full text-center ${isLight ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-slate-900/90 to-purple-900/30 border-white/10'} border rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl`}>
        {/* Lock Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border-purple-400/30'} border flex items-center justify-center`}>
          <Lock className={`w-10 h-10 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
        </div>
        
        {/* Title */}
        <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Unlock Premium Odds
        </h2>
        
        {/* Description */}
        <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-medium mb-8 text-base md:text-lg`}>
          Get access to real-time odds comparison, +EV betting opportunities, and line shopping across 15+ sportsbooks.
        </p>
        
        {/* Features List */}
        <div className={`${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-2xl p-6 mb-8 text-left`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-green-100' : 'bg-green-500/20'} flex items-center justify-center`}>
                <Check className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <span className={`font-bold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>Real-time odds from 15+ sportsbooks</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-green-100' : 'bg-green-500/20'} flex items-center justify-center`}>
                <Check className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <span className={`font-bold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>+EV bet identification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-green-100' : 'bg-green-500/20'} flex items-center justify-center`}>
                <Check className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <span className={`font-bold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>Line shopping & best odds alerts</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-green-100' : 'bg-green-500/20'} flex items-center justify-center`}>
                <Check className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <span className={`font-bold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>Player props & alternate lines</span>
            </div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscribe')}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Gold - $10/mo
          </button>
          <button
            onClick={() => navigate('/subscribe')}
            className={`w-full py-3 px-6 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white/80'} font-bold rounded-xl transition-all flex items-center justify-center gap-2`}
          >
            <Sparkles className="w-4 h-4" />
            View All Plans
          </button>
        </div>
        
        {/* Money-back guarantee */}
        <p className={`mt-6 text-sm ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
          ✨ Plans pay for themselves in 2-3 weeks
        </p>
      </div>
    </div>
  );

  // Show paywall for free users (after loading completes)
  if (!meLoading && !hasPaidPlan) {
    return <PaywallOverlay />;
  }

  // Show PlayerPropsPage when props are selected
  if (selectedBetType === 'props') {
    return (
      <div className="space-y-6">
        <div className="relative">
          <button
            onClick={() => setIsBetTypeDropdownOpen(!isBetTypeDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              isLight 
                ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <span className="font-bold text-2xl md:text-3xl">
              {betTypes.find(b => b.id === selectedBetType)?.name || 'All Bets'}
            </span>
            <ChevronDown className={`w-6 h-6 transition-transform ${isBetTypeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu - Positioned relative to button */}
          {isBetTypeDropdownOpen && (
            <div className={`absolute top-full mt-2 left-0 w-64 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-white/10'} border rounded-xl overflow-hidden z-40 shadow-xl`}>
              {betTypes.map((betType) => (
                <button
                  key={betType.id}
                  onClick={() => {
                    setSelectedBetType(betType.id);
                    setIsBetTypeDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left font-bold transition-all flex items-center justify-between ${
                    selectedBetType === betType.id
                      ? isLight 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'bg-purple-500/10 text-purple-300'
                      : isLight 
                        ? 'text-gray-700 hover:bg-gray-50' 
                        : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span>{betType.name}</span>
                  {selectedBetType === betType.id && (
                    <Check className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Backdrop - Rendered outside relative container */}
        {isBetTypeDropdownOpen && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsBetTypeDropdownOpen(false)}
          />
        )}

        <PlayerPropsPage onAddPick={onAddPick} savedPicks={savedPicks} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Bet Type Heading */}
      <div className="relative">
        <button
          onClick={() => setIsBetTypeDropdownOpen(!isBetTypeDropdownOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            isLight 
              ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          <span className="font-bold text-2xl md:text-3xl">
            {betTypes.find(b => b.id === selectedBetType)?.name || 'All Bets'}
          </span>
          <ChevronDown className={`w-6 h-6 transition-transform ${isBetTypeDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu - Positioned relative to button */}
        {isBetTypeDropdownOpen && (
          <div className={`absolute top-full mt-2 left-0 w-64 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-white/10'} border rounded-xl overflow-hidden z-40 shadow-xl`}>
            {betTypes.map((betType) => (
              <button
                key={betType.id}
                onClick={() => {
                  setSelectedBetType(betType.id);
                  setIsBetTypeDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-left font-bold transition-all flex items-center justify-between ${
                  selectedBetType === betType.id
                    ? isLight 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'bg-purple-500/10 text-purple-300'
                    : isLight 
                      ? 'text-gray-700 hover:bg-gray-50' 
                      : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <span>{betType.name}</span>
                {selectedBetType === betType.id && (
                  <Check className="w-5 h-5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop - Rendered outside relative container */}
      {isBetTypeDropdownOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsBetTypeDropdownOpen(false)}
        />
      )}

      {/* Bet Type Quick Filters */}
      

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
            <input 
              type="text"
              placeholder="Search..."
              className={`w-full h-[44px] pl-10 pr-4 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/40 focus:bg-white/10'} backdrop-blur-2xl border rounded-xl focus:outline-none font-bold transition-all text-sm`}
            />
          </div>
          <div className="flex items-center justify-center gap-2 overflow-x-auto overflow-y-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide w-full md:w-auto">
            {/* Filters Button - Opens side panel to filter odds by sport, market type, bet type, and date
                - Shows purple/active styling when filters are applied or panel is open
                - Displays a badge with count of active filters when any non-default filters are selected
                - Default filters: All Sports, All Markets, Straight Bets, Today */}
            <button 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-2xl border rounded-xl transition-all font-bold whitespace-nowrap text-sm ${
                isFilterMenuOpen || selectedSport !== 'all' || selectedMarket !== 'all' || selectedBetType !== 'straight' || selectedDate !== 'today'
                  ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-white'
                  : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Manual Refresh Button */}
            <button 
              onClick={() => {
                refetch();
                toast.success('Refreshing odds...', {
                  description: 'Fetching latest odds data'
                });
              }}
              disabled={isLoading}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-xl border rounded-xl transition-all font-bold whitespace-nowrap text-sm ${
                isLoading
                  ? isLight ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Pagination Controls - Mobile only */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-[44px] h-[44px] backdrop-blur-2xl border rounded-xl transition-all font-bold ${
                  currentPage === 1
                    ? isLight ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              
              <div className={`flex items-center gap-2 h-[44px] px-4 ${isLight ? 'bg-white border-gray-300' : 'bg-white/5 border-white/10'} backdrop-blur-2xl border rounded-xl`}>
                <span className={`${isLight ? 'text-gray-700' : 'text-white'} font-bold text-sm whitespace-nowrap`}>
                  {currentPage} / {totalPages}
                </span>
              </div>

              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center w-[44px] h-[44px] backdrop-blur-2xl border rounded-xl transition-all font-bold ${
                  currentPage === totalPages
                    ? isLight ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Controls - Desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-[44px] h-[44px] backdrop-blur-2xl border rounded-xl transition-all font-bold ${
              currentPage === 1
                ? isLight ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          
          <div className={`flex items-center gap-2 h-[44px] px-4 ${isLight ? 'bg-white border-gray-300' : 'bg-white/5 border-white/10'} backdrop-blur-2xl border rounded-xl`}>
            <span className={`${isLight ? 'text-gray-700' : 'text-white'} font-bold text-sm whitespace-nowrap`}>
              {currentPage} / {totalPages}
            </span>
          </div>

          <button 
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-[44px] h-[44px] backdrop-blur-2xl border rounded-xl transition-all font-bold ${
              currentPage === totalPages
                ? isLight ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Side Panel */}
      {isFilterMenuOpen && (
        <>
          {/* Backdrop - full screen overlay */}
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-md z-[100] transition-opacity duration-300 ${isFilterClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeFilterMenu}
          />
          
          {/* Side Panel - Desktop / Bottom Drawer - Mobile */}
          <div 
            className={`fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:h-auto max-lg:pb-24 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl lg:border-r border-t lg:border-t-0 z-[101] lg:rounded-none rounded-t-3xl flex flex-col ${isFilterClosing ? 'animate-out max-lg:slide-out-to-bottom lg:slide-out-to-left duration-300' : 'animate-in max-lg:slide-in-from-bottom lg:slide-in-from-left duration-300'} lg:top-0 lg:left-0 lg:bottom-0 lg:w-80 lg:h-screen`}
          >
            {/* Sticky Header */}
            <div className={`sticky top-0 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} z-10 p-6 pb-4 space-y-4 lg:border-b border-b-0`}>
              {/* Drag Handle - Mobile Only */}
              <div className="lg:hidden flex justify-center -mt-3 mb-2">
                <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-xl`}>Filters</h3>
                <button
                  onClick={closeFilterMenu}
                  className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                >
                  <ChevronRight className="w-5 h-5 lg:block hidden" />
                  <span className="lg:hidden text-lg">✕</span>
                </button>
              </div>
              
              {/* Apply and Reset Buttons - Mobile Only */}
              <div className="flex lg:hidden gap-2">
                <button
                  onClick={closeFilterMenu}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${
                    isLight 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                  }`}
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setSelectedSport('all');
                    setSelectedMarket('all');
                    setSelectedBetType('straight');
                    setSelectedDate('today');
                    setSelectedSportsbooks([]);
                    setMinDataPoints(4);
                    toast.success('Filters reset', {
                      description: 'All filters have been cleared'
                    });
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${
                    isLight 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Content - auto height on mobile, scrollable on desktop */}
            <div className="lg:overflow-y-auto lg:flex-1 p-6 pt-4 space-y-5">

              {/* Auto Refresh Toggle - Platinum Only */}
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 flex items-center gap-2`}>
                  Auto Refresh
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Crown className="w-3 h-3 inline mr-0.5" />
                    PLATINUM
                  </span>
                </label>
                <div className={`flex items-center justify-between p-4 ${isLight ? 'bg-white border border-gray-300' : 'bg-white/5 border border-white/10'} backdrop-blur-xl rounded-xl ${!hasPlatinum ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <RefreshCw className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                    <div>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>Auto Refresh Odds</div>
                      <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold`}>
                        {hasPlatinum ? 'Update every 30 seconds' : 'Upgrade to Platinum to enable'}
                      </div>
                    </div>
                  </div>
                  <label className={`relative inline-flex items-center ${!hasPlatinum ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={hasPlatinum && autoRefresh}
                      onChange={(e) => hasPlatinum && setAutoRefresh(e.target.checked)}
                      disabled={!hasPlatinum}
                    />
                    <div className={`w-11 h-6 ${isLight ? 'bg-gray-200' : 'bg-white/10'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500 ${!hasPlatinum ? 'cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>
              </div>

              {/* Minimum Data Points Slider - Hidden for arbitrage */}
              {selectedBetType !== 'arbitrage' && (
                <div>
                  <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                    Minimum Data Points
                  </label>
                  <div className={`p-4 ${isLight ? 'bg-white border border-gray-300' : 'bg-white/5 border border-white/10'} backdrop-blur-xl rounded-xl`}>
                    <div className="flex items-center gap-3">
                      <span className={`${isLight ? 'text-gray-500' : 'text-white/40'} text-xs font-bold`}>1</span>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={minDataPoints}
                        onChange={(e) => setMinDataPoints(parseInt(e.target.value))}
                        className={`flex-1 h-2 rounded-full appearance-none cursor-pointer ${isLight ? 'bg-gray-200' : 'bg-white/10'} accent-purple-500`}
                        style={{
                          background: `linear-gradient(to right, ${isLight ? '#9333ea' : '#a855f7'} 0%, ${isLight ? '#9333ea' : '#a855f7'} ${((minDataPoints - 1) / 14) * 100}%, ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} ${((minDataPoints - 1) / 14) * 100}%, ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} 100%)`
                        }}
                      />
                      <div className={`${isLight ? 'text-purple-600 bg-purple-100' : 'text-purple-300 bg-purple-500/20'} px-2 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center`}>
                        {minDataPoints === 15 ? 'MAX' : minDataPoints}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Filter */}
              <div className="relative">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Date
                </label>
                <button
                  onClick={() => setDateExpanded(!dateExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>
                    {dateOptions.find(d => d.id === selectedDate)?.name || 'All Upcoming'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dateExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {dateExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden max-h-64 overflow-y-auto`}>
                    {dateOptions.map((date) => (
                      <button
                        key={date.id}
                        onClick={() => {
                          setSelectedDate(date.id);
                          setDateExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all ${
                          selectedDate === date.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {date.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Drawer - Mobile Only */}
              {dateExpanded && (
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ${dateClosing ? 'opacity-0' : 'opacity-100'}`}
                    style={{ top: '-50px', left: 0, right: 0, bottom: 0, height: 'calc(100vh + 50px)', width: '100vw' }}
                    onClick={closeDateDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden ${dateClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Date</h3>
                        <button
                          onClick={closeDateDrawer}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)]">
                      {dateOptions.map((date) => (
                        <button
                          key={date.id}
                          onClick={() => {
                            setSelectedDate(date.id);
                            setDateExpanded(false);
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all ${
                            selectedDate === date.id
                              ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {date.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Sportsbooks Filter */}
              <div className="relative">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Sportsbooks
                </label>
                <button
                  onClick={() => setSportsbooksExpanded(!sportsbooksExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>
                    {selectedSportsbooks.length === 0 
                      ? 'All Sportsbooks' 
                      : selectedSportsbooks.length === 1 
                        ? sportsbooksByTier.flatMap(t => t.books).find(b => b.id === selectedSportsbooks[0])?.name
                        : `${selectedSportsbooks.length} selected`
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sportsbooksExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {sportsbooksExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden max-h-80 overflow-y-auto`}>
                    {sportsbooksByTier.map((tierGroup, tierIndex) => (
                      <div key={tierIndex}>
                        {/* Tier Header */}
                        <div className={`px-4 py-2 ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-white/50'} text-xs font-bold uppercase tracking-wider`}>
                          {tierGroup.tier}
                        </div>
                        {/* Sportsbooks in this tier */}
                        {tierGroup.books.map((book) => (
                          <button
                            key={book.id}
                            onClick={() => toggleSportsbookFilter(book.id)}
                            className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                              selectedSportsbooks.includes(book.id)
                                ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                                : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <span>{book.name}</span>
                            {selectedSportsbooks.includes(book.id) && (
                              <div className={`w-4 h-4 rounded ${isLight ? 'bg-purple-600' : 'bg-purple-400'} flex items-center justify-center`}>
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sportsbooks Drawer - Mobile Only */}
              {sportsbooksExpanded && (
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ${sportsbooksClosing ? 'opacity-0' : 'opacity-100'}`}
                    style={{ top: '-50px', left: 0, right: 0, bottom: 0, height: 'calc(100vh + 50px)', width: '100vw' }}
                    onClick={closeSportsbooksDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[70vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden ${sportsbooksClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Sportsbooks</h3>
                        <button
                          onClick={closeSportsbooksDrawer}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options - Grouped by Tier */}
                    <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
                      {sportsbooksByTier
                        .filter(tierGroup => {
                          // Hide DFS & Pick'em category when in straight bets mode
                          if (selectedBetType === 'straight' && tierGroup.tier.includes('DFS')) {
                            return false;
                          }
                          return true;
                        })
                        .map((tierGroup, tierIndex) => (
                        <div key={tierIndex}>
                          {/* Tier Header */}
                          <div className={`px-6 py-2 ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-white/50'} text-xs font-bold uppercase tracking-wider`}>
                            {tierGroup.tier}
                          </div>
                          {/* Sportsbooks in this tier */}
                          {tierGroup.books.map((book) => (
                            <button
                              key={book.id}
                              onClick={() => toggleSportsbookFilter(book.id)}
                              className={`w-full text-left px-6 py-4 font-bold transition-all flex items-center justify-between ${
                                selectedSportsbooks.includes(book.id)
                                  ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                                  : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              <span>{book.name}</span>
                              {selectedSportsbooks.includes(book.id) && (
                                <div className={`w-4 h-4 rounded ${isLight ? 'bg-purple-600' : 'bg-purple-400'} flex items-center justify-center`}>
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Sport Filter */}
              <div className="relative">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Sport
                </label>
                <button
                  onClick={() => setSportExpanded(!sportExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{sports.find(s => s.id === selectedSport)?.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sportExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {sportExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {sports.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => {
                          setSelectedSport(sport.id);
                          setSportExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedSport === sport.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <span>{sport.name}</span>
                        <span className={`text-xs ${selectedSport === sport.id ? isLight ? 'text-purple-600' : 'text-purple-300' : isLight ? 'text-gray-500' : 'text-white/40'}`}>
                          {sport.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sport Drawer - Mobile Only */}
              {sportExpanded && (
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ${sportClosing ? 'opacity-0' : 'opacity-100'}`}
                    style={{ top: '-50px', left: 0, right: 0, bottom: 0, height: 'calc(100vh + 50px)', width: '100vw' }}
                    onClick={closeSportDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden ${sportClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Sport</h3>
                        <button
                          onClick={closeSportDrawer}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)]">
                      {sports.map((sport) => (
                        <button
                          key={sport.id}
                          onClick={() => {
                            setSelectedSport(sport.id);
                            setSportExpanded(false);
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all flex items-center justify-between ${
                            selectedSport === sport.id
                              ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <span>{sport.name}</span>
                          <span className={`text-xs ${selectedSport === sport.id ? isLight ? 'text-purple-600' : 'text-purple-300' : isLight ? 'text-gray-500' : 'text-white/40'}`}>
                            {sport.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Market Type Filter */}
              <div className="relative">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Market Type
                </label>
                <button
                  onClick={() => setMarketExpanded(!marketExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{marketTypes.find(m => m.id === selectedMarket)?.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${marketExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {marketExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {marketTypes.map((market) => (
                      <button
                        key={market.id}
                        onClick={() => {
                          setSelectedMarket(market.id);
                          setMarketExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all ${
                          selectedMarket === market.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {market.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Market Type Drawer - Mobile Only */}
              {marketExpanded && (
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ${marketClosing ? 'opacity-0' : 'opacity-100'}`}
                    style={{ top: '-50px', left: 0, right: 0, bottom: 0, height: 'calc(100vh + 50px)', width: '100vw' }}
                    onClick={closeMarketDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden ${marketClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Market Type</h3>
                        <button
                          onClick={closeMarketDrawer}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)]">
                      {marketTypes.map((market) => (
                        <button
                          key={market.id}
                          onClick={() => {
                            setSelectedMarket(market.id);
                            setMarketExpanded(false);
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all ${
                            selectedMarket === market.id
                              ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {market.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Desktop Apply & Reset Buttons */}
              <div className="hidden lg:block pt-4 space-y-3">
                {/* Apply Button */}
                <button
                  onClick={closeFilterMenu}
                  className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${
                    isLight 
                      ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700 hover:from-purple-200 hover:to-indigo-200' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 border-purple-400/30 text-white'
                  }`}
                >
                  Apply Filters
                </button>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setSelectedSport('all');
                    setSelectedMarket('all');
                    setSelectedBetType('straight');
                    setSelectedDate('today');
                    setSelectedSportsbooks([]);
                    setMinDataPoints(4);
                    toast.success('Filters reset', {
                      description: 'All filters have been cleared'
                    });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${
                    isLight 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Reset All Filters
                </button>
              </div>
              
            </div>
            {/* End Scrollable Content */}
          </div>
          {/* End Side Panel */}
        </>
      )}

      {/* Odds Table */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl overflow-hidden`}>
        {/* Table Header - Desktop Only */}
        {selectedBetType === 'arbitrage' ? (
          <div className={`hidden lg:grid lg:grid-cols-12 gap-4 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-b`}>
            <div className={`col-span-1 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>ROI</div>
            <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Match</div>
            <div className={`col-span-6 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Sides</div>
            <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Stakes</div>
          </div>
        ) : (
          <div className={`hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-b`}>
            <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>EV%</div>
            <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Match</div>
            <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Team/Line</div>
            <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Book</div>
            <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Odds</div>
          </div>
        )}

        {/* Table Rows */}
        <div className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-white/10'}`}>
          {isLoading ? (
            Array.from({ length: itemsPerPage }, (_, index) => <SkeletonRow key={index} />)
          ) : paginatedPicks.length > 0 ? (
            paginatedPicks.map((pick) => (
              <div key={pick.id}>
                {/* Main Row */}
                <div
                  onClick={() => toggleRow(pick.id)}
                  className={`w-full p-4 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-all cursor-pointer`}
                >
                  {/* Arbitrage Layout - Shows both sides stacked */}
                  {selectedBetType === 'arbitrage' ? (
                    <div className="hidden lg:block">
                      {/* Arbitrage Header Row */}
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* ROI Badge - Calculate arbitrage ROI */}
                        <div className="col-span-1 flex items-center justify-center">
                          {(() => {
                            // Calculate ROI for arbitrage
                            const books = pick.allBooks || pick.books || [];
                            const side1Odds = parseInt(String(pick.bestOdds).replace('+', ''), 10);
                            const booksWithTeam2 = books.filter((b: any) => b.team2Odds && b.team2Odds !== '--');
                            const bestOppBook = booksWithTeam2.length > 0 
                              ? booksWithTeam2.reduce((best: any, b: any) => {
                                  const bestOdds = parseInt(best.team2Odds, 10);
                                  const bOdds = parseInt(b.team2Odds, 10);
                                  return bOdds > bestOdds ? b : best;
                                }, booksWithTeam2[0])
                              : null;
                            const side2Odds = bestOppBook ? parseInt(bestOppBook.team2Odds, 10) : 0;
                            
                            const toDecimal = (american: number) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
                            const decimal1 = toDecimal(side1Odds);
                            const decimal2 = toDecimal(side2Odds);
                            const impliedProb1 = 1 / decimal1;
                            const impliedProb2 = 1 / decimal2;
                            const totalImplied = impliedProb1 + impliedProb2;
                            const roi = totalImplied < 1 ? ((1 - totalImplied) * 100).toFixed(2) : '0';
                            
                            return (
                              <div className={`px-3 py-1 rounded-full font-bold text-sm ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {roi}%
                              </div>
                            );
                          })()}
                        </div>

                        {/* Match Info */}
                        <div className="col-span-3 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-1 ${isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-full font-bold text-xs`}>
                              {pick.sport}
                            </span>
                          </div>
                          <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                            {pick.game.includes(' @ ') ? (
                              <span className="flex flex-col leading-tight">
                                <span>{pick.game.split(' @ ')[0]}</span>
                                <span>@ {pick.game.split(' @ ')[1]}</span>
                              </span>
                            ) : pick.game}
                          </div>
                          <div className={`flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold mt-1`}>
                            <Clock className="w-3 h-3" />
                            {pick.commenceTime ? new Date(pick.commenceTime).toLocaleString('en-US', { 
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit', hour12: true,
                              timeZone: 'America/Los_Angeles'
                            }) : 'Time TBD'}
                          </div>
                        </div>

                        {/* Both Sides Stacked + Stakes */}
                        {(() => {
                          // Calculate stakes for $100 total
                          const books = pick.allBooks || pick.books || [];
                          const side1Odds = parseInt(String(pick.bestOdds).replace('+', ''), 10);
                          const booksWithTeam2 = books.filter((b: any) => b.team2Odds && b.team2Odds !== '--');
                          const bestOppBook = booksWithTeam2.length > 0 
                            ? booksWithTeam2.reduce((best: any, b: any) => {
                                const bestOdds = parseInt(best.team2Odds, 10);
                                const bOdds = parseInt(b.team2Odds, 10);
                                return bOdds > bestOdds ? b : best;
                              }, booksWithTeam2[0])
                            : null;
                          const side2Odds = bestOppBook ? parseInt(bestOppBook.team2Odds, 10) : 0;
                          
                          const toDecimal = (american: number) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
                          const decimal1 = toDecimal(side1Odds);
                          const decimal2 = toDecimal(side2Odds);
                          const impliedProb1 = 1 / decimal1;
                          const impliedProb2 = 1 / decimal2;
                          const totalImplied = impliedProb1 + impliedProb2;
                          
                          const totalStake = arbitrageStake;
                          const stake1 = totalStake * (impliedProb1 / totalImplied);
                          const stake2 = totalStake * (impliedProb2 / totalImplied);
                          
                          const oppositeSideName = pick.pick.includes('Over') ? pick.pick.replace('Over', 'Under') 
                            : pick.pick.includes('Under') ? pick.pick.replace('Under', 'Over')
                            : pick.team2 || 'Opposite';
                          
                          return (
                            <>
                              <div className="col-span-6">
                                {/* Side 1 - Best odds for this pick */}
                                <div className={`grid grid-cols-3 gap-4 p-3 mb-2 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/20'} border rounded-xl`}>
                                  <div>
                                    <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Side 1</div>
                                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{pick.pick}</div>
                                  </div>
                                  <div>
                                    <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Book</div>
                                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{pick.bestBook}</div>
                                  </div>
                                  <div>
                                    <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Odds</div>
                                    <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-sm`}>{formatOdds(pick.bestOdds)}</div>
                                  </div>
                                </div>
                                
                                {/* Side 2 - Opposite side with best odds from another book */}
                                {bestOppBook ? (
                                  <div className={`grid grid-cols-3 gap-4 p-3 ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-400/20'} border rounded-xl`}>
                                    <div>
                                      <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Side 2</div>
                                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{oppositeSideName}</div>
                                    </div>
                                    <div>
                                      <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Book</div>
                                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{bestOppBook.name}</div>
                                    </div>
                                    <div>
                                      <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Odds</div>
                                      <div className={`${isLight ? 'text-blue-700' : 'text-blue-400'} font-bold text-sm`}>{formatOdds(bestOppBook.team2Odds)}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl text-center`}>
                                    <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm`}>No opposite side data</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Stakes Column */}
                              <div className="col-span-2 flex flex-col">
                                <div className={`h-full p-3 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl flex flex-col justify-center`}>
                                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-3 text-center`}>Stakes (${arbitrageStake})</div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>Side 1:</span>
                                      <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-base`}>${stake1.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>Side 2:</span>
                                      <span className={`${isLight ? 'text-blue-700' : 'text-blue-400'} font-bold text-base`}>${stake2.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                  /* Standard Desktop Layout - Grid format for larger screens */
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-6 items-center">
                    {/* EV Badge - Shows expected value percentage */}
                    <div className="lg:col-span-2">
                      <div className={`inline-flex items-center gap-2 px-1.5 py-0.5 lg:px-2 lg:py-0.5 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-full shadow-lg whitespace-nowrap text-[14px]`}>
                        <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-xs lg:text-sm`}>{pick.ev}</span>
                      </div>
                    </div>

                    {/* Match Info - Game details, sport badge, and time */}
                    <div className="lg:col-span-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Sport Badge */}
                        <span className={`px-2.5 py-1 ${isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-full font-bold text-xs`}>
                          {pick.sport}
                        </span>
                      </div>
                      {/* Game Matchup - Stack teams on desktop if too long */}
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base`}>
                        <span className="lg:hidden truncate block">{pick.game}</span>
                        <span className="hidden lg:block">
                          {pick.game.includes(' @ ') ? (
                            <span className="flex flex-col leading-tight">
                              <span>{pick.game.split(' @ ')[0]}</span>
                              <span>@ {pick.game.split(' @ ')[1]}</span>
                            </span>
                          ) : pick.game}
                        </span>
                      </div>
                      {/* Game Time - From API */}
                      <div className={`flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold mt-1`}>
                        <Clock className="w-3 h-3" />
                        {pick.commenceTime ? new Date(pick.commenceTime).toLocaleString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'America/Los_Angeles'
                        }) : 'Time TBD'}
                      </div>
                    </div>

                    {/* Team/Line - Recommended pick (spread, total, moneyline, etc.) */}
                    <div className="lg:col-span-3 min-w-0">
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.pick}</div>
                    </div>

                    {/* Book - Best sportsbook for this pick */}
                    <div className="lg:col-span-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.bestBook}</span>
                      </div>
                    </div>
                    
                    {/* Odds - Best available odds for this pick */}
                    <div className="lg:col-span-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{formatOdds(pick.bestOdds)}</span>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Mobile Layout - BetCard Style */}
                  <div className="lg:hidden">
                    {/* Card Header */}
                    <div className={`p-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="mb-2">
                        <span className={`px-2 py-0.5 ${isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-full font-bold text-xs`}>
                          {pick.sport}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-1 text-sm`}>
                            {pick.game}
                          </h3>
                          <div className={`flex items-center gap-1.5 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold`}>
                            <Clock className="w-3 h-3" />
                            {pick.commenceTime ? new Date(pick.commenceTime).toLocaleString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'America/Los_Angeles'
                            }) : 'Time TBD'}
                          </div>
                        </div>
                        {/* Show ROI for arbitrage, EV for others */}
                        {selectedBetType === 'arbitrage' ? (
                          (() => {
                            const books = pick.allBooks || pick.books || [];
                            const side1Odds = parseInt(String(pick.bestOdds).replace('+', ''), 10);
                            const booksWithTeam2 = books.filter((b: any) => b.team2Odds && b.team2Odds !== '--');
                            const bestOppBook = booksWithTeam2.length > 0 
                              ? booksWithTeam2.reduce((best: any, b: any) => {
                                  const bestOdds = parseInt(best.team2Odds, 10);
                                  const bOdds = parseInt(b.team2Odds, 10);
                                  return bOdds > bestOdds ? b : best;
                                }, booksWithTeam2[0])
                              : null;
                            const side2Odds = bestOppBook ? parseInt(bestOppBook.team2Odds, 10) : 0;
                            
                            const toDecimal = (american: number) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
                            const decimal1 = toDecimal(side1Odds);
                            const decimal2 = toDecimal(side2Odds);
                            const impliedProb1 = 1 / decimal1;
                            const impliedProb2 = 1 / decimal2;
                            const totalImplied = impliedProb1 + impliedProb2;
                            const roi = totalImplied < 1 ? ((1 - totalImplied) * 100).toFixed(2) : '0';
                            
                            return (
                              <div className={`px-2.5 py-1 ${isLight ? 'bg-emerald-100' : 'bg-emerald-500/20'} rounded-full`}>
                                <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-xs`}>
                                  {roi}%
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <div className={`px-2.5 py-1 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30'} backdrop-blur-xl rounded-full border`}>
                            <span className={`${isLight ? 'text-emerald-700' : 'text-white'} font-bold text-xs`}>
                              {pick.ev}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content - Mobile BetCard Style */}
                    <div className="p-3 space-y-2.5">
                      {/* Arbitrage Mobile - Show both sides stacked */}
                      {selectedBetType === 'arbitrage' ? (
                        <>
                          {/* Side 1 */}
                          <div className={`p-3 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/20'} border rounded-2xl`}>
                            <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Side 1</div>
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-2`}>{pick.pick}</div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Book</div>
                                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{pick.bestBook}</div>
                              </div>
                              <div className="text-right">
                                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Odds</div>
                                <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold`}>{formatOdds(pick.bestOdds)}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Side 2 */}
                          {(() => {
                            const books = pick.allBooks || pick.books || [];
                            const oppositeSideName = pick.pick.includes('Over') ? pick.pick.replace('Over', 'Under') 
                              : pick.pick.includes('Under') ? pick.pick.replace('Under', 'Over')
                              : pick.team2 || 'Opposite';
                            const booksWithTeam2 = books.filter((b: any) => b.team2Odds && b.team2Odds !== '--');
                            const bestOppBook = booksWithTeam2.length > 0 
                              ? booksWithTeam2.reduce((best: any, b: any) => {
                                  const bestOdds = parseInt(best.team2Odds, 10);
                                  const bOdds = parseInt(b.team2Odds, 10);
                                  return bOdds > bestOdds ? b : best;
                                }, booksWithTeam2[0])
                              : null;
                            
                            return bestOppBook ? (
                              <div className={`p-3 ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-400/20'} border rounded-2xl`}>
                                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase mb-1`}>Side 2</div>
                                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-2`}>{oppositeSideName}</div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Book</div>
                                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{bestOppBook.name}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Odds</div>
                                    <div className={`${isLight ? 'text-blue-700' : 'text-blue-400'} font-bold`}>{formatOdds(bestOppBook.team2Odds)}</div>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </>
                      ) : (
                        <>
                          {/* Standard Pick Display - Rounded */}
                          <div className={`text-center p-3 ${isLight ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200' : 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30'} backdrop-blur-xl border rounded-2xl`}>
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                              {pick.pick}
                            </div>
                          </div>

                          {/* Odds & Sportsbook - Rounded */}
                          <div className={`flex items-center justify-between p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-2xl border`}>
                            <div>
                              <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase tracking-wide mb-0.5`}>
                                Sportsbook
                              </div>
                              <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                                {pick.bestBook}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase tracking-wide mb-0.5`}>
                                Odds
                              </div>
                              <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                                {formatOdds(pick.bestOdds)}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(pick.id);
                          }}
                          className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-2xl transition-all font-bold text-xs text-center`}
                        >
                          Compare Odds
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!addedPicks.includes(pick.id)) {
                              onAddPick({
                                id: Date.now(),
                                teams: pick.game,
                                time: 'Sun, Nov 10 7:00 PM PST',
                                pick: pick.pick,
                                odds: pick.bestOdds,
                                sportsbook: pick.bestBook,
                                ev: pick.ev,
                                sport: pick.sport,
                                confidence: 'High'
                              });
                              setAddedPicks([...addedPicks, pick.id]);
                              toast.success('Bet added to My Picks!');
                            }
                          }}
                          disabled={addedPicks.includes(pick.id)}
                          className={`px-3 py-2 ${
                            addedPicks.includes(pick.id)
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-400/30 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 border-purple-400/30'
                          } text-white rounded-2xl transition-all font-bold text-xs border text-center flex items-center justify-center gap-1.5`}
                        >
                          {addedPicks.includes(pick.id) ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Added
                            </>
                          ) : (
                            'Place Bet'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Section - Books Comparison or Arbitrage Calculator */}
                {expandedRows.includes(pick.id) && (
                  <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border-t`}>
                    {/* Arbitrage Calculator - Shows when in arbitrage mode */}
                    {selectedBetType === 'arbitrage' ? (
                      <div className="space-y-4">
                        {(() => {
                          // Get odds for both sides
                          const books = pick.allBooks || pick.books || [];
                          const side1Odds = parseInt(String(pick.bestOdds).replace('+', ''), 10);
                          const booksWithTeam2 = books.filter((b: any) => b.team2Odds && b.team2Odds !== '--');
                          const bestOppBook = booksWithTeam2.length > 0 
                            ? booksWithTeam2.reduce((best: any, b: any) => {
                                const bestOdds = parseInt(best.team2Odds, 10);
                                const bOdds = parseInt(b.team2Odds, 10);
                                return bOdds > bestOdds ? b : best;
                              }, booksWithTeam2[0])
                            : null;
                          const side2Odds = bestOppBook ? parseInt(bestOppBook.team2Odds, 10) : 0;
                          
                          // Calculate arbitrage
                          const toDecimal = (american: number) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
                          const decimal1 = toDecimal(side1Odds);
                          const decimal2 = toDecimal(side2Odds);
                          const impliedProb1 = 1 / decimal1;
                          const impliedProb2 = 1 / decimal2;
                          const totalImplied = impliedProb1 + impliedProb2;
                          const isArbitrage = totalImplied < 1;
                          const arbPercentage = isArbitrage ? ((1 - totalImplied) * 100).toFixed(2) : '0';
                          
                          // Use state for stake calculation
                          const totalStake = arbitrageStake;
                          const stake1 = totalStake * (impliedProb1 / totalImplied);
                          const stake2 = totalStake * (impliedProb2 / totalImplied);
                          const payout1 = stake1 * decimal1;
                          const payout2 = stake2 * decimal2;
                          const guaranteedPayout = Math.min(payout1, payout2);
                          const profit = guaranteedPayout - totalStake;
                          
                          const oppositeSideName = pick.pick.includes('Over') ? pick.pick.replace('Over', 'Under') 
                            : pick.pick.includes('Under') ? pick.pick.replace('Under', 'Over')
                            : pick.team2 || 'Opposite';
                          
                          return (
                            <>
                              {/* Stake Calculator */}
                              <div className={`p-4 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                    Stake Calculator
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Total Stake:</span>
                                    <div className="relative">
                                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-500' : 'text-white/50'}`}>$</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={arbitrageStake}
                                        onChange={(e) => setArbitrageStake(Math.max(1, parseInt(e.target.value) || 100))}
                                        className={`w-24 pl-7 pr-3 py-1.5 rounded-lg text-sm font-bold ${isLight ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Side 1 */}
                                  <div className={`p-3 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/20'} border rounded-xl`}>
                                    <div className={`text-xs font-bold uppercase mb-2 ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Side 1: {pick.pick}</div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Book:</span>
                                      <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{pick.bestBook}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Odds:</span>
                                      <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatOdds(pick.bestOdds)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Stake:</span>
                                      <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>${stake1.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Payout:</span>
                                      <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>${payout1.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Side 2 */}
                                  <div className={`p-3 ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-400/20'} border rounded-xl`}>
                                    <div className={`text-xs font-bold uppercase mb-2 ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Side 2: {oppositeSideName}</div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Book:</span>
                                      <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{bestOppBook?.name || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Odds:</span>
                                      <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>{bestOppBook ? formatOdds(bestOppBook.team2Odds) : '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Stake:</span>
                                      <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>${stake2.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Payout:</span>
                                      <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>${payout2.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Profit Summary */}
                                {isArbitrage && (
                                  <div className={`mt-4 p-3 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-emerald-500/20 border-emerald-400/30'} border rounded-xl`}>
                                    <div className="flex justify-between items-center">
                                      <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Guaranteed Profit:</span>
                                      <span className={`font-bold text-lg ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>${profit.toFixed(2)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                    <>
                    {/* Standard Expanded - Mobile Bet Details */}
                    <div className="lg:hidden space-y-4">
                      {/* Three Column Stats */}
                      <div className={`grid grid-cols-3 gap-3 pb-3 mb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                        {/* Best Line */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-xs mb-2`}>
                            Best Line
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-xl`}>
                            <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-base`}>
                              {formatOdds(pick.bestOdds)}
                            </span>
                          </div>
                        </div>

                        {/* Average Odds */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-xs mb-2`}>
                            Average Odds
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-xl`}>
                            <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                              {calculateAverageOdds(pick.allBooks || pick.books)}
                            </span>
                          </div>
                        </div>

                        {/* DeVig Odds */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-xs mb-2`}>
                            DeVig Odds
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-xl`}>
                            <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                              {calculateDevigOdds(pick.allBooks || pick.books)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Books Table */}
                      <div className="space-y-3">
                        {/* Table Header */}
                        <div className={`grid grid-cols-4 gap-3 px-4 py-3 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-purple-500/20 border-purple-400/30'} border rounded-2xl`}>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs`}>Book</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>{pick.isPlayerProp ? 'Over' : pick.team1.split(' ').pop()}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>{pick.isPlayerProp ? 'Under' : pick.team2.split(' ').pop()}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-right`}>Pick</div>
                        </div>

                        {/* Table Rows */}
                        {(expandedSportsbooks.includes(pick.id) ? pick.allBooks : pick.allBooks.slice(0, 5)).map((book, idx) => (
                          <div 
                            key={idx}
                            className={`grid grid-cols-4 gap-3 px-4 py-3 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-2xl items-center`}
                          >
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.name}</div>
                            <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-bold text-sm text-center`}>{typeof book.odds === 'number' ? (book.odds > 0 ? `+${book.odds}` : book.odds) : (typeof book.odds === 'string' && !book.odds.startsWith('-') && !book.odds.startsWith('+') && book.odds !== '--' ? `+${book.odds}` : book.odds)}</div>
                            <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm text-center`}>{book.team2Odds}</div>
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddPick({
                                    id: Date.now(),
                                    teams: pick.game,
                                    time: 'Sun, Nov 10 7:00 PM PST',
                                    pick: pick.pick,
                                    odds: book.odds,
                                    sportsbook: book.name,
                                    ev: book.ev,
                                    sport: pick.sport,
                                    confidence: 'High',
                                    analysis: `${pick.pick} - ${book.name} at ${book.odds} with ${book.ev} expected value`
                                  });
                                  toast.success('Added to My Picks', {
                                    description: `${pick.pick} at ${book.name} has been added to your picks`
                                  });
                                }}
                                className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all flex items-center justify-center"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* View More Button */}
                      {pick.allBooks.length > 5 && (
                        <button 
                          onClick={() => toggleSportsbook(pick.id)}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSportsbooks.includes(pick.id) ? 'rotate-180' : ''}`} />
                          <span>{expandedSportsbooks.includes(pick.id) ? 'View Less' : 'View More'}</span>
                        </button>
                      )}
                    </div>

                    {/* Desktop Expanded - Compact Table (only for non-arbitrage) */}
                    <div className="hidden lg:block space-y-4">
                      {/* Three Column Stats */}
                      <div className={`grid grid-cols-3 gap-4 pb-4 mb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                        {/* Best Line */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm mb-2`}>
                            Best Line
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-full`}>
                            <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-base`}>
                              {formatOdds(pick.bestOdds)}
                            </span>
                          </div>
                        </div>

                        {/* Average Odds */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm mb-2`}>
                            Average Odds
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-xl`}>
                            <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                              {calculateAverageOdds(pick.allBooks || pick.books)}
                            </span>
                          </div>
                        </div>

                        {/* DeVig Odds */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm mb-2`}>
                            DeVig Odds
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-xl`}>
                            <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                              {calculateDevigOdds(pick.allBooks || pick.books)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Books Cards */}
                      <div className="space-y-3">
                        {/* Header */}
                        <div className={`grid grid-cols-4 gap-4 px-4 py-3 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-purple-500/20 border-purple-400/30'} border rounded-2xl`}>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-sm`}>Book</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-sm text-center`}>{pick.team1}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-sm text-center`}>{pick.team2}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-sm text-right`}>Pick</div>
                        </div>

                        {/* Rows */}
                        {(expandedSportsbooks.includes(pick.id) ? pick.allBooks : pick.allBooks.slice(0, 5)).map((book, idx) => (
                          <div 
                            key={idx}
                            className={`grid grid-cols-4 gap-4 px-4 py-3 ${isLight ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-white/5 border-white/10 hover:bg-white/10'} border rounded-2xl items-center transition-all`}
                          >
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.name}</div>
                            <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-bold text-sm text-center`}>{typeof book.odds === 'number' ? (book.odds > 0 ? `+${book.odds}` : book.odds) : (typeof book.odds === 'string' && !book.odds.startsWith('-') && !book.odds.startsWith('+') && book.odds !== '--' ? `+${book.odds}` : book.odds)}</div>
                            <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm text-center`}>{book.team2Odds}</div>
                            <div className="flex justify-end">
                              {isPickAdded(pick, book.name) ? (
                                <button
                                  className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl cursor-default"
                                  disabled
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddPick({
                                      teams: pick.game,
                                      time: 'Sun, Nov 10 7:00 PM PST',
                                      pick: pick.pick,
                                      odds: book.odds,
                                      sportsbook: book.name,
                                      ev: book.ev,
                                      sport: pick.sport,
                                      confidence: 'High',
                                      analysis: `${pick.pick} - ${book.name} at ${book.odds} with ${book.ev} expected value`
                                    });
                                  }}
                                  className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all flex items-center justify-center"
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* View More Button */}
                      {pick.allBooks.length > 5 && (
                        <div className="flex justify-center mt-3">
                          <button 
                            onClick={() => toggleSportsbook(pick.id)}
                            className={`flex items-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSportsbooks.includes(pick.id) ? 'rotate-180' : ''}`} />
                            <span>{expandedSportsbooks.includes(pick.id) ? 'View Less' : 'View More'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    </>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}