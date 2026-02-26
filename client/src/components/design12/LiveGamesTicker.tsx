import React, { useState, useEffect, useRef } from 'react';
import { Circle, Loader2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  score?: string;
}

interface Game {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
    period: number;
    displayClock: string;
  };
  competitions: Array<{
    competitors: Array<{
      id: string;
      homeAway: string;
      team: Team;
      score: string;
      winner?: boolean;
    }>;
  }>;
}

interface SportConfig {
  key: string;
  name: string;
  endpoint: string;
}

const SPORTS: SportConfig[] = [
  { key: 'nfl', name: 'NFL', endpoint: 'football/nfl' },
  { key: 'nba', name: 'NBA', endpoint: 'basketball/nba' },
  { key: 'mlb', name: 'MLB', endpoint: 'baseball/mlb' },
  { key: 'nhl', name: 'NHL', endpoint: 'hockey/nhl' },
  { key: 'ncaaf', name: 'NCAAF', endpoint: 'football/college-football' },
  { key: 'ncaab', name: 'NCAAB', endpoint: 'basketball/mens-college-basketball' },
];

interface LiveGamesTickerProps {
  isLight?: boolean;
}

const LiveGamesTicker: React.FC<LiveGamesTickerProps> = ({ isLight = false }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allGames: Game[] = [];
      
      // Fetch from multiple sports
      const sportsToFetch = selectedSport === 'all' 
        ? SPORTS 
        : SPORTS.filter(s => s.key === selectedSport);
      
      await Promise.all(
        sportsToFetch.map(async (sport) => {
          try {
            const response = await fetch(
              `https://site.api.espn.com/apis/site/v2/sports/${sport.endpoint}/scoreboard`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.events) {
                allGames.push(...data.events.map((event: Game) => ({
                  ...event,
                  sportKey: sport.key,
                  sportName: sport.name,
                })));
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch ${sport.name} games:`, err);
          }
        })
      );
      
      // Sort by status (live first, then upcoming, then completed)
      allGames.sort((a, b) => {
        const stateOrder: Record<string, number> = { 'in': 0, 'pre': 1, 'post': 2 };
        const aState = a.status?.type?.state || 'pre';
        const bState = b.status?.type?.state || 'pre';
        return (stateOrder[aState] ?? 1) - (stateOrder[bState] ?? 1);
      });
      
      setGames(allGames);
    } catch (err) {
      setError('Failed to load games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [selectedSport]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'in':
        return 'text-emerald-500';
      case 'post':
        return isLight ? 'text-gray-400' : 'text-white/40';
      default:
        return isLight ? 'text-gray-500' : 'text-white/50';
    }
  };

  const getStatusText = (game: Game) => {
    const state = game.status?.type?.state;
    if (state === 'in') {
      return game.status?.type?.shortDetail || 'LIVE';
    }
    if (state === 'post') {
      return 'Final';
    }
    // Pre-game - show time
    const gameDate = new Date(game.date);
    return gameDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading && games.length === 0) {
    return (
      <div className={`rounded-xl p-4 ${isLight ? 'bg-gray-50 border border-gray-100' : 'bg-white/5 border border-white/5'}`}>
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className={`w-4 h-4 animate-spin ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Loading games...</span>
        </div>
      </div>
    );
  }

  if (error && games.length === 0) {
    return (
      <div className={`rounded-xl p-4 ${isLight ? 'bg-gray-50 border border-gray-100' : 'bg-white/5 border border-white/5'}`}>
        <p className={`text-sm text-center ${isLight ? 'text-gray-500' : 'text-white/50'}`}>{error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${isLight ? 'bg-gray-50 border border-gray-100' : 'bg-white/5 border border-white/5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h3 className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>Live Scores</h3>
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
              {games.filter(g => g.status?.type?.state === 'in').length} live
            </span>
          </div>
        </div>
        
        {/* Sport Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSport === 'all'
                ? 'bg-purple-600 text-white'
                : isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-white/50 hover:bg-white/5'
            }`}
          >
            All
          </button>
          {SPORTS.slice(0, 4).map((sport) => (
            <button
              key={sport.key}
              onClick={() => setSelectedSport(sport.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSport === sport.key
                  ? 'bg-purple-600 text-white'
                  : isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-white/50 hover:bg-white/5'
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {/* Games Ticker - Swipeable */}
      <div className="relative">
        {/* Scrollable Games */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3 touch-pan-x"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {games.length === 0 ? (
            <div className={`flex-shrink-0 w-full text-center py-4 ${isLight ? 'text-gray-500' : 'text-white/50'} text-sm`}>
              No games scheduled today
            </div>
          ) : (
            games.map((game) => {
              const homeTeam = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
              const awayTeam = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
              const isLive = game.status?.type?.state === 'in';
              const isCompleted = game.status?.type?.state === 'post';
              
              return (
                <div
                  key={game.id}
                  className={`flex-shrink-0 w-[180px] md:w-[200px] p-3 md:p-3 rounded-xl min-h-[100px] md:min-h-[90px] ${
                    isLive 
                      ? isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-500/10 border border-emerald-500/20'
                      : isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'
                  } transition-all hover:scale-[1.02]`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase ${getStatusColor(game.status?.type?.state || 'pre')}`}>
                      {isLive && <Circle className="w-1.5 h-1.5 fill-current inline mr-1 animate-pulse" />}
                      {getStatusText(game)}
                    </span>
                    <span className={`text-[10px] font-medium ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                      {(game as any).sportName}
                    </span>
                  </div>
                  
                  {/* Teams */}
                  <div className="space-y-1.5">
                    {/* Away Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {awayTeam?.team?.logo && (
                          <img 
                            src={awayTeam.team.logo} 
                            alt={awayTeam.team.abbreviation}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          isCompleted && awayTeam?.winner 
                            ? isLight ? 'text-gray-900 font-bold' : 'text-white font-bold'
                            : isLight ? 'text-gray-700' : 'text-white/80'
                        }`}>
                          {awayTeam?.team?.abbreviation || 'TBD'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${
                        isCompleted && awayTeam?.winner
                          ? isLight ? 'text-gray-900' : 'text-white'
                          : isLight ? 'text-gray-600' : 'text-white/60'
                      }`}>
                        {awayTeam?.score || '-'}
                      </span>
                    </div>
                    
                    {/* Home Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {homeTeam?.team?.logo && (
                          <img 
                            src={homeTeam.team.logo} 
                            alt={homeTeam.team.abbreviation}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          isCompleted && homeTeam?.winner 
                            ? isLight ? 'text-gray-900 font-bold' : 'text-white font-bold'
                            : isLight ? 'text-gray-700' : 'text-white/80'
                        }`}>
                          {homeTeam?.team?.abbreviation || 'TBD'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${
                        isCompleted && homeTeam?.winner
                          ? isLight ? 'text-gray-900' : 'text-white'
                          : isLight ? 'text-gray-600' : 'text-white/60'
                      }`}>
                        {homeTeam?.score || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveGamesTicker;
