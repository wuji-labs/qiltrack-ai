"use client";

import { useCallback, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session, User } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/types/database";

/**
 * Authentication method types
 * - password: User has email+password authentication
 * - oauth: User signed in via OAuth provider (Google, GitHub, etc.)
 * - magic_link: User signed in via passwordless magic link
 * - unknown: Authentication method not yet determined
 */
export type AuthMethod = "password" | "oauth" | "magic_link" | "unknown";

/**
 * OAuth identity provider information
 */
export interface AuthProviderInfo {
  provider: string;
  connected_at: string;
}

type AuthResult =
  | { success: true }
  | {
      success: false;
      error?: string;
      status?: number;
      code?: "cooldown" | "invalid_email" | "invalid_credentials" | "user_already_exists";
    };

/**
 * Get the base URL for auth redirects
 * Priority: 1) NEXT_PUBLIC_AUTH_REDIRECT_URL, 2) NEXT_PUBLIC_SITE_URL, 3) NEXT_PUBLIC_VERCEL_URL, 4) runtime origin
 * Supports multi-worktree with different ports and SSR fallback.
 */
function getAuthRedirectBase(): string {
  const base =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;
  if (base) {
    return base.replace(/\/$/, "");
  }
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }
  return window.location.origin;
}

const AUTH_CALLBACK_PATH = "/api/auth/callback";

function mapAuthError(error: unknown): AuthResult {
  if (!error) return { success: false };
  if (typeof error === "object" && error !== null && "message" in error) {
    const status =
      typeof (error as { status?: number }).status === "number"
        ? (error as { status?: number }).status
        : undefined;
    const code =
      typeof (error as { code?: string }).code === "string"
        ? (error as { code?: string }).code
        : undefined;
    const message = String((error as { message?: string }).message ?? "Unknown error");
    const normalizedMessage = message.toLowerCase();
    return {
      success: false,
      error: message,
      status,
      code:
        status === 429 || code === "over_request_rate_limit"
          ? "cooldown"
          : code === "email_address_invalid" ||
              normalizedMessage.includes("invalid email") ||
              normalizedMessage.includes("email address") ||
              normalizedMessage.includes("invalid or missing email")
            ? "invalid_email"
            : undefined,
    };
  }
  return { success: false, error: String(error) };
}

