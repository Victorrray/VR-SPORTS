import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function OddsPage() {
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const sports = [
    { id: 'all', name: 'All Sports', count: 124, active: true },
    { id: 'nfl', name: 'NFL', count: 12, active: false },
    { id: 'nba', name: 'NBA', count: 18, active: false },
    { id: 'nhl', name: 'NHL', count: 24, active: false },
    { id: 'mlb', name: 'MLB', count: 32, active: false },
    { id: 'soccer', name: 'Soccer', count: 38, active: false }
  ];

  const topPicks = [
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
        { name: 'Pinnacle', odds: '+940', ev: '+78.07%', isBest: true },
        { name: 'DraftKings', odds: '+920', ev: '+75.2%', isBest: false },
        { name: 'FanDuel', odds: '+880', ev: '+70.1%', isBest: false },
        { name: 'BetMGM', odds: '+850', ev: '+67.8%', isBest: false },
        { name: 'Caesars', odds: '+830', ev: '+65.5%', isBest: false }
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
        { name: 'Pinnacle', odds: '+138', ev: '+35.41%', isBest: true },
        { name: 'BetMGM', odds: '+135', ev: '+33.2%', isBest: false },
        { name: 'DraftKings', odds: '+130', ev: '+30.5%', isBest: false },
        { name: 'FanDuel', odds: '+125', ev: '+28.1%', isBest: false },
        { name: 'Caesars', odds: '+122', ev: '+26.8%', isBest: false }
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
        { name: 'DraftKings', odds: '+160', ev: '+8.33%', isBest: true },
        { name: 'FanDuel', odds: '+155', ev: '+7.1%', isBest: false },
        { name: 'BetMGM', odds: '+150', ev: '+6.2%', isBest: false },
        { name: 'Caesars', odds: '+145', ev: '+5.5%', isBest: false },
        { name: 'Pinnacle', odds: '+142', ev: '+4.8%', isBest: false }
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
        { name: 'Hard Rock', odds: '+115', ev: '+7.50%', isBest: true },
        { name: 'Pinnacle', odds: '+112', ev: '+6.5%', isBest: false },
        { name: 'DraftKings', odds: '+110', ev: '+5.8%', isBest: false },
        { name: 'FanDuel', odds: '+108', ev: '+5.2%', isBest: false },
        { name: 'BetMGM', odds: '+105', ev: '+4.5%', isBest: false }
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
        { name: 'Pinnacle', odds: '+104', ev: '+6.39%', isBest: true },
        { name: 'DraftKings', odds: '+102', ev: '+5.5%', isBest: false },
        { name: 'FanDuel', odds: '+100', ev: '+4.8%', isBest: false },
        { name: 'BetMGM', odds: '-102', ev: '+3.2%', isBest: false },
        { name: 'Caesars', odds: '-105', ev: '+2.5%', isBest: false }
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
        { name: 'Pinnacle', odds: '+160', ev: '+5.26%', isBest: true },
        { name: 'BetMGM', odds: '+158', ev: '+4.8%', isBest: false },
        { name: 'DraftKings', odds: '+155', ev: '+4.2%', isBest: false },
        { name: 'FanDuel', odds: '+152', ev: '+3.8%', isBest: false },
        { name: 'Caesars', odds: '+150', ev: '+3.5%', isBest: false }
      ]
    }
  ];

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

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
          <button className="flex items-center gap-2 px-4 py-3 md:py-3.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all font-bold shadow-lg shadow-emerald-500/10 whitespace-nowrap text-sm">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Auto-Refresh</span>
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
          {topPicks.map((pick) => (
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
                          // Add to betslip logic
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
              {expandedRows.includes(pick.id) && (
                <div className="p-4 lg:p-6 bg-gradient-to-r from-white/5 to-transparent border-t border-white/10">
                  {/* Mobile Expanded - Bet Details */}
                  <div className="lg:hidden space-y-4">
                    <div className="flex items-start gap-3 pb-4 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{pick.team2[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg mb-1">{pick.team2}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-white/60 font-bold uppercase tracking-wide">SPREAD</div>
                      <div className="text-purple-400 font-bold text-2xl">-4.5</div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-white font-bold">{pick.bestBook}</div>
                      <div className="px-5 py-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 rounded-2xl shadow-lg">
                        <span className="text-white font-bold text-lg">{pick.bestOdds}</span>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30">
                      Place Bet
                    </button>
                  </div>

                  {/* Desktop Expanded - Full Comparison Table */}
                  <div className="hidden lg:block">
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
                            <th className="text-center py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">{pick.team1}</th>
                            <th className="text-center py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">{pick.team2}</th>
                            <th className="text-right py-3 px-4 text-white/60 font-bold text-xs uppercase tracking-wide">EV</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {pick.books.map((book, idx) => (
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
                              <td className="py-3 px-4 text-center">
                                <span className="text-white/40 font-bold text-sm">-</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`font-bold text-sm ${
                                  book.isBest ? 'text-amber-400' : 'text-emerald-400'
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
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Set Alert</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
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