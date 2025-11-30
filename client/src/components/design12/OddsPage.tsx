import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useOddsData, getSportLabel } from '../../hooks/useOddsData';
import { PlayerPropsPage } from './PlayerPropsPage';
import { toast } from 'sonner';

export function OddsPage({ onAddPick, savedPicks = [] }: { onAddPick: (pick: any) => void, savedPicks?: any[] }) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedBetType, setSelectedBetType] = useState('straight');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [expandedSportsbooks, setExpandedSportsbooks] = useState<number[]>([]);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [isBetTypeDropdownOpen, setIsBetTypeDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('today');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortBy, setSortBy] = useState<'ev' | 'time' | null>('ev');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateExpanded, setDateExpanded] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [betTypeExpanded, setBetTypeExpanded] = useState(false);
  const [marketExpanded, setMarketExpanded] = useState(false);
  const [sportsbooksExpanded, setSportsbooksExpanded] = useState(false);
  const [addedPicks, setAddedPicks] = useState<number[]>([]); // Track which picks have been added
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch real odds data from API
  const { picks: apiPicks, loading: apiLoading, error: apiError, refetch } = useOddsData({
    sport: selectedSport,
    marketType: selectedMarket,
    betType: selectedBetType,
    sportsbooks: selectedSportsbooks,
    enabled: true
  });

  // Use API picks, fallback to empty array
  const topPicks = apiPicks || [];
  const isLoading = apiLoading;

  // Show toast when filters change and reset to page 1
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    if (!isLoading && (selectedSport !== 'all' || selectedMarket !== 'all' || selectedBetType !== 'straight' || selectedDate !== 'today')) {
      toast.success('Filters applied', {
        description: 'Odds updated based on your filter selection'
      });
    }
  }, [selectedSport, selectedMarket, selectedBetType, selectedDate, isLoading]);

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

  const marketTypes = [
    { id: 'all', name: 'All Markets' },
    { id: 'moneyline', name: 'Moneyline' },
    { id: 'spread', name: 'Spread' },
    { id: 'totals', name: 'Totals (Over/Under)' },
  ];

  const sportsbooksByTier = [
    {
      tier: 'Tier 1 - Major US Sportsbooks',
      books: [
        { id: 'draftkings', name: 'DraftKings' },
        { id: 'fanduel', name: 'FanDuel' },
        { id: 'betmgm', name: 'BetMGM' },
        { id: 'caesars', name: 'Caesars Sportsbook' },
      ]
    },
    {
      tier: '🎮 DFS APPS (Tier 1)',
      books: [
        { id: 'prizepicks', name: 'PrizePicks' },
        { id: 'underdog', name: 'Underdog Fantasy' },
        { id: 'dkpick6', name: 'DK Pick6' },
        { id: 'dabble', name: 'Dabble' },
      ]
    },
    {
      tier: '⭐ SECOND TIER - MAJOR OPERATORS (Tier 2)',
      books: [
        { id: 'espnbet', name: 'ESPN BET' },
        { id: 'fanatics', name: 'Fanatics Sportsbook' },
        { id: 'hardrock', name: 'Hard Rock Bet' },
        { id: 'pointsbet', name: 'PointsBet US' },
        { id: 'betrivers', name: 'BetRivers' },
        { id: 'wynnbet', name: 'WynnBET' },
        { id: 'unibet', name: 'Unibet US' },
      ]
    },
    {
      tier: '🎯 SHARP/LOW VIG BOOKS (Tier 2)',
      books: [
        { id: 'pinnacle', name: 'Pinnacle' },
        { id: 'novig', name: 'NoVig' },
      ]
    },
    {
      tier: '💱 EXCHANGES (Tier 3)',
      books: [
        { id: 'prophetx', name: 'ProphetX' },
        { id: 'rebet', name: 'ReBet' },
        { id: 'betopenly', name: 'BetOpenly' },
      ]
    },
    {
      tier: '🌍 REGIONAL/SPECIALTY (Tier 3)',
      books: [
        { id: 'fliff', name: 'Fliff' },
        { id: 'circa', name: 'Circa Sports' },
      ]
    },
    {
      tier: '🌐 OFFSHORE (Tier 3 - Optional)',
      books: [
        { id: 'bovada', name: 'Bovada' },
        { id: 'betonline', name: 'BetOnline' },
        { id: 'mybookie', name: 'MyBookie' },
      ]
    }
  ];

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSportsbook = (id: number) => {
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
        'ncaa-basketball': ['NCAA Basketball']
      };
      
      const allowedLabels = sportLabelMap[selectedSport] || [];
      const matches = allowedLabels.some(label => pick.sport === label);
      
      if (!matches) {
        return false;
      }
    }
    
    // Filter by sportsbooks (if any selected, show only picks available at selected books)
    if (selectedSportsbooks.length > 0) {
      // Create a map of sportsbook IDs to names for matching
      const sportsbookMap: Record<string, string[]> = {};
      sportsbooksByTier.forEach(tier => {
        tier.books.forEach(book => {
          if (!sportsbookMap[book.id]) {
            sportsbookMap[book.id] = [];
          }
          sportsbookMap[book.id].push(book.name.toLowerCase());
        });
      });

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
          setSelectedDate('today');
        }}
        className={`px-6 py-2.5 ${isLight ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-white hover:from-purple-500/30 hover:to-indigo-500/30'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
      >
        Clear All Filters
      </button>
    </div>
  );

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

            {/* Auto-Refresh Button - Toggles automatic refreshing of odds data
                - Will automatically fetch latest odds at regular intervals when enabled
                - TODO: Functionality to be implemented with real-time API updates */}
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
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsFilterMenuOpen(false)}
          />
          
          {/* Side Panel - Desktop / Bottom Drawer - Mobile */}
          <div className={`fixed lg:left-0 lg:top-0 lg:bottom-0 bottom-16 left-0 right-0 lg:w-80 lg:h-auto h-auto ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl lg:border-r border-t lg:border-t-0 z-50 lg:rounded-none rounded-t-3xl animate-in max-lg:slide-in-from-bottom lg:slide-in-from-left duration-300 flex flex-col`}>
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
                  onClick={() => setIsFilterMenuOpen(false)}
                  className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                >
                  <ChevronRight className="w-5 h-5 lg:block hidden" />
                  <span className="lg:hidden text-lg">✕</span>
                </button>
              </div>
              
              {/* Apply and Reset Buttons - Mobile Only */}
              <div className="flex lg:hidden gap-2">
                <button
                  onClick={() => {
                    setIsFilterMenuOpen(false);
                    toast.success('Filters applied', {
                      description: 'Your filter selections have been applied'
                    });
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all text-center ${
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
                    toast.success('Filters reset', {
                      description: 'All filters have been cleared'
                    });
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all text-center ${
                    isLight 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 pt-6 space-y-6">

              {/* Auto Refresh Toggle */}
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Auto Refresh
                </label>
                <div className={`flex items-center justify-between p-4 ${isLight ? 'bg-white border border-gray-300' : 'bg-white/5 border border-white/10'} backdrop-blur-xl rounded-lg`}>
                  <div className="flex items-center gap-3 flex-1">
                    <RefreshCw className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                    <div>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>Auto Refresh Odds</div>
                      <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold`}>Update every 30 seconds</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <div className={`w-11 h-6 ${isLight ? 'bg-gray-200' : 'bg-white/10'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500`}></div>
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                    isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>
                    {[
                      { id: 'today', name: 'Today' },
                      { id: 'tomorrow', name: 'Tomorrow' },
                      { id: 'week', name: 'This Week' },
                      { id: 'all', name: 'All Upcoming' }
                    ].find(d => d.id === selectedDate)?.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dateExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Inline Dropdown */}
                {dateExpanded && (
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-lg overflow-hidden`}>
                    {[
                      { id: 'today', name: 'Today' },
                      { id: 'tomorrow', name: 'Tomorrow' },
                      { id: 'week', name: 'This Week' },
                      { id: 'all', name: 'All Upcoming' }
                    ].map((date) => (
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
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setDateExpanded(false)}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Date</h3>
                        <button
                          onClick={() => setDateExpanded(false)}
                          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)]">
                      {[
                        { id: 'today', name: 'Today' },
                        { id: 'tomorrow', name: 'Tomorrow' },
                        { id: 'week', name: 'This Week' },
                        { id: 'all', name: 'All Upcoming' }
                      ].map((date) => (
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all ${
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
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setSportExpanded(false)}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Sport</h3>
                        <button
                          onClick={() => setSportExpanded(false)}
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all ${
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
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setMarketExpanded(false)}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Market Type</h3>
                        <button
                          onClick={() => setMarketExpanded(false)}
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all ${
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
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-lg overflow-hidden max-h-80 overflow-y-auto`}>
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
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setSportsbooksExpanded(false)}
                  />
                  
                  {/* Bottom Drawer */}
                  <div className={`lg:hidden fixed bottom-0 left-0 right-0 max-h-[70vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                    </div>
                    
                    {/* Header */}
                    <div className={`px-6 py-3 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Select Sportsbooks</h3>
                        <button
                          onClick={() => setSportsbooksExpanded(false)}
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
                          <div className={`px-6 py-3 ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-white/50'} text-xs font-bold uppercase tracking-wider sticky top-0`}>
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
                    toast.success('Filters applied', {
                      description: 'Odds updated based on your filter selection'
                    });
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all text-center ${
                    isLight 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
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
                    toast.success('Filters reset', {
                      description: 'All filters have been cleared'
                    });
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all text-center ${
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
                      {/* Game Matchup */}
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.game}</div>
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
                        <div className={`px-2.5 py-1 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30'} backdrop-blur-xl rounded-lg border`}>
                          <span className={`${isLight ? 'text-emerald-700' : 'text-white'} font-bold text-xs`}>
                            {pick.ev}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 space-y-2.5">
                      {/* Pick Display */}
                      <div className={`text-center p-3 ${isLight ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200' : 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30'} backdrop-blur-xl border rounded-lg`}>
                        
                        <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                          {pick.pick}
                        </div>
                      </div>

                      {/* Odds & Sportsbook */}
                      <div className={`flex items-center justify-between p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-lg border`}>
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
                          className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-full transition-all font-bold text-xs text-center`}
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
                          } text-white rounded-lg transition-all font-bold text-xs border text-center flex items-center justify-center gap-1.5`}
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
                              --
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
                              --
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Books Table */}
                      <div className="space-y-2">
                        {/* Table Header */}
                        <div className={`grid grid-cols-4 gap-2 px-3 py-2 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-purple-500/20 border-purple-400/30'} border rounded-full`}>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs`}>Book</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>{pick.team1.split(' ').pop()}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>{pick.team2.split(' ').pop()}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-right`}>Pick</div>
                        </div>

                        {/* Table Rows */}
                        {(expandedSportsbooks.includes(pick.id) ? pick.books : pick.books.slice(0, 5)).map((book, idx) => (
                          <div 
                            key={idx}
                            className={`grid grid-cols-4 gap-2 px-3 py-2.5 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-full items-center`}
                          >
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.name}</div>
                            <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-bold text-sm text-center`}>{typeof book.odds === 'number' && book.odds > 0 ? `+${book.odds}` : book.odds}</div>
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
                                className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg hover:from-purple-400 hover:to-indigo-400 transition-all"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* View More Button */}
                      {pick.books.length > 5 && (
                        <button 
                          onClick={() => toggleSportsbook(pick.id)}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-lg transition-all font-bold text-sm`}
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
                          <div className={`px-3 py-2 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-full`}>
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
                          <div className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-full`}>
                            <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                              {pick.bestOdds.includes('+') ? `+${parseInt(pick.bestOdds) - 15}` : `${parseInt(pick.bestOdds) + 15}`}
                            </span>
                          </div>
                        </div>

                        {/* DeVig Odds */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm mb-2`}>
                            DeVig Odds
                          </div>
                          <div className={`px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-full`}>
                            <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                              {pick.bestOdds.includes('+') ? `+${parseInt(pick.bestOdds) - 8}` : `${parseInt(pick.bestOdds) + 8}`}
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
                            {(expandedSportsbooks.includes(pick.id) ? pick.books : pick.books.slice(0, 5)).map((book, idx) => (
                              <tr 
                                key={idx}
                                className={`transition-all ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}
                              >
                                <td className="py-2 px-3">
                                  <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.name}</span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{typeof book.odds === 'number' && book.odds > 0 ? `+${book.odds}` : book.odds}</span>
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
                                      className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg hover:from-purple-400 hover:to-indigo-400 transition-all"
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
                      {pick.books.length > 5 && (
                        <div className="flex justify-center mt-3">
                          <button 
                            onClick={() => toggleSportsbook(pick.id)}
                            className={`flex items-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-lg transition-all font-bold text-sm`}
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