"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_LABEL, LANGUAGE_ORDER, type Language } from "@/lib/i18n-config";

type NavItem = { label: string; href: string };

type NavigationProps = {
  navItems: NavItem[];
  language: Language;
  setLanguage: (lang: Language) => void;
  userEmail: string | null;
  userName: string | null;
  userImage: string | null;
  planLabel: string;
  remainingQuota?: number;
  quotaLoaded?: boolean;
  isAuthenticated: boolean;
  onSignOut: () => void;
  onPrimaryCta?: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
  onNavClick?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function Navigation({
  navItems,
  language,
  setLanguage,
  userEmail,
  userName,
  userImage,
  planLabel,
  remainingQuota,
  quotaLoaded,
  isAuthenticated,
  onSignOut,
  onPrimaryCta,
  t,
  onNavClick,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  const displayName = userName || userEmail || "Account";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavClick) {
      onNavClick(href, e);
    } else if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Search className="w-5 h-5 text-gray-900" />
            <span className="font-semibold text-gray-900">Qiltrack AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  {LANGUAGE_LABEL[language]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGE_ORDER.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={lang === language ? "bg-gray-100" : ""}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu / Login */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="h-6 w-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold overflow-hidden">
                      {userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userImage} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </span>
                    <span className="hidden sm:inline">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    {userEmail && (
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{planLabel}</p>
                    {quotaLoaded && typeof remainingQuota === "number" && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t("quota.remaining")?.replace("{credits}", remainingQuota.toString()) || `${remainingQuota} credits`}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account?section=referrals" className="cursor-pointer">
                      <span>🎁</span>
                      <span className="ml-2">{t("referral.menu.title")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer">{t("pricing.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">{t("account.menu.settings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut} className="text-red-600 cursor-pointer">
                    {t("auth.account.signout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={onPrimaryCta || (() => {})}>
                {t("cta.preview") || "Sign In"}
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </nav>
      </Container>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-gray-200 bg-white"
        >
          <Container>
            <div className="py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(item.href, e);
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Language Selector */}
              <div className="pt-3 border-t border-gray-200">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Language
                </p>
                {LANGUAGE_ORDER.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      lang === language
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </button>
                ))}
              </div>

              {/* Mobile Account Section */}
              {isAuthenticated ? (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 px-3 py-2 mb-2">
                    <span className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold overflow-hidden">
                      {userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userImage} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {displayName}
                      </p>
                      {userEmail && (
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/account?section=referrals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <span>🎁</span>
                    <span className="ml-2">{t("referral.menu.title")}</span>
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {t("pricing.title")}
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {t("account.menu.settings")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    {t("auth.account.signout")}
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onPrimaryCta) onPrimaryCta();
                    }}
                  >
                    {t("cta.preview") || "Sign In"}
                  </Button>
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
