// client/src/hooks/useCachedOdds.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to fetch cached odds from Supabase instead of directly from The Odds API
 * This significantly reduces API costs and improves loading speeds
 */
export function useCachedOdds(sport = 'nfl', options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const {
    markets = null,
    bookmakers = null,
    eventId = null,
    enabled = true,
    pollInterval = 30000, // Poll every 30 seconds by default
  } = options;

  const fetchCachedOdds = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (markets && markets.length > 0) {
        params.append('markets', markets.join(','));
      }
      if (bookmakers && bookmakers.length > 0) {
        params.append('bookmakers', bookmakers.join(','));
      }
      if (eventId) {
        params.append('eventId', eventId);
      }

      const queryString = params.toString();
      const url = `/api/cached-odds/${sport}${queryString ? `?${queryString}` : ''}`;

      // Use simple fetch for cached data (no auth needed, public data)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit', // Don't send cookies to avoid 431 error
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cached odds: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching cached odds:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sport, markets, bookmakers, eventId, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchCachedOdds();
  }, [fetchCachedOdds]);

  // Set up polling
  useEffect(() => {
    if (!enabled || !pollInterval) return;

    const intervalId = setInterval(() => {
      fetchCachedOdds();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [fetchCachedOdds, pollInterval, enabled]);

  const refetch = useCallback(() => {
    fetchCachedOdds();
  }, [fetchCachedOdds]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch,
  };
}

/**
 * Hook to get update statistics for cached odds
 */
export function useCachedOddsStats(sport = 'americanfootball_nfl', limit = 10) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/cached-odds/stats?sport=${sport}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'omit', // Don't send cookies
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        const result = await response.json();
        setStats(result.stats || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sport, limit]);

  return { stats, loading, error };
}

/**
 * Helper function to manually trigger odds update (admin only)
 */
export async function triggerOddsUpdate(sport = 'nfl', adminKey) {
  try {
    const response = await fetch(`/api/cached-odds/${sport}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error triggering update:', err);
    throw err;
  }
}

/**
 * Helper function to control caching service (admin only)
 */
export async function controlCachingService(sport = 'nfl', action = 'start', adminKey) {
  try {
    const response = await fetch(`/api/cached-odds/${sport}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ action }),
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Control failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error controlling service:', err);
    throw err;
  }
}
