// Auth callback handler for Supabase OAuth flows
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const DEBUG_PRICING = process.env.NODE_ENV === 'development' || 
                     new URLSearchParams(window.location.search).has('debug');

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Get intent from URL params or localStorage
        const urlIntent = searchParams.get('intent');
        const urlReturnTo = searchParams.get('returnTo');
        const storedIntent = JSON.parse(localStorage.getItem('pricingIntent') || 'null');
        
        if (DEBUG_PRICING) {
          console.log('🔍 AuthCallback: URL params:', { intent: urlIntent, returnTo: urlReturnTo });
          console.log('🔍 AuthCallback: Stored intent:', storedIntent);
        }

        // Determine final intent and returnTo
        const finalIntent = urlIntent || storedIntent?.intent;
        const finalReturnTo = urlReturnTo || storedIntent?.returnTo || '/app';

        // Clear stored intent since we're processing it
        localStorage.removeItem('pricingIntent');

        // Route based on intent
        if (finalIntent === 'upgrade') {
          setStatus('Authentication successful! Opening checkout...');
          navigate('/pricing?intent=upgrade&autostart=1', { replace: true });
        } else if (finalIntent === 'start-free') {
          setStatus('Authentication successful! Welcome to your free trial!');
          navigate('/app', { replace: true });
        } else {
          setStatus('Authentication successful! Redirecting...');
          navigate(finalReturnTo, { replace: true });
        }

      } catch (error) {
        console.error('AuthCallback error:', error);
        setStatus('Authentication error. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--accent)',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '12px',
          color: 'var(--text-primary)'
        }}>
          Completing Sign In
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          {status}
        </p>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
