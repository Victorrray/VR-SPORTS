import { TrendingUp, Clock, Target, Filter, Search, ChevronDown, Sparkles, ArrowUpRight, X, Calculator, Trash2, Check, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

export function PicksPage({ savedPicks = [], onRemovePick, onUpdatePickStatus, onNavigateToCalculator }: { savedPicks?: any[], onRemovePick?: (index: number) => void, onUpdatePickStatus?: (index: number, status: 'won' | 'lost' | 'pending') => void, onNavigateToCalculator?: () => void }) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedConfidence, setSelectedConfidence] = useState<string[]>([]);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);

  // Check if a pick's game has ended (compare game time to now)
  const isGameEnded = (pick: any) => {
    if (!pick.time) return false;
    try {
      // Parse the time string - handle various formats
      const timeStr = pick.time;
      const now = new Date();
      
      // Try to extract date from time string
      // Format: "Sun, Nov 10 7:00 PM PST" or similar
      const dateMatch = timeStr.match(/(\w+),?\s+(\w+)\s+(\d+)\s+(\d+):(\d+)\s*(AM|PM)/i);
      if (dateMatch) {
        const [, , month, day, hour, minute, ampm] = dateMatch;
        const monthMap: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        const monthNum = monthMap[month] ?? 0;
        let hourNum = parseInt(hour);
        if (ampm?.toUpperCase() === 'PM' && hourNum !== 12) hourNum += 12;
        if (ampm?.toUpperCase() === 'AM' && hourNum === 12) hourNum = 0;
        
        const gameDate = new Date(now.getFullYear(), monthNum, parseInt(day), hourNum, parseInt(minute));
        // If the game date is in the past by more than 4 hours (typical game length), it's ended
        return now.getTime() > gameDate.getTime() + (4 * 60 * 60 * 1000);
      }
      return false;
    } catch {
      return false;
    }
  };
  
  const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];
  const confidenceLevels = ['High', 'Medium', 'Low'];
  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];

  const toggleFilter = (value: string, selectedArray: string[], setFunction: (arr: string[]) => void) => {
    if (selectedArray.includes(value)) {
      setFunction(selectedArray.filter(item => item !== value));
    } else {
      setFunction([...selectedArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedSports([]);
    setSelectedConfidence([]);
    setSelectedSportsbooks([]);
  };

  // Use only saved picks (no mock data)
  const allPicks = savedPicks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl md:text-3xl font-bold`}>My Picks</h1>
            <button 
              onClick={() => {
                onNavigateToCalculator?.();
              }}
              className={`md:hidden flex items-center gap-2 px-3 py-3 rounded-xl font-bold transition-all shrink-0 ${
                isLight 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600' 
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
              }`}
            >
              <Calculator className="w-5 h-5" />
            </button>
          </div>
          <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>Expert-recommended betting opportunities with positive expected value</p>
        </div>
      </div>

      {/* Quick Stats - Only show when there are picks */}


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
            <input 
              type="text"
              placeholder="Search teams, games, or leagues..."
              className={`w-full pl-12 pr-4 py-3.5 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/40 focus:bg-white/10'} backdrop-blur-2xl border rounded-xl focus:outline-none font-bold transition-all shadow-lg`}
            />
          </div>
          <button className={`flex items-center gap-2 px-4 py-3.5 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-2xl border rounded-xl transition-all font-bold shadow-lg`} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={`${isLight ? 'bg-white border-gray-300' : 'bg-white/5 border-white/10'} backdrop-blur-2xl border rounded-xl p-6 shadow-lg`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Filters</h3>
            <button 
              className={`${isLight ? 'text-purple-600 hover:text-purple-700' : 'text-purple-400 hover:text-purple-300'} transition-colors font-bold`} 
              onClick={() => {
                clearAllFilters();
                toast.success('Filters cleared');
              }}
            >
              Clear All
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-2`}>Sports</h4>
              <div className="flex flex-wrap gap-2">
                {sports.map(sport => (
                  <button
                    key={sport}
                    className={`px-3 py-1.5 ${selectedSports.includes(sport) ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent' : isLight ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/15'} border rounded-full transition-all font-bold`}
                    onClick={() => toggleFilter(sport, selectedSports, setSelectedSports)}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-2`}>Sportsbooks</h4>
              <div className="flex flex-wrap gap-2">
                {sportsbooks.map(book => (
                  <button
                    key={book}
                    className={`px-3 py-1.5 ${selectedSportsbooks.includes(book) ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent' : isLight ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/15'} border rounded-full transition-all font-bold`}
                    onClick={() => toggleFilter(book, selectedSportsbooks, setSelectedSportsbooks)}
                  >
                    {book}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Picks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allPicks.length === 0 ? (
          /* Empty State */
          <div className={`col-span-full flex flex-col items-center justify-center py-16 px-4 ${isLight ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
            <div className={`p-4 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} backdrop-blur-xl rounded-full border mb-4`}>
              <Target className={`w-8 h-8 ${isLight ? 'text-purple-600' : 'text-purple-300'}`} />
            </div>
            <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-xl mb-2`}>No Picks Yet</h3>
            <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-center max-w-md`}>
              Your picks will appear here when you add bets from the Odds page or save recommended bets.
            </p>
          </div>
        ) : (
          /* Display Picks */
          allPicks.map((pick, index) => (
            <div
              key={`pick-${index}-${pick.id}`}
              className={`relative p-4 ${isLight ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-xl hover:border-purple-400/40 transition-all group`}
            >
              {/* Sport Badge & Status */}
              <div className="mb-3 flex items-center justify-between">
                <span className={`px-2 py-0.5 ${isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-xl font-bold text-xs`}>
                  {pick.sport}
                </span>
                {/* Status Badge */}
                {pick.status === 'won' && (
                  <span className={`px-2 py-0.5 ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-400'} backdrop-blur-xl border rounded-xl font-bold text-xs flex items-center gap-1`}>
                    <Check className="w-3 h-3" /> Won
                  </span>
                )}
                {pick.status === 'lost' && (
                  <span className={`px-2 py-0.5 ${isLight ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-400/30 text-red-400'} backdrop-blur-xl border rounded-xl font-bold text-xs flex items-center gap-1`}>
                    <XCircle className="w-3 h-3" /> Lost
                  </span>
                )}
                {(!pick.status || pick.status === 'pending') && isGameEnded(pick) && (
                  <span className={`px-2 py-0.5 ${isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-400'} backdrop-blur-xl border rounded-xl font-bold text-xs`}>
                    Needs Grading
                  </span>
                )}
                {(!pick.status || pick.status === 'pending') && !isGameEnded(pick) && (
                  <span className={`px-2 py-0.5 ${isLight ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-400'} backdrop-blur-xl border rounded-xl font-bold text-xs`}>
                    Pending
                  </span>
                )}
              </div>

              {/* Teams & Time + EV Badge */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-1 text-sm`}>
                    {pick.teams}
                  </h3>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-gray-600' : 'text-white/50'} text-xs font-bold`}>
                    <Clock className="w-3 h-3" />
                    {pick.time}
                  </div>
                </div>

                {/* EV Badge */}
                <div className="shrink-0">
                  <div className={`inline-flex items-center px-2.5 py-1 ${isLight ? 'bg-emerald-100 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30'} backdrop-blur-xl rounded-xl border`}>
                    <span className={`${isLight ? 'text-emerald-700' : 'text-white'} font-bold text-xs`}>
                      {pick.ev}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pick Display */}
              <div className={`text-center p-3 mb-3 ${isLight ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200' : 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30'} backdrop-blur-xl border rounded-xl`}>
                <div className={`${isLight ? 'text-purple-600' : 'text-purple-300'} font-bold uppercase tracking-wide mb-1 text-xs`}>
                  Pick
                </div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                  {pick.pick}
                </div>
              </div>

              {/* Odds & Sportsbook */}
              <div className={`flex items-center justify-between p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'border-white/10'} backdrop-blur-xl rounded-xl border mb-3`}>
                <div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase tracking-wide mb-0.5`}>
                    Sportsbook
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                    {pick.sportsbook}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs font-bold uppercase tracking-wide mb-0.5`}>
                    Odds
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                    {pick.odds}
                  </div>
                </div>
              </div>

              {/* Stake & Potential Payout */}
              {pick.betAmount && (
                <div className={`flex items-center justify-between p-3 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-400/20'} backdrop-blur-xl rounded-xl border mb-3`}>
                  <div>
                    <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} text-xs font-bold uppercase tracking-wide mb-0.5`}>
                      Stake
                    </div>
                    <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-300'} font-bold text-sm`}>
                      ${pick.betAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} text-xs font-bold uppercase tracking-wide mb-0.5`}>
                      To Win
                    </div>
                    <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-300'} font-bold`}>
                      ${(() => {
                        const odds = parseInt((pick.odds || '+100').replace('+', ''), 10);
                        const stake = pick.betAmount || 0;
                        if (odds > 0) {
                          return (stake * (odds / 100)).toFixed(2);
                        } else {
                          return (stake * (100 / Math.abs(odds))).toFixed(2);
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Grading Buttons - Show for ended games that need grading */}
              {onUpdatePickStatus && (!pick.status || pick.status === 'pending') && isGameEnded(pick) && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      onUpdatePickStatus(index, 'won');
                      toast.success('Marked as Won! 🎉');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                      isLight 
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300' 
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-400/30'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-bold text-sm">Won</span>
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePickStatus(index, 'lost');
                      toast.error('Marked as Lost');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                      isLight 
                        ? 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-300' 
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">Lost</span>
                  </button>
                </div>
              )}

              {/* Delete Button - Only show for saved picks (first items in array) */}
              {onRemovePick && index < savedPicks.length && (
                <button
                  onClick={() => {
                    onRemovePick(index);
                    toast.success('Pick removed');
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    isLight 
                      ? 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-300' 
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-bold text-sm">Remove</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}