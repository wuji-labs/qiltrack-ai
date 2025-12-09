"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

/**
 * Google One Tap 自动登录组件
 *
 * 在用户访问网站时自动显示 Google 账号选择器
 * 允许用户快速使用 Google 账号登录
 *
 * 需要配置环境变量：
 * - NEXT_PUBLIC_GOOGLE_CLIENT_ID: Google OAuth 2.0 Client ID
 */
export function GoogleOneTap() {
  const { isAuthenticated, loading, supabase } = useSupabaseAuth();
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    // 如果已登录或正在加载，不显示 One Tap
    if (isAuthenticated || loading || initialized.current) {
      return;
    }

    // 检查是否有 Google Client ID
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google One Tap: 未配置 NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    // 标记为已初始化，避免重复加载
    initialized.current = true;

    // 加载 Google Identity Services 脚本
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // @ts-ignore - Google Identity Services 全局对象
      if (window.google) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false, // 不自动选择账号
          cancel_on_tap_outside: true, // 点击外部时关闭
        });

        // @ts-ignore
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log("Google One Tap 未显示:", notification.getNotDisplayedReason());
          }
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // 清理脚本
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isAuthenticated, loading]);

  const handleCredentialResponse = async (response: any) => {
    if (!supabase) {
      console.error("Supabase 未初始化");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (error) {
        console.error("Google One Tap 登录失败:", error);
        return;
      }

      if (data) {
        console.log("Google One Tap 登录成功");
        router.refresh();
      }
    } catch (err) {
      console.error("Google One Tap 处理异常:", err);
    }
  };

  return null; // 此组件不渲染任何 UI
}
