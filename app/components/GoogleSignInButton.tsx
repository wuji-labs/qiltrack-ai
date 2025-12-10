"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Image from "next/image";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  text?: string;
}

interface GoogleCredentialResponse {
  credential: string;
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

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
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

      if (data?.user) {
        console.log("Google 登录成功");

        // 初始化 profile 和 credits（30 积分）
        try {
          const { error: rpcError } = await supabase.rpc("fn_initialize_profile", {
            p_user_id: data.user.id,
            p_email: data.user.email || "",
          } as never);

          if (rpcError) {
            console.error("初始化 profile 失败:", rpcError);
            // 不阻断登录流程
          } else {
            console.log("Profile 初始化成功");
          }
        } catch (err) {
          console.error("调用 fn_initialize_profile 异常:", err);
          // 不阻断登录流程
        }

        onSuccess?.();
        router.refresh();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "登录异常";
      console.error("Google 登录异常:", err);
      onError?.(errorMsg);
    }
  }, [supabase, onSuccess, onError, router]);

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
      // @ts-expect-error - Google Identity Services 全局对象
      if (window.google) {
        // @ts-expect-error - Google Identity Services API
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
  }, [handleCredentialResponse]);

  // 渲染 Google 按钮
  useEffect(() => {
    if (!isGoogleReady) return;

    const buttonContainer = document.getElementById('google-signin-button');
    // @ts-expect-error - Google Identity Services 全局对象
    if (buttonContainer && window.google) {
      // @ts-expect-error - Google Identity Services API
      window.google.accounts.id.renderButton(
        buttonContainer,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: buttonContainer.offsetWidth,
        }
      );
    }
  }, [isGoogleReady]);

  // 如果没有配置 Client ID，显示配置指引
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <div className="border border-dashed border-slate-700 rounded-xl p-4 bg-slate-900/50">
        <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
          <Image src="/providers/google.svg" alt="google" width={18} height={18} priority />
          <span>Google Sign-In is not configured</span>
        </p>
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-400 hover:underline transition-colors">
            Setup instructions
          </summary>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-500">
            <li>Create a Google OAuth app in Google Cloud Console</li>
            <li>Add <code className="bg-slate-800 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code className="bg-slate-800 px-1 py-0.5 rounded">.env.local</code></li>
            <li>Configure authorized redirect URIs in Google Console</li>
          </ol>
          <a
            href="https://supabase.com/docs/guides/auth/social-login/auth-google"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 hover:underline mt-2 inline-block transition-colors"
          >
            View documentation →
          </a>
        </details>
      </div>
    );
  }

  const isButtonDisabled = disabled || !isGoogleReady;

  return (
    <div className="relative w-full">
      {/* 背景：好看的自定义按钮样式 */}
      <div
        className={`w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 px-4 py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all ${
          isButtonDisabled ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        <Image src="/providers/google.svg" alt="google" width={22} height={22} priority />
        <span>{!isGoogleReady ? "加载中..." : text}</span>
      </div>

      {/* 前景：Google 按钮（透明覆盖层，提供实际点击功能） */}
      <div
        id="google-signin-button"
        className="absolute inset-0 opacity-0 cursor-pointer"
        style={{
          pointerEvents: isButtonDisabled ? 'none' : 'auto'
        }}
      />
    </div>
  );
}
