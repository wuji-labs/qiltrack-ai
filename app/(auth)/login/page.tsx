"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";

import { useLanguage } from "@/lib/i18n";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Turnstile, useTurnstile } from "@/app/components/Turnstile";
import { GoogleSignInButton } from "@/app/components/GoogleSignInButton";

type EmailStatus = "idle" | "loading" | "sent" | "error" | "cooldown";
type AuthView = "signin" | "signup" | "magic-link" | "reset-password";

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
  const view = (searchParams.get("view") || "signin") as AuthView;

  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const {
    signInWithProvider,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    loading,
    isAuthenticated,
  } = useSupabaseAuth();

  const {
    token: turnstileToken,
    isVerified: isTurnstileVerified,
    handleVerify: handleTurnstileVerify,
    handleExpire: handleTurnstileExpire,
    handleError: handleTurnstileError,
    reset: resetTurnstile,
  } = useTurnstile();

  const isTurnstileEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const banner = useMemo(() => {
    if (message) return message;
    if (requestError) {
      return { type: "error" as const, text: t("auth.error.generic") };
    }
    return null;
  }, [message, requestError, t]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
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

  const handlePasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    // Check Turnstile verification
    if (isTurnstileEnabled && !isTurnstileVerified) {
      setMessage({ type: "error", text: t("auth.error.captchaRequired") });
      return;
    }

    setEmailStatus("loading");

    const result = await signInWithPassword(email, password, turnstileToken ?? undefined);
    if (!result.success) {
      setEmailStatus("error");
      resetTurnstile();
      setMessage({
        type: "error",
        text:
          result.code === "invalid_credentials"
            ? t("auth.error.invalidCredentials")
            : result.code === "captcha_failed"
              ? t("auth.error.captchaFailed")
              : t("auth.error.generic"),
      });
      return;
    }

    router.push("/");
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    // Check Turnstile verification
    if (isTurnstileEnabled && !isTurnstileVerified) {
      setMessage({ type: "error", text: t("auth.error.captchaRequired") });
      return;
    }

    setEmailStatus("loading");

    if (password.length < 8) {
      setEmailStatus("error");
      setMessage({ type: "error", text: t("auth.error.passwordTooShort") });
      return;
    }

    const result = await signUpWithPassword(email, password, turnstileToken ?? undefined);
    if (!result.success) {
      setEmailStatus("error");
      resetTurnstile();
      setMessage({
        type: "error",
        text:
          result.code === "user_already_exists"
            ? t("auth.error.userExists")
            : result.code === "captcha_failed"
              ? t("auth.error.captchaFailed")
              : t("auth.error.generic"),
      });
      return;
    }

    setEmailStatus("sent");
    setMessage({ type: "success", text: t("auth.email.confirmEmail") });
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
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
        setMessage({ type: "error", text: t("auth.error.rateLimited") });
        return;
      }
      setEmailStatus("error");
      setMessage({ type: "error", text: t("auth.error.generic") });
      return;
    }

    setEmailStatus("sent");
    setMessage({ type: "success", text: t("auth.email.sent") });
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setEmailStatus("loading");

    const result = await resetPassword(email);
    if (!result.success) {
      if (result.code === "cooldown") {
        setEmailStatus("cooldown");
        setMessage({ type: "error", text: t("auth.error.rateLimited") });
        return;
      }
      if (result.code === "invalid_email") {
        setEmailStatus("error");
        setMessage({ type: "error", text: t("auth.email.invalid") });
        return;
      }
      setEmailStatus("error");
      setMessage({ type: "error", text: t("auth.error.generic") });
      return;
    }

    setEmailStatus("sent");
    setMessage({ type: "success", text: t("auth.resetPassword.emailSent") });
  };

  const emailDisabled =
    emailStatus === "loading" || emailStatus === "sent" || emailStatus === "cooldown";
  const localSupabase = isLocalSupabase();
  const isSignInView = view === "signin" || view === "magic-link" || view === "reset-password";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800/60 font-bold tracking-[0.16em] text-emerald-200 shadow-lg">
              IA
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{t("auth.hero.title")}</h1>
          </div>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">{t("auth.hero.subtitle")}</p>
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
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-6 space-y-6">
          {/* Tab Navigation - Only show for signin/signup, not for magic-link or reset-password */}
          {(view === "signin" || view === "signup") && (
            <div className="flex gap-2 border-b border-slate-800">
              <Link
                href="/login?view=signin"
                className={`flex-1 py-3 text-center font-semibold transition-colors relative ${
                  view === "signin" ? "text-emerald-400" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {view === "signin" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                )}
                {t("auth.tabs.login")}
              </Link>
              <Link
                href="/login?view=signup"
                className={`flex-1 py-3 text-center font-semibold transition-colors relative ${
                  view === "signup" ? "text-emerald-400" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {view === "signup" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                )}
                {t("auth.tabs.signup")}
              </Link>
            </div>
          )}

          {/* Sign In Form (Password) */}
          {view === "signin" && (
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  {t("auth.signin.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  {t("auth.signin.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Turnstile Widget */}
              {isTurnstileEnabled && (
                <div className="flex justify-center">
                  <Turnstile
                    onVerify={handleTurnstileVerify}
                    onExpire={handleTurnstileExpire}
                    onError={handleTurnstileError}
                    theme="dark"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={emailDisabled || (isTurnstileEnabled && !isTurnstileVerified)}
                className={`w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-600 transition-colors ${
                  emailDisabled || (isTurnstileEnabled && !isTurnstileVerified) ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {emailStatus === "loading" ? t("auth.form.loading") : t("auth.signin.submit")}
              </button>

              <div className="flex justify-center gap-4 text-sm">
                <Link
                  href="/login?view=reset-password"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {t("auth.signin.forgotPassword")}
                </Link>
                <Link
                  href="/login?view=magic-link"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {t("auth.signin.magicLink")}
                </Link>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {view === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="signup-email" className="block text-sm font-medium text-slate-300">
                  {t("auth.signup.email")}
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-slate-300"
                >
                  {t("auth.signup.password")}
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <p className="text-xs text-slate-500">{t("auth.signup.passwordHint")}</p>
              </div>

              {/* Turnstile Widget */}
              {isTurnstileEnabled && (
                <div className="flex justify-center">
                  <Turnstile
                    onVerify={handleTurnstileVerify}
                    onExpire={handleTurnstileExpire}
                    onError={handleTurnstileError}
                    theme="dark"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={emailDisabled || (isTurnstileEnabled && !isTurnstileVerified)}
                className={`w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-600 transition-colors ${
                  emailDisabled || (isTurnstileEnabled && !isTurnstileVerified) ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {emailStatus === "loading" ? t("auth.form.loading") : t("auth.signup.submit")}
              </button>
            </form>
          )}

          {/* Magic Link Form */}
          {view === "magic-link" && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="magic-email" className="block text-sm font-medium text-slate-300">
                  {t("auth.magicLink.email")}
                </label>
                <input
                  id="magic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={emailDisabled}
                className={`w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-600 transition-colors ${
                  emailDisabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {emailStatus === "loading"
                  ? t("auth.form.loading")
                  : emailStatus === "sent"
                    ? t("auth.email.sent")
                    : t("auth.magicLink.submit")}
              </button>

              <div className="text-center">
                <Link
                  href="/login?view=signin"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {t("auth.magicLink.backToPassword")}
                </Link>
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

          {/* Reset Password Form */}
          {view === "reset-password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-400">{t("auth.resetPassword.description")}</p>

              <div className="space-y-2">
                <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300">
                  {t("auth.resetPassword.email")}
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={emailDisabled}
                className={`w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-600 transition-colors ${
                  emailDisabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {emailStatus === "loading"
                  ? t("auth.form.loading")
                  : emailStatus === "sent"
                    ? t("auth.email.sent")
                    : t("auth.resetPassword.submit")}
              </button>

              <div className="text-center">
                <Link
                  href="/login?view=signin"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {t("auth.resetPassword.backToSignin")}
                </Link>
              </div>
            </form>
          )}

          {/* OAuth Buttons - Show for signin, signup, and magic-link, but not reset-password */}
          {view !== "reset-password" && (
            <>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="flex-1 h-px bg-slate-800" />
                {t("auth.modal.or")}
                <span className="flex-1 h-px bg-slate-800" />
              </div>

              <div className="space-y-3">
                <GoogleSignInButton
                  disabled={pendingGoogle}
                  onSuccess={() => {
                    setMessage({ type: "success", text: "登录成功" });
                  }}
                  onError={(error) => {
                    setMessage({ type: "error", text: error || t("auth.error.generic") });
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Links */}
        <p className="text-xs text-slate-500 text-center">
          {view === "signup" ? (
            <>
              {t("auth.signup.agreement")}{" "}
              <Link href="/legal/terms" className="text-emerald-300 hover:underline">
                {t("auth.footer.terms")}
              </Link>{" "}
              {t("auth.footer.connector")}{" "}
              <Link href="/legal/privacy" className="text-emerald-300 hover:underline">
                {t("auth.footer.privacy")}
              </Link>
            </>
          ) : (
            <>
              <Link href="/legal/privacy" className="text-emerald-300 hover:underline">
                {t("auth.footer.privacy")}
              </Link>
              {" • "}
              <Link href="/legal/terms" className="text-emerald-300 hover:underline">
                {t("auth.footer.terms")}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
