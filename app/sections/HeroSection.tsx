"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LANGUAGE_LABEL, LANGUAGE_ORDER, type Language } from "@/lib/i18n-config";

type NavItem = { label: string; href: string };

type HighlightItem = { title: string; description: string };

type HeroSectionProps = {
	navItems: NavItem[];
	highlights: HighlightItem[];
	language: Language;
	setLanguage: (lang: Language) => void;
	remainingQuota: number;
	planLabel: string;
	userEmail: string | null;
	isAuthenticated: boolean;
	onPrimaryCta: () => void;
	onSignOut: () => void;
	t: (key: string, vars?: Record<string, string>) => string;
};

export function HeroSection({
	navItems,
	highlights,
	language,
	setLanguage,
	remainingQuota,
	planLabel,
	userEmail,
	isAuthenticated,
	onPrimaryCta,
	onSignOut,
	t,
}: HeroSectionProps) {
	const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
	const languageMenuRef = useRef<HTMLDivElement>(null);
	const previewNote = t("cta.preview.note");

	useEffect(() => {
		if (!languageMenuOpen) return;
		const handleClick = (event: MouseEvent) => {
			if (!languageMenuRef.current) return;
			if (!languageMenuRef.current.contains(event.target as Node)) {
				setLanguageMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [languageMenuOpen]);

	return (
		<section className="w-full">
			<div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 lg:px-10">
				<nav className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-2xl border border-[var(--stroke-soft)]/70 bg-[var(--bg-frosted)]/80 px-5 sm:px-10 py-4 sm:py-5 min-h-[72px] backdrop-blur-xl shadow-[0_22px_70px_rgba(0,0,0,0.52)] transition-all duration-300">
					<div className="flex items-center gap-3 min-w-[200px] shrink-0 mr-auto">
						<div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] via-[var(--accent-purple)] to-[var(--accent-emerald)] flex items-center justify-center text-[12px] font-black tracking-[0.28em] text-slate-950 shadow-[0_12px_32px_rgba(35,230,161,0.35)]">
							IA
						</div>
						<div className="flex flex-col leading-tight">
							<span className="text-lg sm:text-xl font-semibold tracking-[0.1em] uppercase text-dim">{t("brand.title")}</span>
							{t("brand.subtitle") ? (
								<span className="text-sm text-subtle tracking-[0.12em] uppercase">{t("brand.subtitle")}</span>
							) : null}
						</div>
					</div>

					<div className="hidden xl:flex flex-1 items-center justify-center gap-5 xl:gap-7 text-xs md:text-sm font-semibold uppercase tracking-[0.14em] text-dim">
						{navItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="rounded-full px-3 py-2 transition text-subtle hover:text-[var(--accent-blue)] hover:bg-[var(--bg-layer)]/70"
							>
								{item.label}
							</a>
						))}
					</div>

					<div className="flex flex-1 md:flex-none items-center justify-end gap-2 md:gap-2.5 flex-wrap text-[12px] min-w-[240px]">
						<div ref={languageMenuRef} className="relative">
							<button
								type="button"
								onClick={() => setLanguageMenuOpen((open) => !open)}
								className="inline-flex items-center gap-1.5 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-2 text-sm text-dim transition hover:border-[var(--stroke-glow)] hover:text-[var(--accent-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stroke-glow)]/40"
								aria-haspopup="listbox"
								aria-expanded={languageMenuOpen}
							>
								<span>{LANGUAGE_LABEL[language]}</span>
								<span className="text-xs text-subtle">▾</span>
							</button>
							{languageMenuOpen && (
								<div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 p-1 shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
									<ul role="listbox" className="space-y-1">
										{LANGUAGE_ORDER.map((lang) => (
											<li key={lang}>
												<button
													type="button"
													onClick={() => {
														setLanguage(lang);
														setLanguageMenuOpen(false);
													}}
													className={`w-full text-left rounded-xl px-4 py-2 text-sm tracking-wide transition ${
														lang === language
															? "bg-[var(--bg-layer)] text-[var(--accent-blue)]"
															: "text-dim hover:text-[var(--accent-blue)]"
													}`}
												>
													{LANGUAGE_LABEL[lang]}
												</button>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
						{isAuthenticated ? (
						<div className="flex items-center gap-2.5 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-2.5 text-sm leading-tight">
								<div className="flex flex-col text-subtle">
									<span className="font-medium text-dim">
										{userEmail ?? t("auth.session.fallback")}
									</span>
									<span className="text-xs uppercase tracking-[0.24em] text-[var(--accent-emerald)]">
										{t("auth.cta.remaining", { count: remainingQuota.toString() })}
									</span>
								</div>
								<button
									type="button"
									onClick={onSignOut}
									className="btn-ghost px-3.5 py-1.5 text-sm"
								>
									{t("auth.account.signout")}
								</button>
							</div>
						) : (
							<></>
						)}
						<button
							type="button"
							onClick={onPrimaryCta}
							className="btn-gradient px-[18px] py-2 text-sm font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
						>
							{t("cta.preview")}
							{previewNote && (
								<span className="text-xs font-normal text-slate-900/70 normal-case tracking-normal">
									{previewNote}
								</span>
							)}
						</button>
					</div>
				</nav>
			</div>
			<div className="h-[120px] sm:h-[140px]" />

			<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
				<div className="lg:hidden px-4 py-2 border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 backdrop-blur-xl overflow-x-auto flex gap-4 text-sm uppercase tracking-[0.2em] text-subtle rounded-2xl mb-4">
					{navItems.map((item) => (
						<a key={item.href} href={item.href} className="whitespace-nowrap hover:text-[var(--accent-blue)]">
							{item.label}
						</a>
					))}
				</div>
			</div>

			<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
				<section
					id="overview"
					className="relative overflow-hidden rounded-[40px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-5 py-6 sm:px-8 sm:py-10 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
				>
					<div className="pointer-events-none absolute inset-0 opacity-60">
						<div className="absolute -top-10 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-[var(--accent-blue)] via-[var(--accent-purple)] to-transparent blur-[160px]" />
						<div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-gradient-to-br from-[var(--accent-emerald)]/50 to-transparent blur-[140px]" />
					</div>
					<div className="relative space-y-6">
						<div className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-glow)]/50 bg-[var(--bg-layer)] px-4 py-2 text-sm uppercase tracking-[0.28em] text-[var(--accent-blue)]">
							<span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
							<span>{t("hero.tagline")}</span>
						</div>

						<div className="space-y-4">
							<h1 className="text-[2.5rem] sm:text-[3rem] leading-[1.05] font-semibold text-emerald-200">
								{t("hero.title")}
							</h1>
							<p className="max-w-3xl text-lg sm:text-xl text-dim leading-relaxed">
								{t("hero.description")}
							</p>
							<p className="text-base uppercase tracking-[0.24em] text-emerald-200/70">{t("hero.positioning")}</p>
							<p className="text-lg font-medium text-[var(--accent-emerald)]">{t("hero.brandline")}</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<button type="button" onClick={onPrimaryCta} className="btn-gradient px-6 py-2 text-base">
								{t("hero.cta.primary")}
							</button>
							<a href="#generator" className="btn-ghost px-5 py-2 text-base">
								<span>{t("hero.cta.secondary")}</span>
								<span className="text-xs text-subtle">↗</span>
							</a>
						</div>

						<div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
							<div className="glass-card p-5 sm:p-6 space-y-4">
								<p className="text-sm uppercase tracking-[0.3em] text-subtle">{t("nav.product")}</p>
								<p className="text-lg text-dim leading-relaxed">{t("hero.story")}</p>
								<div className="grid gap-3 text-base text-subtle sm:grid-cols-2">
									<div className="rounded-2xl border border-[var(--stroke-soft)] px-4 py-3">
										<p className="text-sm uppercase tracking-[0.3em] text-subtle">{t("hero.highlight1.title")}</p>
										<p className="mt-1 text-base text-dim">{t("hero.highlight1.description")}</p>
									</div>
									<div className="rounded-2xl border border-[var(--stroke-soft)] px-4 py-3">
										<p className="text-sm uppercase tracking-[0.3em] text-subtle">{t("hero.highlight2.title")}</p>
										<p className="mt-1 text-base text-dim">{t("hero.highlight2.description")}</p>
									</div>
								</div>
							</div>
							<div className="glass-card p-5 sm:p-6 space-y-4 border border-[var(--stroke-glow)]/40">
								<p className="text-sm uppercase tracking-[0.3em] text-emerald-200">{t("hero.quota")}</p>
								<p className="text-3xl font-semibold text-emerald-200">
									{isAuthenticated
										? t("quota.status.heading", { count: remainingQuota.toString() })
										: t("quota.banner.title")}
								</p>
								<p className="text-base text-dim leading-relaxed">
									{isAuthenticated && userEmail
										? t("quota.status.session", { email: userEmail, plan: planLabel })
										: t("quota.banner.description")}
								</p>
								<div className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-glow)]/40 px-3 py-1 text-sm uppercase tracking-[0.26em] text-[var(--accent-emerald)]">
									<span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)] animate-ping" />
									<span>
										{isAuthenticated
											? t("quota.banner.hint.refresh")
											: t("quota.banner.hint.register")}
									</span>
								</div>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-3 text-base">
							{highlights.map((item) => (
								<div key={item.title} className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-4 py-5 text-dim">
									<p className="text-sm uppercase tracking-[0.3em] text-subtle">{item.title}</p>
									<p className="mt-2 leading-relaxed text-base text-dim">{item.description}</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</div>
		</section>
	);
}
