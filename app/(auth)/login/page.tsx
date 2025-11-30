"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";

import { useLanguage } from "@/lib/i18n";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type EmailStatus = "idle" | "loading" | "sent" | "error" | "cooldown";

function isLocalSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return /127\.0\.0\.1|localhost/i.test(url);
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
          <div className="text-base text-slate-400">{`Loading sign-in...`}</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestError = searchParams.get("error");

  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
  const { signInWithProvider, signInWithEmail, loading, isAuthenticated } = useSupabaseAuth();

  const banner = useMemo(() => {
    if (message) return message;
    if (requestError) {
      return { type: "error" as const, text: t("auth.error.generic") };
    }
    return null;
  }, [message, requestError, t]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/account");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (emailStatus === "sent" || emailStatus === "cooldown") {
      const timer = setTimeout(() => setEmailStatus("idle"), 60_000);
      return () => clearTimeout(timer);
    }
    return;
  }, [emailStatus]);

  const handleProvider = async () => {
    setMessage(null);
    setPendingGoogle(true);
    const result = await signInWithProvider("google");
    if (!result.success) {
      setMessage({
        type: "error",
        text: result.code === "cooldown" ? t("auth.error.cooldown") : t("auth.error.generic"),
      });
    }
    setPendingGoogle(false);
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setEmailStatus("loading");
    const result = await signInWithEmail(email);
    if (!result.success) {
      if (result.code === "invalid_email") {
        setEmailStatus("error");
        setMessage({ type: "error", text: t("auth.email.invalid") });
        return;
      }
      if (result.code === "cooldown") {
        setEmailStatus("cooldown");
        setMessage({ type: "error", text: t("auth.error.cooldown") });
        return;
      }
      setEmailStatus("error");
      setMessage({ type: "error", text: t("auth.error.generic") });
      return;
    }

    setEmailStatus("sent");
    setMessage({ type: "success", text: t("auth.email.sent") });
  };

  const emailDisabled = emailStatus === "loading" || emailStatus === "sent" || emailStatus === "cooldown";
  const localSupabase = isLocalSupabase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      {/* 居中单卡片布局 */}
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 font-bold tracking-[0.16em] text-emerald-200 shadow-lg">
            IA
          </div>
          <h1 className="text-2xl font-semibold">{t("auth.hero.title")}</h1>
          <p className="text-sm text-slate-400">{t("auth.hero.subtitle")}</p>
        </div>

        {/* Error/Success Banner */}
        {banner && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              banner.type === "error"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
            }`}
            role="status"
          >
            {banner.text}
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-6 space-y-4">

          {/* Google OAuth - 主要登录方式 */}
          <button
            type="button"
            onClick={handleProvider}
            disabled={pendingGoogle}
            className={`w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-slate-900 px-4 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow ${
              pendingGoogle ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <Image src="/providers/google.svg" alt="google" width={22} height={22} priority />
            <span>{t("auth.provider.google")}</span>
          </button>

          {/* Divider */}
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="flex-1 h-px bg-slate-800" />
            {t("auth.modal.or")}
            <span className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Magic Link Toggle/Form */}
          {!showMagicLinkForm ? (
            <button
              type="button"
              onClick={() => setShowMagicLinkForm(true)}
              className="w-full rounded-2xl border border-slate-800 bg-transparent px-4 py-3 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-700 transition"
            >
              {t("auth.email.useEmail")}
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.email.placeholder")}
                className="w-full rounded-2xl border border-slate-800 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMagicLinkForm(false);
                    setEmailStatus("idle");
                    setMessage(null);
                  }}
                  className="flex-1 rounded-2xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  {t("auth.email.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={emailDisabled}
                  className={`flex-1 rounded-2xl bg-emerald-400 text-slate-950 px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition ${
                    emailDisabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {emailStatus === "loading"
                    ? t("auth.form.loading")
                    : emailStatus === "sent"
                      ? t("auth.email.sent")
                      : t("auth.email.send")}
                </button>
              </div>
              {localSupabase && (
                <p className="text-xs text-emerald-100">
                  {t("auth.email.localHint")}{" "}
                  <Link
                    href="http://127.0.0.1:54324"
                    className="underline decoration-emerald-300 hover:text-emerald-200"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inbucket
                  </Link>
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer Links */}
        <p className="text-xs text-slate-500 text-center">
          {t("auth.footer.prefix")}{" "}
          <Link href="/legal/terms" className="text-emerald-300 hover:underline">
            {t("auth.footer.terms")}
          </Link>{" "}
          {t("auth.footer.connector")}{" "}
          <Link href="/legal/privacy" className="text-emerald-300 hover:underline">
            {t("auth.footer.privacy")}
          </Link>
        </p>
      </div>
    </div>
  );
}
