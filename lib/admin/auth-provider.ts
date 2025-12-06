import { AuthProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

/**
 * Supabase Auth Provider for Refine
 *
 * Provides authentication operations for Refine Admin panel
 */
export const authProvider: AuthProvider = {
  /**
   * Login - redirect to Supabase auth
   */
  login: async ({ email, password }) => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error.message,
        },
      };
    }

    return {
      success: true,
      redirectTo: "/admin",
    };
  },

  /**
   * Logout
   */
  logout: async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          name: "LogoutError",
          message: error.message,
        },
      };
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  /**
   * Check authentication status
   */
  check: async () => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = (profile as { role?: string | null } | null)?.role;

    // Check if user has admin privileges (super_admin, admin, editor, developer)
    const adminRoles = ["super_admin", "admin", "editor", "developer"];
    if (!userRole || !adminRoles.includes(userRole)) {
      return {
        authenticated: false,
        redirectTo: "/",
        logout: false,
        error: {
          name: "PermissionError",
          message: "You don't have admin permissions",
        },
      };
    }

    return {
      authenticated: true,
    };
  },

  /**
   * Get error message
   */
  onError: async (error) => {
    console.error("Auth error:", error);
    return { error };
  },

  /**
   * Get user identity
   */
  getIdentity: async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profileData =
      (profile as Partial<Database["public"]["Tables"]["profiles"]["Row"]> | null) ?? null;

    return {
      id: user.id,
      name: profileData?.display_name || user.email,
      email: user.email,
      avatar: profileData?.avatar_url,
      role: profileData?.role,
    };
  },

  /**
   * Get permissions
   */
  getPermissions: async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = (profile as { role?: string | null } | null)?.role;

    return userRole || "user";
  },
};
