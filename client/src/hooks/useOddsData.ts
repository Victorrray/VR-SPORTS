import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';

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

  const [picks, setPicks] = useState<OddsPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOddsData = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (sport && sport !== 'all') params.append('sport', sport);
      if (date && date !== 'all') params.append('date', date);
      if (marketType && marketType !== 'all') params.append('marketType', marketType);
      if (betType && betType !== 'all') params.append('betType', betType);
      if (sportsbooks && sportsbooks.length > 0) {
        params.append('sportsbooks', sportsbooks.join(','));
      }
      if (limit) params.append('limit', limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/odds${queryString ? `?${queryString}` : ''}`;

      console.log('📊 Fetching odds data from:', endpoint);

      const response = await apiClient.get(endpoint);

      if (response.data && Array.isArray(response.data)) {
        setPicks(response.data);
        console.log('✅ Odds data fetched successfully:', response.data.length, 'picks');
      } else if (response.data && response.data.picks && Array.isArray(response.data.picks)) {
        setPicks(response.data.picks);
        console.log('✅ Odds data fetched successfully:', response.data.picks.length, 'picks');
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
  }, [sport, date, marketType, betType, sportsbooks.join(','), limit, enabled]);

  return {
    picks,
    loading,
    error,
    refetch: fetchOddsData,
  };
}
