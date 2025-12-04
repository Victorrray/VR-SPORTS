import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight, ArrowUp, ArrowDown, Check, Crown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { useOddsData } from '../../hooks/useOddsData';
import { toast } from 'sonner';

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

// Helper function to calculate average odds from books array
const calculateAverageOdds = (books: any[]): string => {
  if (!books || books.length === 0) return '--';
  const numericOdds = books
    .map(b => parseInt(b.odds, 10))
    .filter(o => !isNaN(o));
  if (numericOdds.length === 0) return '--';
  const avg = Math.round(numericOdds.reduce((sum, o) => sum + o, 0) / numericOdds.length);
  return avg > 0 ? `+${avg}` : String(avg);
};

// Helper function to calculate devig (no-vig/fair) odds
const calculateDevigOdds = (books: any[]): string => {
  if (!books || books.length < 2) return '--';
  
  const oddsPairs = books
    .filter(b => b.odds && b.team2Odds && b.odds !== '--' && b.team2Odds !== '--')
    .map(b => ({
      odds1: parseInt(b.odds, 10),
      odds2: parseInt(b.team2Odds, 10)
    }))
    .filter(p => !isNaN(p.odds1) && !isNaN(p.odds2));
  
  if (oddsPairs.length === 0) return '--';
  
  const toProb = (american: number) => american > 0 ? 100 / (american + 100) : -american / (-american + 100);
  const toAmerican = (prob: number) => prob >= 0.5 ? Math.round(-100 * prob / (1 - prob)) : Math.round(100 * (1 - prob) / prob);
  
  let totalProb1 = 0, totalProb2 = 0;
  oddsPairs.forEach(p => {
    totalProb1 += toProb(p.odds1);
    totalProb2 += toProb(p.odds2);
  });
  
  const avgProb1 = totalProb1 / oddsPairs.length;
  const avgProb2 = totalProb2 / oddsPairs.length;
  const totalProb = avgProb1 + avgProb2;
  const fairProb1 = avgProb1 / totalProb;
  const fairOdds = toAmerican(fairProb1);
  return fairOdds > 0 ? `+${fairOdds}` : String(fairOdds);
};

