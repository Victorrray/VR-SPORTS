// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import { diagnoseAuthIssues } from "../utils/authDiagnostics";

const isProd = process.env.NODE_ENV === 'production';

// Support BOTH Vite and CRA env conventions.
const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};

// Try to get Supabase config from environment
const getSupabaseConfig = () => {
  // First try environment variables
  const envUrl = process.env.REACT_APP_SUPABASE_URL || viteEnv?.VITE_SUPABASE_URL;
  const envAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || viteEnv?.VITE_SUPABASE_ANON_KEY;

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

if (!isConfigValid && !isProd) {
  console.warn('Supabase not configured - running in demo mode');
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
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
}

// Export the client (may be null if not configured - that's OK for demo mode)
export const supabase = supabaseClient;

// Export db as alias for supabase (for backward compatibility)
export const db = supabaseClient;

// Export flag indicating if Supabase is enabled
export const isSupabaseEnabled = isConfigValid && supabaseClient !== null;

// Export a lightweight accessor for the current access token
export async function getAccessToken() {
  try {
    if (!supabaseClient) return null;
    
    const { data, error } = await supabaseClient.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return token;
    
    // Fallback: check localStorage
    try {
      const storedSession = localStorage.getItem('sb-oddsightseer-auth');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        const storedToken = parsed?.access_token || parsed?.session?.access_token;
        if (storedToken) return storedToken;
      }
    } catch (_) {}
    
    // Fallback: check alternate storage keys
    const altKeys = ['sb-session', 'supabase.auth.token', 'sb-auth-session'];
    for (const key of altKeys) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const altToken = parsed?.session?.access_token || parsed?.access_token;
          if (altToken) return altToken;
        }
      } catch (_) {}
    }
    
    return null;
  } catch (e) {
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
      return cachedToken;
    }
    
    // Check primary storage key
    const storedSession = localStorage.getItem('sb-oddsightseer-auth');
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      const token = parsed?.access_token || parsed?.session?.access_token;
      if (token) {
        cachedToken = token;
        cachedTokenExpiry = now + 60000;
        return token;
      }
    }
    
    // Check alternate keys
    const altKeys = ['sb-session', 'supabase.auth.token', 'sb-auth-session'];
    for (const key of altKeys) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed?.access_token || parsed?.session?.access_token;
          if (token) {
            cachedToken = token;
            cachedTokenExpiry = now + 60000;
            return token;
          }
        }
      } catch (_) {}
    }
    
    // Last resort: Supabase client's internal session
    if (supabaseClient?.auth?.session?.access_token) {
      const token = supabaseClient.auth.session.access_token;
      cachedToken = token;
      cachedTokenExpiry = now + 60000;
      return token;
    }
  } catch (_) {}
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

