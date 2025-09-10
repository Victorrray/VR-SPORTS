import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PrivateRoute = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      // In development, allow access to protected routes for testing
      if (!isProduction) {
        console.log('🔐 Development mode: Bypassing auth check');
        if (mounted) {
          setAuthed(true);
          setReady(true);
        }
        return;
      }
      
      if (!supabase) {
        console.error('🔴 Supabase client not initialized');
        if (mounted) {
          setAuthed(false);
          setReady(true);
        }
        return;
      }

      try {
        console.log('🔐 Checking authentication status...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!mounted) return;
        
        const hasSession = !!data.session;
        console.log(`🔐 Authentication check complete. Authenticated: ${hasSession}`);
        
        setAuthed(hasSession);
        setReady(true);
      } catch (error) {
        console.error('🔴 PrivateRoute: Auth check failed:', error);
        if (mounted) {
          setAuthed(false);
          setReady(true);
        }
      }
    };

    checkAuth();

    if (supabase && isProduction) {
      console.log('🔐 Setting up auth state change listener');
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`🔐 Auth state changed: ${event}`, session);
        if (!mounted) return;
        setAuthed(!!session);
      });

      return () => { 
        console.log('🔐 Cleaning up auth listener');
        mounted = false; 
        subscription?.unsubscribe(); 
      };
    }

    return () => { 
      console.log('🔐 Cleaning up PrivateRoute');
      mounted = false; 
    };
  }, [isProduction]);

  if (!ready) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!authed) {
    // Redirect unauthenticated users to the landing page (never force-login)
    console.log(`🔐 Redirecting to landing from ${location.pathname}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
