"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";
import { LANGUAGE_OPTIONS } from "@/lib/i18n-config";

type Preferences = {
	language: string;
	timezone: string;
	emailAlerts: boolean;
	saveHistory: boolean;
};

export default function AccountPage() {
	const router = useRouter();
	const { isAuthenticated, user, getReportCredits, signOut } = useSupabaseAuth();
	const { language, setLanguage, t } = useLanguage();
	const [prefs, setPrefs] = useState<Preferences>({
		language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		emailAlerts: true,
		saveHistory: true,
	});
	const [loaded, setLoaded] = useState(false);
	const [reportCredits, setReportCredits] = useState<{ credits_available: number; credits_used: number } | null>(null);

	const PREF_KEY = "ia-account-preferences";

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(PREF_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Preferences;
				setPrefs((prev) => ({ ...prev, ...parsed }));
			}
		} catch {
			// ignore malformed data
		} finally {
			setLoaded(true);
		}
	}, []);

	useEffect(() => {
		setPrefs((prev) => (prev.language === language ? prev : { ...prev, language }));
	}, [language]);

	useEffect(() => {
		if (!loaded) return;
		window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
	}, [prefs, loaded]);

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4">
				<div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 text-center shadow-xl">
					<h1 className="text-2xl font-semibold">{t("account.page.title")}</h1>
					<p className="text-sm text-subtle">{t("account.page.loginPrompt")}</p>
					<button
						type="button"
						onClick={() => router.push("/login")}
						className="w-full rounded-xl bg-[var(--accent-emerald)] py-2.5 text-base font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] transition hover:brightness-105"
					>
						{t("account.page.signIn")}
					</button>
					<button
						type="button"
						onClick={() => router.push("/")}
						className="w-full rounded-xl border border-[var(--stroke-soft)] py-2.5 text-base text-dim hover:text-[var(--color-foreground)]"
					>
						{t("account.page.returnHome")}
					</button>
				</div>
			</div>
		);
	}

	const avatarInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";

	return (
		<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
			<div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-6">
				<div className="flex items-center gap-3 text-sm text-subtle">
					<Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-3 py-1.5 hover:text-[var(--color-foreground)]">
						<span className="text-base">←</span>
						{t("account.page.backLabel")}
					</Link>
					<span>{t("account.page.title")}</span>
				</div>

				<div className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-6">
					<div className="flex items-center gap-4">
						<span className="h-12 w-12 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--stroke-soft)] overflow-hidden flex items-center justify-center text-base font-semibold text-[var(--accent-emerald)]">
							{avatarInitial}
						</span>
						<div className="flex-1">
							<p className="text-lg font-semibold">{user?.email ?? t("auth.session.fallback")}</p>
							<p className="text-sm text-subtle">
								{t("account.page.planLabel")}: free
							</p>
						</div>
						<button
							type="button"
							onClick={async () => {
								const credits = await getReportCredits();
								if (credits) {
									setReportCredits(credits);
								}
							}}
							className="rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
						>
							{t("account.page.refreshQuota")}
						</button>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-2">
							<p className="text-sm text-subtle">{t("account.page.remainingTitle")}</p>
							<p className="text-3xl font-bold text-[var(--accent-emerald)]">{reportCredits?.credits_available ?? 5}</p>
							<p className="text-sm text-dim">{t("account.page.remainingNote")}</p>
						</div>
						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-2">
							<p className="text-sm text-subtle">{t("account.page.planSectionTitle")}</p>
							<p className="text-base text-[var(--color-foreground)]">
								{t("account.page.planStatus", { plan: "free" })}
							</p>
							<p className="text-sm text-dim">{t("account.page.planNote")}</p>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
							<p className="text-sm text-subtle">{t("account.page.languageLabel")}</p>
							<select
								value={prefs.language}
								onChange={(e) => {
									setPrefs((prev) => ({ ...prev, language: e.target.value }));
									setLanguage(e.target.value as typeof language);
								}}
								className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3 py-2 text-base text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
							>
								{LANGUAGE_OPTIONS.map((option) => (
									<option
										key={option.value}
										value={option.value}
										className="text-[var(--color-foreground)] bg-[var(--bg-base)]"
									>
										{option.label}
									</option>
								))}
							</select>
							<p className="text-xs text-subtle">{t("account.page.subtitle")}</p>
						</div>

						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
							<p className="text-sm text-subtle">{t("account.page.timezoneLabel")}</p>
							<input
								type="text"
								value={prefs.timezone}
								onChange={(e) => setPrefs((prev) => ({ ...prev, timezone: e.target.value }))}
								className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3 py-2 text-base text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
							/>
							<p className="text-xs text-subtle">{t("account.page.timezoneNote")}</p>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
							<p className="text-sm text-subtle">{t("account.page.notificationsLabel")}</p>
							<label className="flex items-center gap-3 text-sm text-[var(--color-foreground)]">
								<input
									type="checkbox"
									checked={prefs.emailAlerts}
									onChange={(e) => setPrefs((prev) => ({ ...prev, emailAlerts: e.target.checked }))}
									className="h-4 w-4 accent-[var(--accent-emerald)]"
								/>
								<span>{t("account.page.emailAlerts")}</span>
							</label>
							<label className="flex items-center gap-3 text-sm text-[var(--color-foreground)]">
								<input
									type="checkbox"
									checked={prefs.saveHistory}
									onChange={(e) => setPrefs((prev) => ({ ...prev, saveHistory: e.target.checked }))}
									className="h-4 w-4 accent-[var(--accent-emerald)]"
								/>
								<span>{t("account.page.saveHistory")}</span>
							</label>
						</div>

						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
							<p className="text-sm text-subtle">{t("account.page.securityLabel")}</p>
							<p className="text-sm text-dim">{t("account.page.securityNote")}</p>
							<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={async () => {
								const credits = await getReportCredits();
								if (credits) {
									setReportCredits(credits);
								}
							}}
							className="rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
						>
							{t("account.page.refreshQuota")}
						</button>
								<button
									type="button"
									onClick={() => {
										try {
											window.localStorage.removeItem("dev-login-email");
										} catch {
											// ignore
										}
									}}
									className="rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
									>
									{t("account.page.clearDevCache")}
								</button>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<Link
							href="/"
							className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
						>
							{t("account.page.returnHome")}
						</Link>
						<button
							type="button"
							onClick={() => signOut()}
							className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-emerald)] px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] hover:brightness-105"
						>
							{t("auth.account.signout")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
