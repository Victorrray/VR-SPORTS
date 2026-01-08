// Auth callback handler for Supabase OAuth flows
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { debugLog, debugRedirectDecision, debugIntentPersistence } from '../lib/debug';

const DEBUG_PRICING = process.env.NODE_ENV === 'development' || 
                     new URLSearchParams(window.location.search).has('debug');

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Clear plan cache for OAuth users (preserve user preferences)
        console.log('🧹 AuthCallback: Clearing plan cache for OAuth user');
        try {
          localStorage.removeItem('userPlan');
          localStorage.removeItem('me');
          localStorage.removeItem('plan');
          sessionStorage.removeItem('userPlan');
          sessionStorage.removeItem('me');
          sessionStorage.removeItem('plan');
          console.log('✅ Plan cache cleared for OAuth user (preserved bankroll & sportsbooks)');
        } catch (e) {
          console.warn('⚠️ Could not clear cache:', e);
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userId = data.session.user?.id;
        console.log('🔐 AuthCallback: User authenticated:', userId);

        // Check if user has a username (for OAuth users who might not have one yet)
        // Note: We skip this check if the profiles table query fails (e.g., RLS issues, table doesn't exist)
        // In that case, we just proceed with the normal flow
        console.log('🔍 AuthCallback: Checking if user has username...');
        let hasUsername = true; // Default to true to avoid blocking users
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

          if (profileError) {
            // If profile doesn't exist or there's an error, don't block the user
            // They can set up their profile later from the account page
            console.log('⚠️ AuthCallback: Could not fetch profile (this is OK for new users):', profileError.message);
            hasUsername = true; // Don't redirect to account setup
          } else {
            hasUsername = !!profileData?.username;
          }
        } catch (err) {
          console.log('⚠️ AuthCallback: Profile check failed, proceeding with login:', err.message);
          hasUsername = true; // Don't block the user
        }
        
        console.log('🔍 AuthCallback: User has username:', hasUsername);

        // Get intent from URL params or localStorage
        const urlIntent = searchParams.get('intent');
        const urlReturnTo = searchParams.get('returnTo');
        const storedIntent = JSON.parse(localStorage.getItem('pricingIntent') || 'null');
        
        debugLog('AUTH_CALLBACK', 'Processing auth callback', {
          urlIntent,
          urlReturnTo,
          storedIntent,
          hasUsername
        });

        // Determine final intent and returnTo
        const finalIntent = urlIntent || storedIntent?.intent;
        let finalReturnTo = urlReturnTo || storedIntent?.returnTo || '/dashboard';

        // Clear stored intent since we're processing it
        localStorage.removeItem('pricingIntent');

        // If user doesn't have a username, redirect to account page to set it up
        if (!hasUsername) {
          console.log('📝 AuthCallback: User needs to set username, redirecting to account...');
          setStatus('Setting up your profile...');
          navigate('/account?setup=username', { replace: true });
          return;
        }

        // Route based on intent
        if (finalIntent === 'upgrade') {
          setStatus('Authentication successful! Opening checkout...');
          debugRedirectDecision('/auth/callback', '/pricing?intent=upgrade&autostart=1', 'upgrade intent');
          navigate('/pricing?intent=upgrade&autostart=1', { replace: true });
        } else if (finalIntent === 'start-free') {
          setStatus('Authentication successful! Welcome to your free trial!');
          debugRedirectDecision('/auth/callback', '/dashboard', 'start-free intent');
          navigate('/dashboard', { replace: true });
        } else {
          setStatus('Authentication successful! Redirecting...');
          debugRedirectDecision('/auth/callback', finalReturnTo, 'default redirect');
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
