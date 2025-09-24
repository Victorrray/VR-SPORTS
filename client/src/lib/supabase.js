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

// Create Supabase client with error boundary
let supabaseClient = null;
let currentAccessToken = null;

if (isConfigValid && typeof window !== 'undefined') {
  try {
    if (!isProd) {
      console.log('🔌 Creating Supabase client with URL:',
        SUPABASE_URL.replace(/\/\/([^:]+:)[^@]+@/, '//$1:*****@')
      );
    }

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

    // Test connection and setup auth state listener
    supabaseClient.auth.getSession()
      .then(({ data, error }) => {
        if (error && !isProd) {
          console.error('🔴 Supabase auth error:', error.message);
        }
        currentAccessToken = data?.session?.access_token || null;
        if (!isProd) {
          if (data?.session) console.log('🟢 Supabase connected successfully');
          else console.log('🔐 No active session - user not authenticated');
        }
      })
      .catch(err => { if (!isProd) console.error('🔴 Supabase connection test failed:', err.message); });

    // Keep a lightweight token cache in sync
    try {
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentAccessToken = session?.access_token || null;
        if (!isProd) {
          console.log('🔄 Auth state changed:', _event, session ? 'authenticated' : 'not authenticated');
        }
      });
    } catch {}
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
  }
} else if (typeof window !== 'undefined') {
  if (!isProd) console.warn('⚠️ Supabase client not initialized - invalid config or server-side rendering');
}

// Demo mode fallback for when Supabase is not configured
const createDemoAuth = () => {
  if (!isProd) console.log('🎭 Setting up demo authentication fallback');

  return {
    // Mock auth methods for demo mode
    signUp: async (email, password) => {
      const demoUser = {
        id: 'demo-' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        user_metadata: { username: email.split('@')[0] }
      };

      localStorage.setItem('demo-auth-session', JSON.stringify(demoUser));
      localStorage.setItem('sb-session', JSON.stringify({ user: demoUser }));

      return { data: { user: demoUser }, error: null };
    },

    signInWithPassword: async (email, password) => {
      const demoUser = {
        id: 'demo-' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        user_metadata: { username: email.split('@')[0] }
      };

      localStorage.setItem('demo-auth-session', JSON.stringify(demoUser));
      localStorage.setItem('sb-session', JSON.stringify({ user: demoUser }));

      return { data: { user: demoUser, session: { user: demoUser } }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('demo-auth-session');
      localStorage.removeItem('sb-session');
      return { error: null };
    },

    getSession: async () => {
      const demoSession = localStorage.getItem('demo-auth-session');
      if (demoSession) {
        const user = JSON.parse(demoSession);
        return {
          data: { session: { user, access_token: 'demo-token' } },
          error: null
        };
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (callback) => {
      // Mock auth state change listener
      const checkSession = () => {
        const demoSession = localStorage.getItem('demo-auth-session');
        callback('SIGNED_IN', demoSession ? { user: JSON.parse(demoSession) } : null);
      };

      checkSession(); // Initial check
      window.addEventListener('storage', checkSession); // Listen for changes

      return {
        data: { subscription: { unsubscribe: () => window.removeEventListener('storage', checkSession) } }
      };
    },

    updateUser: async (data) => {
      const currentSession = localStorage.getItem('demo-auth-session');
      if (currentSession) {
        const user = JSON.parse(currentSession);
        const updatedUser = { ...user, ...data };
        localStorage.setItem('demo-auth-session', JSON.stringify(updatedUser));
        return { data: { user: updatedUser }, error: null };
      }
      return { data: null, error: { message: 'No user session' } };
    }
  };
};

// Use demo auth if Supabase is not configured
if (!supabaseClient && typeof window !== 'undefined') {
  if (!isProd) console.log('🎭 Using demo authentication mode');
  supabaseClient = createDemoAuth();
}

// Export the client
export const supabase = supabaseClient;

// Export a lightweight accessor for the current access token
export function getAccessToken() {
  return currentAccessToken;
}

// Helper for auth redirects
export const OAUTH_REDIRECT_TO =
  (typeof window !== "undefined" && `${window.location.origin}/`) || undefined;

if (!isProd) console.log(supabase ? '✅ Supabase client created' : '❌ Supabase client creation failed');
