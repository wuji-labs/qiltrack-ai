"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANGUAGE_LABEL, LANGUAGE_ORDER, type Language } from "@/lib/i18n-config";

type NavItem = { label: string; href: string };

type HeroSectionProps = {
	navItems: NavItem[];
	language: Language;
	setLanguage: (lang: Language) => void;
	remainingQuota: number;
	userEmail: string | null;
	userImage: string | null;
	planLabel: string;
	isAuthenticated: boolean;
	onPrimaryCta: () => void;
	onSignOut: () => void;
	t: (key: string, vars?: Record<string, string>) => string;
	belowCta?: ReactNode;
};

export function HeroSection({
	navItems,
	language,
	setLanguage,
	remainingQuota,
	userEmail,
	userImage,
	planLabel,
	isAuthenticated,
	onPrimaryCta,
	onSignOut,
	t,
	belowCta,
}: HeroSectionProps) {
	const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const languageMenuRef = useRef<HTMLDivElement>(null);
	const accountMenuRef = useRef<HTMLDivElement>(null);
	const previewNote = t("cta.preview.note");
	const tagline = t("hero.tagline");

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

	useEffect(() => {
		if (!accountMenuOpen) return;
		const handleClick = (event: MouseEvent) => {
			if (!accountMenuRef.current) return;
			if (!accountMenuRef.current.contains(event.target as Node)) {
				setAccountMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [accountMenuOpen]);

	const avatarInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "A";

	const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
		if (href.startsWith("#")) {
			e.preventDefault();
			const element = document.querySelector(href);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}
	};

	return (
		<section className="w-full">
			<div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 lg:px-10">
				<nav className="flex flex-wrap xl:flex-nowrap justify-between items-center gap-3 sm:gap-4 rounded-2xl border border-[var(--stroke-soft)]/80 bg-[var(--bg-frosted)]/85 px-5 sm:px-10 py-4 sm:py-5 min-h-[72px] backdrop-blur-xl shadow-[0_14px_38px_rgba(0,0,0,0.35)] transition-all duration-300">
					<div className="flex items-center gap-3 min-w-[200px] shrink-0 mr-4">
						<div className="h-11 w-11 rounded-2xl bg-[var(--accent-emerald)] flex items-center justify-center text-[12px] font-black tracking-[0.28em] text-slate-950 shadow-[0_10px_28px_rgba(91,224,176,0.35)]">
							IA
						</div>
						<div className="flex flex-col leading-tight">
							<span className="text-lg sm:text-xl font-semibold tracking-[0.1em] uppercase text-dim">{t("brand.title")}</span>
							{t("brand.subtitle") ? (
								<span className="text-sm text-subtle tracking-[0.12em] uppercase">{t("brand.subtitle")}</span>
							) : null}
						</div>
					</div>

					<div className="hidden xl:flex flex-1 items-center justify-center gap-4 xl:gap-5 text-xs md:text-sm font-semibold uppercase tracking-[0.14em] text-dim whitespace-nowrap">
						{navItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								onClick={(e) => handleNavClick(item.href, e)}
								className="rounded-full px-3 py-2 transition-all duration-200 ease-out relative text-subtle hover:text-[var(--accent-blue)] hover:-translate-y-0.5 hover:bg-[var(--bg-layer)]/70 group"
							>
								{item.label}
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-left" />
							</a>
						))}
					</div>

					<div className="flex flex-1 md:flex-none items-center justify-end gap-2 md:gap-2.5 text-[12px] min-w-[220px] flex-nowrap">
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
						{isAuthenticated && (
							<div ref={accountMenuRef} className="relative">
								<button
									type="button"
									onClick={() => setAccountMenuOpen((open) => !open)}
									className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-2.5 py-1.5 text-sm text-dim transition hover:border-[var(--stroke-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stroke-glow)]/40"
								>
									<span className="h-8 w-8 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--stroke-soft)] overflow-hidden flex items-center justify-center text-xs font-semibold text-[var(--accent-emerald)]">
										{userImage ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={userImage} alt="avatar" className="h-full w-full object-cover" />
										) : (
											avatarInitial
										)}
									</span>
									<span className="text-[var(--color-foreground)] hidden sm:inline-block">{t("auth.account.label").replace(/[:：]$/, "")}</span>
								</button>
								{accountMenuOpen && (
									<div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl space-y-3">
										<div className="flex items-center gap-3">
											<span className="h-10 w-10 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--stroke-soft)] overflow-hidden flex items-center justify-center text-sm font-semibold text-[var(--accent-emerald)]">
												{userImage ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img src={userImage} alt="avatar" className="h-full w-full object-cover" />
												) : (
													avatarInitial
												)}
											</span>
											<div className="flex-1">
												<p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
													{userEmail ?? t("auth.session.fallback")}
												</p>
												<p className="text-xs text-subtle">
													{t("quota.status.session", { email: userEmail ?? t("auth.session.fallback"), plan: planLabel })}
												</p>
											</div>
										</div>
										<div className="grid gap-2 text-sm">
											<button type="button" className="w-full rounded-xl border border-[var(--stroke-soft)] px-3 py-2 text-left text-dim hover:text-[var(--color-foreground)] hover:border-[var(--stroke-glow)]/70">
												{t("pricing.title")}
											</button>
											<Link
												href="/account"
												onClick={() => setAccountMenuOpen(false)}
												className="w-full rounded-xl border border-[var(--stroke-soft)] px-3 py-2 text-left text-dim hover:text-[var(--color-foreground)] hover:border-[var(--stroke-glow)]/70"
											>
												账号设置
											</Link>
										</div>
										<button
											type="button"
											onClick={() => {
												setAccountMenuOpen(false);
												onSignOut();
											}}
											className="w-full rounded-xl bg-[var(--accent-emerald)] text-slate-950 px-3 py-2 text-sm font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.25)] hover:brightness-105"
										>
											{t("auth.account.signout")}
										</button>
									</div>
								)}
							</div>
						)}
						{!isAuthenticated && (
							<button
								type="button"
								onClick={onPrimaryCta}
								className="btn-gradient px-[18px] py-2 text-sm font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(16,185,129,0.45)] active:translate-y-0.5"
							>
								{t("cta.preview")}
								{previewNote && (
									<span className="text-xs font-normal text-slate-900/70 normal-case tracking-normal">
										{previewNote}
									</span>
								)}
							</button>
						)}
					</div>
				</nav>
			</div>
			<div className="h-[120px] sm:h-[140px]" />

			<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
				<div className="lg:hidden px-4 py-2 border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 backdrop-blur-xl overflow-x-auto flex gap-4 text-sm uppercase tracking-[0.2em] text-subtle rounded-2xl mb-4">
					{navItems.map((item) => (
						<a key={item.href} href={item.href} onClick={(e) => handleNavClick(item.href, e)} className="whitespace-nowrap hover:text-[var(--accent-blue)]">
							{item.label}
						</a>
					))}
				</div>
			</div>

			<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
				<section
					id="overview"
					className="relative overflow-hidden rounded-[36px] border border-[var(--stroke-soft)]/80 bg-[var(--bg-layer)]/85 px-5 py-6 sm:px-8 sm:py-9 shadow-[0_16px_60px_rgba(0,0,0,0.32)]"
				>
					<div className="pointer-events-none absolute inset-0 hero-mesh" aria-hidden />
					<div className="relative space-y-7 text-center">
					{tagline ? (
						<div className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)]/90 bg-[var(--bg-layer)]/90 px-4 py-2 text-sm uppercase tracking-[0.24em] text-[var(--accent-emerald)]">
							<span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)]" />
							<span>{tagline}</span>
						</div>
					) : null}

						<div className="space-y-4 text-center">
							<h1 className="text-[2.5rem] sm:text-[3rem] leading-[1.05] font-semibold text-emerald-200">
								{t("hero.title")}
							</h1>
							<p className="mx-auto max-w-3xl text-lg sm:text-xl text-dim leading-relaxed">
								{t("hero.description")}
							</p>
							{t("hero.positioning") ? (
								<p className="text-base uppercase tracking-[0.24em] text-emerald-200/70">{t("hero.positioning")}</p>
							) : null}
							<p className="text-lg font-medium text-[var(--accent-emerald)]">{t("hero.brandline")}</p>
						</div>

						<div className="flex flex-wrap items-center justify-center gap-3 mt-6">
							<button
								type="button"
								onClick={onPrimaryCta}
								className="rounded-full border border-[var(--accent-emerald)]/70 bg-[var(--accent-emerald)]/12 px-6 py-2 text-base font-semibold text-[var(--accent-emerald)] shadow-[0_10px_24px_rgba(91,224,176,0.18)] transition-all duration-200 ease-out hover:bg-[var(--accent-emerald)]/20 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(91,224,176,0.28)] active:translate-y-0.5"
							>
								{t("hero.cta.primary")}
							</button>
							<Link href="/reports" className="btn-ghost px-5 py-2 text-base transition-all duration-200 ease-out hover:-translate-y-0.5">
								<span>{t("hero.cta.secondary")}</span>
								<span className="text-xs text-subtle">↗</span>
							</Link>
						</div>

						{belowCta}
					</div>
				</section>
			</div>
		</section>
	);
}
