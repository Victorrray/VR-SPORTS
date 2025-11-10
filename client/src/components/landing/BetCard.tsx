import { Clock } from 'lucide-react';

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

  return (
    <div
      className={`group ${
        isHero 
          ? 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10 hover:border-purple-400/40' 
          : 'bg-white border-gray-200 hover:border-purple-300'
      } backdrop-blur-2xl border rounded-2xl overflow-hidden transition-all shadow-xl ${
        isHero ? 'hover:shadow-purple-500/20' : 'hover:shadow-xl'
      }`}
    >
      {/* Card Header */}
      <div className={`p-5 border-b ${
        isHero 
          ? 'border-white/10 bg-gradient-to-br from-white/5 to-transparent' 
          : 'border-gray-200 bg-gray-50/50'
      }`}>
        <div className="mb-3">
          <span className={`px-2.5 py-1 ${
            isHero 
              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300' 
              : 'bg-purple-100 border-purple-200 text-purple-700'
          } backdrop-blur-xl border rounded-lg font-bold text-xs shadow-lg ${
            isHero ? 'shadow-purple-500/10' : ''
          }`}>
            {bet.sport}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className={`${isHero ? 'text-white' : 'text-gray-900'} font-bold mb-1.5`}>
              {bet.teams}
            </h3>
            <div className={`flex items-center gap-2 ${
              isHero ? 'text-white/50' : 'text-gray-600'
            } text-sm font-bold`}>
              <Clock className="w-3.5 h-3.5" />
              {bet.time}
            </div>
          </div>
          <div className={`px-3 py-1.5 ${
            isHero 
              ? 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30' 
              : 'bg-emerald-100 border-emerald-300'
          } backdrop-blur-xl rounded-lg shadow-lg ${
            isHero ? 'shadow-emerald-500/30' : ''
          } border`}>
            <span className={`${isHero ? 'text-white' : 'text-emerald-700'} font-bold text-sm`}>
              {bet.ev}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 space-y-4">
        {/* Pick Display */}
        <div className={`text-center p-4 ${
          isHero 
            ? 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-purple-400/30' 
            : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200'
        } backdrop-blur-xl border rounded-xl shadow-lg ${
          isHero ? 'shadow-purple-500/10' : ''
        }`}>
          <div className={`${
            isHero ? 'text-purple-300' : 'text-purple-600'
          } font-bold uppercase tracking-wide mb-2 text-sm`}>
            Recommended Pick
          </div>
          <div className={`${isHero ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>
            {bet.pick}
          </div>
        </div>

        {/* Odds & Sportsbook */}
        <div className={`flex items-center justify-between p-4 ${
          isHero 
            ? 'bg-gradient-to-br from-white/5 to-transparent border-white/10' 
            : 'bg-gray-50 border-gray-200'
        } backdrop-blur-xl rounded-xl border shadow-lg`}>
          <div>
            <div className={`${
              isHero ? 'text-white/50' : 'text-gray-500'
            } text-xs font-bold uppercase tracking-wide mb-1`}>
              Sportsbook
            </div>
            <div className={`${isHero ? 'text-white' : 'text-gray-900'} font-bold`}>
              {bet.sportsbook}
            </div>
          </div>
          <div className="text-right">
            <div className={`${
              isHero ? 'text-white/50' : 'text-gray-500'
            } text-xs font-bold uppercase tracking-wide mb-1`}>
              Odds
            </div>
            <div className={`${isHero ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>
              {bet.odds}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button className={`px-4 py-3 ${
            isHero 
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' 
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          } backdrop-blur-xl border rounded-xl transition-all font-bold text-sm shadow-lg text-center`}>
            Compare Odds
          </button>
          <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30 text-center">
            Place Bet
          </button>
        </div>
      </div>
    </div>
  );
}
