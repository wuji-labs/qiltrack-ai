"use client";

import { useCallback, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session, User } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

export function useSupabaseAuth() {
  const supabase = createClientComponentClient<Database>();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch initial session
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

    // 监听认证状态变化
    const { data } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);
      }
    );

    return () => {
      data?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Get user profile
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

  // Get report credits
  const getReportCredits = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("report_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("获取报告积分失败:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("积分查询异常:", err);
      return null;
    }
  }, [user, supabase]);

  // Sign in with email
  const signInWithEmail = useCallback(
    async (email: string) => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        return { success: true };
      } catch (err) {
        console.error("邮件登录失败:", err);
        return { success: false, error: String(err) };
      }
    },
    [supabase]
  );

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(
    async (provider: "google" | "microsoft" | "apple") => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        return { success: true };
      } catch (err) {
        console.error("OAuth 登录失败:", err);
        return { success: false, error: String(err) };
      }
    },
    [supabase]
  );

  // Sign out
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
      console.error("登出失败:", err);
      return { success: false, error: String(err) };
    }
  }, [supabase]);

  // Refresh session
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
