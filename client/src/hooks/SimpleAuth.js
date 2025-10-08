import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
      
      if (data && !error) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
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

  const value = {
    user,
    session,
    profile,
    authLoading,
    signIn,
    signUp,
    signOut,
    setUsername,
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
