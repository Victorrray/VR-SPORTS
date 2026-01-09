import { useState, useMemo } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
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
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedPropType, setSelectedPropType] = useState('all');
  const [minDiscrepancy, setMinDiscrepancy] = useState(1);
  
  // UI state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [bookExpanded, setBookExpanded] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [propTypeExpanded, setPropTypeExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const itemsPerPage = 10;

  // Close filter with animation
  const closeFilterMenu = () => {
    setIsFilterClosing(true);
    setTimeout(() => {
      setIsFilterMenuOpen(false);
      setIsFilterClosing(false);
    }, 280);
  };

  // Mock data for demonstration - in production this would come from API
  const mockDiscrepancies: DiscrepancyPick[] = useMemo(() => [
    {
      id: '1',
      playerName: 'LeBron James',
      team: 'LAL',
      opponent: 'GSW',
      propType: 'player_points_rebounds_assists',
      propLabel: 'Pts+Reb+Ast',
      commenceTime: new Date(Date.now() + 3600000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 42.5,
      primaryOdds: -110,
      marketAverage: 46.8,
      discrepancy: 4.3,
      discrepancyPercent: 9.2,
      recommendation: 'over',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 42.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 47.5, odds: -110 },
        { bookmaker: 'FanDuel', line: 46.5, odds: -112 },
        { bookmaker: 'BetMGM', line: 46.5, odds: -108 },
      ]
    },
    {
      id: '2',
      playerName: 'Stephen Curry',
      team: 'GSW',
      opponent: 'LAL',
      propType: 'player_threes',
      propLabel: '3-Pointers',
      commenceTime: new Date(Date.now() + 3600000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 4.5,
      primaryOdds: -110,
      marketAverage: 5.8,
      discrepancy: 1.3,
      discrepancyPercent: 22.4,
      recommendation: 'over',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 4.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 5.5, odds: -115 },
        { bookmaker: 'FanDuel', line: 6.5, odds: -110 },
        { bookmaker: 'Underdog', line: 5.5, odds: -110 },
      ]
    },
    {
      id: '3',
      playerName: 'Jayson Tatum',
      team: 'BOS',
      opponent: 'MIA',
      propType: 'player_points',
      propLabel: 'Points',
      commenceTime: new Date(Date.now() + 7200000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 32.5,
      primaryOdds: -110,
      marketAverage: 29.2,
      discrepancy: -3.3,
      discrepancyPercent: -11.3,
      recommendation: 'under',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 32.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 29.5, odds: -110 },
        { bookmaker: 'FanDuel', line: 28.5, odds: -108 },
        { bookmaker: 'BetMGM', line: 29.5, odds: -112 },
      ]
    },
    {
      id: '4',
      playerName: 'Luka Doncic',
      team: 'DAL',
      opponent: 'PHX',
      propType: 'player_assists',
      propLabel: 'Assists',
      commenceTime: new Date(Date.now() + 10800000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 8.5,
      primaryOdds: -110,
      marketAverage: 9.8,
      discrepancy: 1.3,
      discrepancyPercent: 13.3,
      recommendation: 'over',
      confidence: 'medium',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 8.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 9.5, odds: -105 },
        { bookmaker: 'FanDuel', line: 10.5, odds: -110 },
        { bookmaker: 'Underdog', line: 9.5, odds: -110 },
      ]
    },
    {
      id: '5',
      playerName: 'Nikola Jokic',
      team: 'DEN',
      opponent: 'MIN',
      propType: 'player_rebounds',
      propLabel: 'Rebounds',
      commenceTime: new Date(Date.now() + 14400000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 11.5,
      primaryOdds: -110,
      marketAverage: 13.2,
      discrepancy: 1.7,
      discrepancyPercent: 12.9,
      recommendation: 'over',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 11.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 13.5, odds: -110 },
        { bookmaker: 'FanDuel', line: 13.5, odds: -115 },
        { bookmaker: 'BetMGM', line: 12.5, odds: -108 },
      ]
    },
    {
      id: '6',
      playerName: 'Anthony Edwards',
      team: 'MIN',
      opponent: 'DEN',
      propType: 'player_points',
      propLabel: 'Points',
      commenceTime: new Date(Date.now() + 14400000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 24.5,
      primaryOdds: -110,
      marketAverage: 27.1,
      discrepancy: 2.6,
      discrepancyPercent: 9.6,
      recommendation: 'over',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 24.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 27.5, odds: -110 },
        { bookmaker: 'FanDuel', line: 26.5, odds: -112 },
        { bookmaker: 'BetMGM', line: 27.5, odds: -108 },
      ]
    },
    {
      id: '7',
      playerName: 'Tyrese Haliburton',
      team: 'IND',
      opponent: 'CLE',
      propType: 'player_assists',
      propLabel: 'Assists',
      commenceTime: new Date(Date.now() + 18000000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 9.5,
      primaryOdds: -110,
      marketAverage: 11.2,
      discrepancy: 1.7,
      discrepancyPercent: 15.2,
      recommendation: 'over',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 9.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 11.5, odds: -110 },
        { bookmaker: 'FanDuel', line: 11.5, odds: -108 },
        { bookmaker: 'Underdog', line: 10.5, odds: -110 },
      ]
    },
  ], []);

  // Filter discrepancies based on selections
  const filteredDiscrepancies = useMemo(() => {
    return mockDiscrepancies.filter(d => {
      // Filter by minimum discrepancy
      if (Math.abs(d.discrepancy) < minDiscrepancy) return false;
      
      // Filter by sport
      if (selectedSport !== 'all') {
        const sportMap: Record<string, string> = {
          'basketball_nba': 'NBA',
          'basketball_ncaab': 'NCAAB',
          'americanfootball_nfl': 'NFL',
          'americanfootball_ncaaf': 'NCAAF',
          'baseball_mlb': 'MLB',
          'icehockey_nhl': 'NHL',
        };
        if (d.sport !== sportMap[selectedSport]) return false;
      }
      
      // Filter by prop type
      if (selectedPropType !== 'all' && d.propType !== selectedPropType) return false;
      
      return true;
    }).sort((a, b) => Math.abs(b.discrepancyPercent) - Math.abs(a.discrepancyPercent));
  }, [mockDiscrepancies, minDiscrepancy, selectedSport, selectedPropType]);

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
    return lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Refresh handler
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
      toast.success('Discrepancies refreshed', {
        description: 'Fetching latest line comparisons'
      });
    }, 1500);
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
              <div key={pick.id} className={`p-4 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-all`}>
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

                  {/* Recommendation */}
                  <div className="col-span-2 flex flex-col items-center">
                    <div className={`w-full p-3 ${
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
                    <div className={`px-3 py-2 rounded-xl font-bold ${
                      pick.discrepancy > 0
                        ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                        : isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {Math.abs(pick.discrepancyPercent).toFixed(1)}%
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
