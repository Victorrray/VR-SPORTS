// src/hooks/useMarkets.js
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce, APICache, throttle } from '../utils/performance';
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

// Cache for storing previous results to prevent unnecessary re-renders
const marketCache = new Map();

export const useMarkets = (sports = [], regions = [], markets = []) => {
  const [games, setGames] = useState([]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  
  const { quotaExceeded, quotaError, handleApiResponse } = useQuotaHandler();
  
  // Memoize the params to prevent unnecessary effect triggers
  const paramsKey = useMemo(() => (
    `${sports.sort().join(',')}-${regions.sort().join(',')}-${markets.sort().join(',')}`
  ), [sports, regions, markets]);
  
  // Store the last successful fetch time
  const lastFetchTime = useRef(0);
  // Track if we have an active request
  const activeRequest = useRef(null);

  // Debounced fetch function to prevent rapid successive calls
  const fetchMarkets = useMemoizedCallback(debounce(async () => {
    const now = Date.now();
    
    // Skip if we have a recent successful fetch
    if (now - lastFetchTime.current < 5000 && activeRequest.current) {
      console.log('🔍 useMarkets: Skipping fetch - too soon after last successful fetch');
      return activeRequest.current;
    }
    
    console.log('🔍 useMarkets: fetchMarkets called with:', { sports, regions, markets });
    
    if (!sports.length || !regions.length || !markets.length) {
      console.log('🔍 useMarkets: Skipping fetch - missing required params');
      return;
    }
    
    // Check cache first
    const cacheKey = `markets-${paramsKey}`;
    const cachedData = APICache.get(cacheKey);
    
    // Only update from cache if we don't have any data yet
    if (cachedData && games.length === 0) {
      console.log('🔍 useMarkets: Using cached data, length:', cachedData.length);
      setGames(cachedData);
      return;
    }
    
    // Only show loading if we don't have cached data
    if (!cachedData) {
      console.log('🔍 useMarkets: Setting loading to true');
      setIsLoading(true);
    }
    setError(null);
    
    // Store the current request to prevent race conditions
    const requestId = Symbol('requestId');
    activeRequest.current = requestId;

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
        dateFormat: 'iso',
        _t: Date.now() // Cache buster
      });

      // Use the configured API base URL with fallback to production URL
      const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://vr-sports.onrender.com';
      // Use the correct endpoint for fetching odds
      const fullUrl = `${BASE_URL.replace(/\/$/, '')}/api/odds?${params}`;
      console.log('🔍 useMarkets: Final API URL:', fullUrl);
      
      // Include proper headers for authentication
      const response = await secureFetch(fullUrl, {
        credentials: 'include',
        headers: {
          'x-user-id': 'demo-user', // Will be replaced with actual user ID in production
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      console.log('🔍 useMarkets: Response received:', response.status, response.statusText);
      
      // Check if response is valid JSON
      let data;
      try {
        data = await response.clone().json();
      } catch (e) {
        const text = await response.text();
        console.error('🔴 useMarkets: Failed to parse JSON response:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
      }
      
      // Handle quota exceeded before other errors
      const quotaResult = await handleApiResponse(response);
      if (quotaResult.quotaExceeded) {
        console.log('🔍 useMarkets: Quota exceeded, stopping further requests');
        setError('Quota exceeded - upgrade to continue');
        return;
      }
      
      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        let errorDetails = '';
        
        try {
          const errorBody = await response.text();
          console.error('🔴 useMarkets: API error response:', errorBody);
          errorMessage = errorBody || errorMessage;
          errorDetails = errorBody;
        } catch (e) {
          console.error('🔴 useMarkets: Failed to read error response');
        }
        
        console.error('🔍 API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          error: errorDetails
        });
        
        setError(errorMessage);
        setGames([]);
        
        // For development, provide fallback data instead of infinite loading
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔍 useMarkets: Using fallback data in development mode');
          return;
        }
        
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
      }
      
      console.log('🔍 useMarkets: Response data:', data);
      
      if (!data || !Array.isArray(data)) {
        console.error('🔴 useMarkets: Invalid response format - expected array, got:', data);
        setError('Invalid response format from server');
        setGames([]);
        return;
      }
      
      // Normalize the data structure
      const normalizedData = data.map(game => ({
        ...game,
        // Ensure bookmakers is always an array
        bookmakers: Array.isArray(game.bookmakers) ? game.bookmakers : [],
        // Ensure scores is an object with home/away
        scores: game.scores || { home: null, away: null },
        // Add default values for required fields
        commence_time: game.commence_time || new Date().toISOString(),
        home_team: game.home_team || 'Home Team',
        away_team: game.away_team || 'Away Team',
        sport_key: game.sport_key || 'sports',
        sport_title: game.sport_title || 'Sport'
      }));
      
      console.log('🔍 useMarkets: Normalized data:', normalizedData);
      
      // Update state with normalized data
      setGames(normalizedData);
      
      // Update cache
      APICache.set(cacheKey, normalizedData, 2 * 60 * 1000); // 2 minutes cache for odds data
      setCacheStats(APICache.getStats());
      
      // Extract unique bookmakers with their display names
      const bookmakerMap = new Map();
      normalizedData.forEach(game => {
        game.bookmakers.forEach(bookmaker => {
          if (bookmaker && bookmaker.key) {
            bookmakerMap.set(bookmaker.key, bookmaker.title || bookmaker.key);
          }
        });
      });
      
      // Convert to array of {key, title} objects
      const uniqueBooks = Array.from(bookmakerMap.entries()).map(([key, title]) => ({
        key,
        title
      }));
      
      console.log('🔍 useMarkets: Extracted bookmakers:', uniqueBooks);
      setBooks(uniqueBooks);
      setLastUpdate(new Date());
      
      // Update last fetch time
      lastFetchTime.current = Date.now();
      
    } catch (err) {
      console.error('🔍 useMarkets: Fetch error:', err);
      console.error('🔍 useMarkets: Error stack:', err.stack);
      setError(err.message);
      // Set empty games to prevent infinite loading
      setGames([]);
      
      // For development, provide fallback data instead of infinite loading
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔍 useMarkets: Using fallback data in development mode');
        return;
      }
      
      if (err.response) {
        throw new Error(`API request failed: ${err.response.status} - ${err.response.statusText}`);
      } else {
        throw new Error(`API request failed: ${err.message}`);
      }
    } finally {
      console.log('🔍 useMarkets: Setting loading to false');
      setIsLoading(false);
      activeRequest.current = null;
    }
  }, [sports, regions, markets, paramsKey, games.length, handleApiResponse]));

// Throttled refresh function
const refreshMarkets = useMemo(() => throttle(() => {
  if (!isLoading) {
    fetchMarkets();
  }
}, 5000), [fetchMarkets, isLoading]);

// Set up auto-refresh and initial fetch
useEffect(() => {
  // Initial fetch
  fetchMarkets();
  
  // Set up refresh interval
  const refreshInterval = setInterval(refreshMarkets, 30000); // Refresh every 30 seconds
  
  // Clean up
  return () => {
    clearInterval(refreshInterval);
    activeRequest.current = null;
  };
}, [fetchMarkets, refreshMarkets]);

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

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    games,
    books,
    loading: isLoading,
    error: quotaExceeded ? quotaError : error,
    lastUpdate,
    cacheStats,
    quota,
    quotaExceeded,
    quotaError,
    refresh: refreshMarkets,
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
    refreshMarkets
  ]);
};
