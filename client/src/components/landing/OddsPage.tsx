import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useMarketsWithCache } from '../../hooks/useMarketsWithCache';

export function OddsPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedBetType, setSelectedBetType] = useState('straight');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [isBetTypeDropdownOpen, setIsBetTypeDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('today');

  // Fetch real API data
  const { games, books, loading, error, refresh } = useMarketsWithCache(
    selectedSport === 'all' ? ['americanfootball_nfl', 'basketball_nba', 'hockey_nhl'] : [selectedSport],
    ['us'],
    selectedMarket === 'all' ? ['h2h', 'spreads', 'totals'] : [selectedMarket],
    { enabled: true, autoRefresh: true }
  );

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
    { id: 'parlays', name: 'Parlays' },
    { id: 'teasers', name: 'Teasers' },
    { id: 'futures', name: 'Futures' }
  ];

  // Convert API games to display format
  const topPicks = (games as any[] || []).slice(0, 20).map((game: any, idx: number) => {
    const team1 = game.away_team || 'Team 1';
    const team2 = game.home_team || 'Team 2';
    const bookmakersList = (game.bookmakers || []).slice(0, 5);
    
    return {
      id: idx + 1,
      ev: '+5.0%', // Placeholder - would need calculation
      sport: game.sport_title?.split(' ').pop() || 'Sport',
      game: `${team1} @ ${team2}`,
      team1,
      team2,
      pick: `${team2} ML`,
      bestOdds: bookmakersList[0]?.markets?.[0]?.outcomes?.[0]?.price?.toString() || '-110',
      bestBook: bookmakersList[0]?.title || 'Book',
      avgOdds: '-110',
      isHot: idx < 3,
      books: bookmakersList.map((book: any, bidx: number) => ({
        name: book.title || book.key,
        odds: book.markets?.[0]?.outcomes?.[0]?.price?.toString() || '-110',
        ev: '+5.0%',
        isBest: bidx === 0
      }))
    };
  });

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Bet Type Heading */}
      <div>
        <h2 className={`${isLight ? 'text-foreground' : 'text-white'} font-bold text-2xl md:text-3xl`}>
          {betTypes.find(b => b.id === selectedBetType)?.name || 'All Bets'}
        </h2>
        {loading && <p className={`${isLight ? 'text-muted-foreground' : 'text-white/50'} text-sm mt-2`}>Loading live odds...</p>}
        {error && <p className={`text-red-500 text-sm mt-2`}>Error: {error}</p>}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-64">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
          <input 
            type="text"
            placeholder="Search..."
            className={`w-full h-[44px] pl-10 pr-4 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/40 focus:bg-white/10'} backdrop-blur-2xl border rounded-xl focus:outline-none font-bold transition-all shadow-lg text-sm`}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto overflow-y-visible pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide w-full md:w-auto">
          {/* Sport Filter Dropdown */}
          <div className="relative z-10">
            <button 
              onClick={() => setIsSportDropdownOpen(!isSportDropdownOpen)}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-2xl border rounded-xl transition-all font-bold shadow-lg whitespace-nowrap text-sm ${
                isSportDropdownOpen || selectedSport !== 'all'
                  ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-white'
                  : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {sports.find(s => s.id === selectedSport)?.name || 'Sport'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isSportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isSportDropdownOpen && (
              <div className={`absolute top-full left-0 mt-2 w-56 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl border rounded-xl shadow-2xl overflow-hidden z-[100]`}>
                <div className="p-2">
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => {
                        setSelectedSport(sport.id);
                        setIsSportDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                        selectedSport === sport.id
                          ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                          : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {sport.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bet Type Filter Dropdown */}
          <div className="relative z-10">
            <button 
              onClick={() => setIsBetTypeDropdownOpen(!isBetTypeDropdownOpen)}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-2xl border rounded-xl transition-all font-bold shadow-lg whitespace-nowrap text-sm ${
                isBetTypeDropdownOpen || selectedBetType !== 'straight'
                  ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-white'
                  : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {betTypes.find(b => b.id === selectedBetType)?.name || 'Bet Type'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isBetTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isBetTypeDropdownOpen && (
              <div className={`absolute top-full left-0 mt-2 w-56 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl border rounded-xl shadow-2xl overflow-hidden z-[100]`}>
                <div className="p-2">
                  {betTypes.map((betType) => (
                    <button
                      key={betType.id}
                      onClick={() => {
                        setSelectedBetType(betType.id);
                        setIsBetTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                        selectedBetType === betType.id
                          ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                          : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {betType.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Market Type Filter Dropdown */}
          <div className="relative z-10">
            <button 
              onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-2xl border rounded-xl transition-all font-bold shadow-lg whitespace-nowrap text-sm ${
                isMarketDropdownOpen || selectedMarket !== 'all'
                  ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-white'
                  : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {marketTypes.find(m => m.id === selectedMarket)?.name || 'Market Type'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMarketDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isMarketDropdownOpen && (
              <div className={`absolute top-full left-0 mt-2 w-56 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl border rounded-xl shadow-2xl overflow-hidden z-[100]`}>
                <div className="p-2">
                  {marketTypes.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => {
                        setSelectedMarket(market.id);
                        setIsMarketDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                        selectedMarket === market.id
                          ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                          : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {market.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative z-10">
            <button 
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`flex items-center gap-2 h-[44px] px-4 backdrop-blur-2xl border rounded-xl transition-all font-bold shadow-lg whitespace-nowrap text-sm ${
                isDateDropdownOpen || selectedDate !== 'today'
                  ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-white'
                  : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">
                {selectedDate === 'today' ? 'Today' : selectedDate === 'tomorrow' ? 'Tomorrow' : selectedDate === 'week' ? 'This Week' : 'All Upcoming'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isDateDropdownOpen && (
              <div className={`absolute top-full left-0 mt-2 w-56 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-purple-400/50'} backdrop-blur-2xl border rounded-xl shadow-2xl overflow-hidden z-[100]`}>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedDate('today');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                      selectedDate === 'today'
                        ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                        : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate('tomorrow');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                      selectedDate === 'tomorrow'
                        ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                        : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate('week');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                      selectedDate === 'week'
                        ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                        : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate('all');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                      selectedDate === 'all'
                        ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                        : isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    All Upcoming
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className={`flex items-center gap-2 h-[44px] px-4 ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30'} backdrop-blur-xl border rounded-xl transition-all font-bold shadow-lg ${isLight ? '' : 'shadow-emerald-500/10'} whitespace-nowrap text-sm`}>
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Auto-Refresh</span>
          </button>
        </div>
      </div>

      {/* Odds Table */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl overflow-hidden shadow-xl`}>
        {/* Table Header - Desktop Only */}
        <div className={`hidden lg:grid lg:grid-cols-12 gap-4 p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-b`}>
          <div className={`col-span-2 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>EV%</div>
          <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Match</div>
          <div className={`col-span-4 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Team/Line</div>
          <div className={`col-span-3 ${isLight ? lightModeColors.textLight : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Book & Odds</div>
        </div>

        {/* Table Rows */}
        <div className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-white/10'}`}>
          {topPicks.map((pick) => (
            <div key={pick.id}>
              {/* Main Row */}
              <button
                onClick={() => toggleRow(pick.id)}
                className={`w-full p-4 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-all text-left`}
              >
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-center">
                  {/* EV Badge */}
                  <div className="lg:col-span-2">
                    <div className={`inline-flex items-center gap-2 px-1.5 py-0.5 lg:px-2 lg:py-0.5 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-xl shadow-lg whitespace-nowrap text-[14px]`}>
                      <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-xs lg:text-sm`}>{pick.ev}</span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="lg:col-span-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2.5 py-1 ${isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-lg font-bold text-xs`}>
                        {pick.sport}
                      </span>
                    </div>
                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.game}</div>
                    {/* TODO: Mock date - will be replaced with actual game time from API */}
                    <div className={`flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold mt-1`}>
                      <Clock className="w-3 h-3" />
                      Sun, Nov 10 7:00 PM PST
                    </div>
                  </div>

                  {/* Team/Line */}
                  <div className="lg:col-span-4 min-w-0">
                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.pick}</div>
                  </div>

                  {/* Book & Odds */}
                  <div className="lg:col-span-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.bestBook}</span>
                      <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm lg:text-base truncate`}>{pick.bestOdds}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden space-y-4">
                  {/* Header - Teams and EV */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Teams */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} border flex items-center justify-center flex-shrink-0`}>
                            <span className={`${isLight ? 'text-purple-700' : 'text-white'} font-bold text-xs`}>{pick.team1[0]}</span>
                          </div>
                          <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>{pick.team1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} border flex items-center justify-center flex-shrink-0`}>
                            <span className={`${isLight ? 'text-purple-700' : 'text-white'} font-bold text-xs`}>{pick.team2[0]}</span>
                          </div>
                          <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>{pick.team2}</span>
                        </div>
                      </div>
                      
                      {/* Game Info */}
                      <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>
                        Mon, Nov 10 at 7:30 PM • {pick.sport}
                        {pick.isHot && (
                          <span className={`inline-flex items-center gap-1 ml-2 ${isLight ? 'text-orange-600' : 'text-orange-300'}`}>
                            <Flame className="w-3 h-3" />
                            HOT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* EV and Add Button */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className={`px-4 py-2.5 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-2xl shadow-lg text-center`}>
                        <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-base`}>{pick.ev}</span>
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to betslip logic
                        }}
                        className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Section - Books Comparison */}
              {expandedRows.includes(pick.id) && (
                <div className={`p-4 lg:p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10'} border-t`}>
                  {/* Mobile Expanded - Bet Details */}
                  <div className="lg:hidden space-y-4">
                    <div className={`flex items-start gap-3 pb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className={`w-10 h-10 rounded-full ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} border flex items-center justify-center flex-shrink-0`}>
                        <span className={`${isLight ? 'text-purple-700' : 'text-white'} font-bold text-sm`}>{pick.team2[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg mb-1`}>{pick.team2}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold uppercase tracking-wide`}>SPREAD</div>
                      <div className={`${isLight ? 'text-purple-600' : 'text-purple-400'} font-bold text-2xl`}>-4.5</div>
                    </div>

                    <div className={`flex items-center justify-between pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>{pick.bestBook}</div>
                      <div className={`px-5 py-2.5 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl border rounded-2xl shadow-lg`}>
                        <span className={`${isLight ? 'text-emerald-700' : 'text-white'} font-bold text-lg`}>{pick.bestOdds}</span>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30">
                      Place Bet
                    </button>
                  </div>

                  {/* Desktop Expanded - Full Comparison Table */}
                  <div className="hidden lg:block">
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart2 className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
                      <span className={`${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-sm uppercase tracking-wide`}>Sportsbook Comparison</span>
                      <span className={`${isLight ? 'text-gray-400' : 'text-white/40'} text-xs font-bold`}>Avg: {pick.avgOdds}</span>
                    </div>

                    {/* Books Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                            <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide`}>Sportsbook</th>
                            <th className={`text-center py-3 px-4 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide`}>{pick.team1}</th>
                            <th className={`text-center py-3 px-4 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide`}>{pick.team2}</th>
                            <th className={`text-right py-3 px-4 ${isLight ? 'text-gray-500' : 'text-white/60'} font-bold text-xs uppercase tracking-wide`}>EV</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-white/10'}`}>
                          {pick.books.map((book, idx) => (
                            <tr 
                              key={idx}
                              className={`transition-all ${
                                book.isBest 
                                  ? isLight ? 'bg-amber-50' : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10'
                                  : isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {book.isBest && <Star className={`w-4 h-4 ${isLight ? 'text-amber-500 fill-amber-500' : 'text-amber-400 fill-amber-400'}`} />}
                                  <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>{book.odds}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`${isLight ? 'text-gray-400' : 'text-white/40'} font-bold text-sm`}>-</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`font-bold text-sm ${
                                  book.isBest ? isLight ? 'text-amber-600' : 'text-amber-400' : isLight ? 'text-emerald-600' : 'text-emerald-400'
                                }`}>
                                  {book.ev}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex flex-wrap items-center gap-3 mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                      <button className={`flex items-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-lg transition-all font-bold text-sm`}>
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                      </button>
                      <button className={`flex items-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-lg transition-all font-bold text-sm`}>
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Set Alert</span>
                      </button>
                      <button className={`flex items-center gap-2 px-4 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-lg transition-all font-bold text-sm`}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add to Betslip</span>
                      </button>
                      <button className="ml-auto px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30 text-sm">
                        Place Bet
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Load More */}
      <div className="flex justify-center pt-4">
        <button className={`px-8 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-500' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10 text-white hover:bg-white/10 hover:border-purple-400/30'} backdrop-blur-xl border rounded-xl transition-all font-bold shadow-lg`}>
          Load More Picks
          <ChevronDown className="w-4 h-4 inline-block ml-2" />
        </button>
      </div>
    </div>
  );
}