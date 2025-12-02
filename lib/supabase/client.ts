/**
 * Client-side Supabase client for browser use
 * Use this in React components with "use client" directive
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

/**
 * Create a Supabase client for browser-side operations
 * Handles authentication and session management automatically
 * Safe to use in React components and client-side code
 */
export function createClient() {
  return createClientComponentClient<Database>();
}
