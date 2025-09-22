import React, { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { DebugLogger } from '../utils/debugUtils';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const SESSION_VALIDATION_INTERVAL = 5 * 60 * 1000;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isSupabaseEnabled = !!supabase;

  const sessionRef = useRef(null);
  const lastValidationRef = useRef(0);
  const validationIntervalRef = useRef(null);
  const pendingSignOutRef = useRef(null);

  const safeGetItem = useCallback((key) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`useAuth: failed to read ${key}`, error);
      return null;
    }
  }, []);

  const safeSetItem = useCallback((key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`useAuth: failed to write ${key}`, error);
    }
  }, []);

  const safeRemoveItem = useCallback((key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`useAuth: failed to remove ${key}`, error);
    }
  }, []);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSession(null);
    sessionRef.current = null;
    lastValidationRef.current = 0;
    if (pendingSignOutRef.current) {
      clearTimeout(pendingSignOutRef.current);
      pendingSignOutRef.current = null;
    }
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!isSupabaseEnabled || !userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data || null);
    } catch (error) {
      console.error('useAuth: failed to fetch profile', error);
    }
  }, [isSupabaseEnabled]);

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

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('useAuth: session validation error', error);
        if (sessionRef.current) {
          lastValidationRef.current = now;
          return sessionRef.current;
        }
        clearSessionState();
        throw error;
      }

      if (!currentSession?.user) {
        clearSessionState();
        lastValidationRef.current = now;
        return null;
      }

      sessionRef.current = currentSession;
      setSession(currentSession);
      setUser(currentSession.user);
      await fetchUserProfile(currentSession.user.id);
      lastValidationRef.current = now;

      return currentSession;
    } catch (error) {
      console.error('useAuth: error validating session', error);
      if (sessionRef.current) {
        return sessionRef.current;
      }
      clearSessionState();
      return null;
    }
  }, [isSupabaseEnabled, clearSessionState, fetchUserProfile]);

  useEffect(() => {
    let isMounted = true;
    let fallbackTimeout;

    const getInitialSession = async () => {
      if (!isMounted) return;

      try {
        if (!isSupabaseEnabled) {
          DebugLogger.info('AUTH', 'Checking for demo session on page refresh');
          const demoSession = safeGetItem('demo-auth-session');
          DebugLogger.info('AUTH', 'Demo session found:', !!demoSession);

          if (demoSession) {
            try {
              const sessionData = JSON.parse(demoSession);
              DebugLogger.info('AUTH', 'Restoring demo user session:', sessionData.id);
              sessionRef.current = { user: sessionData };
              setSession({ user: sessionData });
              setUser(sessionData);
            } catch (parseError) {
              DebugLogger.error('AUTH', 'Failed to parse demo session:', parseError);
              safeRemoveItem('demo-auth-session');
            }
          } else {
            DebugLogger.info('AUTH', 'No demo session found, user will need to sign in');
          }
          setAuthLoading(false);
          return;
        }

        const { data: { session: freshSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (freshSession?.user) {
          sessionRef.current = freshSession;
          setSession(freshSession);
          setUser(freshSession.user);
          await fetchUserProfile(freshSession.user.id);

          if (!validationIntervalRef.current) {
            validationIntervalRef.current = setInterval(() => {
              validateSession();
            }, SESSION_VALIDATION_INTERVAL);
          }
        } else {
          clearSessionState();
        }
      } catch (error) {
        console.error('useAuth: error getting initial session', error);
        if (!sessionRef.current) {
          clearSessionState();
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
          if (fallbackTimeout) {
            clearTimeout(fallbackTimeout);
          }
        }
      }
    };

    getInitialSession();

    fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        setAuthLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [clearSessionState, fetchUserProfile, isSupabaseEnabled, safeGetItem, validateSession]);

  useEffect(() => {
    if (!isSupabaseEnabled) return undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (pendingSignOutRef.current) {
        clearTimeout(pendingSignOutRef.current);
        pendingSignOutRef.current = null;
      }

      if (!newSession?.user) {
        pendingSignOutRef.current = setTimeout(() => {
          clearSessionState();
        }, 300);
        return;
      }

      sessionRef.current = newSession;
      setSession(newSession);
      setUser(newSession.user);
      await fetchUserProfile(newSession.user.id);

      if (!validationIntervalRef.current) {
        validationIntervalRef.current = setInterval(() => {
          validateSession();
        }, SESSION_VALIDATION_INTERVAL);
      }

      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearSessionState, fetchUserProfile, isSupabaseEnabled, validateSession]);

  useEffect(() => () => {
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }
    if (pendingSignOutRef.current) {
      clearTimeout(pendingSignOutRef.current);
      pendingSignOutRef.current = null;
    }
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
      const demoUser = {
        id: '54276b6c-5255-4117-be95-70c22132591c',
        email,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      };
      DebugLogger.info('AUTH', 'Storing demo user session to localStorage:', demoUser.id);
      safeSetItem('demo-auth-session', JSON.stringify(demoUser));
      setUser(demoUser);
      sessionRef.current = { user: demoUser };
      setSession({ user: demoUser });
      setAuthLoading(false);
      DebugLogger.info('AUTH', 'Demo user signed in', { userId: demoUser.id, email });
      return { data: { user: demoUser, session: { user: demoUser } }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  };

  const signOut = async () => {
    try {
      console.log('🔐 useAuth: Starting sign out process...');
      
      if (isSupabaseEnabled) {
        console.log('🔐 useAuth: Calling supabase.auth.signOut()...');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('🔐 useAuth: Supabase sign out error:', error);
          throw error;
        }
        console.log('🔐 useAuth: Supabase sign out successful');
      }
      
      DebugLogger.info('AUTH', 'Clearing demo session from localStorage');
      safeRemoveItem('demo-auth-session');
      
      // Clear additional auth-related items
      safeRemoveItem('sb-session');
      safeRemoveItem('supabase.auth.token');
      
      console.log('🔐 useAuth: Clearing session state...');
      clearSessionState();
      
      console.log('🔐 useAuth: Sign out process completed successfully');
    } catch (error) {
      console.error('🔐 useAuth: Error during sign out:', error);
      // Even if there's an error, clear the local state
      clearSessionState();
      throw error; // Re-throw so the calling component can handle it
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

    const { data, error } = await supabase.auth.updateUser({
      data: { username }
    });

    if (error) throw error;

    setUser(prev => ({
      ...prev,
      user_metadata: {
        ...prev?.user_metadata,
        username
      }
    }));

    await updateProfile({ username });
    return { data, error: null };
  };

  const value = {
    user,
    profile,
    session,
    authLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateBankroll,
    setUsername,
    validateSession,
    refreshSession: validateSession,
    isSupabaseEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
