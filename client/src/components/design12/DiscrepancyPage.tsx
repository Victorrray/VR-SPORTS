import { useState, useMemo } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { useOddsData } from '../../hooks/useOddsData';
import { ChevronDown, ChevronRight, ChevronLeft, Filter, RefreshCw, ArrowUp, ArrowDown, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

// Types for discrepancy data
interface BookLine {
  bookmaker: string;
  line: number;
  odds: number;
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
  { id: 'baseball_mlb', name: 'MLB' },
  { id: 'icehockey_nhl', name: 'NHL' },
];

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
  const [minDiscrepancy, setMinDiscrepancy] = useState(1);
  
  // UI state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [bookExpanded, setBookExpanded] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [propTypeExpanded, setPropTypeExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Map DFS book IDs to display names and API keys
  const DFS_BOOK_MAP: Record<string, { name: string; keys: string[] }> = {
    'prizepicks': { name: 'PrizePicks', keys: ['prizepicks'] },
    'underdog': { name: 'Underdog', keys: ['underdog'] },
    'draftkings_pick6': { name: 'Pick 6', keys: ['pick6', 'draftkings_pick6'] },
    'sleeper': { name: 'Sleeper', keys: ['sleeper'] },
    'fliff': { name: 'Fliff', keys: ['fliff'] },
    'betr': { name: 'Betr', keys: ['betr', 'betr_us_dfs'] },
  };

  // Fetch player props data from API
  const { picks: apiPicks, loading: isLoading, error: apiError, refetch, lastUpdated, isRefreshing } = useOddsData({
    sport: selectedSport === 'all' ? 'basketball_nba' : selectedSport,
    marketType: selectedPropType === 'all' ? 'player_points' : selectedPropType,
    betType: 'props',
    sportsbooks: [], // Get all sportsbooks
    date: 'all_upcoming',
    minDataPoints: 1,
    enabled: true,
    autoRefresh: false,
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

      // Get other books (excluding the selected DFS book)
      const otherBooks = allBooks.filter((b: any) => 
        !selectedBookInfo.keys.some(key => 
          b.key?.toLowerCase() === key.toLowerCase() || 
          b.name?.toLowerCase().includes(selectedBookInfo.name.toLowerCase())
        )
      );

      if (otherBooks.length === 0) return;

      // Calculate market average from other books
      const validLines = otherBooks
        .filter((b: any) => b.line !== undefined && b.line !== null)
        .map((b: any) => b.line);

      if (validLines.length === 0) return;

      const marketAverage = validLines.reduce((sum: number, line: number) => sum + line, 0) / validLines.length;
      const primaryLine = primaryBookData.line;
      const discrepancy = marketAverage - primaryLine;
      const discrepancyPercent = (discrepancy / marketAverage) * 100;

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

      // Build allBooks array for mini-table
      const bookLines: BookLine[] = allBooks.map((b: any) => ({
        bookmaker: b.name || b.key || 'Unknown',
        line: b.line || 0,
        odds: parseInt(b.overOdds?.replace('+', '') || b.odds?.replace('+', '') || '-110', 10),
      }));

      discrepancies.push({
        id: `${pick.id || idx}-${pick.playerName}-${pick.marketKey}`,
        playerName: pick.playerName,
        team,
        opponent,
        propType: pick.marketKey || 'player_points',
        propLabel: getPropLabel(pick.marketKey || 'player_points'),
        commenceTime: pick.commenceTime || pick.gameTime || new Date().toISOString(),
        sport: getSportLabel(pick.sportKey || selectedSport),
        primaryBook: selectedBookInfo.name,
        primaryLine,
        primaryOdds: -110,
        marketAverage,
        discrepancy,
        discrepancyPercent,
        recommendation,
        allBooks: bookLines,
        confidence,
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
                        pick.discrepancy > 0
                          ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                          : isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {Math.abs(pick.discrepancyPercent).toFixed(1)}%
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="col-span-3">
                      <div className={`inline-block px-2.5 py-1 ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'} rounded-full font-bold text-xs mb-2`}>
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
                        <div className={`inline-block px-2.5 py-1 ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'} rounded-full font-bold text-xs mb-2`}>
                          {pick.sport}
                        </div>
                        <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {pick.playerName}
                        </div>
                        <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                          {pick.team} @ {pick.opponent} • {pick.propLabel}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-2 rounded-xl font-bold ${
                          pick.discrepancy > 0
                            ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                            : isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
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
                        Take {pick.recommendation.toUpperCase()} on {pick.primaryBook}
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
                      
                      {/* Book Lines */}
                      {pick.allBooks.map((book, idx) => {
                        const diffFromAvg = book.line - pick.marketAverage;
                        const isPrimaryBook = book.bookmaker === pick.primaryBook;
                        return (
                          <div 
                            key={idx}
                            className={`grid grid-cols-3 gap-4 px-4 py-3 ${
                              idx !== pick.allBooks.length - 1 ? (isLight ? 'border-b border-gray-100' : 'border-b border-white/5') : ''
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
                      
                      {/* Market Average Row */}
                      <div className={`grid grid-cols-3 gap-4 px-4 py-3 ${isLight ? 'bg-gray-100 border-t border-gray-200' : 'bg-white/5 border-t border-white/10'}`}>
                        <div className={`font-bold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
                          Market Average
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
            className={`!fixed max-lg:!bottom-0 max-lg:!left-0 max-lg:!right-0 max-lg:!top-auto lg:!left-0 lg:!bottom-0 max-lg:pb-24 max-lg:max-h-[85vh] ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} lg:border-r max-lg:border-t lg:rounded-none max-lg:rounded-t-2xl flex flex-col ${isFilterClosing ? 'animate-out max-lg:slide-out-to-bottom lg:slide-out-to-left duration-300' : 'animate-in max-lg:slide-in-from-bottom lg:slide-in-from-left duration-300'} lg:w-80 max-lg:w-full`}
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
            </div>

            {/* Content */}
            <div className="lg:overflow-y-auto lg:flex-1 p-6 pt-12 space-y-5 scrollbar-hide">
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
                
                {bookExpanded && (
                  <div className={`mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {DFS_SPORTSBOOKS.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book.id);
                          setBookExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedBook === book.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
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
                
                {sportExpanded && (
                  <div className={`mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {SPORTS.map((sport) => (
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
                        {sport.name}
                        {selectedSport === sport.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                
                {propTypeExpanded && (
                  <div className={`mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-hide`}>
                    {PROP_TYPES.map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => {
                          setSelectedPropType(prop.id);
                          setPropTypeExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all flex items-center justify-between ${
                          selectedPropType === prop.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
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

              {/* Apply & Reset Buttons */}
              <div className="pt-4 space-y-3">
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

                <button
                  onClick={() => {
                    setSelectedBook('prizepicks');
                    setSelectedSport('all');
                    setSelectedPropType('all');
                    setMinDiscrepancy(1);
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
          </div>
        </>
      )}
    </div>
  );
}
