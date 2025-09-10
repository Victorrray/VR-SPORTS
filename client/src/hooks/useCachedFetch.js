import { useState, useEffect, useCallback, useRef } from 'react';
import { oddsCacheManager } from '../utils/cacheManager';
import { withApiBase } from '../config/api';

// Enhanced fetch hook with intelligent caching
export const useCachedFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);
  
  const {
    enabled = true,
    cacheKey: customCacheKey,
    ttl,
    retryAttempts = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    transform,
    staleWhileRevalidate = true,
    backgroundRefresh = false
  } = options;

  // Generate cache key
  const cacheKey = customCacheKey || oddsCacheManager.generateKey(url, options.params);

  // Fetch function with caching logic
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = oddsCacheManager.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        
        // Background refresh if enabled
        if (backgroundRefresh) {
          setTimeout(() => fetchData(true), 100);
        }
        return cachedData;
      }
      
      // Try stale data if available
      if (staleWhileRevalidate) {
        const staleData = oddsCacheManager.getOddsWithFallback(cacheKey);
        if (staleData) {
          setData(staleData);
          setError(null);
          // Continue to fetch fresh data
        }
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Resolve relative API paths consistently
      const fullUrl = url.startsWith('http') ? url : withApiBase(url);
      const queryParams = options.params ? `?${new URLSearchParams(options.params)}` : '';
      
      const response = await fetch(`${fullUrl}${queryParams}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options.fetchOptions
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let responseData = await response.json();
      
      // Transform data if transformer provided
      if (transform) {
        responseData = transform(responseData);
      }

      // Cache the response
      if (ttl) {
        oddsCacheManager.set(cacheKey, responseData, ttl);
      } else {
        oddsCacheManager.cacheOdds(cacheKey, responseData);
      }

      setData(responseData);
      setLastFetch(new Date());
      retryCountRef.current = 0;
      
      onSuccess?.(responseData);
      return responseData;

    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error(`Fetch error for ${url}:`, err);
      
      // Retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        console.log(`Retrying fetch (${retryCountRef.current}/${retryAttempts}) in ${retryDelay}ms...`);
        
        setTimeout(() => {
          fetchData(forceRefresh);
        }, retryDelay * retryCountRef.current); // Exponential backoff
        
        return;
      }
      
      setError(err);
      onError?.(err);
      
      // Try to return stale data as fallback
      const fallbackData = oddsCacheManager.getOddsWithFallback(cacheKey, 600000); // 10 min stale
      if (fallbackData) {
        setData(fallbackData);
        console.warn('Using stale data due to fetch error');
      }
      
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, enabled, ttl, retryAttempts, retryDelay, onSuccess, onError, transform, staleWhileRevalidate, backgroundRefresh, options.params, options.headers, options.fetchOptions]);

  // Refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    oddsCacheManager.delete(cacheKey);
  }, [cacheKey]);

  // Initial fetch - with proper dependency management
  useEffect(() => {
    if (!enabled) return;
    
    const isPlayerPropsRequest = url.includes('/api/odds') && options.params?.markets?.includes('player_');
    
    if (isPlayerPropsRequest) {
      // Delayed fetch for player props but allow refetch when params change
      const delayedFetch = setTimeout(() => {
        fetchData();
      }, 500);
      
      return () => {
        clearTimeout(delayedFetch);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      fetchData();
      
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [enabled, url, JSON.stringify(options.params)]); // Include params to allow refetch

  // Subscribe to cache updates - disabled for player props to prevent infinite loops
  useEffect(() => {
    const isPlayerPropsRequest = url.includes('/api/odds') && options.params?.markets?.includes('player_');
    
    if (isPlayerPropsRequest) {
      // Skip cache subscription for player props to prevent jitter
      return;
    }
    
    const unsubscribe = oddsCacheManager.subscribe(cacheKey, (cachedData) => {
      setData(cachedData);
      setError(null);
    });
    
    return unsubscribe;
  }, [cacheKey, url, options.params]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    invalidate,
    cacheKey
  };
};

// Hook for batch fetching multiple endpoints
export const useBatchCachedFetch = (requests = []) => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchBatch = useCallback(async () => {
    if (!requests.length) return;

    setLoading(true);
    const newResults = {};
    const newErrors = {};

    // Check cache for all requests first
    const cacheKeys = requests.map(req => 
      req.cacheKey || oddsCacheManager.generateKey(req.url, req.params)
    );
    
    const { results: cachedResults, missing } = oddsCacheManager.getBatch(cacheKeys);
    
    // Use cached data
    requests.forEach((req, index) => {
      const key = cacheKeys[index];
      if (cachedResults[key]) {
        newResults[req.id || req.url] = cachedResults[key];
      }
    });

    // Fetch missing data
    const missingRequests = requests.filter((req, index) => 
      missing.includes(cacheKeys[index])
    );

    if (missingRequests.length > 0) {
      const fetchPromises = missingRequests.map(async (req) => {
        try {
          const fullUrl = req.url.startsWith('http') ? req.url : withApiBase(req.url);
          const queryParams = req.params ? `?${new URLSearchParams(req.params)}` : '';
          
          const response = await fetch(`${fullUrl}${queryParams}`, {
            headers: { 'Content-Type': 'application/json', ...req.headers },
            ...req.fetchOptions
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          let data = await response.json();
          if (req.transform) data = req.transform(data);

          const cacheKey = req.cacheKey || oddsCacheManager.generateKey(req.url, req.params);
          oddsCacheManager.cacheOdds(cacheKey, data);

          return { id: req.id || req.url, data, error: null };
        } catch (error) {
          return { id: req.id || req.url, data: null, error };
        }
      });

      const fetchResults = await Promise.all(fetchPromises);
      
      fetchResults.forEach(({ id, data, error }) => {
        if (error) {
          newErrors[id] = error;
        } else {
          newResults[id] = data;
        }
      });
    }

    setResults(newResults);
    setErrors(newErrors);
    setLoading(false);
  }, [requests]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  return {
    results,
    loading,
    errors,
    refresh: fetchBatch
  };
};

// Hook for real-time data with smart polling
export const useRealtimeCachedFetch = (url, options = {}) => {
  const {
    pollingInterval = 300000, // 5 minutes - reduced to save API costs
    enablePolling = true,
    pauseOnHidden = true,
    ...fetchOptions
  } = options;

  const [isPolling, setIsPolling] = useState(enablePolling);
  const intervalRef = useRef(null);
  const isHiddenRef = useRef(false);

  const { data, loading, error, refresh, ...rest } = useCachedFetch(url, {
    ...fetchOptions,
    backgroundRefresh: false // Disabled to reduce API calls
  });

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isHiddenRef.current = document.hidden;
      
      if (pauseOnHidden) {
        if (document.hidden) {
          setIsPolling(false);
        } else {
          setIsPolling(enablePolling);
          // Refresh immediately when page becomes visible
          refresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enablePolling, pauseOnHidden, refresh]);

  // Polling logic
  useEffect(() => {
    if (isPolling && pollingInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (!isHiddenRef.current || !pauseOnHidden) {
          refresh();
        }
      }, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, pollingInterval, pauseOnHidden, refresh]);

  const startPolling = useCallback(() => setIsPolling(true), []);
  const stopPolling = useCallback(() => setIsPolling(false), []);

  return {
    data,
    loading,
    error,
    refresh,
    isPolling,
    startPolling,
    stopPolling,
    ...rest
  };
};
