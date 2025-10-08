// src/hooks/useMarketsWithCache.js
// Enhanced version of useMarkets that uses Supabase caching for NFL
import { useState, useEffect, useMemo } from 'react';
import { useMarkets } from './useMarkets';
import { useCachedOdds } from './useCachedOdds';

/**
 * Enhanced markets hook that intelligently uses cached data for NFL
 * and falls back to direct API calls for other sports
 */
export const useMarketsWithCache = (sports = [], regions = [], markets = [], options = {}) => {
  const { enabled = true, date = null } = options;
  
  // Determine if we should use cached data
  const isNFLOnly = useMemo(() => {
    return sports.length === 1 && sports[0] === 'americanfootball_nfl';
  }, [sports]);

  const shouldUseCache = isNFLOnly && enabled;

  // Use cached odds for NFL
  const {
    data: cachedData,
    loading: cacheLoading,
    error: cacheError,
    lastUpdate: cacheLastUpdate,
    refetch: refetchCache
  } = useCachedOdds('nfl', {
    markets: markets,
    bookmakers: null, // Get all bookmakers from cache
    enabled: shouldUseCache,
    pollInterval: 30000, // Poll every 30 seconds
  });

  // Use direct API for non-NFL sports or as fallback
  const {
    games: apiGames,
    books: apiBooks,
    loading: apiLoading,
    error: apiError,
    lastUpdate: apiLastUpdate,
    cacheStats,
    quota,
    quotaExceeded,
    quotaError,
    refresh: apiRefresh,
  } = useMarkets(sports, regions, markets, {
    ...options,
    enabled: enabled && !shouldUseCache, // Disable if using cache
  });

  // State for final data
  const [games, setGames] = useState([]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Process cached data when available
  useEffect(() => {
    if (shouldUseCache) {
      setIsLoading(cacheLoading);
      setError(cacheError);
      setLastUpdate(cacheLastUpdate);

      if (cachedData && Array.isArray(cachedData)) {
        console.log('📦 Using cached NFL data:', cachedData.length, 'games');
        
        // Filter by date if provided
        let filteredData = cachedData;
        if (date && date.trim()) {
          const targetDate = new Date(date);
          filteredData = cachedData.filter(game => {
            const gameDate = new Date(game.commence_time);
            return gameDate.toDateString() === targetDate.toDateString();
          });
          console.log(`📅 Filtered to ${filteredData.length} games for date: ${date}`);
        }

        setGames(filteredData);

        // Extract unique bookmakers
        const bookmakerMap = new Map();
        filteredData.forEach(game => {
          if (game.bookmakers && Array.isArray(game.bookmakers)) {
            game.bookmakers.forEach(bookmaker => {
              if (bookmaker && bookmaker.key) {
                bookmakerMap.set(bookmaker.key, bookmaker.title || bookmaker.key);
              }
            });
          }
        });

        const uniqueBooks = Array.from(bookmakerMap.entries()).map(([key, title]) => ({
          key,
          title
        }));

        setBooks(uniqueBooks);
      } else if (!cacheLoading && !cacheError) {
        // No cached data available
        setGames([]);
        setBooks([]);
      }
    }
  }, [shouldUseCache, cachedData, cacheLoading, cacheError, cacheLastUpdate, date]);

  // Use API data when not using cache
  useEffect(() => {
    if (!shouldUseCache) {
      console.log('🔄 Using direct API data for:', sports.join(', '));
      setGames(apiGames);
      setBooks(apiBooks);
      setIsLoading(apiLoading);
      setError(apiError);
      setLastUpdate(apiLastUpdate);
    }
  }, [shouldUseCache, apiGames, apiBooks, apiLoading, apiError, apiLastUpdate, sports]);

  // Refresh function that works for both cache and API
  const refresh = useMemo(() => {
    return shouldUseCache ? refetchCache : apiRefresh;
  }, [shouldUseCache, refetchCache, apiRefresh]);

  // Return unified interface
  return useMemo(() => ({
    games,
    books,
    loading: isLoading,
    error,
    lastUpdate,
    cacheStats,
    quota,
    quotaExceeded,
    quotaError,
    refresh,
    usingCache: shouldUseCache, // Expose whether we're using cache
  }), [
    games,
    books,
    isLoading,
    error,
    lastUpdate,
    cacheStats,
    quota,
    quotaExceeded,
    quotaError,
    refresh,
    shouldUseCache,
  ]);
};
