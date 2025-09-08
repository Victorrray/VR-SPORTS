// Auth callback handler for Supabase OAuth flows
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPricingIntent, clearPricingIntent } from '../lib/intent';

const DEBUG_PRICING = process.env.NODE_ENV === 'development' || 
                     new URLSearchParams(window.location.search).has('debug');

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (loading) {
        if (DEBUG_PRICING) console.log('🔍 AuthCallback: Still loading auth state');
        return;
      }

      try {
        // Get intent from URL params or localStorage
        const urlIntent = searchParams.get('intent');
        const urlReturnTo = searchParams.get('returnTo');
        const storedIntent = getPricingIntent();
        
        if (DEBUG_PRICING) {
          console.log('🔍 AuthCallback: URL params:', { intent: urlIntent, returnTo: urlReturnTo });
          console.log('🔍 AuthCallback: Stored intent:', storedIntent);
          console.log('🔍 AuthCallback: User authenticated:', !!user);
        }

        if (!user) {
          if (DEBUG_PRICING) console.log('🔍 AuthCallback: No user, redirecting to login');
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Determine final intent and returnTo
        const finalIntent = urlIntent || storedIntent?.intent;
        const finalReturnTo = urlReturnTo || storedIntent?.returnTo || '/app';

        if (DEBUG_PRICING) {
          console.log('🔍 AuthCallback: Final routing decision:', { 
            intent: finalIntent, 
            returnTo: finalReturnTo 
          });
        }

        // Clear stored intent since we're processing it
        clearPricingIntent();

        // Route based on intent
        if (finalIntent === 'upgrade') {
          setStatus('Authentication successful! Opening checkout...');
          if (DEBUG_PRICING) console.log('🔍 AuthCallback: Routing to pricing with upgrade intent');
          navigate('/pricing?intent=upgrade&autostart=1');
        } else if (finalIntent === 'start-free') {
          setStatus('Authentication successful! Welcome to your free trial!');
          if (DEBUG_PRICING) console.log('🔍 AuthCallback: Routing to app for free trial');
          navigate('/app');
        } else {
          setStatus('Authentication successful! Redirecting...');
          if (DEBUG_PRICING) console.log('🔍 AuthCallback: Routing to default location:', finalReturnTo);
          navigate(finalReturnTo);
        }

      } catch (error) {
        console.error('AuthCallback error:', error);
        setStatus('Authentication error. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [user, loading, navigate, searchParams]);

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
