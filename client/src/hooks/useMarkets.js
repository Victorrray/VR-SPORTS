// src/hooks/useMarkets.js
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce, throttle } from '../utils/performance';
import { APICache, CACHE_TTL } from '../utils/cache';
import { useMemoizedCallback } from './useMemoizedCallback';
import { withApiBase } from '../config/api';
import { useQuotaHandler } from './useQuotaHandler';
import { secureFetch } from '../utils/security';
import logger, { CATEGORIES } from '../utils/logger';

// Global event emitter for API usage updates
export const apiUsageEvents = new EventTarget();

const SCOREBOARD_CACHE = new Map();

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
  if (cached && now - cached.timestamp < CACHE_TTL.LOGOS) {
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
    logger.warn(CATEGORIES.API, 'Unable to fetch scoreboard logos for', sportKey);
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
  const { enabled = true, date = null, autoRefresh = true } = options;
  const [games, setGames] = useState([]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  
  const { quotaExceeded, quotaError, handleApiResponse } = useQuotaHandler();
  
  // Memoize the params to prevent unnecessary effect triggers
  const paramsKey = useMemo(() => {
    const sportsKey = [...sports].sort().join(',');
    const regionsKey = [...regions].sort().join(',');
    const marketsKey = [...markets].sort().join(',');
    const dateKey = date || 'all';
    return `${sportsKey}-${regionsKey}-${marketsKey}-${dateKey}`;
  }, [sports, regions, markets, date]);
  
  // Store the last successful fetch time
  const lastFetchTime = useRef(0);
  const lastSuccessfulFetchTime = useRef(0); // Track when we got actual data
  const COOLDOWN_MS = 10_000; // Reduced from 30s to 10s for faster sports switching
  // Track if we have an active request
  const activeRequest = useRef(null);
  // Track retry attempts
  const retryCount = useRef(0);
  const stableFetch = useRef(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds between retries
  const EMPTY_RESULT_RETRY_DELAY = 3000; // 3 seconds retry for empty results

  // Debounced fetch function with enhanced error handling and retry logic
  const fetchMarkets = useMemoizedCallback(debounce(async (isRetry = false) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    const withinCooldown = now - lastFetchTime.current < COOLDOWN_MS;

    if (!isRetry && activeRequest.current) {
      return activeRequest.current;
    }

    // Skip if we recently fetched (unless it's a retry)
    if (!isRetry && withinCooldown) {
      if (activeRequest.current) {
        return activeRequest.current;
      }
      setIsLoading(false);
      return;
    }
    
    logger.debug(CATEGORIES.MARKETS, 'fetchMarkets called with:', { sports: sports.length, markets: markets.length });
    
    if (!sports?.length || !regions?.length || !markets?.length) {
      setError('Please select sports, regions, and markets to view odds');
      setIsLoading(false);
      return;
    }
    
    // Check cache first
    const cacheKey = `markets-${paramsKey}`;
    const cachedData = APICache.get(cacheKey);
    
    // Always use cached data if available for faster sports switching
    if (cachedData && cachedData.length > 0) {
      logger.debug(CATEGORIES.CACHE, 'Using cached data:', cachedData.length);
      setGames(cachedData);
      setIsLoading(false);
      return;
    }
    
    // If cached data is empty, clear it and fetch fresh data
    if (cachedData && cachedData.length === 0) {
      APICache.delete(cacheKey);
    }
    
    // Only show loading if we don't have cached data AND we're not within cooldown
    if (!cachedData && !withinCooldown) {
      setIsLoading(true);
    }
    setError(null);
    
    // Store the current request to prevent race conditions
    const previousFetchTs = lastFetchTime.current;
    const requestId = Symbol('requestId');
    activeRequest.current = requestId;
    lastFetchTime.current = now;

    try {
      // Process markets parameter properly
      const marketsParam = Array.isArray(markets) ? markets.join(',') : markets;
      
      // Log period markets being requested (important for debugging)
      const periodMarkets = (Array.isArray(markets) ? markets : markets.split(',')).filter(m => 
        m.includes('_q') || m.includes('_h') || m.includes('_p') || m.includes('_1st')
      );
      if (periodMarkets.length > 0) {
        logger.info(CATEGORIES.MARKETS, 'Period markets requested:', periodMarkets.length);
      }
      
      // Detect if this is a player props request
      const playerPropMarketPrefixes = ['player_', 'batter_', 'pitcher_'];
      const marketsArray = Array.isArray(markets) ? markets : markets.split(',');
      const isPlayerPropsRequest = marketsArray.some(m => 
        playerPropMarketPrefixes.some(prefix => m.startsWith(prefix))
      );
      
      const params = new URLSearchParams({
        sports: sports.join(','),
        regions: regions.join(','),
        markets: marketsParam,
        oddsFormat: 'american',
        dateFormat: 'iso',
        _t: Date.now() // Cache buster
      });

      // Add betType parameter to distinguish between straight bets and player props
      if (isPlayerPropsRequest) {
        params.append('betType', 'props');
      } else {
        params.append('betType', 'straight');
      }

      // Add date parameter if provided
      if (date && date.trim()) {
        params.append('date', date);
      }

      // Build path with centralized API base handling
      const fullUrl = withApiBase(`/api/odds?${params.toString()}`);
      
      // Enhanced fetch with better error handling and timeout
      // Player props requests need longer timeout since they fetch data for each event
      const controller = new AbortController();
      const timeoutMs = isPlayerPropsRequest ? 120000 : 15000; // 2 minutes for props, 15s for regular
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
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

        // Handle quota exceeded before other errors
        const quotaResult = await handleApiResponse(response);
        if (quotaResult.quotaExceeded) {
          logger.warn(CATEGORIES.API, 'Quota exceeded');
          setError('Quota exceeded - upgrade to continue');
          setGames([]);
          return;
        }
        
        if (!response.ok) {
          // Handle 402 Payment Required
          if (response.status === 402) {
            logger.warn(CATEGORIES.API, 'Payment required');
            setError('Subscription required for API access');
            setGames([]);
            return;
          }
          
          // Handle 401 Unauthorized
          if (response.status === 401) {
            logger.warn(CATEGORIES.API, 'Authentication required');
            setError('Authentication required - please log in');
            setGames([]);
            return;
          }
          
          const responseClone = response.clone();
          const errorText = await responseClone.text();
          logger.error(CATEGORIES.API, 'API error:', response.status);
          throw new Error(`API request failed with status ${response.status}: ${errorText.substring(0, 200)}`);
        }
        
        // Check if response is valid JSON
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          logger.error(CATEGORIES.API, 'Expected JSON but got:', contentType);
          throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON.`);
        }
        
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
            error.message = errorBody || error.message;
            logger.error(CATEGORIES.API, 'API Error:', error.response.status);
            
            // Handle errors with retry logic
            if ((error.response.status >= 500 || error.response.status === 0) && retryCount.current < MAX_RETRIES) {
              retryCount.current += 1;
              const retryAfter = error.response.headers.get('Retry-After') || RETRY_DELAY;
              const delay = typeof retryAfter === 'string' ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY;
              
              logger.debug(CATEGORIES.API, `Retrying (${retryCount.current}/${MAX_RETRIES})`);
              activeRequest.current = null;
              setError(`Temporarily unavailable. Retrying... (${retryCount.current}/${MAX_RETRIES})`);
              
              return new Promise(resolve => {
                setTimeout(() => {
                  fetchMarkets(true).then(resolve);
                }, delay * Math.pow(2, retryCount.current - 1));
              });
            }
          } catch (e) {
            logger.error(CATEGORIES.API, 'Failed to read error response');
          }
        }
        
        retryCount.current = 0;
        
        let userFriendlyError = 'Failed to load data. Please try again later.';
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            userFriendlyError = 'Authentication required. Please log in again.';
          } else if (error.response.status === 429) {
            userFriendlyError = 'Too many requests. Please wait before trying again.';
          } else if (error.response.status >= 500) {
            userFriendlyError = 'Server error. Our team has been notified.';
          }
        }
        
        setError(userFriendlyError);
        setGames([]);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        logger.error(CATEGORIES.API, 'Invalid response format - expected array');
        setError('Invalid response format from server');
        setGames([]);
        return;
      }
      
      // Custom bookmaker name mappings (override API titles)
      const bookmakerNameMap = {
        'dabble_au': 'Dabble',
        'williamhill_us': 'Caesars', // William Hill US merged with Caesars
        // Add more custom mappings here if needed
      };
      
      // Normalize the data structure
      const normalizedData = data.map(game => ({
        ...game,
        // Ensure bookmakers is always an array with custom name mapping
        bookmakers: Array.isArray(game.bookmakers) 
          ? game.bookmakers.map(bookmaker => ({
              ...bookmaker,
              // Override title with custom name if mapping exists
              title: bookmakerNameMap[bookmaker.key] || bookmaker.title || bookmaker.key
            }))
          : [],
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
      
      let preparedData = normalizedData;
      try {
        preparedData = await enrichGamesWithScoreboardData(normalizedData);
      } catch (logoErr) {
        logger.warn(CATEGORIES.API, 'Failed to enrich games with logos');
      }
      
      // Update state with normalized data - only if data actually changed
      setGames(prevGames => {
        if (prevGames.length === preparedData.length && prevGames.length > 0 && preparedData.length > 0) {
          if (prevGames[0].id === preparedData[0].id) {
            return prevGames;
          }
        }
        return preparedData;
      });
      
      // Update cache
      APICache.set(cacheKey, preparedData, 2 * 60 * 1000); // 2 minutes cache for odds data
      
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
      
      logger.debug(CATEGORIES.MARKETS, 'Extracted bookmakers:', uniqueBooks.length);
      setBooks(uniqueBooks);
      setLastUpdate(new Date());
      
      // Update last fetch time and reset retry counter on success
      lastFetchTime.current = Date.now();
      
      // If we got empty results, retry sooner instead of applying full cooldown
      if (preparedData.length === 0) {
        retryCount.current += 1;
        if (retryCount.current < MAX_RETRIES) {
          setTimeout(() => {
            fetchMarkets(true);
          }, EMPTY_RESULT_RETRY_DELAY);
        }
      } else {
        // Only reset retry counter if we got actual data
        retryCount.current = 0;
        lastSuccessfulFetchTime.current = Date.now();
      }
      
    } catch (err) {
      logger.error(CATEGORIES.API, 'Fetch error:', err.message);
      lastFetchTime.current = previousFetchTs;
      
      // Handle network errors with retry logic
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch') && retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        logger.debug(CATEGORIES.API, `Network error - Retrying (${retryCount.current}/${MAX_RETRIES})...`);
        
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
        return;
      }
      
      if (err.response) {
        throw new Error(`API request failed: ${err.response.status} - ${err.response.statusText}`);
      } else {
        throw new Error(`API request failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      activeRequest.current = null;
    }
  }, [paramsKey, handleApiResponse, enabled]));

// Throttled refresh function
const refreshMarkets = useMemo(() => throttle(() => {
  if (!enabled) return;
  if (!isLoading) {
    fetchMarkets();
  }
}, 5000), [fetchMarkets, isLoading, enabled]);

// Initial fetch when params change (this is intentional - user changed filters)
useEffect(() => {
  if (!enabled) {
    setIsLoading(false);
    return;
  }

  // Initial fetch when params change
  fetchMarkets();
  
  return () => {
    activeRequest.current = null;
  };
}, [enabled, fetchMarkets, paramsKey]);

// Separate effect for auto-refresh interval ONLY
useEffect(() => {
  if (!enabled || !autoRefresh) {
    return;
  }

  const refreshInterval = setInterval(refreshMarkets, 30000);
  
  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  };
}, [enabled, autoRefresh, refreshMarkets]);

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
    console.log('🔍 useMarkets: Params changed, creating new debounced fetch:', paramsKey);
    console.log('🔍 useMarkets: Old paramsKey:', stableFetch.current?.paramsKey);
    if (stableFetch.current?.cancel) {
      stableFetch.current.cancel();
    }
    
    const debouncedFn = debounce(fetchMarkets, 150); // Reduced from 500ms to 150ms for faster sports switching
    debouncedFn.paramsKey = paramsKey;
    stableFetch.current = debouncedFn;
  } else {
    console.log('🔍 useMarkets: Params unchanged, skipping new fetch');
  }
  
  // Only call fetch if we're not within cooldown
  const now = Date.now();
  const withinCooldown = now - lastFetchTime.current < COOLDOWN_MS;
  if (!withinCooldown) {
    stableFetch.current();
  } else {
    console.log('🔍 useMarkets: Within cooldown, skipping fetch call');
  }
}, [sports, regions, markets, enabled]);

  // Log when games change to debug tab refresh issue
  useEffect(() => {
    console.log('🔍 useMarkets: games updated, length:', games.length);
    console.trace('🔍 useMarkets: games change stack trace');
  }, [games]);

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
