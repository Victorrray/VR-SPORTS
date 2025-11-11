import { TrendingUp, Clock, Target, Filter, Search, ChevronDown, Sparkles, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export function PicksPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
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
          <h1 className={`${isLight ? text-foreground : 'text-white'} text-2xl md:text-3xl font-bold mb-2`}>My Picks</h1>
          <p className={`${isLight ? text-foregroundMuted : 'text-white/60'} font-bold`}>Expert-recommended betting opportunities with positive expected value</p>
        </div>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 px-4 py-2.5 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold shadow-lg ${isLight ? '' : 'hover:shadow-purple-500/10'}`}>
            <Target className="w-4 h-4" />
            All Sports
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 ${isLight ? 'bg-card' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 ${isLight ? 'bg-primary/10' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} backdrop-blur-xl rounded-lg border`}>
              <Sparkles className={`w-4 h-4 ${isLight ? 'text-primary' : 'text-purple-300'}`} />
            </div>
            <span className={`${isLight ? 'text-muted-foreground' : 'text-white/50'} font-bold text-sm uppercase tracking-wide`}>Today's Picks</span>
          </div>
          <div className={`${isLight ? text-foreground : 'text-white'} text-2xl font-bold`}>{picks.length}</div>
        </div>
        <div className={`p-5 ${isLight ? 'bg-card' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 ${isLight ? 'bg-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl rounded-lg border`}>
              <TrendingUp className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-300'}`} />
            </div>
            <span className={`${isLight ? 'text-muted-foreground' : 'text-white/50'} font-bold text-sm uppercase tracking-wide`}>Avg EV</span>
          </div>
          <div className={`${isLight ? text-foreground : 'text-white'} text-2xl font-bold`}>+6.2%</div>
        </div>
        <div className={`p-5 ${isLight ? 'bg-card' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 ${isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30'} backdrop-blur-xl rounded-lg border`}>
              <Target className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-300'}`} />
            </div>
            <span className={`${isLight ? 'text-muted-foreground' : 'text-white/50'} font-bold text-sm uppercase tracking-wide`}>High Confidence</span>
          </div>
          <div className={`${isLight ? text-foreground : 'text-white'} text-2xl font-bold`}>3 Picks</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
          <input 
            type="text"
            placeholder="Search teams, games, or leagues..."
            className={`w-full pl-12 pr-4 py-3.5 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/40 focus:bg-white/10'} backdrop-blur-2xl border rounded-xl focus:outline-none font-bold transition-all shadow-lg`}
          />
        </div>
        <div className="flex gap-2">
          <button className={`flex items-center gap-2 px-4 py-3.5 ${isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-purple-300'} backdrop-blur-xl border rounded-xl font-bold shadow-lg ${isLight ? '' : 'shadow-purple-500/20'}`}>
            All Sports
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className={`flex items-center gap-2 px-4 py-3.5 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-2xl border rounded-xl transition-all font-bold shadow-lg`}>
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
            className={`group ${isLight ? 'bg-white border-gray-200 hover:border-purple-300' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10 hover:border-purple-400/40'} backdrop-blur-2xl border rounded-2xl overflow-hidden transition-all shadow-xl ${isLight ? 'hover:shadow-xl' : 'hover:shadow-purple-500/20'}`}
          >
            {/* Header */}
            <div className={`p-5 border-b ${isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/10 bg-gradient-to-br from-white/5 to-transparent'}`}>
              <div className="mb-3">
                <span className={`px-2.5 py-1 ${isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-lg font-bold text-xs shadow-lg ${isLight ? '' : 'shadow-purple-500/10'}`}>
                  {pick.sport}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-1.5`}>{pick.teams}</h3>
                  <div className={`flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-white/50'} text-sm font-bold`}>
                    <Clock className="w-3.5 h-3.5" />
                    {pick.time}
                  </div>
                </div>
                <div className={`px-3 py-1.5 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30'} backdrop-blur-xl rounded-lg shadow-lg ${isLight ? '' : 'shadow-emerald-500/30'} border`}>
                  <span className={`${isLight ? 'text-emerald-700' : 'text-white'} font-bold text-sm`}>{pick.ev}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Pick */}
              <div className={`text-center p-4 ${isLight ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200' : 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30'} backdrop-blur-xl border rounded-xl shadow-lg ${isLight ? '' : 'shadow-purple-500/10'}`}>
                <div className={`${isLight ? 'text-purple-600' : 'text-purple-300'} font-bold uppercase tracking-wide mb-2 text-sm`}>
                  Recommended Pick
                </div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>{pick.pick}</div>
              </div>

              {/* Sportsbook & Odds */}
              <div className={`flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border shadow-lg`}>
                <div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase tracking-wide mb-1`}>
                    Sportsbook
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>{pick.sportsbook}</div>
                </div>
                <div className="text-right">
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase tracking-wide mb-1`}>
                    Odds
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>{pick.odds}</div>
                </div>
              </div>

              {/* Actions */}
              <button className={`w-full px-4 py-3 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm shadow-lg`}>
                Compare Odds
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}