/**
 * Server-side Supabase client utilities
 * Provides createServerClient() for RLS-enabled queries and createServiceRoleClient() for privileged operations
 */

import { createServerClient as createServerClientBase } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Known @supabase/ssr version that getAllCookies() logic is based on
 * MANUAL CHECK REQUIRED: When upgrading @supabase/ssr, verify cookie names haven't changed
 * Check: https://github.com/supabase/ssr/releases
 * Current package.json: "@supabase/ssr": "^0.7.0"
 */
const KNOWN_SUPABASE_SSR_VERSION = '0.7.0';
const COMMON_COOKIE_NAMES = [
  'sb-auth-token',
  'sb-session',
  'sb_auth_token',
  'sb_session',
];

/**
 * Create a Supabase server client with user session (RLS-enabled)
 * Use this in API route handlers to respect row-level security
 * Handles cookies transparently via @supabase/ssr
 *
 * @param cookieGetter Function to get cookie by name from request
 * @param cookieSetter Optional function to set cookies in response (called with [name, value] pairs)
 *
 * Note: @supabase/ssr automatically discovers the session cookie names.
 * We provide a simple pass-through cookie interface without hardcoding names.
 */
type CookieGetter = (name: string) => { value: string } | undefined;
type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  get?: (name: string) => { value: string } | undefined;
};

export function createServerClient(
  cookieSource: CookieStore | CookieGetter,
  cookieSetter?: (cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) => void
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables");
  }

  const isStore =
    typeof cookieSource === "object" && cookieSource !== null && "getAll" in cookieSource;
  const cookieStore = isStore ? (cookieSource as CookieStore) : null;
  const cookieGetter = isStore ? undefined : (cookieSource as CookieGetter);

  // Collect all cookies from request; fall back to a minimal list if only getter is provided
  const getAllCookies = () => {
    if (cookieStore) {
      const allCookies = cookieStore.getAll().map(({ name, value }) => ({ name, value }));

      // Cookie monitoring: warn on anomalous cookie count
      const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-') || c.name.startsWith('sb_'));
      if (supabaseCookies.length > 10) {
        console.warn(
          `[Supabase] Anomalous cookie count detected: ${supabaseCookies.length} cookies starting with 'sb-' or 'sb_'. ` +
          `This may indicate a cookie leak or @supabase/ssr version change (current known version: ${KNOWN_SUPABASE_SSR_VERSION}). ` +
          `Check: https://github.com/supabase/ssr/releases`
        );
      }

      console.log(
        "[DEBUG createServerClient] getAllCookies returned:",
        allCookies.length,
        "cookies"
      );
      return allCookies;
    }

    // Fallback: manually query known cookie names
    const cookieList: Array<{ name: string; value: string }> = [];
    for (const name of COMMON_COOKIE_NAMES) {
      const cookie = cookieGetter?.(name);
      if (cookie?.value) {
        cookieList.push({ name, value: cookie.value });
      }
    }

    console.log(
      "[DEBUG createServerClient] getAllCookies (fallback) returned:",
      cookieList.length,
      "cookies"
    );
    return cookieList;
  };

  return createServerClientBase<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return getAllCookies();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
        // Pass updated cookies to response handler if provided
        if (cookieSetter) {
          // Ensure cookies have proper serialization with all options
          const cookiesWithOptions = cookiesToSet.map((cookie) => ({
            ...cookie,
            options: cookie.options || {
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 7 days
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax" as const,
            },
          }));
          cookieSetter(cookiesWithOptions);
        }
      },
    },
  });
}

/**
 * Create a Supabase service role client (bypasses RLS)
 * Use ONLY for privileged operations like consuming credits, writing audit logs
 * WARNING: Never expose service role key to client
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables");
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Helper to upload file to Storage bucket with signed URL
 * @param client Supabase client instance
 * @param bucket Bucket name
 * @param path File path (e.g., "user_id/run_id.md")
 * @param data File content (string or Blob)
 */
export async function uploadToStorage(
  client: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  path: string,
  data: string | Blob | Buffer
) {
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(path, data, { upsert: true });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Generate signed URL (valid for 7 days)
  const { data: signedUrl, error: signError } = await client.storage
    .from(bucket)
    .createSignedUrl(path, 7 * 24 * 60 * 60);

  if (signError || !signedUrl?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${signError?.message}`);
  }

  return signedUrl.signedUrl;
}

/**
 * Helper to get user's session from request cookies
 * Returns user ID if authenticated, null otherwise
 */
export async function getUserIdFromRequest(supabase: ReturnType<typeof createServerClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// REMOVED: createClient() function was causing confusion
// It returned createServiceRoleClient() but callers expected a user session
// Use createServiceRoleClient() directly for privileged operations
// Use createServerClient(cookies) for user-authenticated operations
