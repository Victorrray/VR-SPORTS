// src/hooks/useMarkets.js
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce, APICache, throttle } from '../utils/performance';
import { useMemoizedCallback } from './useMemoizedCallback';
import { withApiBase } from '../config/api';
import { useQuotaHandler } from './useQuotaHandler';
import { secureFetch } from '../utils/security';
import { cacheManager } from '../utils/cacheManager';

// Global event emitter for API usage updates
export const apiUsageEvents = new EventTarget();

const SCOREBOARD_CACHE = new Map();
const SCOREBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const normalizeTeamKey = (name = '') => {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();
};

async function getScoreboardLogosForSport(sportKey) {
  if (!sportKey) return new Map();
  const cached = SCOREBOARD_CACHE.get(sportKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < SCOREBOARD_CACHE_TTL) {
    return cached.map;
  }

  try {
    const response = await secureFetch(
      withApiBase(`/api/scores?sport=${encodeURIComponent(sportKey)}`),
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error(`Scoreboard fetch failed (${response.status})`);
    }

    const data = await response.json();
    const teamLogoMap = new Map();

    if (Array.isArray(data)) {
      data.forEach((game) => {
        if (game?.home_team) {
          teamLogoMap.set(normalizeTeamKey(game.home_team), game.home_logo || '');
        }
        if (game?.away_team) {
          teamLogoMap.set(normalizeTeamKey(game.away_team), game.away_logo || '');
        }
      });
    }

    SCOREBOARD_CACHE.set(sportKey, { timestamp: now, map: teamLogoMap });
    return teamLogoMap;
  } catch (error) {
    console.warn('useMarkets: Unable to fetch scoreboard logos for', sportKey, error.message || error);
    SCOREBOARD_CACHE.set(sportKey, { timestamp: now, map: new Map() });
    return new Map();
  }
}

async function enrichGamesWithScoreboardData(games = []) {
  if (!Array.isArray(games) || games.length === 0) return games;

  const uniqueSports = Array.from(
    new Set(
      games
        .map((game) => game?.sport_key)
        .filter(Boolean)
    )
  );

  const logoMapsEntries = await Promise.all(
    uniqueSports.map(async (sportKey) => {
      const map = await getScoreboardLogosForSport(sportKey);
      return [sportKey, map];
    })
  );

  const sportLogoMaps = new Map(logoMapsEntries);

  return games.map((game) => {
    const sportMap = sportLogoMaps.get(game?.sport_key) || new Map();
    const homeLogo = sportMap.get(normalizeTeamKey(game?.home_team)) || game?.home_logo || '';
    const awayLogo = sportMap.get(normalizeTeamKey(game?.away_team)) || game?.away_logo || '';

    return {
      ...game,
      home_logo: homeLogo,
      away_logo: awayLogo,
    };
  });
}

// Small utility to normalize arrays from API responses
function normalizeArray(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && typeof resp === "object") return Object.values(resp);
  return [];
}

// Cache for storing previous results to prevent unnecessary re-renders
const marketCache = new Map();

