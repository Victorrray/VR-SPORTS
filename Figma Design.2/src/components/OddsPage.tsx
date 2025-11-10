import { TrendingUp, Clock, Search, ChevronDown, Filter, BarChart2, Plus, Zap, RefreshCw, Calendar, Star, ArrowUpRight, Target, Flame, Trophy, TrendingDown, Eye, Bell } from 'lucide-react';
import { useState } from 'react';

export function OddsPage() {
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

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

  return (
    <div className="space-y-6">
      {/* Sports Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
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
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input 
            type="text"
            placeholder="Search games, teams, or markets..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-purple-400/40 focus:bg-white/10 font-bold transition-all shadow-lg"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg">
            <Filter className="w-4 h-4" />
            Market Type
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg">
            <Calendar className="w-4 h-4" />
            Today
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all font-bold shadow-lg shadow-emerald-500/10">
            <RefreshCw className="w-4 h-4" />
            Auto-Refresh
          </button>
        </div>
      </div>

      {/* Odds Cards */}
      <div className="space-y-4">
        {topPicks.map((pick) => (
          <div 
            key={pick.id}
            className="group bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-400/40 transition-all shadow-xl hover:shadow-purple-500/20"
          >
            {/* Card Header */}
            <div className="p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Side - Game Info */}
                <div className="flex items-center gap-4">
                  {/* EV Badge */}
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 rounded-xl shadow-lg">
                    <div className="text-xs text-emerald-300 font-bold uppercase tracking-wide mb-1">EV</div>
                    <div className="text-emerald-400 text-xl font-bold">{pick.ev}</div>
                  </div>

                  {/* Game Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 text-purple-300 rounded-lg font-bold text-xs">
                        {pick.sport}
                      </span>
                      {pick.isHot && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-400/30 text-orange-300 rounded-lg font-bold text-xs flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          HOT
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                        LIVE
                      </div>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-1">{pick.game}</h3>
                    <div className="text-white/60 font-bold text-sm">{pick.pick}</div>
                  </div>
                </div>

                {/* Right Side - Best Odds */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">Best Odds</div>
                    <div className="text-white text-2xl font-bold">{pick.bestOdds}</div>
                    <div className="text-white/60 text-sm font-bold">{pick.bestBook}</div>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30">
                    Place Bet
                  </button>
                </div>
              </div>
            </div>

            {/* Odds Comparison */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-white/60" />
                <span className="text-white/60 font-bold text-sm uppercase tracking-wide">Odds Comparison</span>
                <span className="text-white/40 text-xs font-bold">Avg: {pick.avgOdds}</span>
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {pick.books.map((book, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl backdrop-blur-xl transition-all ${
                      book.isBest
                        ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {book.isBest && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">Best</span>
                      </div>
                    )}
                    <div className="text-white font-bold mb-1">{book.name}</div>
                    <div className="text-white text-xl font-bold mb-1">{book.odds}</div>
                    <div className={`text-xs font-bold ${
                      book.isBest ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {book.ev}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                  <Bell className="w-4 h-4" />
                  Set Alert
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-bold text-sm">
                  <Plus className="w-4 h-4" />
                  Add to Betslip
                </button>
                <div className="ml-auto text-white/50 text-sm font-bold">
                  Updated 2s ago
                </div>
              </div>
            </div>
          </div>
        ))}
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