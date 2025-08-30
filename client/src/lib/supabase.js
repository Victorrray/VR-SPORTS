// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Support BOTH Vite and CRA env conventions.
const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};
const SUPABASE_URL =
  viteEnv?.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  viteEnv?.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    [
      "Supabase env vars are missing.",
      "In Create React App, add to a file named `.env` in your project root:",
      "",
      "REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL",
      "REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY",
      "",
      "If you migrate to Vite, use:",
      "VITE_SUPABASE_URL=YOUR_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY",
    ].join("\n")
  );
}

// Helpful for OAuth: send users back to your site root after provider auth.
const redirectTo =
  (typeof window !== "undefined" && `${window.location.origin}/`) || undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce", // best practice for browser apps
  },
  global: {
    headers: { "x-oss-app": "odds-sight-seer" }, // optional: easy header to spot traffic
  },
});

// Optional: export the redirect so AuthProvider can use it for signInWithOAuth
export const OAUTH_REDIRECT_TO = redirectTo;
