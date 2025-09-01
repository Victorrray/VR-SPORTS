// src/auth/AuthProvider.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error("Session retrieval error:", error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        let currentUser = session?.user ?? null;
        
        // Check if user has a username set
        if (currentUser && !currentUser.user_metadata?.username) {
          // Try to get username from database first
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", currentUser.id)
              .single();
          
          if (profile?.username) {
            // Update user metadata with database username
            await supabase.auth.updateUser({
              data: { username: profile.username }
            });
            currentUser = { ...currentUser, user_metadata: { ...currentUser.user_metadata, username: profile.username } };
          } else {
            // Fallback to localStorage
            const savedUsername = localStorage.getItem(`username_${currentUser.id}`);
            if (savedUsername) {
              await supabase.auth.updateUser({
                data: { username: savedUsername }
              });
              currentUser = { ...currentUser, user_metadata: { ...currentUser.user_metadata, username: savedUsername } };
            }
          }
          } catch (error) {
            console.error("Error loading username:", error);
          }
        }
        
        setUser(currentUser);
        setLoading(false);
      } catch (outerError) {
        console.error("Auth initialization error:", outerError);
        setUser(null);
        setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      let currentUser = session?.user ?? null;
      
      // Check if user has a username set
      if (currentUser && !currentUser.user_metadata?.username) {
        // Try to get username from database first
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", currentUser.id)
            .single();
          
          if (profile?.username) {
            // Update user metadata with database username
            await supabase.auth.updateUser({
              data: { username: profile.username }
            });
            currentUser = { ...currentUser, user_metadata: { ...currentUser.user_metadata, username: profile.username } };
          } else {
            // Fallback to localStorage
            const savedUsername = localStorage.getItem(`username_${currentUser.id}`);
            if (savedUsername) {
              await supabase.auth.updateUser({
                data: { username: savedUsername }
              });
              currentUser = { ...currentUser, user_metadata: { ...currentUser.user_metadata, username: savedUsername } };
            }
          }
        } catch (error) {
          console.error("Error loading username:", error);
        }
      }
      
      setUser(currentUser);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const setUsername = async (username) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      // Save to database first with proper error handling
      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          username: username.trim(),
          updated_at: new Date().toISOString()
        });

      if (dbError) {
        console.error("Database error:", dbError);
        if (dbError.code === "23505") {
          return { error: 'Username already taken' };
        }
        return { error: `Database error: ${dbError.message}` };
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: username.trim() }
      });
      
      if (authError) {
        console.error("Auth error:", authError);
        return { error: `Auth error: ${authError.message}` };
      }
      
      // Save to localStorage for persistence
      localStorage.setItem(`username_${user.id}`, username.trim());
      
      // Update local user state immediately
      setUser(prev => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, username: username.trim() }
      }));
      
      return { success: true };
    } catch (error) {
      console.error("Unexpected error:", error);
      return { error: error.message };
    }
  };

  const value = {
    user,
    setUsername,
    signInEmail: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUpEmail: (email, password) =>
      supabase.auth.signUp({ email, password }),
    signInWithProvider: (provider = "google") =>
      supabase.auth.signInWithOAuth({ provider }),
    signOut: () => supabase.auth.signOut(),
  };

  if (loading) return null;
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default AuthProvider;
