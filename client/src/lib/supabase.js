// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Support BOTH Vite and CRA env conventions.
const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};
const SUPABASE_URL =
  viteEnv?.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  viteEnv?.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase env vars missing. Running in demo mode.");
  console.log("SUPABASE_URL:", SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "Present" : "Missing");
}

// Helpful for OAuth: send users back to your site root after provider auth.
const redirectTo =
  (typeof window !== "undefined" && `${window.location.origin}/`) || undefined;

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce", // best practice for browser apps
  },
  global: {
    headers: { "x-oss-app": "odds-sight-seer" }, // optional: easy header to spot traffic
  },
}) : null;

// Optional: export the redirect so AuthProvider can use it for signInWithOAuth
export const OAUTH_REDIRECT_TO = redirectTo;
