// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Debug logging
console.log('🔧 Initializing Supabase client...');

// Support BOTH Vite and CRA env conventions.
const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};

// Try to get Supabase config from environment
const getSupabaseConfig = () => {
  // First try environment variables
  const envUrl = process.env.REACT_APP_SUPABASE_URL || viteEnv?.VITE_SUPABASE_URL;
  const envAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || viteEnv?.VITE_SUPABASE_ANON_KEY;

  // Log what we found
  console.log('🔍 Supabase Config Check:', {
    'REACT_APP_SUPABASE_URL': !!process.env.REACT_APP_SUPABASE_URL,
    'VITE_SUPABASE_URL': !!viteEnv?.VITE_SUPABASE_URL,
    'REACT_APP_SUPABASE_ANON_KEY': !!process.env.REACT_APP_SUPABASE_ANON_KEY,
    'VITE_SUPABASE_ANON_KEY': !!viteEnv?.VITE_SUPABASE_ANON_KEY,
  });

  return {
    url: envUrl,
    anonKey: envAnonKey
  };
};

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getSupabaseConfig();

// Validate configuration
const isConfigValid = SUPABASE_URL && SUPABASE_ANON_KEY && 
                     SUPABASE_URL.startsWith('http') && 
                     SUPABASE_ANON_KEY.startsWith('ey');

if (!isConfigValid) {
  console.error('❌ Invalid Supabase configuration:', {
    hasUrl: !!SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY,
    urlStartsWithHttp: SUPABASE_URL?.startsWith('http'),
    keyStartsWithEy: SUPABASE_ANON_KEY?.startsWith('ey')
  });
  
  // Fallback to demo mode with clear indication
  console.warn('⚠️ Running in demo mode with no database connectivity');
}

// Create Supabase client with error boundary
let supabaseClient = null;

if (isConfigValid && typeof window !== 'undefined') {
  try {
    console.log('🔌 Creating Supabase client with URL:', 
      SUPABASE_URL.replace(/\/\/([^:]+:)[^@]+@/, '//$1:*****@') // Mask sensitive info
    );
    
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-oddsightseer-auth',
        storage: window.localStorage,
      },
      global: {
        headers: { 
          'x-oss-app': 'odds-sight-seer',
          'Content-Type': 'application/json'
        },
      },
    });

    // Test connection
    supabaseClient.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('🔴 Supabase auth error:', error.message);
        } else {
          console.log('🟢 Supabase connected successfully');
          if (data?.session) {
            console.log('🔑 Active session for user:', data.session.user?.email);
          } else {
            console.log('🔐 No active session - user not authenticated');
          }
        }
      })
      .catch(err => {
        console.error('🔴 Supabase connection test failed:', err.message);
      });
      
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
  }
} else if (typeof window !== 'undefined') {
  console.warn('⚠️ Supabase client not initialized - invalid config or server-side rendering');
}

// Export the client
export const supabase = supabaseClient;

// Helper for auth redirects
export const OAUTH_REDIRECT_TO = 
  (typeof window !== "undefined" && `${window.location.origin}/`) || undefined;

// Log initialization status
console.log(supabase ? '✅ Supabase client created' : '❌ Supabase client creation failed');
