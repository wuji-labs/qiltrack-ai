"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_AUTH_ERROR_CODES, getAuthErrorMessage } from "@/lib/auth/supabase-error-codes";

/**
 * RPC function availability cache
 * Prevents repeated existence checks for fn_user_has_password
 */
let rpcFunctionAvailable: boolean | null = null;

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
      code?: "cooldown" | "invalid_email" | "invalid_credentials" | "user_already_exists" | "captcha_failed";
    };

/**
 * 获取认证回调的基础 URL
 * 优先级: NEXT_PUBLIC_AUTH_REDIRECT_URL > NEXT_PUBLIC_SITE_URL > NEXT_PUBLIC_VERCEL_URL > runtime
 *
 * @returns 基础 URL (不含尾部斜杠)
 * @throws 在开发模式下，如果所有环境变量都未配置，会输出 console.warn
 */
function getAuthRedirectBase(): string {
  const base =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;

  if (base) {
    return base.replace(/\/$/, "");
  }

  // 开发模式警告
  if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
    console.warn(
      "[Auth] NEXT_PUBLIC_SITE_URL not configured, using localhost:3000. " +
      "This may cause OAuth/Magic Link callback failures in non-local environments."
    );
  }

  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }

  return window.location.origin;
}

const AUTH_CALLBACK_PATH = "/api/auth/callback";

/**
 * Check if RPC function fn_user_has_password exists
 * Caches result to avoid repeated checks
 * @returns true if function exists, false otherwise
 */
async function checkRpcFunction(supabase: SupabaseClient): Promise<boolean> {
  if (rpcFunctionAvailable !== null) {
    return rpcFunctionAvailable;
  }

  try {
    // Attempt to call RPC (will fail if function doesn't exist)
    const { error } = await supabase.rpc('fn_user_has_password');

    // Check if error indicates function does not exist
    if (error && error.message?.toLowerCase().includes('function') &&
        (error.message?.toLowerCase().includes('does not exist') ||
         error.message?.toLowerCase().includes('not found'))) {
      console.warn(
        '[Auth] RPC function "fn_user_has_password" not found. ' +
        'User authentication method detection will fall back to heuristics. ' +
        'Run: supabase db reset (local) or check migrations (production).'
      );
      rpcFunctionAvailable = false;
    } else {
      rpcFunctionAvailable = true;
    }
  } catch {
    rpcFunctionAvailable = false;
  }

  return rpcFunctionAvailable;
}

/**
 * 映射 Supabase 错误到 AuthResult
 * 优先级: error.code > 字符串匹配 (向后兼容)
 * 使用官方错误代码获取用户友好的错误消息
 */
function mapAuthError(error: unknown): AuthResult {
  if (!error) return { success: false };
  if (typeof error === "object" && error !== null && "message" in error) {
    const status =
      typeof (error as { status?: number }).status === "number"
        ? (error as { status?: number }).status
        : undefined;
    const errorCode =
      typeof (error as { code?: string }).code === "string"
        ? (error as { code?: string }).code
        : undefined;
    const originalMessage = String((error as { message?: string }).message ?? "Unknown error");

    // 使用官方错误代码映射用户友好消息
    const friendlyMessage = errorCode ? getAuthErrorMessage(errorCode) : originalMessage;

    // 映射到内部错误代码 (用于 UI 逻辑判断)
    let internalCode: "cooldown" | "invalid_email" | "invalid_credentials" | "user_already_exists" | "captcha_failed" | undefined;

    // 1. 优先使用 Supabase 官方错误代码
    if (errorCode === SUPABASE_AUTH_ERROR_CODES.RATE_LIMIT || status === 429) {
      internalCode = "cooldown";
    } else if (errorCode === SUPABASE_AUTH_ERROR_CODES.INVALID_EMAIL) {
      internalCode = "invalid_email";
    } else if (errorCode === SUPABASE_AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
      internalCode = "invalid_credentials";
    } else if (errorCode === SUPABASE_AUTH_ERROR_CODES.EMAIL_EXISTS) {
      internalCode = "user_already_exists";
    } else {
      // 2. 回退到字符串匹配 (向后兼容旧版 Supabase 或自定义错误)
      const normalizedMessage = originalMessage.toLowerCase();
      if (normalizedMessage.includes("60 seconds") || normalizedMessage.includes("rate limit")) {
        internalCode = "cooldown";
      } else if (normalizedMessage.includes("invalid email") || normalizedMessage.includes("email address") || normalizedMessage.includes("invalid or missing email")) {
        internalCode = "invalid_email";
      } else if (normalizedMessage.includes("invalid") || normalizedMessage.includes("credentials")) {
        internalCode = "invalid_credentials";
      } else if (normalizedMessage.includes("already") || normalizedMessage.includes("exists")) {
        internalCode = "user_already_exists";
      } else if (normalizedMessage.includes("captcha")) {
        internalCode = "captcha_failed";
      }
    }

    return {
      success: false,
      error: friendlyMessage,
      status,
      code: internalCode,
    };
  }
  return { success: false, error: String(error) };
}

