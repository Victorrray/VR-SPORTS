// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using mock mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Mock client for development without Supabase
const mockClient = {
  auth: {
    signUp: async () => ({ data: null, error: new Error('Mock mode') }),
    signInWithPassword: async () => ({ data: null, error: new Error('Mock mode') }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: null } })
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: new Error('Mock mode') }),
    update: () => ({ data: null, error: new Error('Mock mode') }),
    delete: () => ({ data: null, error: new Error('Mock mode') })
  })
};

export const db = supabase || mockClient;
export const isSupabaseEnabled = !!supabase;
