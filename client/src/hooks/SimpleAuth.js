import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('⚠️ Error fetching profile:', error.message);
        // Profile doesn't exist yet - this is normal for new users
        setProfile(null);
        return;
      }
      
      if (data) {
        console.log('✅ Profile fetched:', { id: data.id, username: data.username });
        setProfile(data);
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('👤 Initial session found, fetching profile for user:', session.user.id);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔐 Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('👤 User logged in, fetching profile for user:', session.user.id);
        fetchProfile(session.user.id);
      } else {
        console.log('👤 User logged out, clearing profile');
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    console.log('🔐 Signing in user...');
    
    // Clear ONLY plan-related cache (NOT user preferences like bankroll/sportsbooks)
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      console.log('✅ Cleared plan cache before sign in (preserved bankroll & sportsbooks)');
    } catch (e) {
      console.warn('⚠️ Could not clear cache:', e);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    console.log('✅ Sign in successful, plan cache cleared');
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    console.log('📝 Signing up user...');
    
    // Clear ONLY plan-related cache (NOT user preferences like bankroll/sportsbooks)
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      console.log('✅ Cleared plan cache before sign up (preserved bankroll & sportsbooks)');
    } catch (e) {
      console.warn('⚠️ Could not clear cache:', e);
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    
    console.log('✅ Sign up successful, plan cache cleared');
    return data;
  };

  const signOut = async () => {
    console.log('🔐 Signing out user...');
    
    // Clear plan cache on sign out (preserve user preferences like bankroll/sportsbooks)
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      sessionStorage.removeItem('userPlan');
      sessionStorage.removeItem('me');
      sessionStorage.removeItem('plan');
      console.log('✅ Plan cache cleared on sign out (preserved bankroll & sportsbooks)');
    } catch (e) {
      console.warn('⚠️ Could not clear cache on sign out:', e);
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    console.log('✅ Sign out completed');
  };

  const setUsername = async (username) => {
    if (!user) {
      console.error('❌ setUsername: No user signed in');
      return { error: { message: 'Not signed in' } };
    }
    
    console.log('🔄 setUsername: Attempting to set username:', username, 'for user:', user.id);
    
    try {
      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('📝 Profile does not exist, creating...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, username: username.trim() });
        
        if (insertError) {
          console.error('❌ Failed to create profile:', insertError);
          return { error: { message: insertError.message || 'Failed to create profile' } };
        }
      } else {
        // Profile exists, update it
        console.log('✏️ Profile exists, updating username...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: username.trim(), updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('❌ Failed to update username:', updateError);
          if (updateError.code === '23505') {
            return { error: { message: 'This username is already in use' } };
          }
          return { error: { message: updateError.message || 'Failed to set username' } };
        }
      }
      
      // Refresh profile after successful update
      console.log('✅ Username set successfully, refreshing profile...');
      await fetchProfile(user.id);
      
      return { success: true };
    } catch (err) {
      console.error('❌ setUsername unexpected error:', err);
      return { error: { message: `An unexpected error occurred: ${err.message}` } };
    }
  };

  const signInWithGoogle = async () => {
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
    isSupabaseEnabled: true
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
