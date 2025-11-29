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

export async function getAuthContext(
  context: SupabaseRequestContext
): Promise<AuthContext> {
  const {
    data: { session },
  } = await context.supabase.auth.getSession();

  if (!session?.user?.id) {
    return { userId: null, role: null };
  }

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("id, role")
    // @ts-expect-error - Supabase type inference issue with user.id in Next.js 16
    .eq("id", session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    role: (profile as any)?.role ?? null,
  };
}

export function isAdminOrEditor(role: AuthContext["role"]) {
  return role === "admin" || role === "editor";
}
