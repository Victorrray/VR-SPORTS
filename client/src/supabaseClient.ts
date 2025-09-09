import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string => {
  try {
    // @ts-ignore - import.meta.env may not be available in all environments
    return (import.meta as any)?.env?.[name] || process.env[name.replace('VITE_', 'REACT_APP_')] || '';
  } catch (e) {
    return process.env[name.replace('VITE_', 'REACT_APP_')] || '';
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
