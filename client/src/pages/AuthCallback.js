// Auth callback handler for Supabase OAuth flows and email confirmation
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { debugLog, debugRedirectDecision, debugIntentPersistence } from '../lib/debug';

const DEBUG_PRICING = process.env.NODE_ENV === 'development' || 
                     new URLSearchParams(window.location.search).has('debug');

// Parse hash parameters from URL (Supabase uses hash for email confirmation)
const getHashParams = () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'), // 'signup', 'recovery', 'magiclink', etc.
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');
  const [isEmailConfirmation, setIsEmailConfirmation] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for hash parameters (email confirmation, password recovery, etc.)
        const hashParams = getHashParams();
        console.log('🔐 AuthCallback: Hash params:', { 
          hasAccessToken: !!hashParams.accessToken, 
          type: hashParams.type,
          error: hashParams.error 
        });

        // Handle errors from Supabase redirect
        if (hashParams.error) {
          console.error('❌ Auth error from Supabase:', hashParams.error, hashParams.errorDescription);
          setErrorMessage(hashParams.errorDescription || hashParams.error || 'Authentication failed');
          setStatus('Authentication error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Detect email confirmation flow
        if (hashParams.type === 'signup' || hashParams.type === 'email_change') {
          setIsEmailConfirmation(true);
          setStatus('Confirming your email...');
          console.log('📧 AuthCallback: Email confirmation detected');
        } else if (hashParams.type === 'recovery') {
          setStatus('Processing password reset...');
          console.log('🔑 AuthCallback: Password recovery detected');
        }

        // Clear plan cache (preserve user preferences)
        console.log('🧹 AuthCallback: Clearing plan cache');
        try {
          localStorage.removeItem('userPlan');
          localStorage.removeItem('me');
          localStorage.removeItem('plan');
          sessionStorage.removeItem('userPlan');
          sessionStorage.removeItem('me');
          sessionStorage.removeItem('plan');
          console.log('✅ Plan cache cleared (preserved bankroll & sportsbooks)');
        } catch (e) {
          console.warn('⚠️ Could not clear cache:', e);
        }

        // Wait a moment for Supabase to process the hash params
        // This is important because detectSessionInUrl needs time to parse the tokens
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setErrorMessage(sessionError.message || 'Failed to establish session');
          setStatus('Authentication error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!data.session) {
          // If we had hash params but no session, the confirmation might have failed
          if (hashParams.accessToken) {
            console.error('❌ Had access token but no session established');
            setErrorMessage('Email confirmation failed. The link may have expired.');
            setStatus('Confirmation failed');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Email confirmation successful!
        if (isEmailConfirmation || hashParams.type === 'signup') {
          setConfirmationSuccess(true);
          setStatus('Email confirmed successfully!');
          console.log('✅ Email confirmation successful');
          // Give user a moment to see the success message
          await new Promise(resolve => setTimeout(resolve, 1500));
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

  // Determine the icon and title based on state
  const getIcon = () => {
    if (errorMessage) {
      return (
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
      );
    }
    if (confirmationSuccess) {
      return (
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
          animation: 'scaleIn 0.3s ease-out'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      );
    }
    if (isEmailConfirmation) {
      return (
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
      );
    }
    return (
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid var(--accent, #8b5cf6)',
        borderTop: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }} />
    );
  };

  const getTitle = () => {
    if (errorMessage) return 'Authentication Error';
    if (confirmationSuccess) return 'Email Confirmed!';
    if (isEmailConfirmation) return 'Confirming Email';
    return 'Completing Sign In';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1025 50%, #0f0a1e 100%)',
      color: 'var(--text-primary, #ffffff)'
    }}>
      <div style={{
        background: 'rgba(26, 16, 37, 0.8)',
        backdropFilter: 'blur(20px)',
        padding: '48px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.1)'
      }}>
        {getIcon()}
        
        <h2 style={{
          fontSize: '26px',
          fontWeight: '700',
          marginBottom: '12px',
          color: '#ffffff',
          letterSpacing: '-0.5px'
        }}>
          {getTitle()}
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          lineHeight: '1.5'
        }}>
          {status}
        </p>

        {errorMessage && (
          <p style={{
            fontSize: '14px',
            color: '#f87171',
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {errorMessage}
          </p>
        )}

        {confirmationSuccess && (
          <p style={{
            fontSize: '14px',
            color: '#34d399',
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            Your account is now active. Redirecting to dashboard...
          </p>
        )}

        {!confirmationSuccess && !errorMessage && (
          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.5)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.5)', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.5)', animation: 'pulse 1.5s ease-in-out 0.4s infinite' }} />
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
