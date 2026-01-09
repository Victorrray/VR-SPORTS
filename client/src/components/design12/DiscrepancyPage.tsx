import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { ChevronDown, ChevronRight, Filter, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Zap, Target, ArrowUp, ArrowDown } from 'lucide-react';
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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data: userData } = useMe();
  const hasPlatinum = userData?.plan === 'platinum' || userData?.plan === 'lifetime';

  // Filter state
  const [selectedBook, setSelectedBook] = useState('prizepicks');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedPropType, setSelectedPropType] = useState('all');
  const [minDiscrepancy, setMinDiscrepancy] = useState(2); // Minimum line difference
  
  // UI state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [bookExpanded, setBookExpanded] = useState(false);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [propTypeExpanded, setPropTypeExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyPick[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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
      opponent: 'vs GSW',
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
      opponent: 'vs LAL',
      propType: 'player_threes',
      propLabel: '3-Pointers',
      commenceTime: new Date(Date.now() + 3600000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 4.5,
      primaryOdds: -110,
      marketAverage: 5.2,
      discrepancy: 0.7,
      discrepancyPercent: 13.5,
      recommendation: 'over',
      confidence: 'medium',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 4.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 5.5, odds: -115 },
        { bookmaker: 'FanDuel', line: 5.5, odds: -110 },
        { bookmaker: 'Underdog', line: 5.0, odds: -110 },
      ]
    },
    {
      id: '3',
      playerName: 'Jayson Tatum',
      team: 'BOS',
      opponent: 'vs MIA',
      propType: 'player_points',
      propLabel: 'Points',
      commenceTime: new Date(Date.now() + 7200000).toISOString(),
      sport: 'NBA',
      primaryBook: 'PrizePicks',
      primaryLine: 32.5,
      primaryOdds: -110,
      marketAverage: 29.8,
      discrepancy: -2.7,
      discrepancyPercent: -9.1,
      recommendation: 'under',
      confidence: 'high',
      allBooks: [
        { bookmaker: 'PrizePicks', line: 32.5, odds: -110 },
        { bookmaker: 'DraftKings', line: 29.5, odds: -110 },
        { bookmaker: 'FanDuel', line: 30.5, odds: -108 },
        { bookmaker: 'BetMGM', line: 29.5, odds: -112 },
      ]
    },
    {
      id: '4',
      playerName: 'Luka Doncic',
      team: 'DAL',
      opponent: 'vs PHX',
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
      opponent: 'vs MIN',
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
    }).sort((a, b) => Math.abs(b.discrepancy) - Math.abs(a.discrepancy)); // Sort by largest discrepancy
  }, [mockDiscrepancies, minDiscrepancy, selectedSport, selectedPropType]);

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Get confidence color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return isLight ? 'text-green-600 bg-green-100' : 'text-green-400 bg-green-500/20';
      case 'medium': return isLight ? 'text-yellow-600 bg-yellow-100' : 'text-yellow-400 bg-yellow-500/20';
      case 'low': return isLight ? 'text-orange-600 bg-orange-100' : 'text-orange-400 bg-orange-500/20';
      default: return isLight ? 'text-gray-600 bg-gray-100' : 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Line Discrepancies
          </h2>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
            Find value by comparing {DFS_SPORTSBOOKS.find(b => b.id === selectedBook)?.name || 'your book'} lines vs market average
          </p>
        </div>
        <button
          onClick={() => setIsFilterMenuOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            isLight 
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
              : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
          <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {filteredDiscrepancies.length}
          </div>
          <div className={`text-xs font-bold ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
            Discrepancies Found
          </div>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
          <div className={`text-2xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'}`}>
            {filteredDiscrepancies.filter(d => d.recommendation === 'over').length}
          </div>
          <div className={`text-xs font-bold ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
            Over Recommendations
          </div>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
          <div className={`text-2xl font-bold ${isLight ? 'text-red-600' : 'text-red-400'}`}>
            {filteredDiscrepancies.filter(d => d.recommendation === 'under').length}
          </div>
          <div className={`text-xs font-bold ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
            Under Recommendations
          </div>
        </div>
      </div>

      {/* Discrepancy Cards */}
      <div className="space-y-3">
        {filteredDiscrepancies.length === 0 ? (
          <div className={`p-8 rounded-xl text-center ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
            <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
            <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              No Discrepancies Found
            </h3>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
              Try lowering the minimum discrepancy threshold or changing your filters.
            </p>
          </div>
        ) : (
          filteredDiscrepancies.map((pick) => (
            <div 
              key={pick.id}
              className={`rounded-xl overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}
            >
              {/* Main Row */}
              <button
                onClick={() => toggleRow(pick.id)}
                className={`w-full p-4 flex items-center justify-between transition-all ${
                  isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Recommendation Badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    pick.recommendation === 'over'
                      ? isLight ? 'bg-green-100' : 'bg-green-500/20'
                      : isLight ? 'bg-red-100' : 'bg-red-500/20'
                  }`}>
                    {pick.recommendation === 'over' ? (
                      <ArrowUp className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
                    ) : (
                      <ArrowDown className={`w-6 h-6 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
                    )}
                  </div>
                  
                  {/* Player Info */}
                  <div className="text-left">
                    <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {pick.playerName}
                    </div>
                    <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                      {pick.team} {pick.opponent} • {pick.propLabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Lines Comparison */}
                  <div className="text-right">
                    <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                      {pick.primaryBook}: <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{pick.primaryLine}</span>
                    </div>
                    <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                      Avg: <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{pick.marketAverage.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Discrepancy */}
                  <div className={`px-3 py-1.5 rounded-lg font-bold ${
                    pick.discrepancy > 0
                      ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                      : isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pick.discrepancy > 0 ? '+' : ''}{pick.discrepancy.toFixed(1)} pts
                  </div>

                  {/* Confidence */}
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${getConfidenceColor(pick.confidence)}`}>
                    {pick.confidence.toUpperCase()}
                  </div>

                  {/* Expand Arrow */}
                  <ChevronDown className={`w-5 h-5 transition-transform ${
                    expandedRows.includes(pick.id) ? 'rotate-180' : ''
                  } ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                </div>
              </button>

              {/* Expanded Details */}
              {expandedRows.includes(pick.id) && (
                <div className={`px-4 pb-4 border-t ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                  <div className="pt-4">
                    {/* Recommendation Explanation */}
                    <div className={`p-4 rounded-xl mb-4 ${
                      pick.recommendation === 'over'
                        ? isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
                        : isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className={`w-5 h-5 ${
                          pick.recommendation === 'over'
                            ? isLight ? 'text-green-600' : 'text-green-400'
                            : isLight ? 'text-red-600' : 'text-red-400'
                        }`} />
                        <span className={`font-bold ${
                          pick.recommendation === 'over'
                            ? isLight ? 'text-green-700' : 'text-green-400'
                            : isLight ? 'text-red-700' : 'text-red-400'
                        }`}>
                          Take the {pick.recommendation.toUpperCase()} on {pick.primaryBook}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        pick.recommendation === 'over'
                          ? isLight ? 'text-green-600' : 'text-green-300'
                          : isLight ? 'text-red-600' : 'text-red-300'
                      }`}>
                        {pick.primaryBook}'s line of {pick.primaryLine} is {Math.abs(pick.discrepancy).toFixed(1)} points {pick.discrepancy > 0 ? 'lower' : 'higher'} than the market average of {pick.marketAverage.toFixed(1)}. 
                        This represents a {Math.abs(pick.discrepancyPercent).toFixed(1)}% edge.
                      </p>
                    </div>

                    {/* All Books Table */}
                    <div className={`rounded-xl overflow-hidden ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                      <div className={`px-4 py-2 font-bold text-xs uppercase tracking-wider ${isLight ? 'text-gray-500 bg-gray-100' : 'text-white/50 bg-white/5'}`}>
                        All Sportsbook Lines
                      </div>
                      {pick.allBooks.map((book, idx) => (
                        <div 
                          key={idx}
                          className={`px-4 py-3 flex items-center justify-between ${
                            idx !== pick.allBooks.length - 1 ? (isLight ? 'border-b border-gray-100' : 'border-b border-white/5') : ''
                          } ${book.bookmaker === pick.primaryBook ? (isLight ? 'bg-purple-50' : 'bg-purple-500/10') : ''}`}
                        >
                          <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {book.bookmaker}
                            {book.bookmaker === pick.primaryBook && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'}`}>
                                Selected
                              </span>
                            )}
                          </span>
                          <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {book.line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
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
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {DFS_SPORTSBOOKS.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book.id);
                          setBookExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all ${
                          selectedBook === book.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {book.name}
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
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {SPORTS.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => {
                          setSelectedSport(sport.id);
                          setSportExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all ${
                          selectedSport === sport.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {sport.name}
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
                  <div className={`hidden lg:block mt-2 ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl overflow-hidden`}>
                    {PROP_TYPES.map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => {
                          setSelectedPropType(prop.id);
                          setPropTypeExpanded(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-bold transition-all ${
                          selectedPropType === prop.id
                            ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white'
                            : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {prop.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Minimum Discrepancy Slider */}
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-xs uppercase tracking-wide mb-2 block`}>
                  Minimum Discrepancy
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
                    setMinDiscrepancy(2);
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