export function useSupabaseAuth() {
  const supabase = createClientComponentClient<Database>();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication method detection
  const [authMethod, setAuthMethod] = useState<AuthMethod>("unknown");
  const [oauthProviders, setOauthProviders] = useState<AuthProviderInfo[]>([]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("获取会话失败:", error);
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsAuthenticated(!!currentSession);
        }
      } catch (err) {
        console.error("会话检查异常:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(!!currentSession);
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Auto-detect authentication method when user changes
  useEffect(() => {
    if (user) {
      getAuthMethod().then(setAuthMethod);
    } else {
      setAuthMethod("unknown");
      setOauthProviders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getUserProfile = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("获取用户资料失败:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("用户资料查询异常:", err);
      return null;
    }
  }, [user, supabase]);

  const getReportCredits = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("report_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("获取额度失败:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("额度查询异常:", err);
      return null;
    }
  }, [user, supabase]);

  /**
   * Detect user's authentication method
   * Returns: "oauth" | "magic_link" | "password" | "unknown"
   *
   * Logic:
   * 1. Check if user has OAuth identities (Google, GitHub, etc.)
   * 2. If has identities, check if also has password → "oauth" or "password"
   * 3. If no identities, check if has password → "magic_link" or "password"
   */
  const getAuthMethod = useCallback(async (): Promise<AuthMethod> => {
    if (!user) return "unknown";

    try {
      // Step 1: Check for OAuth identities
      const { data: identitiesData, error: identitiesError } =
        await supabase.auth.getUserIdentities();

      if (identitiesError) {
        console.error("获取身份提供商失败:", identitiesError);
        return "unknown";
      }

      const identities = identitiesData?.identities ?? [];

      // Step 2: If has OAuth identities, extract provider info
      if (identities.length > 0) {
        setOauthProviders(
          identities.map((identity) => ({
            provider: identity.provider,
            connected_at: identity.created_at ?? new Date().toISOString(),
          }))
        );

        // Check if user also has password (hybrid auth)
        const { data: hasPassword, error: rpcError } = await supabase.rpc("fn_user_has_password");

        if (rpcError) {
          console.error("检查密码状态失败:", rpcError);
          // Assume OAuth-only if RPC fails
          return "oauth";
        }

        return hasPassword ? "password" : "oauth";
      }

      // Step 3: No OAuth identities, check if has password
      const { data: hasPassword, error: rpcError } = await supabase.rpc("fn_user_has_password");

      if (rpcError) {
        console.error("检查密码状态失败:", rpcError);
        return "unknown";
      }

      return hasPassword ? "password" : "magic_link";
    } catch (err) {
      console.error("认证方法检测异常:", err);
      return "unknown";
    }
  }, [user, supabase]);

  const signInWithEmail = useCallback(
    async (email: string): Promise<AuthResult> => {
      const trimmedEmail = email.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
        return { success: false, code: "invalid_email" };
      }

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            emailRedirectTo: `${getAuthRedirectBase()}${AUTH_CALLBACK_PATH}`,
          },
        });

        if (error) {
          return mapAuthError(error);
        }

        return { success: true };
      } catch (err) {
        console.error("邮箱登录失败:", err);
        return mapAuthError(err);
      }
    },
    [supabase]
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const trimmedEmail = email.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
        return { success: false, code: "invalid_email" };
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          const normalizedMessage = error.message.toLowerCase();
          if (normalizedMessage.includes("invalid") || normalizedMessage.includes("credentials")) {
            return { success: false, error: error.message, code: "invalid_credentials" };
          }
          return mapAuthError(error);
        }

        return { success: true };
      } catch (err) {
        console.error("密码登录失败:", err);
        return mapAuthError(err);
      }
    },
    [supabase]
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const trimmedEmail = email.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
        return { success: false, code: "invalid_email" };
      }

      try {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${getAuthRedirectBase()}${AUTH_CALLBACK_PATH}`,
          },
        });

        if (error) {
          const normalizedMessage = error.message.toLowerCase();
          if (normalizedMessage.includes("already") || normalizedMessage.includes("exists")) {
            return { success: false, error: error.message, code: "user_already_exists" };
          }
          return mapAuthError(error);
        }

        return { success: true };
      } catch (err) {
        console.error("注册失败:", err);
        return mapAuthError(err);
      }
    },
    [supabase]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const trimmedEmail = email.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
        return { success: false, code: "invalid_email" };
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${getAuthRedirectBase()}/account/reset-password`,
        });

        if (error) {
          return mapAuthError(error);
        }

        return { success: true };
      } catch (err) {
        console.error("密码重置失败:", err);
        return mapAuthError(err);
      }
    },
    [supabase]
  );

  const signInWithProvider = useCallback(
    async (provider: "google"): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${getAuthRedirectBase()}${AUTH_CALLBACK_PATH}`,
          },
        });

        if (error) {
          return mapAuthError(error);
        }

        return { success: true };
      } catch (err) {
        console.error("OAuth 登录失败:", err);
        return mapAuthError(err);
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (err) {
      console.error("退出登录失败:", err);
      return { success: false, error: String(err) };
    }
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        throw new Error(error.message);
      }

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
      setIsAuthenticated(!!refreshedSession);

      return { success: true };
    } catch (err) {
      console.error("刷新会话失败:", err);
      return { success: false, error: String(err) };
    }
  }, [supabase]);

  return {
    user,
    session,
    loading,
    isAuthenticated,
    // Authentication method detection
    authMethod,
    oauthProviders,
    getAuthMethod,
    // Authentication functions
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    signInWithProvider,
    signOut,
    refreshSession,
    // User data functions
    getUserProfile,
    getReportCredits,
    supabase,
  };
}
