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
      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-100 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            {t("auth.badge.supabase")}
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">{t("auth.hero.title")}</h1>
            <p className="text-lg text-slate-300">{t("auth.hero.subtitle")}</p>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/60 font-bold tracking-[0.16em] text-emerald-200 shadow-inner">
                IA
              </div>
              <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-inner">
                <p className="font-medium text-slate-100">{t("auth.provider.google")}</p>
                <p className="text-xs text-slate-400">{t("auth.provider.google.hint")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{t("auth.badge.supabase")}</p>
                <h2 className="text-xl font-semibold mt-1">{t("auth.hero.title")}</h2>
              </div>
              <span className="rounded-full bg-emerald-400/15 text-emerald-100 px-3 py-1 text-xs font-semibold">
                {t("auth.hero.subtitle")}
              </span>
            </div>

            {banner && (
              <div
                className={`rounded-2xl border px-4 py-3 text-base ${
                  banner.type === "error"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                    : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                }`}
                role="status"
              >
                {banner.text}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleProvider}
              disabled={pendingGoogle}
              className={`w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-slate-900 px-4 py-3 text-base font-semibold shadow-lg shadow-emerald-500/10 transition transform ${
                pendingGoogle ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-emerald-400/30"
              }`}
            >
              <Image src="/providers/google.svg" alt="google" width={22} height={22} priority={false} />
              <span>{t("auth.provider.google")}</span>
            </button>

            <div className="text-sm text-slate-500 flex items-center gap-2">
              <span className="flex-1 h-px bg-slate-800" />
              {t("auth.modal.or")}
              <span className="flex-1 h-px bg-slate-800" />
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
              <label className="text-sm text-slate-300 block">
                <span className="font-medium">{t("auth.email.title")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("auth.email.placeholder")}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-transparent px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={emailDisabled}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-slate-950 py-3 text-base font-semibold transition-opacity ${
                  emailDisabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                }`}
              >
                {emailStatus === "loading"
                  ? t("auth.form.loading")
                  : emailStatus === "sent"
                    ? t("auth.email.sent")
                    : emailStatus === "cooldown"
                      ? t("auth.error.cooldown")
                      : t("auth.email.send")}
              </button>
              {localSupabase ? (
                <p className="text-sm text-emerald-100">
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
              ) : (
                <p className="text-sm text-slate-400">{t("auth.email.hostedHint")}</p>
              )}
            </form>
          </div>

          <p className="text-sm text-slate-500 text-center">
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
    </div>
  );
}
