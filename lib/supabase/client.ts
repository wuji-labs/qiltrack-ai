/**
 * Client-side Supabase client for browser use
 * Use this in React components with "use client" directive
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Create a Supabase client for browser-side operations
 * Handles authentication and session management automatically
 * Safe to use in React components and client-side code
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
