import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PrivateRoute = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      if (!supabase) {
        if (mounted) {
          setAuthed(false);
          setReady(true);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setAuthed(!!data.session);
        setReady(true);
      } catch (error) {
        console.error('🔐 PrivateRoute: Auth check failed:', error);
        if (mounted) {
          setAuthed(false);
          setReady(true);
        }
      }
    };

    checkAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (!mounted) return;
        setAuthed(!!session);
      });

      return () => { 
        mounted = false; 
        subscription.unsubscribe(); 
      };
    }

    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return (
      <div className="loading-fallback">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
