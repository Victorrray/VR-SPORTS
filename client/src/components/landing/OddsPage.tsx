import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMe } from '../../hooks/useMe';
import { useMarketsWithCache } from '../../hooks/useMarketsWithCache';
import { useBetSlip } from '../../contexts/BetSlipContext';

// ✅ HELPER FUNCTIONS
function formatOdds(odds: number): string {
  if (!odds) return '-';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function calculateEV(odds: number, fairLine: number): number {
  const toDec = (o: number) => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  const userDec = toDec(odds);
  const fairDec = toDec(fairLine);
  return ((userDec / fairDec) - 1) * 100;
}

function weightedMedian(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values
    .map((v, i) => ({ value: v, weight: weights[i] || 1 }))
    .sort((a, b) => a.value - b.value);
  
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
  let cumulativeWeight = 0;
  
  for (const item of sorted) {
    cumulativeWeight += item.weight;
    if (cumulativeWeight >= totalWeight / 2) return item.value;
  }
  
  return sorted[sorted.length - 1].value;
}

function getSportName(sportKey: string): string {
  const sports: Record<string, string> = {
    'americanfootball_nfl': 'NFL',
    'americanfootball_ncaaf': 'NCAAF',
    'basketball_nba': 'NBA',
    'basketball_ncaab': 'NCAAB',
    'icehockey_nhl': 'NHL',
    'baseball_mlb': 'MLB',
    'soccer_epl': 'Soccer',
    'soccer_fifa_world_cup': 'World Cup',
  };
  return sports[sportKey] || sportKey.toUpperCase();
}

export function OddsPage() {
  // ✅ HOOKS
  const { me } = useMe();
  const { games, loading, error, refresh } = useMarketsWithCache(
    ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl'],
    ['us'],
    ['h2h', 'spreads', 'totals']
  );
  const { addBet } = useBetSlip();
  
  // ✅ STATE
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ TRANSFORM API DATA TO PICKS
  const topPicks = useMemo(() => {
    if (!games || !Array.isArray(games) || games.length === 0) return [];
    
    const picks: any[] = [];
    
    (games as any[]).forEach((game: any) => {
      if (!game.bookmakers) return;
      
      game.bookmakers.forEach((bookmaker: any) => {
        if (!bookmaker.markets) return;
        
        bookmaker.markets.forEach((market: any) => {
          if (!market.outcomes) return;
          
          market.outcomes.forEach((outcome: any) => {
            // Collect all odds for this outcome
            const allOdds: number[] = [];
            const allBooks: any[] = [];
            
            game.bookmakers.forEach((bk: any) => {
              const mkt = bk.markets.find((m: any) => m.key === market.key);
              if (!mkt) return;
              
              const out = mkt.outcomes.find((o: any) => 
                o.name === outcome.name && 
                (o.point === outcome.point || (!o.point && !outcome.point))
              );
              
              if (out && out.price) {
                allOdds.push(out.price);
                allBooks.push({
                  name: bk.title,
                  odds: formatOdds(out.price),
                  isBest: false
                });
              }
            });
            
            if (allOdds.length === 0) return;
            
            // Calculate fair line
            const fairLine = weightedMedian(allOdds, allBooks.map(() => 1.5));
            const ev = calculateEV(outcome.price, fairLine);
            
            // Find best book
            const bestBookObj = allBooks.reduce((best, current) => 
              parseInt(current.odds) > parseInt(best.odds) ? current : best
            );
            
            allBooks.forEach(b => {
              b.isBest = b.name === bestBookObj.name;
              b.ev = calculateEV(parseInt(b.odds), fairLine).toFixed(2) + '%';
            });
            
            const pick = {
              id: `${game.id}-${market.key}-${outcome.name}`,
              ev: `${ev.toFixed(2)}%`,
              sport: getSportName(game.sport_key),
              game: `${game.away_team} @ ${game.home_team}`,
              team1: game.away_team,
              team2: game.home_team,
              pick: `${outcome.name}${outcome.point ? ` ${outcome.point}` : ''}`,
              bestOdds: formatOdds(outcome.price),
              bestBook: bestBookObj.name,
              avgOdds: formatOdds(Math.round(allOdds.reduce((a, b) => a + b) / allOdds.length)),
              isHot: ev > 10,
              books: allBooks,
              gameTime: game.commence_time
            };
            
            picks.push(pick);
          });
        });
      });
    });
    
    return picks.sort((a, b) => parseFloat(b.ev) - parseFloat(a.ev));
  }, [games]);

  // ✅ FILTER BY SEARCH
  const filteredPicks = useMemo(() => {
    if (!searchQuery) return topPicks;
    
    const query = searchQuery.toLowerCase();
    return topPicks.filter(pick =>
      pick.game.toLowerCase().includes(query) ||
      pick.pick.toLowerCase().includes(query) ||
      pick.sport.toLowerCase().includes(query)
    );
  }, [topPicks, searchQuery]);

  // ✅ SPORTS WITH REAL COUNTS
  const sports = [
    { id: 'all', name: 'All Sports', count: games.length, active: true },
    { id: 'americanfootball_nfl', name: 'NFL', count: games.filter(g => g.sport_key === 'americanfootball_nfl').length, active: false },
    { id: 'basketball_nba', name: 'NBA', count: games.filter(g => g.sport_key === 'basketball_nba').length, active: false },
    { id: 'icehockey_nhl', name: 'NHL', count: games.filter(g => g.sport_key === 'icehockey_nhl').length, active: false },
    { id: 'baseball_mlb', name: 'MLB', count: games.filter(g => g.sport_key === 'baseball_mlb').length, active: false },
    { id: 'soccer_epl', name: 'Soccer', count: games.filter(g => g.sport_key?.includes('soccer')).length, active: false }
  ];

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id as any) ? prev.filter(rowId => rowId !== id) : [...prev, id as any]
    );
  };

  // ✅ HANDLE ADD BET
  const handleAddBet = (pick: any) => {
    const bet = {
      id: pick.id,
      matchup: pick.game,
      selection: pick.pick,
      market: 'MONEYLINE',
      americanOdds: parseInt(pick.bestOdds),
      bookmaker: pick.bestBook,
      sport: pick.sport,
      league: pick.sport,
      edge: parseFloat(pick.ev),
      gameTime: pick.gameTime,
    };
    
    addBet(bet);
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="text-red-400 font-bold">Error loading odds: {error.message}</div>
        <button 
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sports Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all text-sm ${
              selectedSport === sport.id
                ? 'bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 backdrop-blur-xl border border-purple-400/40 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 backdrop-blur-xl border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {sport.name}
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
              selectedSport === sport.id
                ? 'bg-purple-400/30 text-purple-300'
                : 'bg-white/10 text-white/50'
            }`}>
              {sport.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input 
            type="text"
            placeholder="Search games, teams, or markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-purple-400/40 focus:bg-white/10 font-bold transition-all shadow-lg text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <button className="flex items-center gap-2 px-4 py-3 md:py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg whitespace-nowrap text-sm">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Market Type</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-3 md:py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg whitespace-nowrap text-sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Today</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button 
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-3 md:py-3.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all font-bold shadow-lg shadow-emerald-500/10 whitespace-nowrap text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Odds Table */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Header - Desktop Only */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
          <div className="col-span-2 text-white/60 font-bold text-sm uppercase tracking-wide">EV%</div>
          <div className="col-span-3 text-white/60 font-bold text-sm uppercase tracking-wide">Match</div>
          <div className="col-span-4 text-white/60 font-bold text-sm uppercase tracking-wide">Team/Line</div>
          <div className="col-span-3 text-white/60 font-bold text-sm uppercase tracking-wide">Book & Odds</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/10">
          {filteredPicks.map((pick) => (
            <div key={pick.id}>
              {/* Main Row */}
              <button
                onClick={() => toggleRow(pick.id)}
                className="w-full p-4 hover:bg-white/5 transition-all text-left"
              >
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-center">
                  {/* EV Badge */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 px-2 py-1 lg:px-2.5 lg:py-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 rounded-xl shadow-lg whitespace-nowrap text-[14px]">
                      <span className="text-emerald-400 font-bold text-xs lg:text-sm">{pick.ev}</span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="lg:col-span-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 text-purple-300 rounded-lg font-bold text-xs">
                        {pick.sport}
                      </span>
                      {pick.isHot && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-400/30 text-orange-300 rounded-lg font-bold text-xs flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="text-white font-bold text-sm lg:text-base truncate">{pick.game}</div>
                    <div className="flex items-center gap-1 text-red-400 text-xs font-bold mt-1">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </div>

                  {/* Team/Line */}
                  <div className="lg:col-span-4 min-w-0">
                    <div className="text-white font-bold text-sm lg:text-base truncate">{pick.pick}</div>
                  </div>

                  {/* Book & Odds */}
                  <div className="lg:col-span-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm lg:text-base truncate">{pick.bestBook}</span>
                      <span className="text-white font-bold text-sm lg:text-base truncate">{pick.bestOdds}</span>
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">{pick.team1[0]}</span>
                          </div>
                          <span className="text-white font-bold text-base">{pick.team1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">{pick.team2[0]}</span>
                          </div>
                          <span className="text-white font-bold text-base">{pick.team2}</span>
                        </div>
                      </div>
                      
                      {/* Game Info */}
                      <div className="text-white/60 text-sm font-bold">
                        Mon, Nov 10 at 7:30 PM • {pick.sport}
                        {pick.isHot && (
                          <span className="inline-flex items-center gap-1 ml-2 text-orange-300">
                            <Flame className="w-3 h-3" />
                            HOT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* EV and Add Button */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="px-4 py-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 rounded-2xl shadow-lg text-center">
                        <span className="text-emerald-400 font-bold text-base">{pick.ev}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBet(pick);
                        }}
                        className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg flex items-center justify-center"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Section - Books Comparison */}
              {expandedRows.includes(pick.id as any) && (
                <div className="p-4 lg:p-6 bg-gradient-to-r from-white/5 to-transparent border-t border-white/10">
                  {/* Desktop Expanded - Full Comparison Table */}
                  <div className="block">
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 font-bold text-sm uppercase tracking-wide">Sportsbook Comparison</span>
                      <span className="text-white/40 text-xs font-bold">Avg: {pick.avgOdds}</span>
                    </div>

                    {/* Books Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">Sportsbook</th>
                            <th className="text-center py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">Odds</th>
                            <th className="text-right py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">EV</th>
                            <th className="text-center py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {pick.books.map((book: any, idx: number) => (
                            <tr 
                              key={idx}
                              className={`transition-all ${
                                book.isBest 
                                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10' 
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {book.isBest && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                                  <span className="text-white font-bold text-sm">{book.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-white font-bold text-sm">{book.odds}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`font-bold text-sm ${
                                  book.isBest ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                  {book.ev}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button 
                                  onClick={() => handleAddBet(pick)}
                                  className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all text-xs font-bold"
                                >
                                  Add
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Set Alert</span>
                      </button>
                      <button 
                        onClick={() => handleAddBet(pick)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm"
                      >
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
        <button className="px-8 py-3 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-purple-400/30 transition-all font-bold shadow-lg">
          Load More Picks
          <ChevronDown className="w-4 h-4 inline-block ml-2" />
        </button>
      </div>
    </div>
  );
}