export function useSupabaseAuth() {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const supabase = useMemo(
    () => (hasSupabaseConfig ? createClient() : null),
    [hasSupabaseConfig]
  );
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication method detection
  const [authMethod, setAuthMethod] = useState<AuthMethod>("unknown");
  const [oauthProviders, setOauthProviders] = useState<AuthProviderInfo[]>([]);

  useEffect(() => {
    const getSession = async () => {
      if (!supabase) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }
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

    const { data } =
      supabase?.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);
      }) ?? { data: undefined };

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
  }, [user, supabase]);

  const getUserProfile = useCallback(async () => {
    if (!user || !supabase) return null;

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
    if (!user || !supabase) return null;

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
   * 1. Check RPC function availability
   * 2. Check if user has OAuth identities (Google, GitHub, etc.)
   * 3. If has identities, check if also has password → "oauth" or "password"
   * 4. If no identities, check if has password → "magic_link" or "password"
   * 5. Fallback to heuristics if RPC function not available
   */
  const getAuthMethod = useCallback(async (): Promise<AuthMethod> => {
    if (!user || !supabase) return "unknown";

    try {
      // Check if RPC function is available
      const rpcAvailable = await checkRpcFunction(supabase);

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

        // If RPC not available, fallback to provider-based heuristic
        if (!rpcAvailable) {
          // OAuth users are assumed to not have password unless hybrid auth is explicitly set
          return "oauth";
        }

        // Check if user also has password (hybrid auth)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: hasPassword, error: rpcError } = await (supabase.rpc as any)("fn_user_has_password");

          if (rpcError) {
            console.warn("RPC fn_user_has_password failed - falling back to OAuth", {
              error: rpcError?.message || rpcError,
              code: (rpcError as unknown as { code?: string })?.code,
            });
            // Assume OAuth-only if RPC fails
            return "oauth";
          }

          return hasPassword ? "password" : "oauth";
        } catch (rpcErr) {
          console.warn("RPC 调用异常 - 降级处理:", rpcErr);
          return "oauth";
        }
      }

      // Step 3: No OAuth identities, check if has password
      // If RPC not available, assume password-based auth
      if (!rpcAvailable) {
        return "password";
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: hasPassword, error: rpcError } = await (supabase.rpc as any)("fn_user_has_password");

        if (rpcError) {
          console.warn("RPC fn_user_has_password failed - returning unknown", {
            error: rpcError?.message || rpcError,
            code: (rpcError as unknown as { code?: string })?.code,
          });
          return "unknown";
        }

        return hasPassword ? "password" : "magic_link";
      } catch (rpcErr) {
        console.warn("RPC 调用异常 - 返回 unknown:", rpcErr);
        return "unknown";
      }
    } catch (err) {
      console.error("认证方法检测异常:", err);
      return "unknown";
    }
  }, [user, supabase]);

  const signInWithEmail = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!supabase) return { success: false, error: "Supabase not configured" };
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
    async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
      if (!supabase) return { success: false, error: "Supabase not configured" };
      const trimmedEmail = email.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
        return { success: false, code: "invalid_email" };
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
          options: captchaToken
            ? { captchaToken }
            : undefined,
        });

        if (error) {
          const normalizedMessage = error.message.toLowerCase();
          if (normalizedMessage.includes("captcha")) {
            return { success: false, error: error.message, code: "captcha_failed" };
          }
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
    async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
      if (!supabase) return { success: false, error: "Supabase not configured" };
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
            ...(captchaToken ? { captchaToken } : {}),
          },
        });

        if (error) {
          const normalizedMessage = error.message.toLowerCase();
          if (normalizedMessage.includes("captcha")) {
            return { success: false, error: error.message, code: "captcha_failed" };
          }
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
      if (!supabase) return { success: false, error: "Supabase not configured" };
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
      if (!supabase) return { success: false, error: "Supabase not configured" };
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
    if (!supabase) {
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    }
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
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }
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
