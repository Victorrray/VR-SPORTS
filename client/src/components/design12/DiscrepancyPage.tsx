import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { useOddsData } from '../../hooks/useOddsData';
import { ChevronDown, ChevronRight, ChevronLeft, Filter, RefreshCw, ArrowUp, ArrowDown, Check, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// Types for discrepancy data
interface BookLine {
  bookmaker: string;
  bookKey?: string; // API key for the book (for DFS detection)
  line: number;
  odds: number;
  isDFS?: boolean; // Whether this is a DFS app (excluded from market average)
}

interface DiscrepancyPick {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  propType: string;
  propLabel: string;
  commenceTime: string;
  sport: string;
  primaryBook: string;
  primaryLine: number;
  primaryOdds: number;
  marketAverage: number;
  discrepancy: number;
  discrepancyPercent: number;
  recommendation: 'over' | 'under';
  allBooks: BookLine[];
  confidence: 'high' | 'medium' | 'low';
  traditionalBookCount?: number; // Number of traditional sportsbooks used in average
}

// Props for the component
interface DiscrepancyPageProps {
  onAddPick?: (pick: any) => void;
  savedPicks?: any[];
}

// DFS apps that support player props
const DFS_SPORTSBOOKS = [
  { id: 'prizepicks', name: 'PrizePicks' },
  { id: 'underdog', name: 'Underdog Fantasy' },
  { id: 'draftkings_pick6', name: 'DraftKings Pick6' },
  { id: 'sleeper', name: 'Sleeper' },
  { id: 'fliff', name: 'Fliff' },
  { id: 'betr', name: 'Betr' },
];

// Sports with player props
const SPORTS = [
  { id: 'all', name: 'All Sports' },
  { id: 'basketball_nba', name: 'NBA' },
  { id: 'basketball_ncaab', name: 'NCAA Basketball' },
  { id: 'americanfootball_nfl', name: 'NFL' },
  { id: 'americanfootball_ncaaf', name: 'NCAA Football' },
  { id: 'icehockey_nhl', name: 'NHL' },
  // MLB removed - not in season (add back around March/April)
];

// Generate date options for the next 7 days
function getDateOptions() {
  const options = [{ id: 'all_upcoming', name: 'All Upcoming' }];
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = dayNames[date.getDay()];
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

const DATE_OPTIONS = getDateOptions();

// Prop types
const PROP_TYPES = [
  { id: 'all', name: 'All Props' },
  { id: 'player_points', name: 'Points' },
  { id: 'player_rebounds', name: 'Rebounds' },
  { id: 'player_assists', name: 'Assists' },
  { id: 'player_points_rebounds_assists', name: 'PRA (Pts+Reb+Ast)' },
  { id: 'player_threes', name: '3-Pointers Made' },
  { id: 'player_steals', name: 'Steals' },
  { id: 'player_blocks', name: 'Blocks' },
  { id: 'player_turnovers', name: 'Turnovers' },
  { id: 'player_pass_yds', name: 'Passing Yards' },
  { id: 'player_rush_yds', name: 'Rushing Yards' },
  { id: 'player_reception_yds', name: 'Receiving Yards' },
  { id: 'player_pass_tds', name: 'Passing TDs' },
  { id: 'player_rush_tds', name: 'Rushing TDs' },
  { id: 'player_receptions', name: 'Receptions' },
];

export function DiscrepancyPage({ onAddPick, savedPicks = [] }: DiscrepancyPageProps) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const { data: userData } = useMe();

  // Filter state
  const [selectedBook, setSelectedBook] = useState('prizepicks');
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const [selectedPropType, setSelectedPropType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all_upcoming');
  const [minDiscrepancy, setMinDiscrepancy] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // UI state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [bookExpanded, setBookExpanded] = useState(false);
  const [bookClosing, setBookClosing] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [sportClosing, setSportClosing] = useState(false);
  const [propTypeExpanded, setPropTypeExpanded] = useState(false);
  const [propTypeClosing, setPropTypeClosing] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(false);
  const [dateClosing, setDateClosing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Close drawer functions with animation
  const closeBookDrawer = () => {
    setBookClosing(true);
    setTimeout(() => {
      setBookExpanded(false);
      setBookClosing(false);
    }, 300);
  };

  const closeSportDrawer = () => {
    setSportClosing(true);
    setTimeout(() => {
      setSportExpanded(false);
      setSportClosing(false);
    }, 300);
  };

  const closePropTypeDrawer = () => {
    setPropTypeClosing(true);
    setTimeout(() => {
      setPropTypeExpanded(false);
      setPropTypeClosing(false);
    }, 300);
  };

  const closeDateDrawer = () => {
    setDateClosing(true);
    setTimeout(() => {
      setDateExpanded(false);
      setDateClosing(false);
    }, 300);
  };

  // Map DFS book IDs to display names and API keys
  const DFS_BOOK_MAP: Record<string, { name: string; keys: string[] }> = {
    'prizepicks': { name: 'PrizePicks', keys: ['prizepicks'] },
    'underdog': { name: 'Underdog', keys: ['underdog'] },
    'draftkings_pick6': { name: 'Pick 6', keys: ['pick6', 'draftkings_pick6'] },
    'sleeper': { name: 'Sleeper', keys: ['sleeper'] },
    'fliff': { name: 'Fliff', keys: ['fliff'] },
    'betr': { name: 'Betr', keys: ['betr', 'betr_us_dfs'] },
  };

  // ALL DFS app keys - used to exclude from market average calculation
  const ALL_DFS_KEYS = [
    'prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'sleeper', 
    'fliff', 'betr', 'betr_us_dfs', 'dabble', 'dabble_au', 'chalkboard', 'parlay'
  ];

  // Check if a book is a DFS app
  const isDFSBook = (bookKey: string, bookName: string): boolean => {
    const key = bookKey?.toLowerCase() || '';
    const name = bookName?.toLowerCase() || '';
    return ALL_DFS_KEYS.some(dfs => key.includes(dfs) || name.includes(dfs));
  };

  // Check if market key is an alternate line (should be excluded)
  const isAlternateLine = (marketKey: string): boolean => {
    if (!marketKey) return false;
    const key = marketKey.toLowerCase();
    return key.includes('alternate') || key.includes('_alt');
  };

  // Stable empty array reference to prevent infinite re-renders
  const emptySportsbooks = useRef<string[]>([]).current;

  // Fetch player props data from API
  // When "all" is selected, pass 'all' to let useOddsData fetch from all sports
  const { picks: apiPicks, loading: isLoading, error: apiError, refetch, lastUpdated, isRefreshing } = useOddsData({
    sport: selectedSport, // Pass 'all' or specific sport - useOddsData handles the mapping
    marketType: selectedPropType === 'all' ? 'player_points' : selectedPropType,
    betType: 'props',
    sportsbooks: emptySportsbooks, // Get all sportsbooks - stable reference
    date: selectedDate,
    minDataPoints: 1,
    enabled: true,
    autoRefresh: autoRefresh,
    refreshInterval: 45000, // 45 seconds
  });

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Close filter with animation
  const closeFilterMenu = () => {
    setIsFilterClosing(true);
    setTimeout(() => {
      setIsFilterMenuOpen(false);
      setIsFilterClosing(false);
    }, 280);
  };

  // Get prop label from market key
  const getPropLabel = (marketKey: string): string => {
    const labelMap: Record<string, string> = {
      'player_points': 'Points',
      'player_rebounds': 'Rebounds',
      'player_assists': 'Assists',
      'player_points_rebounds_assists': 'PRA',
      'player_threes': '3-Pointers',
      'player_steals': 'Steals',
      'player_blocks': 'Blocks',
      'player_turnovers': 'Turnovers',
      'player_pass_yds': 'Pass Yds',
      'player_rush_yds': 'Rush Yds',
      'player_reception_yds': 'Rec Yds',
      'player_pass_tds': 'Pass TDs',
      'player_rush_tds': 'Rush TDs',
      'player_receptions': 'Receptions',
    };
    return labelMap[marketKey] || marketKey.replace('player_', '').replace(/_/g, ' ');
  };

  // Get sport label from sport key
  const getSportLabel = (sportKey: string): string => {
    const sportMap: Record<string, string> = {
      'basketball_nba': 'NBA',
      'basketball_ncaab': 'NCAAB',
      'americanfootball_nfl': 'NFL',
      'americanfootball_ncaaf': 'NCAAF',
      'baseball_mlb': 'MLB',
      'icehockey_nhl': 'NHL',
    };
    return sportMap[sportKey] || sportKey;
  };

  // Process API picks to find discrepancies
  const processedDiscrepancies: DiscrepancyPick[] = useMemo(() => {
    if (!apiPicks || apiPicks.length === 0) return [];

    const selectedBookInfo = DFS_BOOK_MAP[selectedBook];
    if (!selectedBookInfo) return [];

    const discrepancies: DiscrepancyPick[] = [];

    apiPicks.forEach((pick, idx) => {
      // Only process player props
      if (!pick.isPlayerProp || !pick.playerName) return;

      // SKIP alternate lines - they create false discrepancies
      const marketKey = pick.marketKey || '';
      if (isAlternateLine(marketKey)) return;

      // Get all books for this pick
      const allBooks = pick.allBooks || pick.books || [];
      if (allBooks.length < 2) return; // Need at least 2 books to compare

      // Find the selected DFS book's line
      const primaryBookData = allBooks.find((b: any) => 
        selectedBookInfo.keys.some(key => 
          b.key?.toLowerCase() === key.toLowerCase() || 
          b.name?.toLowerCase().includes(selectedBookInfo.name.toLowerCase())
        )
      );

      if (!primaryBookData || primaryBookData.line === undefined) return;

      // Get ONLY traditional sportsbooks for market average (exclude ALL DFS apps)
      const traditionalBooks = allBooks.filter((b: any) => {
        const bookKey = b.key || '';
        const bookName = b.name || '';
        // Exclude all DFS apps from market average calculation
        return !isDFSBook(bookKey, bookName);
      });

      // Need at least 5 traditional sportsbooks to compare against for reliable discrepancy
      if (traditionalBooks.length < 5) return;

      // Calculate market average from TRADITIONAL sportsbooks only
      const validLines = traditionalBooks
        .filter((b: any) => b.line !== undefined && b.line !== null)
        .map((b: any) => b.line);

      if (validLines.length === 0) return;

      const marketAverage = validLines.reduce((sum: number, line: number) => sum + line, 0) / validLines.length;
      const primaryLine = primaryBookData.line;
      const discrepancy = marketAverage - primaryLine;
      
      // Avoid division by zero and handle edge cases
      if (marketAverage === 0) return;
      const discrepancyPercent = (discrepancy / marketAverage) * 100;

      // Skip if discrepancy is unreasonably high (likely bad data)
      if (Math.abs(discrepancyPercent) > 100) return;

      // Determine recommendation
      // If primary line < average, take OVER (you're getting a lower line)
      // If primary line > average, take UNDER (you're getting a higher line)
      const recommendation: 'over' | 'under' = discrepancy > 0 ? 'over' : 'under';

      // Determine confidence based on discrepancy percentage
      const absPercent = Math.abs(discrepancyPercent);
      const confidence: 'high' | 'medium' | 'low' = 
        absPercent >= 10 ? 'high' : 
        absPercent >= 5 ? 'medium' : 'low';

      // Parse game info from pick
      const gameInfo = pick.game || '';
      const teams = gameInfo.split(' @ ');
      const team = teams[0] || '';
      const opponent = teams[1] || '';

      // Build allBooks array for mini-table - show DFS apps AND traditional books
      // But mark which are DFS vs traditional
      const bookLines: BookLine[] = allBooks.map((b: any) => ({
        bookmaker: b.name || b.key || 'Unknown',
        bookKey: b.key || '', // Preserve key for DFS detection
        line: b.line || 0,
        odds: parseInt(b.overOdds?.replace('+', '') || b.odds?.replace('+', '') || '-110', 10),
        isDFS: isDFSBook(b.key || '', b.name || ''),
      }));

      discrepancies.push({
        id: `${pick.id || idx}-${pick.playerName}-${pick.marketKey}`,
        playerName: pick.playerName,
        team,
        opponent,
        propType: marketKey || 'player_points',
        propLabel: getPropLabel(marketKey || 'player_points'),
        commenceTime: pick.commenceTime || pick.gameTime || new Date().toISOString(),
        sport: pick.sport || getSportLabel(pick.sportKey || (selectedSport !== 'all' ? selectedSport : 'basketball_nba')),
        primaryBook: selectedBookInfo.name,
        primaryLine,
        primaryOdds: -110,
        marketAverage,
        discrepancy,
        discrepancyPercent,
        recommendation,
        allBooks: bookLines,
        confidence,
        traditionalBookCount: traditionalBooks.length,
      });
    });

    return discrepancies;
  }, [apiPicks, selectedBook, selectedSport]);

  // Filter discrepancies based on selections
  const filteredDiscrepancies = useMemo(() => {
    return processedDiscrepancies.filter(d => {
      // Filter by minimum discrepancy
      if (Math.abs(d.discrepancy) < minDiscrepancy) return false;
      
      // Filter by prop type
      if (selectedPropType !== 'all' && d.propType !== selectedPropType) return false;
      
      return true;
    }).sort((a, b) => Math.abs(b.discrepancyPercent) - Math.abs(a.discrepancyPercent));
  }, [processedDiscrepancies, minDiscrepancy, selectedPropType]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDiscrepancies.length / itemsPerPage));
  const paginatedDiscrepancies = filteredDiscrepancies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    return lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Refresh handler - use the refetch from useOddsData
  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing discrepancies...', {
      description: 'Fetching latest line comparisons'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar - Matching Arbitrage */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
          <div className="flex items-center justify-center gap-2 overflow-x-auto overflow-y-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide w-full md:w-auto">
            {/* Filters Button */}
            <button 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-2xl border rounded-xl transition-all font-bold whitespace-nowrap text-sm ${
                isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Refresh Button */}
            <button 
              onClick={handleRefresh}
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
                <ChevronLeft className="w-5 h-5" />
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

        {/* Desktop Pagination */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-[44px] h-[44px] backdrop-blur-2xl border rounded-xl transition-all font-bold ${
              currentPage === 1
                ? isLight ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
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

      {/* Results Count & Last Updated */}
      <div className="flex items-center justify-between">
        <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
          {filteredDiscrepancies.length} discrepancies found
        </p>
        <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
          Updated {formatLastUpdated()}
        </p>
      </div>

      {/* Discrepancy Table */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl overflow-hidden`}>
        {/* Table Header - Desktop Only */}
        <div className={`hidden lg:grid lg:grid-cols-12 gap-4 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-b`}>
          <div className={`col-span-1 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Edge</div>
          <div className={`col-span-3 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Match</div>
          <div className={`col-span-6 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Lines</div>
          <div className={`col-span-2 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Recommendation</div>
        </div>

        {/* Table Body */}
        {paginatedDiscrepancies.length === 0 ? (
          <div className={`p-8 text-center ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
            <p className="font-bold text-lg mb-2">No discrepancies found</p>
            <p className="text-sm">Try adjusting your filters or lowering the minimum edge threshold.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {paginatedDiscrepancies.map((pick) => (
              <div key={pick.id}>
                {/* Clickable Row */}
                <button 
                  onClick={() => toggleRowExpansion(pick.id)}
                  className={`w-full p-4 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-all text-left`}
                >
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                    {/* Edge Badge */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className={`px-3 py-2 rounded-xl font-bold text-lg ${
                        isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {Math.abs(pick.discrepancyPercent).toFixed(1)}%
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="col-span-3">
                      <div className={`inline-block px-2.5 py-1 ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-white'} rounded-full font-bold text-xs mb-2`}>
                        {pick.sport}
                      </div>
                      <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {pick.playerName}
                      </div>
                      <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                        {pick.team} @ {pick.opponent}
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${isLight ? 'text-gray-400' : 'text-white/40'} mt-1`}>
                        <Clock className="w-3 h-3" />
                        {formatTime(pick.commenceTime)}
                      </div>
                    </div>

                    {/* Lines Comparison */}
                    <div className="col-span-6">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Primary Book Line */}
                        <div className={`p-3 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                          <div className={`text-xs font-bold uppercase ${isLight ? 'text-gray-500' : 'text-white/50'} mb-1`}>
                            {pick.primaryBook}
                          </div>
                          <div className={`font-bold text-xl ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {pick.propLabel}: {pick.primaryLine}
                          </div>
                        </div>
                        
                        {/* Market Average */}
                        <div className={`p-3 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                          <div className={`text-xs font-bold uppercase ${isLight ? 'text-gray-500' : 'text-white/50'} mb-1`}>
                            Market Average
                          </div>
                          <div className={`font-bold text-xl ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {pick.propLabel}: {pick.marketAverage.toFixed(1)}
                          </div>
                          <div className={`text-xs ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                            Diff: {pick.discrepancy > 0 ? '+' : ''}{pick.discrepancy.toFixed(1)} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation + Expand Arrow */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div className={`flex-1 p-3 ${
                        pick.recommendation === 'over'
                          ? isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/20'
                          : isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'
                      } border rounded-xl text-center`}>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          {pick.recommendation === 'over' ? (
                            <ArrowUp className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
                          ) : (
                            <ArrowDown className={`w-5 h-5 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
                          )}
                          <span className={`font-bold text-lg ${
                            pick.recommendation === 'over'
                              ? isLight ? 'text-green-700' : 'text-green-400'
                              : isLight ? 'text-red-700' : 'text-red-400'
                          }`}>
                            {pick.recommendation.toUpperCase()}
                          </span>
                        </div>
                        <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                          on {pick.primaryBook}
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-white/40'} transition-transform ${expandedRows.includes(pick.id) ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`inline-block px-2.5 py-1 ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-white'} rounded-full font-bold text-xs mb-2`}>
                          {pick.sport}
                        </div>
                        <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {pick.playerName}
                        </div>
                        <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                          {pick.team} @ {pick.opponent}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-2 rounded-xl font-bold ${
                          isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {Math.abs(pick.discrepancyPercent).toFixed(1)}%
                        </div>
                        <ChevronDown className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-white/40'} transition-transform ${expandedRows.includes(pick.id) ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Lines */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                        <div className={`text-xs font-bold ${isLight ? 'text-gray-500' : 'text-white/50'}`}>{pick.primaryBook}</div>
                        <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{pick.primaryLine}</div>
                      </div>
                      <div className={`p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                        <div className={`text-xs font-bold ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Avg</div>
                        <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{pick.marketAverage.toFixed(1)}</div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`p-3 ${
                      pick.recommendation === 'over'
                        ? isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/20'
                        : isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'
                    } border rounded-xl flex items-center justify-center gap-2`}>
                      {pick.recommendation === 'over' ? (
                        <ArrowUp className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
                      ) : (
                        <ArrowDown className={`w-5 h-5 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
                      )}
                      <span className={`font-bold ${
                        pick.recommendation === 'over'
                          ? isLight ? 'text-green-700' : 'text-green-400'
                          : isLight ? 'text-red-700' : 'text-red-400'
                      }`}>
                        {pick.recommendation.toUpperCase()} {pick.propLabel}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Mini-Table - All Book Lines */}
                {expandedRows.includes(pick.id) && (
                  <div className={`px-4 pb-4 ${isLight ? 'bg-gray-50' : 'bg-white/[0.02]'}`}>
                    <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-slate-900/50 border-white/10'} border rounded-xl overflow-hidden`}>
                      {/* Mini-Table Header */}
                      <div className={`grid grid-cols-3 gap-4 px-4 py-3 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} border-b`}>
                        <div className={`${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide`}>Sportsbook</div>
                        <div className={`${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide text-center`}>Line</div>
                        <div className={`${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide text-right`}>vs Avg</div>
                      </div>
                      
                      {/* Traditional Sportsbooks Section */}
                      <div className={`px-4 py-2 ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'} border-b`}>
                        <span className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                          Traditional Sportsbooks (Used in Average)
                        </span>
                      </div>
                      {pick.allBooks.filter(b => !b.isDFS).map((book, idx) => {
                        const diffFromAvg = book.line - pick.marketAverage;
                        const traditionalBooks = pick.allBooks.filter(b => !b.isDFS);
                        return (
                          <div 
                            key={`trad-${idx}`}
                            className={`grid grid-cols-3 gap-4 px-4 py-3 ${
                              idx !== traditionalBooks.length - 1 ? (isLight ? 'border-b border-gray-100' : 'border-b border-white/5') : ''
                            }`}
                          >
                            <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-2`}>
                              {book.bookmaker}
                            </div>
                            <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'} text-center`}>
                              {book.line}
                            </div>
                            <div className={`font-bold text-right ${
                              diffFromAvg < 0
                                ? isLight ? 'text-green-600' : 'text-green-400'
                                : diffFromAvg > 0
                                  ? isLight ? 'text-red-600' : 'text-red-400'
                                  : isLight ? 'text-gray-500' : 'text-white/50'
                            }`}>
                              {diffFromAvg > 0 ? '+' : ''}{diffFromAvg.toFixed(1)}
                            </div>
                          </div>
                        );
                      })}

                      {/* DFS Apps Section */}
                      {pick.allBooks.filter(b => b.isDFS).length > 0 && (
                        <>
                          <div className={`px-4 py-2 ${isLight ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/10 border-purple-500/20'} border-y`}>
                            <span className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                              DFS Apps (Not in Average)
                            </span>
                          </div>
                          {pick.allBooks.filter(b => b.isDFS).map((book, idx) => {
                            const diffFromAvg = book.line - pick.marketAverage;
                            const isPrimaryBook = book.bookmaker.toLowerCase().includes(pick.primaryBook.toLowerCase()) || 
                                                  pick.primaryBook.toLowerCase().includes(book.bookmaker.toLowerCase());
                            const dfsBooks = pick.allBooks.filter(b => b.isDFS);
                            return (
                              <div 
                                key={`dfs-${idx}`}
                                className={`grid grid-cols-3 gap-4 px-4 py-3 ${
                                  idx !== dfsBooks.length - 1 ? (isLight ? 'border-b border-gray-100' : 'border-b border-white/5') : ''
                                } ${isPrimaryBook ? (isLight ? 'bg-purple-50' : 'bg-purple-500/10') : ''}`}
                              >
                                <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-2`}>
                                  {book.bookmaker}
                                  {isPrimaryBook && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'}`}>
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'} text-center`}>
                                  {book.line}
                                </div>
                                <div className={`font-bold text-right ${
                                  diffFromAvg < 0
                                    ? isLight ? 'text-green-600' : 'text-green-400'
                                    : diffFromAvg > 0
                                      ? isLight ? 'text-red-600' : 'text-red-400'
                                      : isLight ? 'text-gray-500' : 'text-white/50'
                                }`}>
                                  {diffFromAvg > 0 ? '+' : ''}{diffFromAvg.toFixed(1)}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Market Average Row */}
                      <div className={`grid grid-cols-3 gap-4 px-4 py-3 ${isLight ? 'bg-gray-100 border-t border-gray-200' : 'bg-white/5 border-t border-white/10'}`}>
                        <div className={`font-bold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
                          Market Average
                          <span className={`ml-2 text-xs font-normal ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                            ({pick.traditionalBookCount || pick.allBooks.filter(b => !b.isDFS).length} book{(pick.traditionalBookCount || pick.allBooks.filter(b => !b.isDFS).length) !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'} text-center`}>
                          {pick.marketAverage.toFixed(1)}
                        </div>
                        <div className={`font-bold ${isLight ? 'text-gray-500' : 'text-white/50'} text-right`}>
                          —
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Side Panel */}
      {isFilterMenuOpen && (
        <>
          {/* Desktop Backdrop */}
          <div 
            className={`hidden lg:block fixed right-0 bg-black/30 z-[9998] transition-opacity duration-300 ${isFilterClosing ? 'opacity-0' : 'opacity-100'}`}
            style={{ top: '-100px', bottom: 0, left: '320px' }}
            onClick={closeFilterMenu}
          />
          
          {/* Mobile Backdrop */}
          <div 
            className={`lg:hidden fixed right-0 left-0 bg-black/60 z-[9998] transition-opacity duration-300 ${isFilterClosing ? 'opacity-0' : 'opacity-100'}`}
            style={{ top: '-100px', bottom: 0 }}
            onClick={closeFilterMenu}
          />
          
          {/* Side Panel */}
          <div 
            className={`!fixed max-lg:!bottom-0 max-lg:!left-0 max-lg:!right-0 max-lg:!top-auto lg:!left-0 lg:!bottom-0 max-lg:max-h-[85vh] ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} lg:border-r max-lg:border-t lg:rounded-none max-lg:rounded-t-2xl flex flex-col ${isFilterClosing ? 'animate-out max-lg:slide-out-to-bottom lg:slide-out-to-left duration-300' : 'animate-in max-lg:slide-in-from-bottom lg:slide-in-from-left duration-300'} lg:w-80 max-lg:w-full`}
            style={{
              zIndex: 9999,
              top: '-64px',
            }}
          >
            {/* Sticky Header */}
            <div className={`sticky top-0 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} z-10 px-6 pt-6 lg:pt-6 pb-4 space-y-4 lg:border-b border-b-0 -mt-6 lg:mt-0 lg:rounded-none max-lg:rounded-t-2xl`}>
              {/* Drag Handle - Mobile Only */}
              <div className="flex lg:hidden justify-center pt-3 pb-2 -mt-6">
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
                    setSelectedBook('prizepicks');
                    setSelectedSport('all');
                    setSelectedPropType('all');
                    setSelectedDate('all_upcoming');
                    setMinDiscrepancy(1);
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

            {/* Content - scrollable on both mobile and desktop */}
            <div className="overflow-y-auto flex-1 p-6 pt-2 lg:pt-12 space-y-3 lg:space-y-5 scrollbar-hide">
              {/* Auto Refresh Toggle */}
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 flex items-center gap-2`}>
                  Auto Refresh
                </label>
                <div className={`flex items-center justify-between p-4 ${isLight ? 'bg-white border border-gray-300' : 'bg-white/5 border border-white/10'} backdrop-blur-xl rounded-xl`}>
                  <div className="flex items-center gap-3 flex-1">
                    <RefreshCw className={`w-5 h-5 ${autoRefresh ? (isLight ? 'text-purple-600' : 'text-purple-400') : (isLight ? 'text-gray-400' : 'text-white/40')}`} />
                    <div>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>Auto Refresh Odds</div>
                      <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold`}>
                        {autoRefresh ? 'Updates every 45 seconds' : 'Update every 45 seconds'}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <div className={`w-11 h-6 ${isLight ? 'bg-gray-200' : 'bg-white/10'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500`}></div>
                  </label>
                </div>
              </div>

              {/* Minimum Edge Slider */}
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Minimum Edge
                </label>
                <div className={`p-4 ${isLight ? 'bg-white border border-gray-300' : 'bg-white/5 border border-white/10'} backdrop-blur-xl rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <span className={`${isLight ? 'text-gray-500' : 'text-white/40'} text-xs font-bold`}>0.5</span>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={minDiscrepancy}
                      onChange={(e) => setMinDiscrepancy(parseFloat(e.target.value))}
                      className={`flex-1 h-2 rounded-full appearance-none cursor-pointer ${isLight ? 'bg-gray-200' : 'bg-white/10'} accent-purple-500`}
                      style={{
                        background: `linear-gradient(to right, ${isLight ? '#9333ea' : '#a855f7'} 0%, ${isLight ? '#9333ea' : '#a855f7'} ${((minDiscrepancy - 0.5) / 4.5) * 100}%, ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} ${((minDiscrepancy - 0.5) / 4.5) * 100}%, ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} 100%)`
                      }}
                    />
                    <div className={`${isLight ? 'text-purple-600 bg-purple-100' : 'text-purple-300 bg-purple-500/20'} px-2 py-1 rounded-full font-bold text-sm min-w-[50px] text-center`}>
                      {minDiscrepancy}+ pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Sportsbook */}
              <div className="relative">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Compare Against
                </label>
                <button
                  onClick={() => setBookExpanded(!bookExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{DFS_SPORTSBOOKS.find(b => b.id === selectedBook)?.name || 'Select Book'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${bookExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {bookExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {DFS_SPORTSBOOKS.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book.id);
                          setBookExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedBook === book.id
                            ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {book.name}
                        {selectedBook === book.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Book Drawer - Mobile Only - Rendered via Portal */}
              {bookExpanded && createPortal(
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] transition-opacity duration-300 ${bookClosing ? 'opacity-0' : 'opacity-100'}`}
                    onClick={closeBookDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-[10001] overflow-hidden ${bookClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Compare Against</h3>
                        <button
                          onClick={closeBookDrawer}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)] scrollbar-hide">
                      {DFS_SPORTSBOOKS.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => {
                            setSelectedBook(book.id);
                            closeBookDrawer();
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all flex items-center justify-between ${
                            selectedBook === book.id
                              ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {book.name}
                          {selectedBook === book.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>,
                document.body
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
                  <span>{SPORTS.find(s => s.id === selectedSport)?.name || 'All Sports'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sportExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {sportExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {SPORTS.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => {
                          setSelectedSport(sport.id);
                          setSportExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedSport === sport.id
                            ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {sport.name}
                        {selectedSport === sport.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sport Drawer - Mobile Only - Rendered via Portal */}
              {sportExpanded && createPortal(
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] transition-opacity duration-300 ${sportClosing ? 'opacity-0' : 'opacity-100'}`}
                    onClick={closeSportDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-[10001] overflow-hidden ${sportClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
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
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)] scrollbar-hide">
                      {SPORTS.map((sport) => (
                        <button
                          key={sport.id}
                          onClick={() => {
                            setSelectedSport(sport.id);
                            closeSportDrawer();
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all flex items-center justify-between ${
                            selectedSport === sport.id
                              ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {sport.name}
                          {selectedSport === sport.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>,
                document.body
              )}

              {/* Prop Type Filter */}
              <div className="relative">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Prop Type
                </label>
                <button
                  onClick={() => setPropTypeExpanded(!propTypeExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{PROP_TYPES.find(p => p.id === selectedPropType)?.name || 'All Props'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${propTypeExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {propTypeExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-hide`}>
                    {PROP_TYPES.map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => {
                          setSelectedPropType(prop.id);
                          setPropTypeExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedPropType === prop.id
                            ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {prop.name}
                        {selectedPropType === prop.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Prop Type Drawer - Mobile Only - Rendered via Portal */}
              {propTypeExpanded && createPortal(
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] transition-opacity duration-300 ${propTypeClosing ? 'opacity-0' : 'opacity-100'}`}
                    onClick={closePropTypeDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[70vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-[10001] overflow-hidden ${propTypeClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Prop Type</h3>
                        <button
                          onClick={closePropTypeDrawer}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="overflow-y-auto max-h-[calc(70vh-80px)] scrollbar-hide">
                      {PROP_TYPES.map((prop) => (
                        <button
                          key={prop.id}
                          onClick={() => {
                            setSelectedPropType(prop.id);
                            closePropTypeDrawer();
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all flex items-center justify-between ${
                            selectedPropType === prop.id
                              ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {prop.name}
                          {selectedPropType === prop.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>,
                document.body
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
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{DATE_OPTIONS.find(d => d.id === selectedDate)?.name || 'All Upcoming'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dateExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {dateExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-hide`}>
                    {DATE_OPTIONS.map((date) => (
                      <button
                        key={date.id}
                        onClick={() => {
                          setSelectedDate(date.id);
                          setDateExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedDate === date.id
                            ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {date.name}
                        {selectedDate === date.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Drawer - Mobile Only - Rendered via Portal */}
              {dateExpanded && createPortal(
                <>
                  {/* Backdrop */}
                  <div 
                    className={`lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] transition-opacity duration-300 ${dateClosing ? 'opacity-0' : 'opacity-100'}`}
                    onClick={closeDateDrawer}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[70vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-[10001] overflow-hidden ${dateClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'} duration-300`}>
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
                    <div className="overflow-y-auto max-h-[calc(70vh-80px)] scrollbar-hide">
                      {DATE_OPTIONS.map((date) => (
                        <button
                          key={date.id}
                          onClick={() => {
                            setSelectedDate(date.id);
                            closeDateDrawer();
                          }}
                          className={`w-full text-left px-6 py-4 font-bold transition-all flex items-center justify-between ${
                            selectedDate === date.id
                              ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-white'
                              : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {date.name}
                          {selectedDate === date.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>,
                document.body
              )}

              </div>
          </div>
        </>
      )}
    </div>
  );
}
