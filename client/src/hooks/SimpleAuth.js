import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, clearTokenCache } from '../lib/supabase';
import logger, { CATEGORIES } from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastSessionId, setLastSessionId] = useState(null);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId) => {
    if (!userId || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Profile doesn't exist yet - this is normal for new users
        if (error.code === 'PGRST116') {
          logger.debug(CATEGORIES.AUTH, 'Profile does not exist yet (new user):', userId);
          setProfile(null);
          return;
        }
        logger.warn(CATEGORIES.AUTH, 'Error fetching profile:', error.message, error.code);
        setProfile(null);
        return;
      }
      
      if (data) {
        logger.debug(CATEGORIES.AUTH, 'Profile fetched:', { id: data.id, username: data.username });
        setProfile(data);
      }
    } catch (err) {
      logger.error(CATEGORIES.AUTH, 'Error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (!supabase) {
      logger.warn(CATEGORIES.AUTH, 'Supabase not configured, running in demo mode');
      setAuthLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.debug(CATEGORIES.AUTH, 'Initial session check:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        userId: session?.user?.id
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        logger.debug(CATEGORIES.AUTH, 'Initial session found, fetching profile');
        fetchProfile(session.user.id);
      } else {
        logger.debug(CATEGORIES.AUTH, 'No initial session found');
        setProfile(null);
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip if session ID hasn't changed (prevents refresh on tab switch)
      const currentSessionId = session?.user?.id;
      if (currentSessionId === lastSessionId && _event === 'SIGNED_IN') {
        return; // Skip duplicate SIGNED_IN events on tab switch
      }
      
      logger.debug(CATEGORIES.AUTH, 'Auth state changed:', _event);
      
      if (!session?.access_token) {
        logger.warn(CATEGORIES.AUTH, 'Session has no access token');
      }
      
      setLastSessionId(currentSessionId);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        logger.debug(CATEGORIES.AUTH, 'User logged in, fetching profile');
        fetchProfile(session.user.id);
      } else {
        logger.debug(CATEGORIES.AUTH, 'User logged out');
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Monitor session expiry and refresh token before it expires
  useEffect(() => {
    if (!session?.expires_at || !supabase) return;

    const checkTokenExpiry = () => {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const fiveMinutesMs = 5 * 60 * 1000;

      if (timeUntilExpiry < fiveMinutesMs && timeUntilExpiry > 0) {
        logger.debug(CATEGORIES.AUTH, 'Token expiring soon, refreshing...');
        supabase.auth.refreshSession().then(({ data, error }) => {
          if (error) {
            logger.warn(CATEGORIES.AUTH, 'Token refresh failed:', error.message);
          } else {
            logger.debug(CATEGORIES.AUTH, 'Token refreshed successfully');
            clearTokenCache();
          }
        });
      }
    };

    // Check token expiry every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    checkTokenExpiry(); // Check immediately on mount

    return () => clearInterval(interval);
  }, [session?.expires_at, supabase]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    logger.debug(CATEGORIES.AUTH, 'Signing in user...');
    
    // Clear plan-related cache
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
    } catch (e) {
      logger.warn(CATEGORIES.AUTH, 'Could not clear cache:', e);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    logger.debug(CATEGORIES.AUTH, 'Sign in successful');
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    logger.debug(CATEGORIES.AUTH, 'Signing up user...');
    
    // Clear plan-related cache
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
    } catch (e) {
      logger.warn(CATEGORIES.AUTH, 'Could not clear cache:', e);
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    
    logger.debug(CATEGORIES.AUTH, 'Sign up successful');
    return data;
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    logger.debug(CATEGORIES.AUTH, 'Signing out user...');
    
    clearTokenCache();
    
    // Clear plan cache on sign out
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      sessionStorage.removeItem('userPlan');
      sessionStorage.removeItem('me');
      sessionStorage.removeItem('plan');
    } catch (e) {
      logger.warn(CATEGORIES.AUTH, 'Could not clear cache on sign out:', e);
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    logger.debug(CATEGORIES.AUTH, 'Sign out completed');
  };

  const setUsername = async (username) => {
    if (!user) {
      logger.error(CATEGORIES.AUTH, 'setUsername: No user signed in');
      return { error: { message: 'Not signed in' } };
    }
    if (!supabase) {
      logger.error(CATEGORIES.AUTH, 'setUsername: Supabase not configured');
      return { error: { message: 'Database not available' } };
    }
    
    logger.debug(CATEGORIES.AUTH, 'Setting username:', username);
    
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        logger.debug(CATEGORIES.AUTH, 'Profile does not exist, creating...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, username: username.trim() });
        
        if (insertError) {
          logger.error(CATEGORIES.AUTH, 'Failed to create profile:', insertError);
          return { error: { message: insertError.message || 'Failed to create profile' } };
        }
      } else {
        logger.debug(CATEGORIES.AUTH, 'Profile exists, updating username...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: username.trim(), updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (updateError) {
          logger.error(CATEGORIES.AUTH, 'Failed to update username:', updateError);
          if (updateError.code === '23505') {
            return { error: { message: 'This username is already in use' } };
          }
          return { error: { message: updateError.message || 'Failed to set username' } };
        }
      }
      
      logger.debug(CATEGORIES.AUTH, 'Username set successfully');
      await fetchProfile(user.id);
      
      return { success: true };
    } catch (err) {
      logger.error(CATEGORIES.AUTH, 'setUsername unexpected error:', err);
      return { error: { message: `An unexpected error occurred: ${err.message}` } };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  };

  const signInWithApple = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    profile,
    authLoading,
    signIn,
    signUp,
    signOut,
    setUsername,
    signInWithGoogle,
    signInWithApple,
    isSupabaseEnabled: !!supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
