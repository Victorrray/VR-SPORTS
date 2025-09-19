// Authentication hook with Supabase integration
import { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';

const AuthContext = createContext({});

// Session storage key
const SESSION_STORAGE_KEY = 'sb-session';

// Session validation timeout (5 minutes)
const SESSION_VALIDATION_INTERVAL = 5 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const isSupabaseEnabled = !!supabase;
  const sessionRef = useRef(null);
  const lastValidationRef = useRef(0);
  const prevPlanRef = useRef(null);
  const planNoticeTimeoutRef = useRef(null);
  const lastPlanStaleRef = useRef(false);

  const [planInfo, setPlanInfo] = useState(null);
  const [planNotice, setPlanNotice] = useState('');

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
    setPlanNotice('');
    if (planNoticeTimeoutRef.current) {
      clearTimeout(planNoticeTimeoutRef.current);
      planNoticeTimeoutRef.current = null;
    }
    setLoading(false);

    safeRemoveItem(SESSION_STORAGE_KEY);
    safeRemoveItem('demo-auth-session');
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

  const fetchPlanStatus = useCallback(async () => {
    if (!sessionRef.current) return null;

    try {
      const response = await secureFetch(withApiBase('/api/me/usage'), {
        credentials: 'include',
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
      setPlanInfo(info);

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
      console.warn('useAuth: Failed to fetch plan status', error);
      return null;
    }
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
      await fetchPlanStatus();
      lastValidationRef.current = now;

      safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));

      // Only update if the user has changed
      if (activeSession?.user?.id !== currentSession.user.id) {
        console.log('🔐 useAuth: Session validated, user:', currentSession.user.email);
      }

      return currentSession;
    } catch (error) {
      console.error('🔐 useAuth: Error validating session:', error);
      clearSessionState();
      return null;
    }
  }, [isSupabaseEnabled, clearSessionState, fetchUserProfile, fetchPlanStatus, safeSetItem]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    let isMounted = true;
    let subscription;
    let fallbackTimeout;
    let settled = false;
    let validationInterval;

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
          
          if (isMounted) setLoading(false);
          return;
        }

        // Check for stored session first
        const storedSession = safeGetItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.user) {
              console.log('🔐 useAuth: Found stored session for:', parsedSession.user.email);

              // Validate against Supabase to ensure the session is still active
              const { data: { session: freshSession }, error: refreshError } = await supabase.auth.getSession();

              if (refreshError || !freshSession?.user) {
                console.log('🔐 useAuth: Stored session invalid, clearing');
                clearSessionState();
              } else {
                sessionRef.current = freshSession;
                setSession(freshSession);
                setUser(freshSession.user);
                await fetchUserProfile(freshSession.user.id);
                await fetchPlanStatus();

                safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(freshSession));

                validationInterval = setInterval(() => {
                  if (isMounted) validateSession();
                }, SESSION_VALIDATION_INTERVAL);

                if (isMounted) setLoading(false);
                return;
              }
            } else {
              clearSessionState();
            }
          } catch (error) {
            console.error('🔐 useAuth: Error parsing stored session:', error);
            clearSessionState();
          }
        }

        // If no stored session or invalid, get fresh session
        console.log('🔐 useAuth: No valid stored session, fetching from server');
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
            await fetchPlanStatus();

            safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(freshSession));

            validationInterval = setInterval(() => {
              if (isMounted) validateSession();
            }, SESSION_VALIDATION_INTERVAL);
          } else {
            clearSessionState();
          }
      }
    } catch (error) {
      console.error('🔐 useAuth: Error getting session:', error);
      if (isMounted) {
        clearSessionState();
      }
      } finally {
        if (isMounted) {
          console.log('🔐 useAuth: Setting loading to false');
          setLoading(false);
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
          
          // Update session and user state
          sessionRef.current = newSession;
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user) {
            console.log('🔐 useAuth: Auth change - fetching profile for:', newSession.user.id);
            
            // Store the session for persistence
            safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
            
            // Fetch user profile
            await fetchUserProfile(newSession.user.id);
            await fetchPlanStatus();
            
            // Set up periodic session validation if not already set
            if (!validationInterval) {
              validationInterval = setInterval(() => {
                if (isMounted) validateSession();
              }, SESSION_VALIDATION_INTERVAL);
            }
          } else {
            // Clear session data on sign out
            console.log('🔐 useAuth: Clearing session data');
            clearSessionState();
            
            // Clear validation interval
            if (validationInterval) {
              clearInterval(validationInterval);
              validationInterval = null;
            }
          }
          
          if (!settled) {
            console.log('🔐 useAuth: Auth change - setting loading false');
            setLoading(false);
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
        setLoading(false);
        settled = true;
      }
    }, 5000);

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (validationInterval) clearInterval(validationInterval);
    };
  }, [clearSessionState, fetchUserProfile, isSupabaseEnabled, safeGetItem, safeSetItem, validateSession]);

  useEffect(() => {
    if (session) {
      fetchPlanStatus();
    } else {
      setPlanInfo(null);
    }
  }, [session, fetchPlanStatus]);

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
    return data;
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
      return { user: demoUser, session: { user: demoUser } };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
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
    loading,
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
    refreshPlan: fetchPlanStatus
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
