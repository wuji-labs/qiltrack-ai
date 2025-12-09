"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Image from "next/image";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  text?: string;
}

/**
 * Google 登录按钮组件（改进版）
 *
 * 使用 Google Identity Services 替代 Supabase OAuth 重定向
 * 优点：
 * - 用户只看到你的域名（qiltrack.com），不显示 Supabase 域名
 * - 弹窗登录，不跳转页面
 * - 更好的用户体验
 *
 * 需要配置：NEXT_PUBLIC_GOOGLE_CLIENT_ID
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  text = "使用 Google 登录",
}: GoogleSignInButtonProps) {
  const { supabase } = useSupabaseAuth();
  const router = useRouter();
  const initialized = useRef(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google Sign In: 未配置 NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

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
          auto_select: false,
        });
        setIsGoogleReady(true);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    if (!supabase) {
      const errorMsg = "Supabase 未初始化";
      console.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (error) {
        console.error("Google 登录失败:", error);
        onError?.(error.message || "登录失败");
        return;
      }

      if (data) {
        console.log("Google 登录成功");
        onSuccess?.();
        router.refresh();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "登录异常";
      console.error("Google 登录异常:", err);
      onError?.(errorMsg);
    }
  };

  const handleClick = () => {
    if (disabled || !isGoogleReady) return;

    // @ts-ignore - 使用 Google One Tap 弹窗
    if (window.google) {
      // @ts-ignore
      window.google.accounts.id.prompt();
    } else {
      console.error("Google Identity Services 未加载");
      onError?.("Google 登录服务加载失败，请刷新页面重试");
    }
  };

  // 如果没有配置 Client ID，显示降级 UI
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled={true}
        className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-slate-700 text-slate-400 px-4 py-3 text-base font-semibold cursor-not-allowed"
      >
        <Image src="/providers/google.svg" alt="google" width={22} height={22} priority />
        <span>Google 登录未配置</span>
      </button>
    );
  }

  // 恢复原来好看的按钮样式
  const isButtonDisabled = disabled || !isGoogleReady;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={`w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 px-4 py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all ${
        isButtonDisabled ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      <Image src="/providers/google.svg" alt="google" width={22} height={22} priority />
      <span>{!isGoogleReady ? "加载中..." : text}</span>
    </button>
  );
}
