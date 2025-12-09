"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import ReferralPanel from "@/app/components/referral/ReferralPanel";

export default function ReferralsPage() {
  const router = useRouter();
  const { isAuthenticated } = useSupabaseAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 text-center shadow-xl">
          <h1 className="text-2xl font-semibold">邀请好友</h1>
          <p className="text-sm text-subtle">请先登录以查看邀请系统</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-[var(--accent-emerald)] py-2.5 text-base font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] transition hover:brightness-105"
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-[var(--stroke-soft)] py-2.5 text-base text-dim hover:text-[var(--color-foreground)]"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 text-sm text-subtle mb-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-3 py-1.5 hover:text-[var(--color-foreground)]"
          >
            <span className="text-base">←</span>
            返回账户
          </Link>
          <span>邀请好友</span>
        </div>

        <ReferralPanel />
      </div>
    </div>
  );
}
