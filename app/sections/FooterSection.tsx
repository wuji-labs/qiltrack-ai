"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { LogoIcon } from "@/app/components/Logo";

type FooterSectionProps = {
  disclaimer?: string;
  dataSource?: string;
};

export function FooterSection({ disclaimer, dataSource }: FooterSectionProps) {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--stroke-soft)] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main row: Logo + Links + Copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2.5">
            <LogoIcon size={24} />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
              Qiltrack AI
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/pricing"
              className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="/legal/terms"
              className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/legal/privacy"
              className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/legal/refund"
              className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
            >
              退款政策
            </Link>
            <a
              href="mailto:support@qiltrack.com"
              className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
            >
              联系客服
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-[var(--text-subtle)]">
            © {new Date().getFullYear()} Qiltrack AI
          </p>
        </div>

        {/* Disclaimer (small, subtle) */}
        {(disclaimer || dataSource) && (
          <div className="mt-6 pt-4 border-t border-[var(--stroke-soft)]">
            <p className="text-xs text-[var(--text-subtle)] leading-relaxed">
              {disclaimer}
              {disclaimer && dataSource && " "}
              {dataSource}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
