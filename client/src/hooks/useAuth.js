// Authentication hook with Supabase integration
import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const isSupabaseEnabled = !!supabase;

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 useAuth: Getting initial session, isSupabaseEnabled:', isSupabaseEnabled);
      
      if (!isSupabaseEnabled) {
        console.log('🔐 useAuth: Supabase disabled - checking localStorage for demo session');
        
        // Check for demo session in localStorage
        try {
          const demoSession = localStorage.getItem('demo-auth-session');
          if (demoSession) {
            const sessionData = JSON.parse(demoSession);
            console.log('🔐 useAuth: Found demo session:', sessionData.email);
            setUser(sessionData);
            setSession({ user: sessionData });
          } else {
            console.log('🔐 useAuth: No demo session found');
            setUser(null);
            setSession(null);
          }
        } catch (error) {
          console.error('🔐 useAuth: Error parsing demo session:', error);
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
        return;
      }

      try {
        console.log('🔐 useAuth: Calling supabase.auth.getSession()');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        console.log('🔐 useAuth: Session received:', !!session, session?.user?.email);
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          console.log('🔐 useAuth: Fetching user profile for:', session.user.id);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('🔐 useAuth: Error getting session:', error);
      } finally {
        console.log('🔐 useAuth: Setting loading to false');
        setLoading(false);
      }
    };

    getInitialSession();

    // Fallback timeout to ensure loading never stays true indefinitely
    const fallbackTimeout = setTimeout(() => {
      console.log('🔐 useAuth: Fallback timeout - forcing loading to false');
      setLoading(false);
    }, 3000);

    // Listen for auth changes
    if (isSupabaseEnabled) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 useAuth: Auth state change:', event, !!session);
          setSession(session);
          setUser(session?.user || null);
          
          if (session?.user) {
            console.log('🔐 useAuth: Auth change - fetching profile for:', session.user.id);
            await fetchUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          console.log('🔐 useAuth: Auth change - setting loading false');
          setLoading(false);
        }
      );

      return () => {
        subscription?.unsubscribe();
        clearTimeout(fallbackTimeout);
      };
    }

    return () => clearTimeout(fallbackTimeout);
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
      
      // Always clear local state regardless of Supabase availability
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Clear any local storage items related to auth
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('demo-auth-session'); // Clear demo session
      
      console.log('🔐 useAuth: Successfully signed out');
    } catch (error) {
      console.error('🔐 useAuth: Error during sign out:', error);
      // Still clear local state even if Supabase signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);
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

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
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
    isAuthenticated: !!user,
    isSupabaseEnabled
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
