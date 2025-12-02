import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type CookieBag = Array<{ name: string; value: string; options?: unknown }>;

export type SupabaseRequestContext = {
  supabase: ReturnType<typeof createServerClient>;
  responseCookies: CookieBag;
  applyCookies: (response: NextResponse) => NextResponse;
};

export type AuthContext =
  | {
      userId: string;
      role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
    }
  | { userId: null; role: null };

export function initSupabase(request: NextRequest): SupabaseRequestContext {
  const responseCookies: CookieBag = [];
  const supabase = createServerClient(
    (name: string) => {
      const cookieValue = request.cookies.get(name)?.value;
      return cookieValue ? { value: cookieValue } : undefined;
    },
    (cookies) => {
      responseCookies.push(...cookies);
    }
  );

  const applyCookies = (response: NextResponse) => {
    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });
    return response;
  };

  return { supabase, responseCookies, applyCookies };
}

export async function getAuthContext(context: SupabaseRequestContext): Promise<AuthContext> {
  const {
    data: { session },
  } = await context.supabase.auth.getSession();

  if (!session?.user?.id) {
    return { userId: null, role: null };
  }

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("id, role")
    .eq("id" as never, session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    role:
      (profile as { role?: Database["public"]["Tables"]["profiles"]["Row"]["role"] })?.role ?? null,
  };
}

/**
 * Get auth context from a regular Request object
 * For use in API routes that don't use NextRequest
 */
export async function getAuthContextFromRequest(request: Request): Promise<AuthContext> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return { userId: null, role: null };
  }

  const supabase = createServerClient(
    (name: string) => {
      const cookies = cookieHeader.split("; ");
      for (const cookie of cookies) {
        const [cookieName, ...valueParts] = cookie.split("=");
        if (cookieName === name) {
          return { value: valueParts.join("=") };
        }
      }
      return undefined;
    },
    () => {
      // No-op for read-only context
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { userId: null, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id" as never, session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    role:
      (profile as { role?: Database["public"]["Tables"]["profiles"]["Row"]["role"] })?.role ?? null,
  };
}

export function isAdminOrEditor(role: AuthContext["role"]) {
  return role === "admin" || role === "editor";
}

export function isAdmin(role: AuthContext["role"]) {
  return role === "admin";
}
