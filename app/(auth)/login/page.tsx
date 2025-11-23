"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { useLanguage } from "@/lib/i18n";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const providerButtons = [
	{ id: "google", icon: "☉", labelKey: "auth.provider.google" },
	{ id: "apple", icon: "", labelKey: "auth.provider.apple" },
	{ id: "azure-ad", icon: "◆", labelKey: "auth.provider.microsoft" },
] as const;

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
	const callbackUrl = searchParams.get("callbackUrl") ?? "/";
	const requestError = searchParams.get("error");

	const [pendingProvider, setPendingProvider] = useState<string | null>(null);
	const [email, setEmail] = useState("");
	const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
	const enableDevLogin = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";
	const [devEmail, setDevEmail] = useState("");
	const [devError, setDevError] = useState<string | null>(null);
	const [devLoading, setDevLoading] = useState(false);
	const { signInWithProvider, signInWithEmail } = useSupabaseAuth();

	const errorMessage = requestError ? t("auth.error.generic") : null;
	const successMessage = emailStatus === "sent" ? t("auth.success.magicLink") : null;

	const handleProvider = async (provider: "google" | "github" | "microsoft") => {
		try {
			setPendingProvider(provider);
			const result = await signInWithProvider(provider);
			if (!result.success) {
				console.error("Provider sign-in error:", result.error);
			}
		} finally {
			setPendingProvider(null);
		}
	};

	const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!email) return;
		setEmailStatus("loading");
		try {
			const result = await signInWithEmail(email);
			if (!result.success) {
				setEmailStatus("error");
				return;
			}
			setEmailStatus("sent");
		} catch (err) {
			console.error("Email sign-in failed", err);
			setEmailStatus("error");
		}
	};

	const disabled = emailStatus === "loading";

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-8 space-y-6">
				<div className="flex flex-col items-center gap-2 text-center">
					<div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-300 to-sky-400 flex items-center justify-center font-black tracking-[0.2em] text-slate-950">
						IA
					</div>
					<h1 className="text-2xl font-semibold">{t("auth.page.title")}</h1>
					<p className="text-base text-slate-400">{t("auth.page.subtitle")}</p>
				</div>

				{errorMessage && (
					<div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-base text-amber-200">
						{errorMessage}
					</div>
				)}

				{successMessage && (
					<div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-base text-emerald-200">
						{successMessage}
					</div>
				)}

				<div className="space-y-3">
					{providerButtons.map((provider) => {
						const loading = pendingProvider === provider.id;
						return (
							<button
								key={provider.id}
								type="button"
								onClick={() => handleProvider(provider.id)}
								disabled={loading}
								className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 px-4 py-3 text-base font-medium transition-colors ${
									loading
										? "opacity-60 cursor-not-allowed"
										: "hover:border-emerald-400 hover:bg-slate-900"
								}`}
							>
								<span>{provider.icon}</span>
								<span>{t(provider.labelKey)}</span>
							</button>
						);
					})}
				</div>

				<div className="flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-slate-600">
					<span className="flex-1 h-px bg-slate-800" />
					{t("auth.modal.or")}
					<span className="flex-1 h-px bg-slate-800" />
				</div>

				<form onSubmit={handleEmailSubmit} className="space-y-3">
					<label className="text-sm text-slate-400 block">
						{t("auth.form.email")}
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder={t("auth.form.placeholder")}
							className="mt-1 w-full rounded-2xl border border-slate-800 bg-transparent px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
						/>
					</label>
					<button
						type="submit"
						disabled={disabled}
						className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-slate-950 py-3 text-base font-semibold transition-opacity ${
							disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
						}`}
					>
						{disabled ? t("auth.form.loading") : t("auth.email.button")}
					</button>
					<p className="text-sm text-slate-500">{t("auth.modal.emailHint")}</p>
				</form>

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

				{enableDevLogin && (
					<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
						<div className="text-sm uppercase tracking-[0.22em] text-emerald-300">测试登录</div>
						<p className="text-sm text-slate-400">输入任意邮箱，无需验证，直接登录用于本地调试（配额 1）。</p>
						<form
							onSubmit={async (event) => {
								event.preventDefault();
								const value = devEmail.trim();
								if (!value) {
									setDevError("请填写邮箱");
									return;
								}
								setDevError(null);
								setDevLoading(true);
								const result = await signIn("credentials", {
									redirect: false,
									email: value,
									callbackUrl,
								});
								if (result?.error) {
									setDevError(result.error);
									setDevLoading(false);
									return;
								}
								// 成功后手动跳转，这会触发 session 刷新
								try {
									window.localStorage.setItem("dev-login-email", value);
								} catch {
									// ignore
								}
								window.location.href = callbackUrl;
							}}
							className="space-y-3"
						>
							<label className="text-sm text-slate-400 block">
								邮箱
								<input
									type="email"
									value={devEmail}
									onChange={(event) => setDevEmail(event.target.value)}
									placeholder="test@example.com"
									className="mt-1 w-full rounded-2xl border border-slate-800 bg-transparent px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
								/>
							</label>
							<button
								type="submit"
								disabled={devLoading}
								className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-emerald-100 py-3 text-base font-semibold transition-colors ${
									devLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-emerald-400/20"
								}`}
							>
								{devLoading ? "登录中..." : "一键登录（测试）"}
							</button>
							{devError && (
								<div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
									{devError}
								</div>
							)}
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
