"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANGUAGE_LABEL, LANGUAGE_ORDER, type Language } from "@/lib/i18n-config";
import { LogoIcon } from "@/app/components/Logo";

type NavItem = { label: string; href: string };

type HeroSectionProps = {
  navItems: NavItem[];
  language: Language;
  setLanguage: (lang: Language) => void;
  userEmail: string | null;
  userImage: string | null;
  userName: string | null;
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
  userEmail,
  userImage,
  userName,
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

  const displayName = userName || userEmail || "Account";
  const avatarInitial = displayName.charAt(0).toUpperCase();

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

  const pageContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10";
  const navContainer = "mx-auto w-full max-w-7xl px-4 sm:px-8 xl:px-12";

  return (
    <section className="w-full overflow-x-hidden">
      {/* 🎨 复古导航栏 - 粗黑边框 + 硬阴影 */}
      <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 ${navContainer}`}>
        <nav className="flex flex-nowrap items-center gap-2 sm:gap-4 border-4 border-black bg-white px-3 sm:px-10 py-3 sm:py-5 min-h-[72px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <LogoIcon size={28} className="flex-shrink-0" />
            <span className="text-[17px] font-bold tracking-tight text-black font-[family-name:var(--font-anton)] uppercase">
              Qiltrack AI
            </span>
          </div>

          <div className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-4 xl:gap-5 2xl:gap-6 text-xs 2xl:text-sm font-bold uppercase tracking-[0.14em] text-black whitespace-nowrap">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className="px-3 xl:px-3.5 py-2 transition-all duration-200 ease-out relative hover:text-[var(--accent-orange)] hover:-translate-y-0.5 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent-orange)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-left" />
              </a>
            ))}
          </div>

          {/* 右侧容器：汉堡 + 桌面端按钮 */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 text-[12px] flex-nowrap flex-shrink-0">
            {/* 汉堡菜单（<xl显示） */}
            <div className="xl:hidden">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen((open) => !open)}
                className="inline-flex items-center justify-center h-10 w-10 border-2 border-black bg-white text-black transition hover:bg-[var(--accent-yellow)] focus-visible:outline-none min-h-[44px]"
                aria-haspopup="dialog"
                aria-expanded={mobileDrawerOpen}
              >
                <span className="sr-only">Open navigation menu</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* 桌面端：语言 + 账户 + 登录（lg:以上显示） */}
            <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
              <div ref={languageMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLanguageMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 border-2 border-black bg-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-black font-bold uppercase transition hover:bg-[var(--accent-yellow)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none whitespace-nowrap min-h-[44px] min-w-[112px]"
                  aria-haspopup="listbox"
                  aria-expanded={languageMenuOpen}
                >
                  <span>{LANGUAGE_LABEL[language]}</span>
                  <span className="text-xs">▾</span>
                </button>
                {languageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                    <ul role="listbox" className="space-y-1">
                      {LANGUAGE_ORDER.map((lang) => (
                        <li key={lang}>
                          <button
                            type="button"
                            onClick={() => {
                              setLanguage(lang);
                              setLanguageMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm font-semibold transition ${
                              lang === language
                                ? "bg-[var(--accent-yellow)] text-black"
                                : "text-black hover:bg-[var(--accent-orange)]"
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
                    className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-black bg-white px-1.5 sm:px-2.5 py-1.5 text-sm text-black font-bold uppercase transition hover:bg-[var(--accent-yellow)] focus-visible:outline-none min-h-[44px]"
                  >
                    <span className="h-7 sm:h-8 w-7 sm:w-8 bg-[var(--accent-emerald)] border-2 border-black overflow-hidden flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                      {userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userImage} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </span>
                    <span className="text-black text-sm">
                      {t("auth.account.label").replace(/[:：]$/, "")}
                    </span>
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3 z-50">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 bg-[var(--accent-emerald)] border-2 border-black overflow-hidden flex items-center justify-center text-sm font-bold text-black">
                          {userImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={userImage}
                              alt="avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            avatarInitial
                          )}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black truncate uppercase">
                            {displayName}
                          </p>
                          {userEmail && (
                            <p className="text-xs text-black/70 truncate">
                              {userEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <Link
                          href="/account?section=referrals"
                          onClick={() => setAccountMenuOpen(false)}
                          className="w-full bg-[var(--accent-emerald)] border-2 border-black px-3 py-2 text-left text-black font-bold uppercase hover:bg-[var(--accent-yellow)] transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <span>🎁</span>
                          {t("referral.menu.title")}
                        </Link>
                        <Link
                          href="/pricing"
                          onClick={() => setAccountMenuOpen(false)}
                          className="w-full border-2 border-black px-3 py-2 text-left text-black font-bold uppercase hover:bg-[var(--accent-yellow)] block"
                        >
                          {t("pricing.title")}
                        </Link>
                        <Link
                          href="/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="w-full border-2 border-black px-3 py-2 text-left text-black font-bold uppercase hover:bg-[var(--accent-yellow)]"
                        >
                          {t("account.menu.settings")}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full bg-[var(--accent-orange)] text-black border-2 border-black px-3 py-2 text-sm font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[var(--accent-yellow)]"
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
                  className="btn-retro px-[18px] py-2 text-sm min-h-[44px]"
                >
                  {t("cta.preview")}
                  {previewNote && (
                    <span className="text-xs font-normal normal-case tracking-normal">
                      {previewNote}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* 移动端抽屉（xl:以下在汉堡菜单打开时显示） */}
        {mobileDrawerOpen && (
          <div
            ref={mobileDrawerRef}
            className="fixed inset-0 z-40 xl:hidden"
            style={{ top: "calc(100% + 12px)" }}
          >
            <div className="absolute right-4 top-0 w-80 max-w-[calc(100vw-32px)] border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              {/* 导航项 */}
              <div className="space-y-1 border-b-2 border-black pb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black font-bold px-3 py-1">
                  Navigation
                </p>
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      handleNavClick(item.href, e);
                      setMobileDrawerOpen(false);
                    }}
                    className="block px-4 py-2.5 text-sm font-bold uppercase text-black hover:bg-[var(--accent-yellow)] transition"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              {/* 语言选择 */}
              <div className="space-y-1 border-b-2 border-black pb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black font-bold px-3 py-1">Language</p>
                {LANGUAGE_ORDER.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold uppercase transition ${
                      lang === language
                        ? "bg-[var(--accent-yellow)] text-black"
                        : "text-black hover:bg-[var(--accent-orange)]"
                    }`}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </button>
                ))}
              </div>

              {/* 账户菜单 */}
              {isAuthenticated && (
                <div className="space-y-1 border-b-2 border-black pb-4">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="h-8 w-8 bg-[var(--accent-emerald)] border-2 border-black overflow-hidden flex items-center justify-center text-xs font-bold text-black">
                      {userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userImage} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate uppercase">
                        {displayName}
                      </p>
                      {userEmail && (
                        <p className="text-xs text-black/70 truncate">
                          {userEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/account?section=referrals"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm bg-[var(--accent-emerald)] text-black font-bold uppercase hover:bg-[var(--accent-yellow)] transition border-2 border-black"
                  >
                    <span>🎁</span>
                    {t("referral.menu.title")}
                  </Link>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-black font-bold uppercase hover:bg-[var(--accent-yellow)] transition border-2 border-black"
                  >
                    {t("pricing.title")}
                  </button>
                  <Link
                    href="/account"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="block px-4 py-2.5 text-sm text-black font-bold uppercase hover:bg-[var(--accent-yellow)] transition border-2 border-black"
                  >
                    {t("account.menu.settings")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm bg-[var(--accent-orange)] text-black font-bold uppercase hover:bg-[var(--accent-yellow)] transition border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                  className="w-full btn-retro px-4 py-3 text-sm min-h-[44px]"
                >
                  {t("cta.preview")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="h-[120px] sm:h-[140px]" />

      {/* 🎨 复古波普 Hero 区域 */}
      <div className={pageContainer}>
        <section
          id="hero"
          className="relative overflow-hidden border-4 border-black bg-[var(--bg-base)] px-4 sm:px-8 py-6 sm:py-9 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* 点阵网格背景 */}
          <div className="pointer-events-none absolute inset-0 bg-grid-dots" aria-hidden />

          {/* 浮动几何元素 */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute top-10 left-10 h-16 w-16 border-4 border-[var(--accent-orange)] bg-[var(--accent-yellow)] animate-float-slow" />
            <div className="absolute top-20 right-16 h-20 w-20 border-4 border-black bg-[var(--accent-blue)] animate-float" />
            <div className="absolute bottom-16 left-1/4 h-12 w-12 border-4 border-black bg-[var(--accent-emerald)] animate-float-fast rotate-45" />
            <div className="absolute bottom-20 right-1/4 h-24 w-24 rounded-full border-4 border-black bg-[var(--accent-orange)] animate-float-slow" />
          </div>

          <div className="relative space-y-4 sm:space-y-7 text-center">
            {tagline ? (
              <div className="inline-flex items-center gap-2 border-2 border-black bg-[var(--accent-yellow)] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm uppercase tracking-[0.24em] text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="h-1.5 w-1.5 bg-black" />
                <span>{tagline}</span>
              </div>
            ) : null}

            <div className="space-y-3 sm:space-y-4 text-center">
              <h1 className="text-3xl sm:text-[3rem] lg:text-[4rem] leading-[1.1] font-bold text-black font-[family-name:var(--font-anton)] uppercase text-3d">
                {t("hero.title")}
              </h1>
              <p className="mx-auto max-w-3xl text-base sm:text-lg lg:text-xl text-black leading-relaxed font-semibold">
                {t("hero.description")}
              </p>
              {t("hero.positioning") ? (
                <p className="text-sm sm:text-base uppercase tracking-[0.24em] text-black/70 font-bold">
                  {t("hero.positioning")}
                </p>
              ) : null}
              <p className="text-base sm:text-lg font-bold text-[var(--accent-orange)] uppercase tracking-wider">
                {t("hero.brandline")}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                type="button"
                onClick={onPrimaryCta}
                className="flex-1 sm:flex-none min-w-[136px] border-2 border-black bg-[var(--accent-orange)] px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base font-bold text-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:bg-[var(--accent-yellow)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-1 active:translate-y-1 min-h-[44px] flex items-center justify-center"
              >
                {t("hero.cta.primary")}
              </button>
              <Link
                href="/reports"
                className="flex-1 sm:flex-none min-w-[136px] border-2 border-black bg-white px-4 sm:px-5 py-2.5 sm:py-2 text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-200 ease-out hover:bg-black hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[44px] flex items-center justify-center"
              >
                <span>{t("hero.cta.secondary")}</span>
                <span className="text-xs ml-1">↗</span>
              </Link>
            </div>

            {belowCta}
          </div>
        </section>
      </div>
    </section>
  );
}
