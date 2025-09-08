// src/hooks/useMarkets.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { debounce, APICache } from '../utils/performance';
import { useMemoizedCallback } from './useMemoizedCallback';
import { secureFetch, apiRateLimiter } from '../utils/security';
import { useCachedFetch, useRealtimeCachedFetch } from './useCachedFetch';
import { useQuotaHandler } from './useQuotaHandler';

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
  
  const { quotaExceeded, quotaError, handleApiResponse } = useQuotaHandler();

  const fetchMarkets = useMemoizedCallback(async () => {
    console.log('🔍 useMarkets: fetchMarkets called with:', { sports, regions, markets });
    
    if (!sports.length || !regions.length || !markets.length) {
      console.log('🔍 useMarkets: Skipping fetch - missing required params:', { sports, regions, markets });
      return;
    }

    // Check cache first
    const cacheKey = `markets-${sports.join(',')}-${regions.join(',')}-${markets.join(',')}`;
    const cachedData = APICache.get(cacheKey);
    if (cachedData) {
      console.log('🔍 useMarkets: Using cached data, length:', cachedData.length);
      setGames(cachedData);
      return;
    }

    console.log('🔍 useMarkets: Setting loading to true');
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 useMarkets: Starting fetch with params:', { sports, regions, markets });
      
      // Process markets parameter properly
      const marketsParam = Array.isArray(markets) ? markets.join(',') : markets;
      console.log('🔍 useMarkets: Processed marketsParam:', marketsParam);
      
      const params = new URLSearchParams({
        sports: sports.join(','),
        regions: regions.join(','),
        markets: marketsParam,
        oddsFormat: 'american',
        dateFormat: 'iso'
      });

      const BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:10000');
      const fullUrl = `${BASE_URL}/api/odds?${params}`;
      console.log('🔍 useMarkets: Final API URL:', fullUrl);
      console.log('🔍 useMarkets: BASE_URL from env:', process.env.REACT_APP_API_URL);
      console.log('🔍 useMarkets: NODE_ENV:', process.env.NODE_ENV);
      
      const response = await secureFetch(fullUrl);
      console.log('🔍 useMarkets: Response received:', response.status, response.statusText);
      
      // Handle quota exceeded before other errors
      const quotaResult = await handleApiResponse(response);
      if (quotaResult.quotaExceeded) {
        console.log('🔍 useMarkets: Quota exceeded, stopping further requests');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 useMarkets: Raw API response type:', typeof data);
      console.log('🔍 useMarkets: Raw API response length:', Array.isArray(data) ? data.length : 'not array');
      console.log('🔍 useMarkets: Raw API response sample:', data);
      
      const normalizedGames = normalizeArray(data);
      console.log('🔍 useMarkets: Normalized games length:', normalizedGames.length);
      console.log('🔍 useMarkets: First normalized game:', normalizedGames[0]);
      
      // Cache the result
      APICache.set(cacheKey, normalizedGames);
      
      console.log('🔍 useMarkets: Setting games state with', normalizedGames.length, 'games');
      setGames(normalizedGames);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('🔍 useMarkets: Fetch error:', err);
      console.error('🔍 useMarkets: Error stack:', err.stack);
      setError(err.message);
    } finally {
      console.log('🔍 useMarkets: Setting loading to false');
      setLoading(false);
    }
  }, [sports, regions, markets]);

  useEffect(() => {
    if (games) {
      // Extract unique books from games data
      const bookSet = new Set();
      games.forEach(game => {
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
  }, [games]);

  // Stable reference to prevent jitter
  const stableFetch = useRef(null);
  
  useEffect(() => {
    // Only create new debounced function if params actually changed
    const paramsKey = `${sports.join(',')}-${regions.join(',')}-${markets.join(',')}`;
    
    if (!stableFetch.current || stableFetch.current.paramsKey !== paramsKey) {
      if (stableFetch.current?.cancel) {
        stableFetch.current.cancel();
      }
      
      const debouncedFn = debounce(fetchMarkets, 500);
      debouncedFn.paramsKey = paramsKey;
      stableFetch.current = debouncedFn;
    }
    
    stableFetch.current();
  }, [sports, regions, markets, fetchMarkets]);

  return {
    games,
    books,
    loading,
    error,
    lastUpdate,
    refresh: fetchMarkets,
    quotaExceeded,
    quotaError
  };
}
