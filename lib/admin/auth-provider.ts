import { AuthProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

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

    if (!profile || profile.role !== "admin") {
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

    return {
      id: user.id,
      name: profile?.display_name || user.email,
      email: user.email,
      avatar: profile?.avatar_url,
      role: profile?.role,
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

    return profile?.role || "user";
  },
};
