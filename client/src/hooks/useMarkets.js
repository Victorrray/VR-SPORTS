// src/hooks/useMarkets.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { debounce, APICache } from '../utils/performance';
import { useMemoizedCallback } from './useMemoizedCallback';
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

  const fetchMarkets = useMemoizedCallback(async () => {
    if (!sports.length || !regions.length || !markets.length) {
      console.log('🔍 useMarkets: Skipping fetch - missing required params:', { sports, regions, markets });
      return;
    }

    // Check cache first
    const cacheKey = `markets-${sports.join(',')}-${regions.join(',')}-${markets.join(',')}`;
    const cachedData = APICache.get(cacheKey);
    if (cachedData) {
      console.log('🔍 useMarkets: Using cached data');
      setGames(cachedData);
      return;
    }

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
      
      const response = await secureFetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 useMarkets: Raw API response:', data);
      
      const normalizedGames = normalizeArray(data);
      console.log('🔍 useMarkets: Normalized games:', normalizedGames);
      
      // Cache the result
      APICache.set(cacheKey, normalizedGames);
      
      setGames(normalizedGames);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('🔍 useMarkets: Fetch error:', err);
      setError(err.message);
    } finally {
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

  // Debounced fetch to prevent excessive API calls
  const debouncedFetch = useMemo(
    () => debounce(fetchMarkets, 500),
    [fetchMarkets]
  );

  useEffect(() => {
    debouncedFetch();
  }, [sports, regions, markets, debouncedFetch]);

  return {
    games,
    books,
    loading,
    error,
    lastUpdate,
    refresh: fetchMarkets
  };
}
