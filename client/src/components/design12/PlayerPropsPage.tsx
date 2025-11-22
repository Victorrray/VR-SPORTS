import React, { useState } from 'react';
import { Search, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useOddsData } from '../../hooks/useOddsData';
import { toast } from 'sonner';

export function PlayerPropsPage({ onAddPick, savedPicks = [] }: { onAddPick?: (pick: any) => void, savedPicks?: any[] }) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortBy, setSortBy] = useState<'ev' | null>('ev');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch player props data from API
  const { picks: apiPicks, loading: apiLoading, error: apiError, refetch } = useOddsData({
    sport: selectedSport,
    betType: 'props',
    sportsbooks: selectedSportsbooks,
    enabled: true
  });

  const topPicks = apiPicks || [];
  const isLoading = apiLoading;

  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'nfl', name: 'NFL' },
    { id: 'nba', name: 'NBA' },
    { id: 'nhl', name: 'NHL' },
    { id: 'mlb', name: 'MLB' },
  ];

  const sportsbooksByTier = [
    {
      tier: 'Tier 1 - Major US Sportsbooks',
      books: [
        { id: 'draftkings', name: 'DraftKings' },
        { id: 'fanduel', name: 'FanDuel' },
        { id: 'betmgm', name: 'BetMGM' },
        { id: 'caesars', name: 'Caesars Sportsbook' },
      ]
    },
    {
      tier: '⭐ SECOND TIER - MAJOR OPERATORS (Tier 2)',
      books: [
        { id: 'espnbet', name: 'ESPN BET' },
        { id: 'fanatics', name: 'Fanatics Sportsbook' },
        { id: 'hardrock', name: 'Hard Rock Bet' },
        { id: 'pointsbet', name: 'PointsBet US' },
        { id: 'betrivers', name: 'BetRivers' },
      ]
    },
    {
      tier: '🎯 SHARP/LOW VIG BOOKS (Tier 2)',
      books: [
        { id: 'pinnacle', name: 'Pinnacle' },
      ]
    },
  ];

  // Filter picks
  const filteredPicks = topPicks.filter(pick => {
    if (selectedSport !== 'all') {
      const sportMap: Record<string, string[]> = {
        'nfl': ['americanfootball_nfl', 'nfl'],
        'nba': ['basketball_nba', 'nba'],
        'nhl': ['icehockey_nhl', 'nhl'],
        'mlb': ['baseball_mlb', 'mlb'],
      };
      
      const allowedSports = sportMap[selectedSport] || [];
      const pickSport = pick.sport.toLowerCase();
      const matches = allowedSports.some(sport => pickSport.includes(sport.toLowerCase()));
      
      if (!matches) {
        return false;
      }
    }

    if (selectedSportsbooks.length > 0) {
      // Create a map of sportsbook IDs to names for matching
      const sportsbookMap: Record<string, string[]> = {};
      sportsbooksByTier.forEach(tier => {
        tier.books.forEach(book => {
          if (!sportsbookMap[book.id]) {
            sportsbookMap[book.id] = [];
          }
          sportsbookMap[book.id].push(book.name.toLowerCase());
        });
      });

      const hasSelectedBook = pick.books.some(book => {
        const bookNameLower = book.name.toLowerCase();
        return selectedSportsbooks.some(selectedId => {
          const matchingNames = sportsbookMap[selectedId] || [];
          return matchingNames.some(name => bookNameLower.includes(name) || name.includes(bookNameLower));
        });
      });

      if (!hasSelectedBook) {
        return false;
      }
    }

    return true;
  });

  // Sort filtered picks
  const sortedPicks = [...filteredPicks].sort((a, b) => {
    if (!sortBy) return 0;
    
    if (sortBy === 'ev') {
      const aEV = parseFloat(a.ev.replace('%', ''));
      const bEV = parseFloat(b.ev.replace('%', ''));
      return sortDirection === 'desc' ? bEV - aEV : aEV - bEV;
    }
    
    return 0;
  });

  // Paginate
  const paginatedPicks = sortedPicks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(sortedPicks.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-3xl font-bold mb-2`}>
          Player Props
        </h1>
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>
          Individual player performance bets with positive expected value
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 flex-wrap">
          {/* Sport Filter */}
          <div className="relative">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                isLight 
                  ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <span className="font-bold">{sports.find(s => s.id === selectedSport)?.name || 'All Sports'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className={`absolute top-full mt-2 left-0 w-48 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-white/10'} border rounded-xl overflow-hidden z-40 shadow-xl`}>
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left font-bold transition-all ${
                    selectedSport === sport.id
                      ? isLight 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'bg-purple-500/10 text-purple-300'
                      : isLight 
                        ? 'text-gray-700 hover:bg-gray-50' 
                        : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  {sport.name}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              refetch();
              toast.success('Refreshing player props...');
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold ${
              isLoading
                ? isLight ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-white/5 border-white/10 text-white/40'
                : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-xl border rounded-xl overflow-hidden`}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            <p className={`mt-4 ${isLight ? 'text-gray-600' : 'text-white/60'} font-bold`}>Loading player props...</p>
          </div>
        ) : paginatedPicks.length > 0 ? (
          <div className="divide-y divide-white/10">
            {paginatedPicks.map((pick) => (
              <div key={pick.id} className={`p-4 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-all`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Pick Info */}
                  <div>
                    <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1`}>
                      {pick.sport.toUpperCase()}
                    </p>
                    <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                      {pick.pick}
                    </p>
                    <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>
                      {pick.game}
                    </p>
                  </div>

                  {/* EV */}
                  <div className="text-center">
                    <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1`}>
                      Expected Value
                    </p>
                    <p className={`${parseFloat(pick.ev) > 0 ? 'text-green-400' : 'text-red-400'} font-bold text-lg`}>
                      {pick.ev}
                    </p>
                  </div>

                  {/* Best Odds */}
                  <div className="text-center">
                    <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1`}>
                      Best Odds
                    </p>
                    <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                      {pick.bestOdds}
                    </p>
                    <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold`}>
                      {pick.bestBook}
                    </p>
                  </div>

                  {/* Add Button */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        if (onAddPick) {
                          onAddPick(pick);
                          toast.success('Pick added to your slip!');
                        }
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-bold"
                    >
                      Add Pick
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Search className={`w-12 h-12 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
            <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg mb-2`}>
              No player props found
            </p>
            <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold`}>
              Try adjusting your filters or check back later
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              currentPage === 1
                ? isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-white/40'
                : isLight ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            Previous
          </button>
          <span className={`px-4 py-2 font-bold ${isLight ? 'text-gray-700' : 'text-white'}`}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              currentPage === totalPages
                ? isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-white/40'
                : isLight ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PlayerPropsPage;
