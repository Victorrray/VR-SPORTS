// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import { diagnoseAuthIssues } from "../utils/authDiagnostics";

const isProd = process.env.NODE_ENV === 'production';
if (!isProd) console.log('🔧 Initializing Supabase client...');

// Support BOTH Vite and CRA env conventions.
const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};

// Try to get Supabase config from environment
const getSupabaseConfig = () => {
  // First try environment variables
  const envUrl = process.env.REACT_APP_SUPABASE_URL || viteEnv?.VITE_SUPABASE_URL;
  const envAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || viteEnv?.VITE_SUPABASE_ANON_KEY;

  // Log what we found
  if (!isProd) {
    console.log('🔍 Supabase Config Check:', {
      'REACT_APP_SUPABASE_URL': !!process.env.REACT_APP_SUPABASE_URL,
      'VITE_SUPABASE_URL': !!viteEnv?.VITE_SUPABASE_URL,
      'REACT_APP_SUPABASE_ANON_KEY': !!process.env.REACT_APP_SUPABASE_ANON_KEY,
      'VITE_SUPABASE_ANON_KEY': !!viteEnv?.VITE_SUPABASE_ANON_KEY,
    });
  }

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
    keyStartsWithEy: SUPABASE_ANON_KEY?.startsWith('ey'),
    actualUrl: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'undefined',
    actualKeyPrefix: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'undefined'
  });
  console.warn('⚠️ Running in demo mode with no database connectivity');
}

// Run diagnostics if in development
if (!isProd && typeof window !== 'undefined') {
  setTimeout(() => diagnoseAuthIssues(), 1000);
}

// Create Supabase client
let supabaseClient = null;

if (isConfigValid && typeof window !== 'undefined') {
  try {
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
    if (!isProd) console.log('✅ Supabase client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
  }
} else if (typeof window !== 'undefined') {
  console.error('❌ Supabase configuration invalid - auth will not work');
}

// Require Supabase to be configured
if (!supabaseClient && typeof window !== 'undefined') {
  throw new Error('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.');
}

// Export the client
export const supabase = supabaseClient;

// Export a lightweight accessor for the current access token
export async function getAccessToken() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    return data?.session?.access_token || null;
  } catch (e) {
    console.error('❌ getAccessToken error:', e.message);
    return null;
  }
}

// Helper for auth redirects
export const OAUTH_REDIRECT_TO =
  (typeof window !== "undefined" && `${window.location.origin}/`) || undefined;

if (!isProd) console.log(supabase ? '✅ Supabase client created' : '❌ Supabase client creation failed');
