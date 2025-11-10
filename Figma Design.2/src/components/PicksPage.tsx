import { TrendingUp, Clock, Target, Filter, Search, ChevronDown, Sparkles, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

export function PicksPage() {
  const picks = [
    {
      id: 1,
      teams: 'Detroit Pistons @ Philadelphia 76ers',
      time: 'Sun, Nov 10 4:41 PM PST',
      pick: 'Detroit Pistons -3.5',
      odds: '-118',
      sportsbook: 'DraftKings',
      ev: '+8.2%',
      sport: 'NBA',
      confidence: 'High',
      analysis: 'Strong value play with Pistons covering spread in 4 of last 5 matchups'
    },
    {
      id: 2,
      teams: 'Lakers @ Warriors',
      time: 'Sun, Nov 10 7:00 PM PST',
      pick: 'Over 228.5',
      odds: '-110',
      sportsbook: 'FanDuel',
      ev: '+6.5%',
      sport: 'NBA',
      confidence: 'Medium',
      analysis: 'Both teams averaging 115+ PPG, pace favors over'
    },
    {
      id: 3,
      teams: 'Cowboys @ Giants',
      time: 'Sun, Nov 10 1:00 PM EST',
      pick: 'Cowboys -7.5',
      odds: '-115',
      sportsbook: 'BetMGM',
      ev: '+5.8%',
      sport: 'NFL',
      confidence: 'High',
      analysis: 'Cowboys dominant ATS on road, Giants struggling defensively'
    },
    {
      id: 4,
      teams: 'Celtics @ Heat',
      time: 'Mon, Nov 11 7:30 PM EST',
      pick: 'Celtics ML',
      odds: '-125',
      sportsbook: 'Caesars',
      ev: '+4.3%',
      sport: 'NBA',
      confidence: 'Medium',
      analysis: 'Celtics strong road record, Heat missing key players'
    },
    {
      id: 5,
      teams: 'Chiefs @ Bills',
      time: 'Sun, Nov 10 4:25 PM EST',
      pick: 'Under 47.5',
      odds: '-108',
      sportsbook: 'DraftKings',
      ev: '+7.1%',
      sport: 'NFL',
      confidence: 'High',
      analysis: 'Elite defenses, weather conditions favor under'
    },
    {
      id: 6,
      teams: 'Bucks @ Nets',
      time: 'Sun, Nov 10 6:00 PM EST',
      pick: 'Bucks -4.5',
      odds: '-112',
      sportsbook: 'FanDuel',
      ev: '+5.2%',
      sport: 'NBA',
      confidence: 'Medium',
      analysis: 'Bucks on 3-game win streak, Nets injury concerns'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">My Picks</h1>
          <p className="text-white/60 font-bold">Expert-recommended betting opportunities with positive expected value</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg hover:shadow-purple-500/10">
            <Target className="w-4 h-4" />
            All Sports
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-lg border border-purple-400/30">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-white/50 font-bold text-sm uppercase tracking-wide">Today's Picks</span>
          </div>
          <div className="text-white text-2xl font-bold">{picks.length}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-lg border border-emerald-400/30">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="text-white/50 font-bold text-sm uppercase tracking-wide">Avg EV</span>
          </div>
          <div className="text-white text-2xl font-bold">+6.2%</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-lg border border-amber-400/30">
              <Target className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-white/50 font-bold text-sm uppercase tracking-wide">High Confidence</span>
          </div>
          <div className="text-white text-2xl font-bold">3 Picks</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input 
            type="text"
            placeholder="Search teams, games, or leagues..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-purple-400/40 focus:bg-white/10 font-bold transition-all shadow-lg"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/40 text-purple-300 rounded-xl font-bold shadow-lg shadow-purple-500/20">
            All Sports
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Picks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {picks.map((pick) => (
          <div 
            key={pick.id}
            className="group bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-400/40 transition-all shadow-xl hover:shadow-purple-500/20"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-1.5">{pick.teams}</h3>
                  <div className="flex items-center gap-2 text-white/50 text-sm font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {pick.time}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-xl rounded-lg shadow-lg shadow-amber-500/30 border border-amber-400/30">
                  <span className="text-white font-bold text-sm">{pick.ev}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 text-purple-300 rounded-lg font-bold text-xs shadow-lg shadow-purple-500/10">
                  {pick.sport}
                </span>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs backdrop-blur-xl shadow-lg ${
                  pick.confidence === 'High' 
                    ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shadow-emerald-500/10'
                    : 'bg-blue-500/20 border border-blue-400/30 text-blue-300 shadow-blue-500/10'
                }`}>
                  {pick.confidence} Confidence
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Pick */}
              <div className="text-center p-4 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 backdrop-blur-xl border border-purple-400/30 rounded-xl shadow-lg shadow-purple-500/10">
                <div className="text-purple-300 font-bold uppercase tracking-wide mb-2 text-sm">
                  Recommended Pick
                </div>
                <div className="text-white text-xl font-bold">{pick.pick}</div>
              </div>

              {/* Analysis */}
              <div className="p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
                <div className="text-white/50 font-bold text-xs uppercase tracking-wide mb-2">Analysis</div>
                <p className="text-white/80 text-sm font-bold">{pick.analysis}</p>
              </div>

              {/* Sportsbook & Odds */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 shadow-lg">
                <div>
                  <div className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">
                    Sportsbook
                  </div>
                  <div className="text-white font-bold">{pick.sportsbook}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">
                    Odds
                  </div>
                  <div className="text-white text-xl font-bold">{pick.odds}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm shadow-lg">
                  Compare Odds
                </button>
                <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30">
                  Place Bet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