export function PlayerPropsPage({ onAddPick, savedPicks = [] }: { onAddPick: (pick: any) => void, savedPicks?: any[] }) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const { me } = useMe();
  const hasPlatinum = me?.plan === 'platinum' || me?.unlimited === true;
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedBetType] = useState('props');
  const [expandedRows, setExpandedRows] = useState<(string | number)[]>([]);
  const [expandedSportsbooks, setExpandedSportsbooks] = useState<(string | number)[]>([]);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [isBetTypeDropdownOpen, setIsBetTypeDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('all_upcoming');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);
  
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  
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

  // Generate date options dynamically
  const dateOptions = useMemo(() => generateDateOptions(), []);

  // Fetch real odds data from API
  const { picks: apiPicks, loading: apiLoading, error: apiError, refetch } = useOddsData({
    sport: selectedSport,
    marketType: selectedMarket,
    betType: selectedBetType,
    sportsbooks: selectedSportsbooks,
    date: selectedDate,
    enabled: true
  });

  // Filter picks by selected date
  const dateFilteredPicks = useMemo(() => {
    if (!apiPicks || apiPicks.length === 0) return [];
    
    // If "all_upcoming" is selected, show all games (no date filter)
    if (selectedDate === 'all_upcoming') {
      return apiPicks;
    }
    
    // Filter by specific date (YYYY-MM-DD format)
    return apiPicks.filter(pick => {
      // If no game time, include the pick (don't filter it out)
      if (!pick.commenceTime && !pick.gameTime) return true;
      
      const gameDate = new Date(pick.commenceTime || pick.gameTime || '');
      // Use local date string to avoid timezone issues
      const year = gameDate.getFullYear();
      const month = String(gameDate.getMonth() + 1).padStart(2, '0');
      const day = String(gameDate.getDate()).padStart(2, '0');
      const gameDateStr = `${year}-${month}-${day}`;
      
      return gameDateStr === selectedDate;
    });
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
      console.log('🔄 Auto-refreshing player props data...');
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
    { id: 'ncaa-basketball', name: 'NCAA Basketball', count: 25, active: false }
  ];

  const betTypes = [
    { id: 'straight', name: 'Straight Bets' },
    { id: 'props', name: 'Player Props' },
    { id: 'arbitrage', name: 'Arbitrage' },
    { id: 'middles', name: 'Middles' }
  ];

  // Player props market types
  const marketTypes = [
    { id: 'all', name: 'All Props' },
    { id: 'player_points', name: 'Points' },
    { id: 'player_rebounds', name: 'Rebounds' },
    { id: 'player_assists', name: 'Assists' },
    { id: 'player_threes', name: '3-Pointers' },
    { id: 'player_steals', name: 'Steals' },
    { id: 'player_blocks', name: 'Blocks' },
    { id: 'player_pass_yds', name: 'Passing Yards' },
    { id: 'player_pass_tds', name: 'Passing TDs' },
    { id: 'player_rush_yds', name: 'Rushing Yards' },
    { id: 'player_receptions', name: 'Receptions' },
    { id: 'player_reception_yds', name: 'Receiving Yards' },
    { id: 'player_anytime_td', name: 'Anytime TD' },
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

  // Filter picks based on selections
  const filteredPicks = topPicks.map(pick => {
    // Create a map of sportsbook IDs to names for matching
    const sportsbookMap: Record<string, string[]> = {};
    sportsbooksByTier.forEach(tier => {
      tier.books.forEach(book => {
        if (!sportsbookMap[book.id]) {
          sportsbookMap[book.id] = [];
        }
        sportsbookMap[book.id].push(book.name.toLowerCase());
        // Also add the ID itself as a matching name
        sportsbookMap[book.id].push(book.id.toLowerCase());
      });
    });

    // Filter books array if sportsbooks are selected (for main card display)
    let filteredBooks = pick.books;
    if (selectedSportsbooks.length > 0) {
      filteredBooks = pick.books.filter(book => {
        // Use rawName if available (for books with line in name), otherwise use name
        // Also strip any line info like "(4.5)" from the name for matching
        const rawName = (book as any).rawName || book.name;
        const bookNameLower = rawName.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase().trim();
        const bookKey = ((book as any).key || '').toLowerCase();
        
        return selectedSportsbooks.some(selectedId => {
          const matchingNames = sportsbookMap[selectedId] || [];
          const selectedIdLower = selectedId.toLowerCase();
          
          // Exact match by key or selected ID
          if (bookKey === selectedIdLower) return true;
          
          // Exact match by name
          if (matchingNames.some(name => bookNameLower === name)) return true;
          
          // For DFS apps, also check if the book key starts with the selected ID
          // e.g., "prizepicks" matches "prizepicks", "underdog" matches "underdog"
          const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'betr_us_dfs', 'sleeper', 'fliff'];
          if (dfsApps.includes(selectedIdLower)) {
            // Check if book name or key contains the DFS app name
            if (bookKey === selectedIdLower || bookNameLower === selectedIdLower) return true;
            // Special handling for display names
            if (selectedIdLower === 'dabble_au' && bookNameLower === 'dabble') return true;
            if (selectedIdLower === 'betr_us_dfs' && bookNameLower === 'betr') return true;
            if (selectedIdLower === 'pick6' && (bookNameLower === 'pick6' || bookNameLower === 'draftkings pick6')) return true;
          }
          
          return false;
        });
      });
    }

    // Find best book from filtered books for main card
    const bestBookForCard = filteredBooks.length > 0 
      ? filteredBooks.reduce((best: any, book: any) => {
          const bestOddsNum = parseInt(best.odds, 10);
          const bookOddsNum = parseInt(book.odds, 10);
          return bookOddsNum > bestOddsNum ? book : best;
        }, filteredBooks[0])
      : pick.books[0];

    return {
      ...pick,
      // Keep ALL books for mini table (allBooks)
      allBooks: pick.books,
      // Use filtered books for determining if pick should show
      filteredBooks: filteredBooks,
      // Update bestBook and bestOdds based on filtered selection
      bestBook: bestBookForCard?.rawName || bestBookForCard?.name || pick.bestBook,
      bestOdds: bestBookForCard?.odds || pick.bestOdds
    };
  }).filter(pick => {
    // Filter by sport - compare against API sport value
    if (selectedSport !== 'all') {
      // Map filter IDs to API sport values
      const sportMap: Record<string, string[]> = {
        'nfl': ['americanfootball_nfl', 'nfl'],
        'nba': ['basketball_nba', 'nba'],
        'nhl': ['icehockey_nhl', 'nhl'],
        'mlb': ['baseball_mlb', 'mlb'],
        'ncaa-football': ['americanfootball_ncaa', 'ncaa_football'],
        'ncaa-basketball': ['basketball_ncaa', 'ncaa_basketball']
      };
      
      const allowedSports = sportMap[selectedSport] || [];
      const pickSport = pick.sport.toLowerCase();
      const matches = allowedSports.some(sport => pickSport.includes(sport.toLowerCase()));
      
      if (!matches) {
        return false;
      }
    }
    
    // Filter by sportsbooks (if any selected, show only picks available at selected books)
    if (selectedSportsbooks.length > 0) {
      // Only include picks that have at least one book after filtering
      if ((pick as any).filteredBooks?.length === 0) {
        return false;
      }
    }
    
    return true;
  });

  // Sort filtered picks
  const sortedPicks = [...filteredPicks].sort((a, b) => {
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
        No player props found
      </h3>
      <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold mb-4`}>
        Try adjusting your filters to see more player prop betting opportunities
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
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
                toast.success('Refreshing props...', {
                  description: 'Fetching latest player props data'
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
            className={`fixed bg-black/50 backdrop-blur-md z-[100] transition-opacity duration-300 ${isFilterClosing ? 'opacity-0' : 'opacity-100'}`}
            style={{ top: '-50px', left: 0, right: 0, bottom: 0, height: 'calc(100vh + 50px)', width: '100vw' }}
            onClick={closeFilterMenu}
          />
          
          {/* Side Panel - Desktop / Bottom Drawer - Mobile */}
          <div 
            className={`fixed left-0 right-0 lg:right-auto lg:w-80 lg:top-0 lg:bottom-0 max-lg:bottom-0 max-lg:h-auto max-lg:pb-24 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl lg:border-r border-t lg:border-t-0 z-[101] lg:rounded-none rounded-t-3xl flex flex-col ${isFilterClosing ? 'animate-out max-lg:slide-out-to-bottom lg:slide-out-to-left duration-300' : 'animate-in max-lg:slide-in-from-bottom lg:slide-in-from-left duration-300'}`}
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
                    setSelectedDate('all_upcoming');
                    setSelectedSportsbooks([]);
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
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-lg overflow-hidden`}>
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
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-lg overflow-hidden`}>
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
                    {sportsbooksByTier
                      .flatMap(tierGroup => tierGroup.books)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((book) => (
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
                      {sportsbooksByTier.map((tierGroup, tierIndex) => (
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

              {/* Desktop Apply & Reset Buttons */}
              <div className="hidden lg:block pt-4 space-y-3">
                {/* Apply Button */}
                <button
                  onClick={() => {
                    setIsFilterMenuOpen(false);
                  }}
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
                    setSelectedDate('all_upcoming');
                    setSelectedSportsbooks([]);
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
                  Reset Filters
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
        <div className={`hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-b`}>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>EV%</div>
          <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Match</div>
          <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Team/Line</div>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Book</div>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Odds</div>
        </div>

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
                  {/* Desktop Layout - Grid format for larger screens */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-6 items-center">
                    {/* EV Badge - Shows expected value percentage */}
                    <div className="lg:col-span-2">
                      <div className={`inline-flex items-center gap-2 px-1.5 py-0.5 lg:px-2 lg:py-0.5 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-xl shadow-lg whitespace-nowrap text-[14px]`}>
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
                      {/* Game Matchup */}
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.game}</div>
                      {/* Game Time */}
                      <div className={`flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold mt-1`}>
                        <Clock className="w-3 h-3" />
                        {pick.commenceTime || pick.gameTime ? new Date(pick.commenceTime || pick.gameTime).toLocaleString('en-US', { 
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
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base leading-tight`}>{pick.pick}</div>
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
                        <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.bestOdds}</span>
                      </div>
                    </div>
                  </div>

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
                            {pick.commenceTime || pick.gameTime ? new Date(pick.commenceTime || pick.gameTime).toLocaleString('en-US', { 
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
                        <div className={`px-2.5 py-1 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30'} backdrop-blur-xl rounded-full border`}>
                          <span className={`${isLight ? 'text-emerald-700' : 'text-white'} font-bold text-xs`}>
                            {pick.ev}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 space-y-2.5">
                      {/* Pick Display */}
                      <div className={`text-center p-3 ${isLight ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200' : 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30'} backdrop-blur-xl border rounded-xl`}>
                        
                        <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                          {pick.pick}
                        </div>
                      </div>

                      {/* Odds & Sportsbook */}
                      <div className={`flex items-center justify-between p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border`}>
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
                            {pick.bestOdds}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(pick.id);
                          }}
                          className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-xs text-center`}
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
                          } text-white rounded-xl transition-all font-bold text-xs border text-center flex items-center justify-center gap-1.5`}
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

                {/* Expanded Section - Books Comparison */}
                {expandedRows.includes(pick.id) && (
                  <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border-t`}>
                    {/* Mobile Expanded - Bet Details */}
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
                              {pick.bestOdds}
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
                              {calculateAverageOdds((pick as any).allBooks || pick.books)}
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
                              {calculateDevigOdds((pick as any).allBooks || pick.books)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Books Table */}
                      <div className="space-y-2">
                        {/* Table Header */}
                        <div className={`grid grid-cols-4 gap-2 px-3 py-2 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-purple-500/20 border-purple-400/30'} border rounded-xl`}>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs`}>Book</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>Over</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>Under</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-right`}>Pick</div>
                        </div>

                        {/* Table Rows */}
                        {(expandedSportsbooks.includes(pick.id) ? ((pick as any).allBooks || pick.books) : ((pick as any).allBooks || pick.books).slice(0, 5)).map((book: any, idx: number) => (
                          <div 
                            key={idx}
                            className={`grid grid-cols-4 gap-2 px-3 py-2.5 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl items-center`}
                          >
                            <div className="flex flex-col">
                              <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                                {book.rawName || book.name.replace(/\s*\([^)]*\)\s*$/, '')}
                              </span>
                              {book.line && (
                                <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
                                  {book.line}
                                </span>
                              )}
                            </div>
                            <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-bold text-sm text-center`}>{book.odds}</div>
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
                      {((pick as any).allBooks || pick.books).length > 5 && (
                        <button 
                          onClick={() => toggleSportsbook(pick.id)}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSportsbooks.includes(pick.id) ? 'rotate-180' : ''}`} />
                          <span>{expandedSportsbooks.includes(pick.id) ? 'View Less' : 'View More'}</span>
                        </button>
                      )}
                    </div>

                    {/* Desktop Expanded - Compact Table */}
                    <div className="hidden lg:block space-y-4">
                      {/* Three Column Stats */}
                      <div className={`grid grid-cols-3 gap-4 pb-4 mb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                        {/* Best Line */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm mb-2`}>
                            Best Line
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-xl`}>
                            <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-base`}>
                              {pick.bestOdds}
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
                              {calculateAverageOdds((pick as any).allBooks || pick.books)}
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
                              {calculateDevigOdds((pick as any).allBooks || pick.books)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Compact Books Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                              <th className={`text-left py-2 px-3 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs`}>Book</th>
                              <th className={`text-center py-2 px-3 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs`}>{pick.team1}</th>
                              <th className={`text-center py-2 px-3 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs`}>{pick.team2}</th>
                              <th className={`text-right py-2 px-3 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs`}>Pick</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-white/10'}`}>
                            {(expandedSportsbooks.includes(pick.id) ? ((pick as any).allBooks || pick.books) : ((pick as any).allBooks || pick.books).slice(0, 5)).map((book: any, idx: number) => (
                              <tr 
                                key={idx}
                                className={`transition-all ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}
                              >
                                <td className="py-2 px-3">
                                  <div className="flex flex-col">
                                    <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                                      {book.rawName || book.name.replace(/\s*\([^)]*\)\s*$/, '')}
                                    </span>
                                    {book.line && (
                                      <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
                                        {book.line}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.odds}</span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm`}>{book.team2Odds}</span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {isPickAdded(pick, book.name) ? (
                                    <button
                                      className="p-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg cursor-default"
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
                                      className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all flex items-center justify-center"
                                    >
                                      <Plus className="w-4 h-4 text-white" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* View More Button */}
                      {((pick as any).allBooks || pick.books).length > 5 && (
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