// Authentication hook with Supabase integration
import { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';
import { loadPlanInfo, savePlanInfo, clearPlanInfo, isPlanInfoStale } from '../utils/planCache';

const AuthContext = createContext({});

// Session validation timeout (5 minutes)
const SESSION_VALIDATION_INTERVAL = 5 * 60 * 1000;
const PLAN_MIN_INTERVAL = 30 * 1000; // rate limit plan refreshes
const PLAN_FETCH_TIMEOUT = 12 * 1000; // abort plan calls after 12s
const PLAN_MAX_BACKOFF = 5 * 60 * 1000; // cap exponential backoff at 5 minutes
const PREMIUM_GRACE_MS = 15 * 60 * 1000;

const PREMIUM_PLANS = new Set(['platinum', 'premium', 'vip']);
const isPremiumPlan = (plan) => PREMIUM_PLANS.has(String(plan || '').toLowerCase());

const defaultPlan = {
  plan: 'free',
  quota: null,
  used: null,
  remaining: null,
  fetchedAt: null,
  stale: true,
  source: 'default'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(!cachedPlanInfo);
  const [session, setSession] = useState(null);
  const isSupabaseEnabled = !!supabase;
  const sessionRef = useRef(null);
  const lastValidationRef = useRef(0);
  const prevPlanRef = useRef(null);
  const planNoticeTimeoutRef = useRef(null);
  const lastPlanStaleRef = useRef(false);
  const validationIntervalRef = useRef(null);
  const pendingSignOutRef = useRef(null);

  const cachedPlanInfo = loadPlanInfo();
  const [planInfo, setPlanInfo] = useState(cachedPlanInfo);
  const [planNotice, setPlanNotice] = useState('');
  const planInfoRef = useRef(cachedPlanInfo);

  useEffect(() => {
    if (planInfo) {
      setPlanLoading(false);
    }
  }, [planInfo]);

  const initialPremiumSeen = cachedPlanInfo && isPremiumPlan(cachedPlanInfo.plan)
    ? new Date(cachedPlanInfo.fetchedAt || Date.now()).getTime()
    : 0;

  const planFetchStateRef = useRef({
    promise: null,
    controller: null,
    lastFetch: cachedPlanInfo?.fetchedAt ? new Date(cachedPlanInfo.fetchedAt).getTime() : 0,
    backoffUntil: 0,
    attempt: 0,
    lastPremiumSeen: initialPremiumSeen,
  });

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const safeGetItem = useCallback((key) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn(`🔐 useAuth: Failed to read ${key} from storage`, err);
      return null;
    }
  }, []);

  const safeSetItem = useCallback((key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`🔐 useAuth: Failed to write ${key} to storage`, err);
    }
  }, []);

  const safeRemoveItem = useCallback((key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`🔐 useAuth: Failed to remove ${key} from storage`, err);
    }
  }, []);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSession(null);
    sessionRef.current = null;
    lastValidationRef.current = 0;
    prevPlanRef.current = null;
    lastPlanStaleRef.current = false;
    setPlanInfo(null);
    planInfoRef.current = null;
    setPlanNotice('');
    if (planNoticeTimeoutRef.current) {
      clearTimeout(planNoticeTimeoutRef.current);
      planNoticeTimeoutRef.current = null;
    }
    setAuthLoading(false);
    setPlanLoading(false);
    if (pendingSignOutRef.current) {
      clearTimeout(pendingSignOutRef.current);
      pendingSignOutRef.current = null;
    }

    const fetchState = planFetchStateRef.current;
    if (fetchState.controller) {
      fetchState.controller.abort();
    }
    fetchState.promise = null;
    fetchState.controller = null;
    fetchState.lastFetch = 0;
    fetchState.backoffUntil = 0;
    fetchState.attempt = 0;
    fetchState.lastPremiumSeen = 0;

    safeRemoveItem('demo-auth-session');
    clearPlanInfo();
    sessionRef.current = null;

    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }
  }, [safeRemoveItem]);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!isSupabaseEnabled || !userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      setProfile(data || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [isSupabaseEnabled]);

  const schedulePlanNotice = useCallback((message) => {
    setPlanNotice(message);
    if (planNoticeTimeoutRef.current) {
      clearTimeout(planNoticeTimeoutRef.current);
    }
    planNoticeTimeoutRef.current = setTimeout(() => {
      setPlanNotice('');
    }, 10000);
  }, []);

  const fetchPlanStatus = useCallback(async ({ force = false } = {}) => {
    if (!sessionRef.current) {
      setPlanLoading(false);
      return planInfoRef.current || null;
    }

    const fetchState = planFetchStateRef.current;
    const now = Date.now();
    const existingPlan = planInfoRef.current || loadPlanInfo();
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

    if (!force && (isHidden || isOffline) && existingPlan) {
      setPlanLoading(false);
      return existingPlan;
    }

    if (!force) {
      if (fetchState.promise) {
        return fetchState.promise;
      }
      if (fetchState.lastFetch && now - fetchState.lastFetch < PLAN_MIN_INTERVAL && existingPlan) {
        setPlanLoading(false);
        return existingPlan;
      }
      if (fetchState.backoffUntil && now < fetchState.backoffUntil && existingPlan) {
        setPlanLoading(false);
        return existingPlan;
      }
    }

    if (fetchState.promise) {
      fetchState.controller?.abort();
    }

    const controller = new AbortController();
    fetchState.controller = controller;
    const requestToken = Symbol('planFetch');
    fetchState.currentToken = requestToken;

    setPlanLoading(true);

    const doFetch = (async () => {
      const timeoutId = setTimeout(() => controller.abort(), PLAN_FETCH_TIMEOUT);
      try {
        const response = await secureFetch(withApiBase('/api/me/usage'), {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Plan fetch failed (${response.status})`);
        }

        const data = await response.json();
        const nextPlan = data.plan || 'free';
        const info = {
          plan: nextPlan,
          quota: data.quota ?? null,
          used: data.used ?? null,
          remaining: data.remaining ?? null,
          fetchedAt: new Date().toISOString(),
          stale: !!data.stale,
          source: data.source || 'live'
        };

        const previousPlan = prevPlanRef.current;
        prevPlanRef.current = nextPlan;
        planInfoRef.current = info;
        setPlanInfo(info);
        savePlanInfo(info);

        fetchState.attempt = 0;
        fetchState.backoffUntil = 0;
        fetchState.lastFetch = Date.now();
        if (isPremiumPlan(nextPlan)) {
          fetchState.lastPremiumSeen = Date.now();
        }

        if (previousPlan && previousPlan !== nextPlan) {
          if (nextPlan === 'platinum') {
            schedulePlanNotice('🎉 Upgraded to Platinum – premium access unlocked.');
          } else {
            schedulePlanNotice('⚠️ Plan changed to Free – premium features disabled.');
          }
          lastPlanStaleRef.current = info.stale;
        } else if (info.stale && !lastPlanStaleRef.current) {
          schedulePlanNotice('⚠️ Using cached plan until the server reconnects.');
          lastPlanStaleRef.current = true;
        } else if (!info.stale) {
          lastPlanStaleRef.current = false;
        }

        return info;
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('useAuth: Failed to fetch plan status', error);
        }

        if (!controller.signal.aborted) {
          fetchState.attempt = Math.min((fetchState.attempt || 0) + 1, 10);
          const backoff = Math.min(PLAN_MAX_BACKOFF, Math.pow(2, fetchState.attempt) * 1000);
          fetchState.backoffUntil = Date.now() + backoff;
        }

        const fallback = planInfoRef.current || loadPlanInfo();
        const lastPremiumSeen = fetchState.lastPremiumSeen || 0;
        const withinGrace = lastPremiumSeen && (Date.now() - lastPremiumSeen) < PREMIUM_GRACE_MS;

        let resolvedPlan = fallback;
        if (!resolvedPlan && withinGrace) {
          resolvedPlan = {
            ...defaultPlan,
            plan: 'platinum',
            source: 'grace',
            stale: true,
            fetchedAt: new Date(lastPremiumSeen).toISOString(),
          };
        }

        if (resolvedPlan) {
          if (isPremiumPlan(resolvedPlan.plan)) {
            const ts = resolvedPlan.fetchedAt ? new Date(resolvedPlan.fetchedAt).getTime() : Date.now();
            fetchState.lastPremiumSeen = Math.max(fetchState.lastPremiumSeen || 0, ts);
          }
          const cachedStale = {
            ...resolvedPlan,
            stale: true,
            source: resolvedPlan.source || (controller.signal.aborted ? 'aborted' : 'cache'),
          };
          planInfoRef.current = cachedStale;
          setPlanInfo(cachedStale);
          fetchState.lastFetch = Date.now();
          return cachedStale;
        }

        if (controller.signal.aborted) {
          return { ...defaultPlan, stale: true, source: 'default' };
        }

        const defaultPlanInfo = {
          ...defaultPlan,
          fetchedAt: new Date().toISOString(),
          stale: true,
          source: 'default'
        };
        planInfoRef.current = defaultPlanInfo;
        setPlanInfo(defaultPlanInfo);
        fetchState.lastFetch = Date.now();
        return defaultPlanInfo;
      } finally {
        clearTimeout(timeoutId);
        if (fetchState.currentToken === requestToken) {
          fetchState.promise = null;
          fetchState.controller = null;
          fetchState.currentToken = null;
          setPlanLoading(false);
        }
      }
    })();

    fetchState.promise = doFetch;
    return doFetch;
  }, [schedulePlanNotice]);

  const clearPlanNotice = useCallback(() => {
    setPlanNotice('');
    if (planNoticeTimeoutRef.current) {
      clearTimeout(planNoticeTimeoutRef.current);
      planNoticeTimeoutRef.current = null;
    }
  }, []);

  // Validate the current session
  const validateSession = useCallback(async () => {
    if (!isSupabaseEnabled) return null;
    
    try {
      const now = Date.now();
      const activeSession = sessionRef.current;
      const lastValidation = lastValidationRef.current;
      const shouldValidate = !activeSession || (now - lastValidation >= SESSION_VALIDATION_INTERVAL);
      if (!shouldValidate) {
        return activeSession;
      }

      console.log('🔐 useAuth: Validating session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 useAuth: Session validation error:', error);
        if (sessionRef.current) {
          console.warn('🔐 useAuth: Validation failed; retaining existing session.');
          lastValidationRef.current = now;
          return sessionRef.current;
        }
        clearSessionState();
        throw error;
      }
      
      if (!currentSession?.user) {
        console.log('🔐 useAuth: No valid session found');
        clearSessionState();
        lastValidationRef.current = now;
        return null;
      }
      
      sessionRef.current = currentSession;
      setSession(currentSession);
      setUser(currentSession.user);
      await fetchUserProfile(currentSession.user.id);
      const currentPlan = planInfoRef.current || loadPlanInfo();
      if (!currentPlan || isPlanInfoStale(currentPlan)) {
        fetchPlanStatus().catch((err) => {
          console.warn('useAuth: background plan refresh failed during validation', err);
        });
      }
      lastValidationRef.current = now;

      // Only update if the user has changed
      if (activeSession?.user?.id !== currentSession.user.id) {
        console.log('🔐 useAuth: Session validated, user:', currentSession.user.email);
      }

      return currentSession;
    } catch (error) {
      console.error('🔐 useAuth: Error validating session:', error);

      if (sessionRef.current) {
        console.warn('🔐 useAuth: Keeping previous session after validation failure.');
        return sessionRef.current;
      }

      clearSessionState();
      return null;
    }
  }, [isSupabaseEnabled, clearSessionState, fetchUserProfile, fetchPlanStatus]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    let isMounted = true;
    let subscription;
    let fallbackTimeout;
    let settled = false;
    // Get initial session
    const getInitialSession = async () => {
      if (!isMounted) return;
      
      console.log('🔐 useAuth: Getting initial session, isSupabaseEnabled:', isSupabaseEnabled);
      
      try {
        if (!isSupabaseEnabled) {
          console.log('🔐 useAuth: Supabase disabled - checking localStorage for demo session');
          
          // Check for demo session in localStorage
          try {
            const demoSession = safeGetItem('demo-auth-session');
            if (demoSession) {
              const sessionData = JSON.parse(demoSession);
              console.log('🔐 useAuth: Found demo session:', sessionData.email);
              if (isMounted) {
                setUser(sessionData);
                sessionRef.current = { user: sessionData };
                setSession({ user: sessionData });
              }
            } else if (isMounted) {
              console.log('🔐 useAuth: No demo session found');
              setUser(null);
              sessionRef.current = null;
              setSession(null);
            }
          } catch (error) {
            console.error('🔐 useAuth: Error parsing demo session:', error);
            if (isMounted) {
            setUser(null);
            sessionRef.current = null;
            setSession(null);
            }
          }
          
          if (isMounted) setAuthLoading(false);
          return;
        }

        console.log('🔐 useAuth: Fetching Supabase session');
        const { data: { session: freshSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        console.log('🔐 useAuth: Session received:', !!freshSession, freshSession?.user?.email);
        
        if (isMounted) {
          if (freshSession?.user) {
            console.log('🔐 useAuth: Fetching user profile for:', freshSession.user.id);
            sessionRef.current = freshSession;
            setSession(freshSession);
            setUser(freshSession.user);
            await fetchUserProfile(freshSession.user.id);
            fetchPlanStatus().catch((err) => {
              console.warn('useAuth: background plan refresh failed (fresh session)', err);
            });

            if (!validationIntervalRef.current) {
              validationIntervalRef.current = setInterval(() => {
                if (isMounted) validateSession();
              }, SESSION_VALIDATION_INTERVAL);
            }
          } else {
            clearSessionState();
          }
      }
    } catch (error) {
      console.error('🔐 useAuth: Error getting session:', error);
      if (isMounted && !sessionRef.current) {
        clearSessionState();
      }
      } finally {
        if (isMounted) {
          console.log('🔐 useAuth: Setting loading to false');
          setAuthLoading(false);
          if (fallbackTimeout) clearTimeout(fallbackTimeout);
          settled = true;
        }
      }
    };

    // Set up auth state change listener
    const setupAuthListener = () => {
      if (!isSupabaseEnabled || !isMounted) return null;
      
      console.log('🔐 useAuth: Setting up auth state listener');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!isMounted) return;
          
          console.log('🔐 useAuth: Auth state change:', event, !!newSession);
          
          if (pendingSignOutRef.current) {
            clearTimeout(pendingSignOutRef.current);
            pendingSignOutRef.current = null;
          }

          if (!newSession?.user) {
            pendingSignOutRef.current = setTimeout(() => {
              if (!isMounted) return;
              console.log('🔐 useAuth: Clearing session data');
              clearSessionState();
              if (validationIntervalRef.current) {
                clearInterval(validationIntervalRef.current);
                validationIntervalRef.current = null;
              }
            }, 300);
            return;
          }

          sessionRef.current = newSession;
          setSession(newSession);
          setUser(newSession.user);

          console.log('🔐 useAuth: Auth change - fetching profile for:', newSession.user.id);
          await fetchUserProfile(newSession.user.id);
          fetchPlanStatus().catch((err) => {
            console.warn('useAuth: background plan refresh failed (auth state change)', err);
          });

          if (!validationIntervalRef.current) {
            validationIntervalRef.current = setInterval(() => {
              if (isMounted) validateSession();
            }, SESSION_VALIDATION_INTERVAL);
          }
          
          if (!settled) {
            console.log('🔐 useAuth: Auth change - setting loading false');
            setAuthLoading(false);
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
            settled = true;
          }
        }
      );
      
      return subscription;
    };

    // Initialize
    getInitialSession();
    subscription = setupAuthListener();

    // Fallback timeout to ensure loading never stays true indefinitely
    fallbackTimeout = setTimeout(() => {
      if (isMounted && !settled) {
        console.log('🔐 useAuth: Fallback timeout - forcing loading to false');
        setAuthLoading(false);
        settled = true;
      }
    }, 5000);

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }
      if (pendingSignOutRef.current) {
        clearTimeout(pendingSignOutRef.current);
        pendingSignOutRef.current = null;
      }
    };
  }, [clearSessionState, fetchUserProfile, isSupabaseEnabled, safeGetItem, validateSession]);

  useEffect(() => {
    if (session) {
      const currentPlan = planInfoRef.current || loadPlanInfo();
      const shouldForce = !currentPlan || isPlanInfoStale(currentPlan);
      fetchPlanStatus({ force: shouldForce });
    } else if (!authLoading) {
      setPlanInfo(null);
      planInfoRef.current = null;
      clearPlanInfo();
      setPlanLoading(false);
    }
  }, [session, authLoading, fetchPlanStatus]);

  useEffect(() => {
    if (!isSupabaseEnabled) return undefined;

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        validateSession();
        fetchPlanStatus();
      }
    };

    const handleOnline = () => {
      validateSession();
      fetchPlanStatus();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [isSupabaseEnabled, fetchPlanStatus, validateSession]);

  useEffect(() => {
    return () => {
      if (planNoticeTimeoutRef.current) {
        clearTimeout(planNoticeTimeoutRef.current);
      }
    };
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseEnabled) {
      throw new Error('Authentication not available - Supabase not configured');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;
    return { data, error: null };
  };

  const signIn = async (email, password) => {
    if (!isSupabaseEnabled) {
      // Demo mode - create a fake session and persist it
      const demoUser = {
        id: '54276b6c-5255-4117-be95-70c22132591c',
        email: email,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      };
      
      // Store in localStorage for persistence across refreshes
      safeSetItem('demo-auth-session', JSON.stringify(demoUser));
      
      setUser(demoUser);
      sessionRef.current = { user: demoUser };
      setSession({ user: demoUser });
      
      console.log('🔐 useAuth: Demo login successful for:', email);
      return {
        data: { user: demoUser, session: { user: demoUser } },
        error: null,
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { data, error: null };
  };

  const signOut = async () => {
    try {
      if (isSupabaseEnabled) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      // Clear all auth-related data
      clearSessionState();
      safeRemoveItem('supabase.auth.token');
      
      console.log('🔐 useAuth: Successfully signed out');
    } catch (error) {
      console.error('🔐 useAuth: Error during sign out:', error);
      // Ensure all auth state is cleared even if Supabase signOut fails
      clearSessionState();
    }
  };

  const updateProfile = async (updates) => {
    if (!isSupabaseEnabled || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    setProfile(data);
    return data;
  };

  const updateBankroll = async (newBankroll) => {
    if (!profile) return;

    return updateProfile({ bankroll: newBankroll });
  };

  const setUsername = async (username) => {
    if (!isSupabaseEnabled || !user) {
      throw new Error('Authentication required');
    }

    // Update the user's metadata in Supabase
    const { data, error } = await supabase.auth.updateUser({
      data: { username }
    });

    if (error) throw error;

    // Update local user state
    setUser(prev => ({
      ...prev,
      user_metadata: {
        ...prev?.user_metadata,
        username
      }
    }));

    // Also update the profile in the profiles table
    await updateProfile({ username });
    
    return { data, error: null };
  };

  const value = {
    user,
    profile,
    session,
    loading: authLoading,
    authLoading,
    planLoading,
    signUp,
    signIn,
    setUsername,
    signInEmail: signIn,
    signUpEmail: signUp,
    signInWithProvider: async (provider) => {
      if (!isSupabaseEnabled) {
        throw new Error('Authentication not available - Supabase not configured');
      }
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      return data;
    },
    signOut,
    updateProfile,
    updateBankroll,
    fetchUserProfile,
    validateSession, // Export validateSession for manual validation when needed
    isAuthenticated: !!user,
    isSupabaseEnabled,
    lastValidation: lastValidationRef.current,
    planInfo,
    planNotice,
    clearPlanNotice,
    refreshPlan: (options) => fetchPlanStatus(options || {})
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
