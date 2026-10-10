import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const publishableKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const validSupabaseUrl = /^https:\/\//i.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
export const isSupabaseConfigured = Boolean(url && publishableKey && validSupabaseUrl);
export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
