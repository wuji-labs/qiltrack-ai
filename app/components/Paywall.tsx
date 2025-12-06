"use client";

import { useRouter } from "next/navigation";
import { useMembershipTier, type MembershipTier } from "@/hooks/useMembershipTier";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface PaywallProps {
  requiredTier: "pro" | "ultra";
  feature: string;
  description?: string;
  children: React.ReactNode;
}

export function Paywall({ requiredTier, feature, description, children }: PaywallProps) {
  const router = useRouter();
  const { isAuthenticated } = useSupabaseAuth();
  const membership = useMembershipTier();

  // 正在加载会员信息
  if (membership.loading) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/80 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-2 text-subtle">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  // 检查权限
  const hasAccess =
    (requiredTier === "pro" && (membership.isPro || membership.isUltra) && membership.isActive) ||
    (requiredTier === "ultra" && membership.isUltra && membership.isActive);

  // 有权限：直接显示内容
  if (hasAccess) {
    return <>{children}</>;
  }

  // 无权限：显示付费墙
  return (
    <div className="relative">
      {/* 模糊的内容预览 */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>

      {/* 付费墙覆盖层 */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[var(--bg-base)]/95 via-[var(--bg-base)]/98 to-[var(--bg-base)] backdrop-blur-sm rounded-xl">
        <div className="max-w-md p-8 text-center">
          {/* 锁定图标 */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 blur-xl"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
              <svg className="h-8 w-8 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">{feature}</h3>

          {/* 描述 */}
          <p className="text-sm text-subtle mb-6">
            {description || `此功能仅限${requiredTier === "pro" ? "Pro 会员" : "Ultra 会员"}使用`}
          </p>

          {/* 会员等级说明 */}
          <div className="mb-6 rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dim">需要会员等级:</span>
              <span className="font-semibold text-amber-300">
                {requiredTier === "pro" ? "Pro 会员" : "Ultra 会员"}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-3">
            {!isAuthenticated ? (
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-[0_12px_28px_rgba(16,185,129,0.3)] transition-all hover:scale-105 hover:shadow-[0_16px_36px_rgba(16,185,129,0.4)]"
              >
                登录查看
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-base font-semibold text-white shadow-[0_12px_28px_rgba(251,146,60,0.3)] transition-all hover:scale-105 hover:shadow-[0_16px_36px_rgba(251,146,60,0.4)]"
                >
                  立即升级
                </button>

                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full rounded-xl border border-[var(--stroke-soft)] px-6 py-2 text-sm text-subtle transition-colors hover:border-[var(--accent-emerald)]/50 hover:text-[var(--color-foreground)]"
                >
                  查看定价详情
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 简化版Paywall：用于按钮禁用
interface PaywallButtonProps {
  requiredTier: "pro" | "ultra";
  feature: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PaywallButton({ requiredTier, feature, onClick, children, className = "" }: PaywallButtonProps) {
  const router = useRouter();
  const membership = useMembershipTier();
  const { isAuthenticated } = useSupabaseAuth();

  const hasAccess =
    (requiredTier === "pro" && (membership.isPro || membership.isUltra) && membership.isActive) ||
    (requiredTier === "ultra" && membership.isUltra && membership.isActive);

  if (hasAccess) {
    return (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        if (!isAuthenticated) {
          router.push("/login");
        } else {
          router.push("/pricing");
        }
      }}
      className={`${className} relative group`}
      title={`此功能需要${requiredTier === "pro" ? "Pro" : "Ultra"}会员`}
    >
      {children}
      <svg
        className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    </button>
  );
}
