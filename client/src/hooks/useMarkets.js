// src/hooks/useMarkets.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { secureFetch, apiRateLimiter } from '../utils/security';
import { useCachedFetch, useRealtimeCachedFetch } from './useCachedFetch';

// Small utility to normalize arrays from API responses
function normalizeArray(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && typeof resp === "object") return Object.values(resp);
  return [];
}

export const useMarkets = (sports = [], regions = [], markets = []) => {
  const [games, setGames] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });

  const marketsParam = useMemo(() => {
    const CANON = { alternate_spreads: 'spreads_alternate', alternate_totals: 'totals_alternate' };
    const set = new Set();
    (markets || []).forEach(k => set.add(CANON[k] || k));
    return Array.from(set).join(",");
  }, [markets]);

  const {
    data: cachedGames,
    loading: cacheLoading,
    error: cacheError,
    refresh: refreshCache,
    isPolling,
    startPolling,
    stopPolling
  } = useRealtimeCachedFetch('/api/odds', {
    enabled: sports.length > 0 && regions.length > 0 && markets.length > 0,
    params: {
      sports: sports.join(','),
      regions: regions.join(','),
      markets: markets.join(',')
    },
    pollingInterval: 600000, // 10 minutes - reduced API calls to save costs
    enablePolling: false, // Disabled auto-polling to stop refresh glitch
    pauseOnHidden: true,
    transform: (data) => data || [],
    onSuccess: (data) => {
      setLastUpdate(new Date());
      // Update cache stats
      import('../utils/cacheManager').then(({ oddsCacheManager }) => {
        setCacheStats(oddsCacheManager.getStats());
      });
    },
    onError: (err) => {
      console.error('Markets fetch error:', err);
    }
  });

  // Sync cached data with local state and extract books
  useEffect(() => {
    if (cachedGames) {
      setGames(cachedGames);
      
      // Extract unique books from games data
      const bookSet = new Set();
      cachedGames.forEach(game => {
        if (game.bookmakers && Array.isArray(game.bookmakers)) {
          game.bookmakers.forEach(book => {
            if (book.key && book.title) {
              bookSet.add(JSON.stringify({ key: book.key, title: book.title }));
            }
          });
        }
      });
      
      const uniqueBooks = Array.from(bookSet).map(bookStr => JSON.parse(bookStr));
      setBooks(uniqueBooks);
    }
  }, [cachedGames]);

  useEffect(() => {
    setLoading(cacheLoading);
  }, [cacheLoading]);

  useEffect(() => {
    setError(cacheError?.message || null);
  }, [cacheError]);

  // Legacy fetch function for backward compatibility
  const fetchMarkets = useCallback(async (silent = false) => {
    return refreshCache();
  }, [refreshCache]);

  return {
    games,
    books,
    loading,
    error,
    lastUpdate,
    refresh: fetchMarkets,
    cacheStats,
    isPolling,
    startPolling,
    stopPolling,
    refreshCache
  };
}
