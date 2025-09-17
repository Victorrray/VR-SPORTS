// Authentication hook with Supabase integration
import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
  const [lastValidation, setLastValidation] = useState(Date.now());
  const isSupabaseEnabled = !!supabase;

  // Validate the current session
  const validateSession = useCallback(async () => {
    if (!isSupabaseEnabled || !session) return null;
    
    try {
      const now = Date.now();
      // Only validate if it's been more than 5 minutes since last validation
      if (now - lastValidation < SESSION_VALIDATION_INTERVAL) {
        return session;
      }
      
      console.log('🔐 useAuth: Validating session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 useAuth: Session validation error:', error);
        throw error;
      }
      
      setLastValidation(now);
      
      if (!currentSession?.user) {
        console.log('🔐 useAuth: No valid session found');
        setSession(null);
        setUser(null);
        setProfile(null);
        return null;
      }
      
      // Only update if the user has changed
      if (currentSession.user.id !== session.user?.id) {
        console.log('🔐 useAuth: Session validated, user:', currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchUserProfile(currentSession.user.id);
      }
      
      return currentSession;
    } catch (error) {
      console.error('🔐 useAuth: Error validating session:', error);
      return null;
    }
  }, [session, isSupabaseEnabled, lastValidation]);

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
            const demoSession = localStorage.getItem('demo-auth-session');
            if (demoSession) {
              const sessionData = JSON.parse(demoSession);
              console.log('🔐 useAuth: Found demo session:', sessionData.email);
              if (isMounted) {
                setUser(sessionData);
                setSession({ user: sessionData });
              }
            } else if (isMounted) {
              console.log('🔐 useAuth: No demo session found');
              setUser(null);
              setSession(null);
            }
          } catch (error) {
            console.error('🔐 useAuth: Error parsing demo session:', error);
            if (isMounted) {
              setUser(null);
              setSession(null);
            }
          }
          
          if (isMounted) setLoading(false);
          return;
        }

        // Check for stored session first
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.user) {
              console.log('🔐 useAuth: Found stored session for:', parsedSession.user.email);
              setSession(parsedSession);
              setUser(parsedSession.user);
              await fetchUserProfile(parsedSession.user.id);
              
              // Set up periodic session validation
              validationInterval = setInterval(() => {
                if (isMounted) validateSession();
              }, SESSION_VALIDATION_INTERVAL);
              
              if (isMounted) setLoading(false);
              return;
            }
          } catch (error) {
            console.error('🔐 useAuth: Error parsing stored session:', error);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }

        // If no stored session or invalid, get fresh session
        console.log('🔐 useAuth: No valid stored session, fetching from server');
        const { data: { session: freshSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        console.log('🔐 useAuth: Session received:', !!freshSession, freshSession?.user?.email);
        
        if (isMounted) {
          setSession(freshSession);
          setUser(freshSession?.user || null);
          
          if (freshSession?.user) {
            console.log('🔐 useAuth: Fetching user profile for:', freshSession.user.id);
            await fetchUserProfile(freshSession.user.id);
            
            // Store the session for persistence
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(freshSession));
            
            // Set up periodic session validation
            validationInterval = setInterval(() => {
              if (isMounted) validateSession();
            }, SESSION_VALIDATION_INTERVAL);
          }
        }
      } catch (error) {
        console.error('🔐 useAuth: Error getting session:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
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
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user) {
            console.log('🔐 useAuth: Auth change - fetching profile for:', newSession.user.id);
            
            // Store the session for persistence
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
            
            // Fetch user profile
            await fetchUserProfile(newSession.user.id);
            
            // Set up periodic session validation if not already set
            if (!validationInterval) {
              validationInterval = setInterval(() => {
                if (isMounted) validateSession();
              }, SESSION_VALIDATION_INTERVAL);
            }
          } else {
            // Clear session data on sign out
            console.log('🔐 useAuth: Clearing session data');
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setProfile(null);
            
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
  }, []);

  const fetchUserProfile = async (userId) => {
    if (!isSupabaseEnabled) return;

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
  };

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
      localStorage.setItem('demo-auth-session', JSON.stringify(demoUser));
      
      setUser(demoUser);
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
      setUser(null);
      setProfile(null);
      setSession(null);
      setLastValidation(0);
      
      // Clear all auth-related storage
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('demo-auth-session');
      
      console.log('🔐 useAuth: Successfully signed out');
    } catch (error) {
      console.error('🔐 useAuth: Error during sign out:', error);
      // Ensure all auth state is cleared even if Supabase signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);
      setLastValidation(0);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('demo-auth-session');
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
    lastValidation
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
