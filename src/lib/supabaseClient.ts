import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client for data-access helpers. Keeping the client creation
 * centralized avoids duplicating credentials across the app.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL. Please set the environment variable to your Supabase project URL."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY. Please set the environment variable to your Supabase anonymous key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
