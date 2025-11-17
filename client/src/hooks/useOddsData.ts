import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { useAuth } from './SimpleAuth';

export interface OddsBook {
  name: string;
  odds: string;
  team2Odds: string;
  ev: string;
  isBest: boolean;
}

export interface OddsPick {
  id: number;
  ev: string;
  sport: string;
  game: string;
  team1: string;
  team2: string;
  pick: string;
  bestOdds: string;
  bestBook: string;
  avgOdds: string;
  isHot: boolean;
  books: OddsBook[];
}

export interface UseOddsDataOptions {
  sport?: string;
  date?: string;
  marketType?: string;
  betType?: string;
  sportsbooks?: string[];
  limit?: number;
  enabled?: boolean;
}

export interface UseOddsDataResult {
  picks: OddsPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Transform TheOddsAPI format to OddsPick format
function transformOddsApiToOddsPick(games: any[]): OddsPick[] {
  if (!Array.isArray(games)) return [];
  
  return games.map((game, idx) => {
    const team1 = game.away_team || 'Team A';
    const team2 = game.home_team || 'Team B';
    const bookmakers = game.bookmakers || [];
    
    // Get best odds from first bookmaker's first market
    let bestOdds = '-110';
    let bestBook = 'N/A';
    let ev = '0%';
    
    if (bookmakers.length > 0 && bookmakers[0].markets && bookmakers[0].markets.length > 0) {
      const firstMarket = bookmakers[0].markets[0];
      if (firstMarket.outcomes && firstMarket.outcomes.length > 0) {
        bestOdds = String(firstMarket.outcomes[0].odds);
        bestBook = bookmakers[0].title || bookmakers[0].key;
      }
    }
    
    return {
      id: idx + 1,
      ev: ev,
      sport: game.sport_title || 'Unknown',
      game: `${team1} @ ${team2}`,
      team1,
      team2,
      pick: `${team1} ML`,
      bestOdds,
      bestBook,
      avgOdds: bestOdds,
      isHot: false,
      books: bookmakers.map(bm => ({
        name: bm.title || bm.key,
        odds: bm.markets?.[0]?.outcomes?.[0]?.odds ? String(bm.markets[0].outcomes[0].odds) : '-110',
        team2Odds: bm.markets?.[0]?.outcomes?.[1]?.odds ? String(bm.markets[0].outcomes[1].odds) : '-110',
        ev: '0%',
        isBest: bm === bookmakers[0]
      }))
    };
  });
}

export function useOddsData(options: UseOddsDataOptions = {}): UseOddsDataResult {
  const {
    sport = 'all',
    date = 'today',
    marketType = 'all',
    betType = 'straight',
    sportsbooks = [],
    limit = 50,
    enabled = true,
  } = options;

  const { user, authLoading } = useAuth();
  const [picks, setPicks] = useState<OddsPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOddsData = async () => {
    if (!enabled || !user || authLoading) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters - match backend API expectations
      const params = new URLSearchParams();
      
      // Map frontend filters to backend parameter names
      // Default sports if not specified
      const sportsList = sport && sport !== 'all' 
        ? sport 
        : 'americanfootball_nfl,basketball_nba,baseball_mlb,icehockey_nhl';
      params.append('sports', sportsList);
      
      // Backend expects 'markets' not 'marketType'
      const marketsList = marketType && marketType !== 'all'
        ? marketType
        : 'h2h,spreads,totals';
      params.append('markets', marketsList);
      
      // Add other parameters the backend expects
      params.append('regions', 'us');
      params.append('oddsFormat', 'american');
      
      // Optional: date, betType, sportsbooks (if backend supports them)
      if (date && date !== 'all') params.append('date', date);
      if (betType && betType !== 'all') params.append('betType', betType);
      if (sportsbooks && sportsbooks.length > 0) {
        params.append('sportsbooks', sportsbooks.join(','));
      }
      if (limit) params.append('limit', limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/odds${queryString ? `?${queryString}` : ''}`;

      console.log('📊 Fetching odds data from:', endpoint);

      const response = await apiClient.get(endpoint);
      
      console.log('📦 API Response:', response.data);
      console.log('📦 Response type:', typeof response.data);
      console.log('📦 Is array?:', Array.isArray(response.data));
      if (response.data && typeof response.data === 'object') {
        console.log('📦 Response keys:', Object.keys(response.data));
      }

      if (response.data && Array.isArray(response.data)) {
        const transformedPicks = transformOddsApiToOddsPick(response.data);
        setPicks(transformedPicks);
        console.log('✅ Odds data fetched and transformed successfully:', transformedPicks.length, 'picks');
      } else if (response.data && response.data.picks && Array.isArray(response.data.picks)) {
        const transformedPicks = transformOddsApiToOddsPick(response.data.picks);
        setPicks(transformedPicks);
        console.log('✅ Odds data fetched and transformed successfully:', transformedPicks.length, 'picks');
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        setError('Invalid response format from API');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch odds data';
      console.error('❌ Error fetching odds data:', errorMessage);
      setError(errorMessage);
      setPicks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOddsData();
  }, [sport, date, marketType, betType, sportsbooks.join(','), limit, enabled, user, authLoading]);

  return {
    picks,
    loading,
    error,
    refetch: fetchOddsData,
  };
}
