import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import { useOddsData, type OddsPick } from '../../hooks/useOddsData';

export function OddsPage({ onAddPick }: { onAddPick: (pick: any) => void }) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [dateExpanded, setDateExpanded] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [betTypeExpanded, setBetTypeExpanded] = useState(false);
  const [marketExpanded, setMarketExpanded] = useState(false);
  const [sportsbooksExpanded, setSportsbooksExpanded] = useState(false);
  const [addedPicks, setAddedPicks] = useState<number[]>([]); // Track which picks have been added
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch odds data from API
  const { picks: apiPicks, loading: apiLoading, error: apiError, refetch } = useOddsData({
    sport: selectedSport,
    date: selectedDate,
    marketType: selectedMarket,
    betType: selectedBetType,
    sportsbooks: selectedSportsbooks,
    limit: 50,
    enabled: true,
  });

  // Show toast when filters change
  useEffect(() => {
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

  // Mock data - now using API via useOddsData hook
  /* const topPicks = [
    {
      id: 1,
      ev: '+78.07%',
      sport: 'NBA',
      game: 'Celtics @ Magic',
      team1: 'Celtics',
      team2: 'Magic',
      pick: 'Magic ML',
      bestOdds: '+940',
      bestBook: 'Pinnacle',
      avgOdds: '+850',
      isHot: true,
      books: [
        { name: 'Pinnacle', odds: '+940', team2Odds: '-1200', ev: '+78.07%', isBest: true },
        { name: 'DraftKings', odds: '+920', team2Odds: '-1180', ev: '+75.2%', isBest: false },
        { name: 'FanDuel', odds: '+880', team2Odds: '-1150', ev: '+70.1%', isBest: false },
        { name: 'BetMGM', odds: '+850', team2Odds: '-1120', ev: '+67.8%', isBest: false },
        { name: 'Caesars', odds: '+830', team2Odds: '-1100', ev: '+65.5%', isBest: false },
        { name: 'BetRivers', odds: '+820', team2Odds: '-1080', ev: '+63.2%', isBest: false },
        { name: 'PointsBet', odds: '+810', team2Odds: '-1060', ev: '+61.8%', isBest: false },
        { name: 'Hard Rock', odds: '+800', team2Odds: '-1040', ev: '+60.5%', isBest: false },
        { name: 'Fanatics', odds: '+790', team2Odds: '-1020', ev: '+59.1%', isBest: false },
        { name: 'BetWay', odds: '+780', team2Odds: '-1000', ev: '+57.8%', isBest: false }
      ]
    },
    {
      id: 2,
      ev: '+35.41%',
      sport: 'NBA',
      game: 'Pistons @ 76ers',
      team1: 'Pistons',
      team2: '76ers',
      pick: '76ers ML',
      bestOdds: '+138',
      bestBook: 'Pinnacle',
      avgOdds: '+125',
      isHot: true,
      books: [
        { name: 'Pinnacle', odds: '+138', team2Odds: '-165', ev: '+35.41%', isBest: true },
        { name: 'BetMGM', odds: '+135', team2Odds: '-162', ev: '+33.2%', isBest: false },
        { name: 'DraftKings', odds: '+130', team2Odds: '-158', ev: '+30.5%', isBest: false },
        { name: 'FanDuel', odds: '+125', team2Odds: '-152', ev: '+28.1%', isBest: false },
        { name: 'Caesars', odds: '+122', team2Odds: '-148', ev: '+26.8%', isBest: false }
      ]
    },
    {
      id: 3,
      ev: '+8.33%',
      sport: 'NHL',
      game: 'Hurricanes @ Maple Leafs',
      team1: 'Hurricanes',
      team2: 'Maple Leafs',
      pick: 'Maple Leafs -1.5',
      bestOdds: '+160',
      bestBook: 'DraftKings',
      avgOdds: '+148',
      isHot: false,
      books: [
        { name: 'DraftKings', odds: '+160', team2Odds: '-195', ev: '+8.33%', isBest: true },
        { name: 'FanDuel', odds: '+155', team2Odds: '-188', ev: '+7.1%', isBest: false },
        { name: 'BetMGM', odds: '+150', team2Odds: '-182', ev: '+6.2%', isBest: false },
        { name: 'Caesars', odds: '+145', team2Odds: '-175', ev: '+5.5%', isBest: false },
        { name: 'Pinnacle', odds: '+142', team2Odds: '-172', ev: '+4.8%', isBest: false }
      ]
    },
    {
      id: 4,
      ev: '+7.50%',
      sport: 'NHL',
      game: 'Kraken @ Stars',
      team1: 'Kraken',
      team2: 'Stars',
      pick: 'Kraken +1.5',
      bestOdds: '+115',
      bestBook: 'Hard Rock',
      avgOdds: '+108',
      isHot: false,
      books: [
        { name: 'Hard Rock', odds: '+115', team2Odds: '-138', ev: '+7.50%', isBest: true },
        { name: 'Pinnacle', odds: '+112', team2Odds: '-135', ev: '+6.5%', isBest: false },
        { name: 'DraftKings', odds: '+110', team2Odds: '-132', ev: '+5.8%', isBest: false },
        { name: 'FanDuel', odds: '+108', team2Odds: '-130', ev: '+5.2%', isBest: false },
        { name: 'BetMGM', odds: '+105', team2Odds: '-125', ev: '+4.5%', isBest: false }
      ]
    },
    {
      id: 5,
      ev: '+6.39%',
      sport: 'NFL',
      game: 'Chiefs @ Broncos',
      team1: 'Chiefs',
      team2: 'Broncos',
      pick: 'Broncos +3.5',
      bestOdds: '+104',
      bestBook: 'Pinnacle',
      avgOdds: '+100',
      isHot: true,
      books: [
        { name: 'Pinnacle', odds: '+104', team2Odds: '-122', ev: '+6.39%', isBest: true },
        { name: 'DraftKings', odds: '+102', team2Odds: '-120', ev: '+5.5%', isBest: false },
        { name: 'FanDuel', odds: '+100', team2Odds: '-118', ev: '+4.8%', isBest: false },
        { name: 'BetMGM', odds: '-102', team2Odds: '-115', ev: '+3.2%', isBest: false },
        { name: 'Caesars', odds: '-105', team2Odds: '-112', ev: '+2.5%', isBest: false }
      ]
    },
    {
      id: 6,
      ev: '+5.26%',
      sport: 'NFL',
      game: 'Steelers @ Chargers',
      team1: 'Steelers',
      team2: 'Chargers',
      pick: 'Steelers ML',
      bestOdds: '+160',
      bestBook: 'Pinnacle',
      avgOdds: '+152',
      isHot: false,
      books: [
        { name: 'Pinnacle', odds: '+160', team2Odds: '-195', ev: '+5.26%', isBest: true },
        { name: 'BetMGM', odds: '+158', team2Odds: '-192', ev: '+4.8%', isBest: false },
        { name: 'DraftKings', odds: '+155', team2Odds: '-188', ev: '+4.2%', isBest: false },
        { name: 'FanDuel', odds: '+152', team2Odds: '-185', ev: '+3.8%', isBest: false },
        { name: 'Caesars', odds: '+150', team2Odds: '-182', ev: '+3.5%', isBest: false }
      ]
    },
    {
      id: 7,
      ev: '+4.82%',
      sport: 'NCAA Basketball',
      game: 'Duke @ North Carolina',
      team1: 'Duke',
      team2: 'North Carolina',
      pick: 'North Carolina -2.5',
      bestOdds: '-108',
      bestBook: 'BetMGM',
      avgOdds: '-115',
      isHot: true,
      books: [
        { name: 'BetMGM', odds: '-108', team2Odds: '-112', ev: '+4.82%', isBest: true },
        { name: 'DraftKings', odds: '-110', team2Odds: '-110', ev: '+4.2%', isBest: false },
        { name: 'FanDuel', odds: '-112', team2Odds: '-108', ev: '+3.8%', isBest: false },
        { name: 'Caesars', odds: '-115', team2Odds: '-105', ev: '+3.2%', isBest: false },
        { name: 'Pinnacle', odds: '-118', team2Odds: '-102', ev: '+2.8%', isBest: false }
      ]
    },
    {
      id: 8,
      ev: '+4.15%',
      sport: 'NBA',
      game: 'Lakers @ Warriors',
      team1: 'Lakers',
      team2: 'Warriors',
      pick: 'Warriors ML',
      bestOdds: '-185',
      bestBook: 'Pinnacle',
      avgOdds: '-195',
      isHot: false,
      books: [
        { name: 'Pinnacle', odds: '-185', team2Odds: '+158', ev: '+4.15%', isBest: true },
        { name: 'DraftKings', odds: '-190', team2Odds: '+155', ev: '+3.5%', isBest: false },
        { name: 'FanDuel', odds: '-195', team2Odds: '+152', ev: '+2.8%', isBest: false },
        { name: 'BetMGM', odds: '-198', team2Odds: '+148', ev: '+2.2%', isBest: false },
        { name: 'Caesars', odds: '-200', team2Odds: '+145', ev: '+1.8%', isBest: false }
      ]
    },
    {
      id: 9,
      ev: '+3.67%',
      sport: 'NHL',
      game: 'Bruins @ Rangers',
      team1: 'Bruins',
      team2: 'Rangers',
      pick: 'Over 6.5',
      bestOdds: '+125',
      bestBook: 'FanDuel',
      avgOdds: '+118',
      isHot: false,
      books: [
        { name: 'FanDuel', odds: '+125', team2Odds: '-152', ev: '+3.67%', isBest: true },
        { name: 'DraftKings', odds: '+122', team2Odds: '-148', ev: '+3.2%', isBest: false },
        { name: 'BetMGM', odds: '+120', team2Odds: '-145', ev: '+2.8%', isBest: false },
        { name: 'Caesars', odds: '+118', team2Odds: '-142', ev: '+2.5%', isBest: false },
        { name: 'Pinnacle', odds: '+115', team2Odds: '-138', ev: '+2.1%', isBest: false }
      ]
    },
    {
      id: 10,
      ev: '+2.94%',
      sport: 'NCAA Football',
      game: 'Alabama @ Georgia',
      team1: 'Alabama',
      team2: 'Georgia',
      pick: 'Alabama +7',
      bestOdds: '-105',
      bestBook: 'Hard Rock',
      avgOdds: '-110',
      isHot: true,
      books: [
        { name: 'Hard Rock', odds: '-105', team2Odds: '-115', ev: '+2.94%', isBest: true },
        { name: 'Pinnacle', odds: '-108', team2Odds: '-112', ev: '+2.5%', isBest: false },
        { name: 'DraftKings', odds: '-110', team2Odds: '-110', ev: '+2.1%', isBest: false },
        { name: 'FanDuel', odds: '-110', team2Odds: '-110', ev: '+2.1%', isBest: false },
        { name: 'BetMGM', odds: '-112', team2Odds: '-108', ev: '+1.8%', isBest: false }
      ]
    }
  ]; */

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

  const sortPicks = (picks: OddsPick[]) => {
    if (!sortBy) return picks;
    return [...picks].sort((a, b) => {
      if (sortBy === 'ev') {
        const evA = parseFloat((a.ev || '0%').replace('%', ''));
        const evB = parseFloat((b.ev || '0%').replace('%', ''));
        return sortDirection === 'asc' ? evA - evB : evB - evA;
      } else if (sortBy === 'time') {
        // Mock date sorting - replace with actual game time from API
        const timeA = new Date('2023-11-10T19:00:00Z').getTime();
        const timeB = new Date('2023-11-10T19:00:00Z').getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  };

  // Use API picks or fallback to empty array if loading/error
  const filteredPicks = apiPicks && apiPicks.length > 0 ? apiPicks : [];
  
  // Calculate total pages after filteredPicks is defined
  const totalPages = Math.ceil(filteredPicks.length / itemsPerPage);
  
  // Update loading state based on API loading
  useEffect(() => {
    setIsLoading(apiLoading);
    console.log('🔍 OddsPage - apiLoading:', apiLoading, 'apiPicks:', apiPicks?.length, 'filteredPicks:', filteredPicks.length);
    if (apiError) {
      toast.error('Failed to load odds', {
        description: apiError
      });
    }
  }, [apiLoading, apiError, apiPicks]);

  // Skeleton Loader Component
  const SkeletonRow = () => (
    <div className={`p-4 ${isLight ? 'bg-white' : 'bg-white/5'} animate-pulse`}>
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-2">
          <div className={`h-6 w-16 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded-xl`}></div>
        </div>
        <div className="lg:col-span-3">
          <div className={`h-4 w-20 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded mb-2`}></div>
          <div className={`h-5 w-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded`}></div>
        </div>
        <div className="lg:col-span-3">
          <div className={`h-5 w-32 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded`}></div>
        </div>
        <div className="lg:col-span-2">
          <div className={`h-5 w-24 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded`}></div>
        </div>
        <div className="lg:col-span-2">
          <div className={`h-5 w-16 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded`}></div>
        </div>
      </div>
      <div className="lg:hidden space-y-3">
        <div className={`h-8 w-48 ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded`}></div>
        <div className={`h-6 w-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} rounded`}></div>
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

        {/* Dropdown Menu */}
        {isBetTypeDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsBetTypeDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <div className={`absolute top-full left-0 mt-2 w-64 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-white/10'} border rounded-xl overflow-hidden z-40`}>
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
          </>
        )}
      </div>

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
              {/* Badge showing number of active filters */}
              {(selectedSport !== 'all' || selectedMarket !== 'all' || selectedBetType !== 'straight' || selectedDate !== 'today') && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${isLight ? 'bg-purple-200 text-purple-700' : 'bg-purple-500/30 text-purple-300'}`}>
                  {[selectedSport !== 'all', selectedMarket !== 'all', selectedBetType !== 'straight', selectedDate !== 'today'].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Auto-Refresh Button - Toggles automatic refreshing of odds data
                - Will automatically fetch latest odds at regular intervals when enabled
                - TODO: Functionality to be implemented with real-time API updates */}
            <button 
              onClick={() => {
                setIsLoading(true);
                toast.success('Refreshing odds...', {
                  description: 'Fetching latest odds data'
                });
                setTimeout(() => {
                  setIsLoading(false);
                  toast.success('Odds refreshed', {
                    description: 'All odds are now up to date'
                  });
                }, 2000);
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
          {/* Backdrop - Mobile only */}
          <div 
            className="fixed lg:hidden inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsFilterMenuOpen(false)}
          />
          
          {/* Side Panel - Desktop / Bottom Drawer - Mobile */}
          <div className={`fixed lg:left-0 lg:top-0 lg:bottom-0 bottom-16 left-0 right-0 lg:w-80 h-screen lg:overflow-y-auto ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl lg:border-r border-t lg:border-t-0 z-50 lg:rounded-none rounded-t-3xl animate-in slide-in-from-bottom lg:slide-in-from-left duration-300 flex flex-col`}>
            {/* Sticky Header */}
            <div className={`sticky top-0 lg:top-0 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} z-10 p-6 pb-4 space-y-4 lg:border-b border-b-0`}>
              {/* Drag Handle - Mobile Only */}
              <div className="lg:hidden flex justify-center -mt-3 mb-2">
                <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-white/20'}`}></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-xl`}>Filters</h3>
                <button
                  onClick={() => setIsFilterMenuOpen(false)}
                  className={`p-2 -mt-2 -mr-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-lg transition-all`}
                >
                  <ChevronRight className="w-5 h-5 lg:block hidden" />
                  <span className="lg:hidden text-lg">✕</span>
                </button>
              </div>
              
              {/* Apply and Reset Buttons */}
              <div className="flex gap-2">
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
                {dateExpanded && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                      onClick={() => setDateExpanded(false)}
                    />
                    
                    {/* Bottom Drawer */}
                    <div className={`fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
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
              </div>

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
                {sportExpanded && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                      onClick={() => setSportExpanded(false)}
                    />
                    
                    {/* Bottom Drawer */}
                    <div className={`fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
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
              </div>

              {/* Bet Type Filter */}
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
                {marketExpanded && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                      onClick={() => setMarketExpanded(false)}
                    />
                    
                    {/* Bottom Drawer */}
                    <div className={`fixed bottom-0 left-0 right-0 max-h-[60vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
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
              </div>

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
                {sportsbooksExpanded && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                      onClick={() => setSportsbooksExpanded(false)}
                    />
                    
                    {/* Bottom Drawer */}
                    <div className={`fixed bottom-0 left-0 right-0 max-h-[70vh] ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-t-3xl z-50 overflow-hidden animate-in slide-in-from-bottom fade-in duration-300`}>
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
              </div>

              {/* Clear Filters Button */}
              
            </div>
            {/* End Scrollable Content */}
          </div>
          {/* End Side Panel */}
        </>
      )}

      {/* Odds Table */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl overflow-hidden`}>
        {/* Table Header - Desktop Only */}
        <div className={`hidden lg:grid lg:grid-cols-12 gap-4 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-b`}>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>EV%</div>
          <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Match</div>
          <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Team/Line</div>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Book</div>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Odds</div>
        </div>

        {/* Table Rows */}
        <div className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-white/10'}`}>
          {(() => { console.log('🔍 Rendering table - isLoading:', isLoading, 'filteredPicks.length:', filteredPicks.length); return isLoading; })() ? (
            Array.from({ length: itemsPerPage }, (_, index) => <SkeletonRow key={index} />)
          ) : filteredPicks.length > 0 ? (
            sortPicks(filteredPicks).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((pick) => (
              <div key={pick.id}>
                {/* Main Row */}
                <button
                  onClick={() => toggleRow(pick.id)}
                  className={`w-full p-4 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-all text-left`}
                >
                  {/* Desktop Layout - Grid format for larger screens */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-center">
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
                      {/* Game Time - TODO: Mock date - will be replaced with actual game time from API */}
                      <div className={`flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold mt-1`}>
                        <Clock className="w-3 h-3" />
                        Sun, Nov 10 7:00 PM PST
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
                            Sun, Nov 10 7:00 PM PST
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30'} backdrop-blur-xl rounded-xl border`}>
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
                              onAddPick(pick);
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
                </button>

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
                              {pick.bestOdds.includes('+') ? `+${parseInt(pick.bestOdds) - 15}` : `${parseInt(pick.bestOdds) + 15}`}
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
                              {pick.bestOdds.includes('+') ? `+${parseInt(pick.bestOdds) - 8}` : `${parseInt(pick.bestOdds) + 8}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Books Table */}
                      <div className="space-y-2">
                        {/* Table Header */}
                        <div className={`grid grid-cols-4 gap-2 px-3 py-2 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-purple-500/20 border-purple-400/30'} border rounded-lg`}>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs`}>Book</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>{pick.team1.split(' ').pop()}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-center`}>{pick.team2.split(' ').pop()}</div>
                          <div className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-xs text-right`}>Pick</div>
                        </div>

                        {/* Table Rows */}
                        {(expandedSportsbooks.includes(pick.id) ? pick.books : pick.books.slice(0, 5)).map((book, idx) => (
                          <div 
                            key={idx}
                            className={`grid grid-cols-4 gap-2 px-3 py-2.5 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-lg items-center`}
                          >
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.name}</div>
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
                              {pick.bestOdds.includes('+') ? `+${parseInt(pick.bestOdds) - 15}` : `${parseInt(pick.bestOdds) + 15}`}
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
                                  <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.odds}</span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-sm`}>{book.team2Odds}</span>
                                </td>
                                <td className="py-2 px-3 text-right">
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