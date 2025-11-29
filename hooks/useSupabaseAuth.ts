"use client";

import { useCallback, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session, User } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/types/database";

type AuthResult =
  | { success: true }
  | { success: false; error?: string; status?: number; code?: "cooldown" | "invalid_email" };

const AUTH_CALLBACK_PATH = "/api/auth/callback";

function mapAuthError(error: unknown): AuthResult {
  if (!error) return { success: false };
  if (typeof error === "object" && error !== null && "message" in error) {
    const status =
      typeof (error as { status?: number }).status === "number"
        ? (error as { status?: number }).status
        : undefined;
    const message = String((error as { message?: string }).message ?? "Unknown error");
    const normalizedMessage = message.toLowerCase();
    return {
      success: false,
      error: message,
      status,
      code:
        status === 429
          ? "cooldown"
          : normalizedMessage.includes("invalid email")
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

  const getUserProfile = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

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
      const { data, error } = await supabase.from("report_credits").select("*").eq("user_id", user.id).single();

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
            emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
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

  const signInWithProvider = useCallback(
    async (provider: "google"): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
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
    signInWithEmail,
    signInWithProvider,
    signOut,
    refreshSession,
    getUserProfile,
    getReportCredits,
    supabase,
  };
}