export const useMarkets = (sports = [], regions = [], markets = [], options = {}) => {
  const { enabled = true } = options;
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
  // Track retry attempts
  const retryCount = useRef(0);
  const stableFetch = useRef(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds between retries

  // Debounced fetch function with enhanced error handling and retry logic
  const fetchMarkets = useMemoizedCallback(debounce(async (isRetry = false) => {
    if (!enabled) {
      console.log('🔍 useMarkets: Skipping fetch - hook disabled');
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    
    // Skip if we have a recent successful fetch (unless it's a retry)
    if (!isRetry && now - lastFetchTime.current < 5000 && activeRequest.current) {
      console.log('🔍 useMarkets: Skipping fetch - too soon after last successful fetch');
      return activeRequest.current;
    }
    
    console.log('🔍 useMarkets: fetchMarkets called with:', { sports, regions, markets });
    
    if (!sports?.length || !regions?.length || !markets?.length) {
      console.log('🔍 useMarkets: Skipping fetch - missing required params');
      setError('Please select sports, regions, and markets to view odds');
      setIsLoading(false);
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
      console.log(`🔍 useMarkets: Starting ${isRetry ? `retry ${retryCount.current}/` : ''}fetch with params:`, { sports, regions, markets });
      
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

      // Build path with centralized API base handling
      const fullUrl = withApiBase(`/api/odds?${params.toString()}`);
      console.log('🔍 useMarkets: Final API URL:', fullUrl);
      
      // Enhanced fetch with better error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let response;
      let data;
      try {
        response = await secureFetch(fullUrl, {
          signal: controller.signal,
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store',
          mode: 'cors',
          redirect: 'follow'
        });
        
        clearTimeout(timeoutId);
        
        console.log('🔍 useMarkets: Response received:', response.status, response.statusText);
        
        // Handle quota exceeded before other errors
        const quotaResult = await handleApiResponse(response);
        if (quotaResult.quotaExceeded) {
          console.log('🔍 useMarkets: Quota exceeded, stopping further requests');
          setError('Quota exceeded - upgrade to continue');
          setGames([]);
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔴 useMarkets: API error response:', errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText.substring(0, 200)}`);
        }
        
        // Check if response is valid JSON
        data = await response.json();
        
        // Emit API usage event to trigger usage counter refresh
        apiUsageEvents.dispatchEvent(new CustomEvent('apiCallMade'));
      
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        // If we have a response, try to extract error details
        if (error.response) {
          try {
            const errorBody = await error.response.text();
            console.error('🔴 useMarkets: API error response:', errorBody);
            error.message = errorBody || error.message;
            
            console.error('🔍 API Error:', {
              status: error.response.status,
              statusText: error.response.statusText,
              url: error.response.url,
              error: errorBody
            });
            
            // Handle errors with retry logic
            if ((error.response.status >= 500 || error.response.status === 0) && retryCount.current < MAX_RETRIES) {
              retryCount.current += 1;
              const retryAfter = error.response.headers.get('Retry-After') || RETRY_DELAY;
              const delay = typeof retryAfter === 'string' ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY;
              
              console.log(`🔄 useMarkets: Retrying (${retryCount.current}/${MAX_RETRIES}) in ${delay/1000} seconds...`);
              
              // Clear the current request
              activeRequest.current = null;
              
              // Show user feedback about the retry
              setError(`Temporarily unavailable. Retrying in ${delay/1000} seconds... (${retryCount.current}/${MAX_RETRIES})`);
              
              // Schedule a retry with exponential backoff
              return new Promise(resolve => {
                setTimeout(() => {
                  fetchMarkets(true).then(resolve);
                }, delay * Math.pow(2, retryCount.current - 1)); // Exponential backoff
              });
            }
          } catch (e) {
            console.error('🔴 useMarkets: Failed to read error response');
          }
        }
        
        // Reset retry counter on non-retryable errors or max retries reached
        retryCount.current = 0;
        
        // Provide more user-friendly error messages
        let userFriendlyError = 'Failed to load data. Please try again later.';
        
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            userFriendlyError = 'Authentication required. Please log in again.';
          } else if (error.response.status === 429) {
            userFriendlyError = 'Too many requests. Please wait before trying again.';
          } else if (error.response.status >= 500) {
            userFriendlyError = 'Server error. Our team has been notified.';
          }
          
          // In development, log the full error but still show something to the user
          if (process.env.NODE_ENV === 'development') {
            console.warn('🔍 useMarkets: Request failed with status', error.response.status, error.message);
          }
        }
        
        setError(userFriendlyError);
        setGames([]);
        
        // Re-throw the error to be caught by the error boundary
        throw error;
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
        sport_title: game.sport_title || 'Sport',
        home_logo: game.home_logo || '',
        away_logo: game.away_logo || ''
      }));
      
      console.log('🔍 useMarkets: Normalized data:', normalizedData);
      
      let preparedData = normalizedData;
      try {
        preparedData = await enrichGamesWithScoreboardData(normalizedData);
      } catch (logoErr) {
        console.warn('useMarkets: Failed to enrich games with logos', logoErr);
      }
      
      // Update state with normalized data
      setGames(preparedData);
      
      // Update cache
      APICache.set(cacheKey, preparedData, 2 * 60 * 1000); // 2 minutes cache for odds data
      try {
        setCacheStats(cacheManager.getStats());
      } catch (_) {
        // stats optional
      }
      
      // Extract unique bookmakers with their display names
      const bookmakerMap = new Map();
      preparedData.forEach(game => {
        game.bookmakers.forEach(bookmaker => {
          if (bookmaker && bookmaker.key) {
            bookmakerMap.set(bookmaker.key, bookmaker.title || bookmaker.key);
          }
        });
      });
      
      // Convert to array of {key, title} objects
      let uniqueBooks = Array.from(bookmakerMap.entries()).map(([key, title]) => ({
        key,
        title
      }));
      
      // Filter books for free users - only allow DraftKings, FanDuel, and Caesars
      // This will be handled by the component using useMe hook
      
      console.log('🔍 useMarkets: Extracted bookmakers:', uniqueBooks);
      setBooks(uniqueBooks);
      setLastUpdate(new Date());
      
      // Update last fetch time and reset retry counter on success
      lastFetchTime.current = Date.now();
      retryCount.current = 0;
      
    } catch (err) {
      console.error('🔍 useMarkets: Fetch error:', err);
      console.error('🔍 useMarkets: Error stack:', err.stack);
      
      // Handle network errors with retry logic
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch') && retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        console.log(`🔄 useMarkets: Network error - Retrying (${retryCount.current}/${MAX_RETRIES}) in ${RETRY_DELAY/1000} seconds...`);
        
        // Clear the current request
        activeRequest.current = null;
        
        // Schedule a retry
        setTimeout(() => {
          fetchMarkets(true); // Pass true to indicate this is a retry
        }, RETRY_DELAY);
        
        return;
      }
      
      // Reset retry counter on non-retryable errors or max retries reached
      retryCount.current = 0;
      
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
  }, [sports, regions, markets, paramsKey, games.length, handleApiResponse, enabled]));

// Throttled refresh function
const refreshMarkets = useMemo(() => throttle(() => {
  if (!enabled) return;
  if (!isLoading) {
    fetchMarkets();
  }
}, 5000), [fetchMarkets, isLoading, enabled]);

// Set up auto-refresh and initial fetch
useEffect(() => {
  if (!enabled) {
    setIsLoading(false);
    return () => {
      if (stableFetch.current?.cancel) {
        stableFetch.current.cancel();
      }
    };
  }

  // Initial fetch
  fetchMarkets();
  
  // Set up refresh interval
  const refreshInterval = setInterval(refreshMarkets, 30000); // Refresh every 30 seconds
  
  // Clean up
  return () => {
    clearInterval(refreshInterval);
    activeRequest.current = null;
  };
}, [enabled, fetchMarkets, refreshMarkets]);

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

useEffect(() => {
  if (!enabled) {
    if (stableFetch.current?.cancel) {
      stableFetch.current.cancel();
    }
    return;
  }

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
}, [sports, regions, markets, fetchMarkets, enabled]);

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
