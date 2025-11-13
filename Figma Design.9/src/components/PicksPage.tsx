import { TrendingUp, Clock, Target, Filter, Search, ChevronDown, Sparkles, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors } from '../contexts/ThemeContext';

export function PicksPage({ savedPicks = [] }: { savedPicks?: any[] }) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
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

  // Combine default picks with saved picks
  const allPicks = [...savedPicks, ...picks];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl md:text-3xl font-bold mb-2`}>My Picks</h1>
          <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>Expert-recommended betting opportunities with positive expected value</p>
        </div>
        <div className="flex items-center gap-3">
          
        </div>
      </div>

      {/* Quick Stats - Only show when there are picks */}
      {allPicks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto">
          <div className={`p-4 md:p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border-white/10'} border rounded-xl md:rounded-2xl`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 ${isLight ? lightModeColors.statsIcon : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} backdrop-blur-xl rounded-lg border`}>
                <Sparkles className={`w-4 h-4 ${isLight ? lightModeColors.statsIconColor : 'text-purple-300'}`} />
              </div>
              <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs md:text-sm uppercase tracking-wide`}>Today's Picks</span>
            </div>
            <div className={`${isLight ? lightModeColors.text : 'text-white'} text-xl md:text-2xl font-bold`}>{allPicks.length}</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+2 from yesterday</span>
            </div>
          </div>
          <div className={`p-4 md:p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border-white/10'} border rounded-xl md:rounded-2xl`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 ${isLight ? 'bg-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl rounded-lg border`}>
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-300'}`} />
              </div>
              <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs md:text-sm uppercase tracking-wide`}>Avg EV</span>
            </div>
            <div className={`${isLight ? lightModeColors.text : 'text-white'} text-xl md:text-2xl font-bold`}>+6.2%</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+0.8% this week</span>
            </div>
          </div>
        </div>
      )}

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
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Empty State - Will be populated by bets added from Odds page and recommended bets */}
        <div className={`col-span-full flex flex-col items-center justify-center py-16 px-4 ${isLight ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <div className={`p-4 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} backdrop-blur-xl rounded-full border mb-4`}>
            <Target className={`w-8 h-8 ${isLight ? 'text-purple-600' : 'text-purple-300'}`} />
          </div>
          <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-xl mb-2`}>No Picks Yet</h3>
          <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-center max-w-md`}>
            Your picks will appear here when you add bets from the Odds page or save recommended bets.
          </p>
        </div>
      </div>
    </div>
  );
}