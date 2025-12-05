/**
 * Admin authentication utilities
 * Provides unified admin authentication for API routes
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

export type AdminRole = "super_admin" | "admin" | "editor";

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
  status?: number;
}

/**
 * Get authenticated user from request cookies
 * Uses the new @supabase/ssr library
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return {
        success: false,
        error: "未登录",
        status: 401,
      };
    }

    // Get user profile with role using service role to bypass RLS
    const supabaseAdmin = createServiceRoleClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Failed to get user profile:", profileError);
      return {
        success: false,
        error: "获取用户信息失败",
        status: 500,
      };
    }

    return {
      success: true,
      userId: user.id,
      email: user.email,
      role: profile?.role || "user",
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      success: false,
      error: "认证失败",
      status: 500,
    };
  }
}

/**
 * Require admin role for API access
 * Returns error response if not authorized, or user info if authorized
 */
export async function requireAdmin(
  allowedRoles: AdminRole[] = ["super_admin", "admin", "editor"]
): Promise<AuthResult | NextResponse> {
  const auth = await getAuthenticatedUser();

  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error || "未登录" },
      { status: auth.status || 401 }
    );
  }

  const role = auth.role as string;
  if (!allowedRoles.includes(role as AdminRole)) {
    return NextResponse.json(
      { error: "需要管理员权限" },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Require super admin role for sensitive operations
 */
export async function requireSuperAdmin(): Promise<AuthResult | NextResponse> {
  return requireAdmin(["super_admin"]);
}

/**
 * Check if auth result is an error response
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
