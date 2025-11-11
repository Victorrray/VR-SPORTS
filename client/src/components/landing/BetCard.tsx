import { Clock } from 'lucide-react';
import { useTheme } from "next-themes";

export interface BetData {
  id: number;
  teams: string;
  time: string;
  pick: string;
  odds: string;
  sportsbook: string;
  ev: string;
  sport: string;
  status: string;
  confidence: string;
}

interface BetCardProps {
  bet: BetData;
  variant?: 'default' | 'hero'; // 'hero' for landing page display
}

export function BetCard({ bet, variant = 'default' }: BetCardProps) {
  // For the hero variant, we use a fixed dark theme style
  const isHero = variant === 'hero';
  
  // Only use theme context when not in hero mode (hero is always dark)
  const { theme } = useTheme();
  const isDark = isHero ? true : theme === 'dark';

  return (
    <div
      className={`group ${
        isHero 
          ? 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10 hover:border-purple-400/40' 
          : isDark
          ? 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10 hover:border-purple-400/40'
          : 'bg-white border-gray-200 hover:border-purple-300'
      } backdrop-blur-2xl border rounded-xl overflow-hidden transition-all`}
    >
      {/* Card Header */}
      <div className={`p-3 border-b ${
        isHero || isDark
          ? 'border-white/10 bg-gradient-to-br from-white/5 to-transparent' 
          : 'border-gray-200 bg-gray-50/50'
      }`}>
        <div className="mb-2">
          <span className={`px-2 py-0.5 ${
            isHero || isDark
              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300' 
              : 'bg-purple-100 border-purple-200 text-purple-700'
          } backdrop-blur-xl border rounded-lg font-bold text-xs`}>
            {bet.sport}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold mb-1 text-sm`}>
              {bet.teams}
            </h3>
            <div className={`flex items-center gap-1.5 ${
              isHero || isDark ? 'text-white/50' : 'text-gray-600'
            } text-xs font-bold`}>
              <Clock className="w-3 h-3" />
              {bet.time}
            </div>
          </div>
          <div className={`px-2.5 py-1 ${
            isHero || isDark
              ? 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30' 
              : 'bg-emerald-100 border-emerald-300'
          } backdrop-blur-xl rounded-lg border`}>
            <span className={`${isHero || isDark ? 'text-white' : 'text-emerald-700'} font-bold text-xs`}>
              {bet.ev}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-2.5">
        {/* Pick Display */}
        <div className={`text-center p-3 ${
          isHero || isDark
            ? 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30' 
            : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200'
        } backdrop-blur-xl border rounded-lg`}>
          <div className={`${
            isHero || isDark ? 'text-purple-300' : 'text-purple-600'
          } font-bold uppercase tracking-wide mb-1 text-xs`}>
            Recommended Pick
          </div>
          <div className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold`}>
            {bet.pick}
          </div>
        </div>

        {/* Odds & Sportsbook */}
        <div className={`flex items-center justify-between p-3 ${
          isHero || isDark
            ? 'bg-gradient-to-br from-white/5 to-transparent border-white/10' 
            : 'bg-gray-50 border-gray-200'
        } backdrop-blur-xl rounded-lg border`}>
          <div>
            <div className={`${
              isHero || isDark ? 'text-white/50' : 'text-gray-500'
            } text-xs font-bold uppercase tracking-wide mb-0.5`}>
              Sportsbook
            </div>
            <div className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold text-sm`}>
              {bet.sportsbook}
            </div>
          </div>
          <div className="text-right">
            <div className={`${
              isHero || isDark ? 'text-white/50' : 'text-gray-500'
            } text-xs font-bold uppercase tracking-wide mb-0.5`}>
              Odds
            </div>
            <div className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold`}>
              {bet.odds}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button className={`px-3 py-2 ${
            isHero || isDark
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' 
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          } backdrop-blur-xl border rounded-lg transition-all font-bold text-xs text-center`}>
            Compare Odds
          </button>
          <button className="px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-xs border border-purple-400/30 text-center">
            Place Bet
          </button>
        </div>
      </div>
    </div>
  );
}