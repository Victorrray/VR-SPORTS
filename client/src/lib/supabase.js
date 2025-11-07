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
    if (!supabaseClient) {
      console.warn('⚠️ getAccessToken: Supabase client not initialized');
      return null;
    }
    
    // Try to get session from Supabase
    const { data, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.warn('⚠️ getAccessToken: Error getting session:', error.message);
    }
    
    const token = data?.session?.access_token;
    
    if (token) {
      console.log('✅ getAccessToken: Got token from Supabase session');
      return token;
    }
    
    // Fallback 1: check localStorage for session with correct key
    try {
      const storedSession = localStorage.getItem('sb-oddsightseer-auth');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        const storedToken = parsed?.session?.access_token;
        if (storedToken) {
          console.log('✅ getAccessToken: Got token from localStorage (sb-oddsightseer-auth)');
          return storedToken;
        }
      }
    } catch (e) {
      console.warn('⚠️ getAccessToken: Could not parse sb-oddsightseer-auth');
    }
    
    // Fallback 2: check for alternate storage keys
    try {
      const altKeys = ['sb-session', 'supabase.auth.token', 'sb-auth-session'];
      for (const key of altKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const altToken = parsed?.session?.access_token || parsed?.access_token;
            if (altToken) {
              console.log(`✅ getAccessToken: Got token from localStorage (${key})`);
              return altToken;
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('⚠️ getAccessToken: Could not check alternate storage keys');
    }
    
    console.warn('⚠️ getAccessToken: No token available in any storage location');
    return null;
  } catch (e) {
    console.error('❌ getAccessToken error:', e.message);
    return null;
  }
}

// In-memory token cache to avoid repeated lookups
let cachedToken = null;
let cachedTokenExpiry = 0;

// Synchronous token getter for quick access (checks localStorage and client state)
export function getAccessTokenSync() {
  try {
    // Check in-memory cache first (valid for 1 minute)
    const now = Date.now();
    if (cachedToken && cachedTokenExpiry > now) {
      console.log('✅ getAccessTokenSync: Got token from memory cache');
      return cachedToken;
    }
    
    // Check primary storage key
    const storedSession = localStorage.getItem('sb-oddsightseer-auth');
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      const token = parsed?.session?.access_token;
      if (token) {
        console.log('✅ getAccessTokenSync: Got token from localStorage (sb-oddsightseer-auth)');
        // Cache the token
        cachedToken = token;
        cachedTokenExpiry = now + 60000; // Cache for 1 minute
        return token;
      }
    }
    
    // Check alternate keys
    const altKeys = ['sb-session', 'supabase.auth.token', 'sb-auth-session'];
    for (const key of altKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const token = parsed?.session?.access_token || parsed?.access_token;
          if (token) {
            console.log(`✅ getAccessTokenSync: Got token from localStorage (${key})`);
            // Cache the token
            cachedToken = token;
            cachedTokenExpiry = now + 60000; // Cache for 1 minute
            return token;
          }
        } catch (_) {}
      }
    }
    
    // Last resort: try to get from Supabase client's internal session (synchronously if available)
    if (supabaseClient && supabaseClient.auth.session) {
      const token = supabaseClient.auth.session?.access_token;
      if (token) {
        console.log('✅ getAccessTokenSync: Got token from Supabase client internal session');
        // Cache the token
        cachedToken = token;
        cachedTokenExpiry = now + 60000; // Cache for 1 minute
        return token;
      }
    }
  } catch (e) {
    console.warn('⚠️ getAccessTokenSync error:', e.message);
  }
  console.warn('⚠️ getAccessTokenSync: No token found in any location');
  return null;
}

// Clear token cache when user logs out
export function clearTokenCache() {
  cachedToken = null;
  cachedTokenExpiry = 0;
}

// Helper for auth redirects
export const OAUTH_REDIRECT_TO =
  (typeof window !== "undefined" && `${window.location.origin}/`) || undefined;

if (!isProd) console.log(supabase ? '✅ Supabase client created' : '❌ Supabase client creation failed');
