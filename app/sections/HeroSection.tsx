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
	onSmoothScroll?: (href: string) => void;
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
	onSmoothScroll,
	onSignOut,
	t,
	belowCta,
}: HeroSectionProps) {
	const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
	const languageMenuRef = useRef<HTMLDivElement>(null);
	const accountMenuRef = useRef<HTMLDivElement>(null);
	const mobileDrawerRef = useRef<HTMLDivElement>(null);
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

	useEffect(() => {
		if (!mobileDrawerOpen) return;
		const handleClick = (event: MouseEvent) => {
			if (!mobileDrawerRef.current) return;
			if (!mobileDrawerRef.current.contains(event.target as Node)) {
				setMobileDrawerOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [mobileDrawerOpen]);

	const avatarInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "A";

	const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
		if (href.startsWith("#")) {
			e.preventDefault();
			if (onSmoothScroll) {
				onSmoothScroll(href);
			} else {
				const element = document.querySelector(href);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}
		}
	};

	return (
		<section className="w-full overflow-x-hidden">
			<div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 lg:px-10">
				<nav className="flex flex-wrap xl:flex-nowrap justify-between items-center gap-2 sm:gap-4 rounded-2xl border border-[var(--stroke-soft)]/80 bg-[var(--bg-frosted)]/85 px-3 sm:px-10 py-3 sm:py-5 min-h-[72px] backdrop-blur-xl shadow-[0_14px_38px_rgba(0,0,0,0.35)] transition-all duration-300 min-w-0">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
						<div className="h-9 sm:h-11 w-9 sm:w-11 rounded-2xl bg-[var(--accent-emerald)] flex items-center justify-center text-[10px] sm:text-[12px] font-black tracking-[0.28em] text-slate-950 shadow-[0_10px_28px_rgba(91,224,176,0.35)] flex-shrink-0">
							IA
						</div>
						<div className="flex flex-col leading-tight min-w-0">
							<span className="text-sm sm:text-lg font-semibold tracking-[0.1em] uppercase text-dim truncate">{t("brand.title")}</span>
							{t("brand.subtitle") ? (
								<span className="text-xs sm:text-sm text-subtle tracking-[0.12em] uppercase truncate">{t("brand.subtitle")}</span>
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

					{/* 桌面端：语言 + 账户 + 登录（lg:以上显示） */}
					<div className="hidden lg:flex items-center justify-end gap-1.5 sm:gap-2 text-[12px] flex-nowrap min-w-0">
						<div ref={languageMenuRef} className="relative">
							<button
								type="button"
								onClick={() => setLanguageMenuOpen((open) => !open)}
								className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-dim transition hover:border-[var(--stroke-glow)] hover:text-[var(--accent-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stroke-glow)]/40 whitespace-nowrap min-h-[44px]"
								aria-haspopup="listbox"
								aria-expanded={languageMenuOpen}
							>
								<span>{LANGUAGE_LABEL[language]}</span>
								<span className="text-xs text-subtle">▾</span>
							</button>
							{languageMenuOpen && (
								<div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 p-1 shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl z-50">
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
									className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-1.5 sm:px-2.5 py-1.5 text-sm text-dim transition hover:border-[var(--stroke-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stroke-glow)]/40 min-h-[44px]"
								>
									<span className="h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--stroke-soft)] overflow-hidden flex items-center justify-center text-xs font-semibold text-[var(--accent-emerald)] flex-shrink-0">
										{userImage ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={userImage} alt="avatar" className="h-full w-full object-cover" />
										) : (
											avatarInitial
										)}
									</span>
									<span className="text-[var(--color-foreground)] text-sm">{t("auth.account.label").replace(/[:：]$/, "")}</span>
								</button>
								{accountMenuOpen && (
									<div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl space-y-3 z-50">
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
								className="btn-gradient px-[18px] py-2 text-sm font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(16,185,129,0.45)] active:translate-y-0.5 min-h-[44px]"
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

					{/* 移动端：汉堡菜单（lg:以下显示） */}
					<div className="lg:hidden">
						<button
							type="button"
							onClick={() => setMobileDrawerOpen((open) => !open)}
							className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] text-dim transition hover:border-[var(--stroke-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stroke-glow)]/40 min-h-[44px]"
							aria-haspopup="dialog"
							aria-expanded={mobileDrawerOpen}
						>
							<span className="sr-only">Open navigation menu</span>
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>
				</nav>

				{/* 移动端抽屉（lg:以下在汉堡菜单打开时显示） */}
				{mobileDrawerOpen && (
					<div
						ref={mobileDrawerRef}
						className="fixed inset-0 z-40 lg:hidden"
						style={{ top: "calc(100% + 12px)" }}
					>
						<div className="absolute right-4 top-0 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl space-y-4">
							{/* 导航项 */}
							<div className="space-y-1 border-b border-[var(--stroke-soft)] pb-4">
								<p className="text-xs uppercase tracking-[0.2em] text-subtle px-3 py-1">Navigation</p>
								{navItems.map((item) => (
									<a
										key={item.href}
										href={item.href}
										onClick={(e) => {
											handleNavClick(item.href, e);
											setMobileDrawerOpen(false);
										}}
										className="block px-4 py-2.5 text-sm rounded-lg text-dim hover:text-[var(--accent-blue)] hover:bg-[var(--bg-layer)]/50 transition"
									>
										{item.label}
									</a>
								))}
							</div>

							{/* 语言选择 */}
							<div className="space-y-1 border-b border-[var(--stroke-soft)] pb-4">
								<p className="text-xs uppercase tracking-[0.2em] text-subtle px-3 py-1">Language</p>
								{LANGUAGE_ORDER.map((lang) => (
									<button
										key={lang}
										type="button"
										onClick={() => {
											setLanguage(lang);
											setMobileDrawerOpen(false);
										}}
										className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition ${
											lang === language
												? "bg-[var(--bg-layer)] text-[var(--accent-emerald)]"
												: "text-dim hover:text-[var(--accent-blue)] hover:bg-[var(--bg-layer)]/50"
										}`}
									>
										{LANGUAGE_LABEL[lang]}
									</button>
								))}
							</div>

							{/* 账户菜单 */}
							{isAuthenticated && (
								<div className="space-y-1 border-b border-[var(--stroke-soft)] pb-4">
									<div className="flex items-center gap-2 px-3 py-2">
										<span className="h-8 w-8 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--stroke-soft)] overflow-hidden flex items-center justify-center text-xs font-semibold text-[var(--accent-emerald)]">
											{userImage ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={userImage} alt="avatar" className="h-full w-full object-cover" />
											) : (
												avatarInitial
											)}
										</span>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
												{userEmail ?? t("auth.session.fallback")}
											</p>
										</div>
									</div>
									<button
										type="button"
										className="w-full text-left px-4 py-2.5 text-sm rounded-lg text-dim hover:text-[var(--color-foreground)] hover:bg-[var(--bg-layer)]/50 transition"
									>
										{t("pricing.title")}
									</button>
									<Link
										href="/account"
										onClick={() => setMobileDrawerOpen(false)}
										className="block px-4 py-2.5 text-sm rounded-lg text-dim hover:text-[var(--color-foreground)] hover:bg-[var(--bg-layer)]/50 transition"
									>
										账号设置
									</Link>
									<button
										type="button"
										onClick={() => {
											setMobileDrawerOpen(false);
											onSignOut();
										}}
										className="w-full text-left px-4 py-2.5 text-sm rounded-lg bg-[var(--accent-emerald)]/12 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/20 transition"
									>
										{t("auth.account.signout")}
									</button>
								</div>
							)}

							{/* 未登录用户：登录按钮 */}
							{!isAuthenticated && (
								<button
									type="button"
									onClick={() => {
										setMobileDrawerOpen(false);
										onPrimaryCta();
									}}
									className="w-full btn-gradient px-4 py-3 text-sm font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.35)] min-h-[44px]"
								>
									{t("cta.preview")}
								</button>
							)}
						</div>
					</div>
				)}
			</div>
			<div className="h-[120px] sm:h-[140px]" />

			<div className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-10">
				<section
					id="hero"
					className="relative overflow-hidden rounded-[20px] sm:rounded-[36px] border border-[var(--stroke-soft)]/80 bg-[var(--bg-layer)]/85 px-4 sm:px-8 py-6 sm:py-9 shadow-[0_16px_60px_rgba(0,0,0,0.32)]"
				>
					<div className="pointer-events-none absolute inset-0 hero-mesh" aria-hidden />
					<div className="relative space-y-4 sm:space-y-7 text-center">
					{tagline ? (
						<div className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)]/90 bg-[var(--bg-layer)]/90 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm uppercase tracking-[0.24em] text-[var(--accent-emerald)]">
								<span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)]" />
								<span>{tagline}</span>
						</div>
					) : null}

						<div className="space-y-3 sm:space-y-4 text-center">
							<h1 className="text-2xl sm:text-[2.5rem] lg:text-[3rem] leading-[1.2] sm:leading-[1.05] font-semibold text-emerald-200">
								{t("hero.title")}
							</h1>
							<p className="mx-auto max-w-3xl text-base sm:text-lg lg:text-xl text-dim leading-relaxed">
								{t("hero.description")}
							</p>
							{t("hero.positioning") ? (
								<p className="text-sm sm:text-base uppercase tracking-[0.24em] text-emerald-200/70">{t("hero.positioning")}</p>
							) : null}
							<p className="text-base sm:text-lg font-medium text-[var(--accent-emerald)]">{t("hero.brandline")}</p>
						</div>

						<div className="flex flex-col sm:flex-wrap items-center justify-center gap-3 mt-4 sm:mt-6">
							<button
								type="button"
								onClick={onPrimaryCta}
								className="w-full sm:w-auto rounded-full border border-[var(--accent-emerald)]/70 bg-[var(--accent-emerald)]/12 px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base font-semibold text-[var(--accent-emerald)] shadow-[0_10px_24px_rgba(91,224,176,0.18)] transition-all duration-200 ease-out hover:bg-[var(--accent-emerald)]/20 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(91,224,176,0.28)] active:translate-y-0.5 min-h-[44px] flex items-center justify-center"
							>
								{t("hero.cta.primary")}
							</button>
							<Link href="/reports" className="w-full sm:w-auto btn-ghost px-4 sm:px-5 py-2.5 sm:py-2 text-sm sm:text-base transition-all duration-200 ease-out hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center">
								<span>{t("hero.cta.secondary")}</span>
								<span className="text-xs text-subtle ml-1">↗</span>
							</Link>
						</div>

						{belowCta}
					</div>
				</section>
			</div>
		</section>
	);
}
