import { Clock, Check, Plus, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

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
  showActions?: boolean; // Control whether to show action buttons
}

export function BetCard({ bet, variant = 'default', showActions = true }: BetCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [isCompareExpanded, setIsCompareExpanded] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  
  // Always call useTheme at top level
  const { colorMode } = useTheme();
  
  // For the hero variant, we use a fixed dark theme style
  const isHero = variant === 'hero';
  
  // Determine if dark mode - hero is always dark, otherwise use theme context
  const isDark = isHero ? true : colorMode === 'dark';

  const handleAddToPicks = () => {
    setIsAdded(!isAdded);
  };

  // Mock sportsbook data - In production, this would come from API
  const sportsbookOdds = [
    { name: 'Pinnacle', odds: bet.odds, team2Odds: '-195' },
    { name: 'DraftKings', odds: '+135', team2Odds: '-162' },
    { name: 'FanDuel', odds: '+130', team2Odds: '-158' },
    { name: 'BetMGM', odds: '+125', team2Odds: '-152' },
    { name: 'Caesars', odds: '+122', team2Odds: '-148' },
    { name: 'BetRivers', odds: '+120', team2Odds: '-145' },
    { name: 'Hard Rock', odds: '+118', team2Odds: '-142' },
    { name: 'Fanatics', odds: '+115', team2Odds: '-138' }
  ];

  // Extract team names from the teams string
  const teamNames = bet.teams.split(' @ ');
  const team1 = teamNames[0] || 'Team 1';
  const team2 = teamNames[1] || 'Team 2';

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
          ? 'border-white/10' 
          : 'border-gray-200 bg-gray-50/50'
      }`}>
        <div className="mb-2">
          <span className={`px-2 py-0.5 ${
            isHero || isDark
              ? 'bg-gradient-to-r bg-purple-500/20 border-purple-400/30 text-purple-300' 
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
            Pick
          </div>
          <div className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold text-sm`}>
            {bet.pick && bet.pick !== 'Yes' ? bet.pick : `${bet.teams}`}
          </div>
        </div>

        {/* Odds & Sportsbook */}
        <div className={`flex items-center justify-between p-3 ${
          isHero || isDark
            ? 'border-white/10' 
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
        {showActions && (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setIsCompareExpanded(!isCompareExpanded)}
              className={`px-3 py-2 ${
              isHero || isDark
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            } backdrop-blur-xl border rounded-lg transition-all font-bold text-xs text-center`}>
              Compare Odds
            </button>
            <button 
              onClick={handleAddToPicks}
              className={`px-3 py-2 ${
                isAdded 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 border-emerald-400/30' 
                  : 'bg-purple-500 hover:bg-purple-400 border-purple-400/30'
              } text-white rounded-lg transition-all font-bold text-xs border text-center flex items-center justify-center gap-1.5`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Added
                </>
              ) : (
                'Place Bet'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Expanded Compare Odds Section */}
      {isCompareExpanded && (
        <div className={`p-4 border-t ${
          isHero || isDark
            ? 'bg-white/5 border-white/10' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Best Odds Badge */}
          <div className={`grid grid-cols-3 gap-3 pb-3 mb-4 border-b ${
            isHero || isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
            {/* Best Line */}
            <div className="flex flex-col items-center text-center">
              <div className={`${isHero || isDark ? 'text-white/60' : 'text-gray-600'} font-bold text-xs mb-2`}>
                Best Line
              </div>
              <div className={`px-3 py-2 ${
                isHero || isDark
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30' 
                  : 'bg-emerald-100 border-emerald-300'
              } backdrop-blur-xl border rounded-xl`}>
                <span className={`${isHero || isDark ? 'text-emerald-400' : 'text-emerald-700'} font-bold text-base`}>
                  {bet.odds}
                </span>
              </div>
            </div>

            {/* Average Odds */}
            <div className="flex flex-col items-center text-center">
              <div className={`${isHero || isDark ? 'text-white/60' : 'text-gray-600'} font-bold text-xs mb-2`}>
                Average Odds
              </div>
              <div className={`px-3 py-2 ${
                isHero || isDark
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-gray-100 border-gray-200'
              } backdrop-blur-xl border rounded-xl`}>
                <span className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold text-base`}>
                  {bet.odds.includes('+') ? `+${parseInt(bet.odds) - 15}` : `${parseInt(bet.odds) + 15}`}
                </span>
              </div>
            </div>

            {/* DeVig Odds */}
            <div className="flex flex-col items-center text-center">
              <div className={`${isHero || isDark ? 'text-white/60' : 'text-gray-600'} font-bold text-xs mb-2`}>
                DeVig Odds
              </div>
              <div className={`px-3 py-2 ${
                isHero || isDark
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-gray-100 border-gray-200'
              } backdrop-blur-xl border rounded-xl`}>
                <span className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold text-base`}>
                  {bet.odds.includes('+') ? `+${parseInt(bet.odds) - 8}` : `${parseInt(bet.odds) + 8}`}
                </span>
              </div>
            </div>
          </div>

          {/* Books Table */}
          <div className="space-y-2">
            {/* Table Header */}
            <div className={`grid grid-cols-4 gap-2 px-3 py-2 ${
              isHero || isDark
                ? 'bg-purple-500/20 border-purple-400/30' 
                : 'bg-purple-100 border-purple-200'
            } border rounded-lg`}>
              <div className={`${isHero || isDark ? 'text-purple-300' : 'text-purple-700'} font-bold text-xs`}>
                Book
              </div>
              <div className={`${isHero || isDark ? 'text-purple-300' : 'text-purple-700'} font-bold text-xs text-center`}>
                {team1.split(' ').pop()}
              </div>
              <div className={`${isHero || isDark ? 'text-purple-300' : 'text-purple-700'} font-bold text-xs text-center`}>
                {team2.split(' ').pop()}
              </div>
              <div className={`${isHero || isDark ? 'text-purple-300' : 'text-purple-700'} font-bold text-xs text-right`}>
                Pick
              </div>
            </div>

            {/* Table Rows */}
            {(showAllBooks ? sportsbookOdds : sportsbookOdds.slice(0, 5)).map((book, idx) => (
              <div 
                key={idx}
                className={`grid grid-cols-4 gap-2 px-3 py-2.5 ${
                  isHero || isDark
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white border-gray-200'
                } border rounded-lg items-center`}
              >
                <div className={`${isHero || isDark ? 'text-white' : 'text-gray-900'} font-bold text-sm`}>
                  {book.name}
                </div>
                <div className={`${
                  isHero || isDark ? 'text-emerald-400' : 'text-emerald-600'
                } font-bold text-sm text-center`}>
                  {book.odds}
                </div>
                <div className={`${
                  isHero || isDark ? 'text-white/60' : 'text-gray-600'
                } font-bold text-sm text-center`}>
                  {book.team2Odds}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddToPicks}
                    className="p-1.5 bg-purple-500 rounded-lg hover:bg-purple-400 transition-all"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View More Button */}
          {sportsbookOdds.length > 5 && (
            <button 
              onClick={() => setShowAllBooks(!showAllBooks)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 mt-3 ${
                isHero || isDark
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              } backdrop-blur-xl border rounded-lg transition-all font-bold text-sm`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllBooks ? 'rotate-180' : ''}`} />
              <span>{showAllBooks ? 'View Less' : 'View More'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}