"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMembershipTier } from "@/hooks/useMembershipTier";
import { useLanguage } from "@/lib/i18n";

// Import sections
import ProfileSection from "./sections/ProfileSection";
import SecuritySection from "./sections/SecuritySection";
import MembershipSection from "./sections/MembershipSection";
import PreferencesSection from "./sections/PreferencesSection";
import DataSection from "./sections/DataSection";
import ReferralSection from "./sections/ReferralSection";

type Section = "profile" | "security" | "membership" | "preferences" | "data" | "referrals";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, loading } = useSupabaseAuth();
  const { t } = useLanguage();

  // Read section from URL params, default to "profile"
  const initialSection = (searchParams.get("section") as Section) || "profile";
  const [activeSection, setActiveSection] = useState<Section>(initialSection);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Update active section when URL param changes
  useEffect(() => {
    const section = searchParams.get("section") as Section;
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams, activeSection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--accent-emerald)] border-r-transparent"></div>
          <p className="mt-4 text-sm text-subtle">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: "profile", label: t("account.sections.profile"), icon: "👤" },
    { id: "membership", label: t("account.sections.membership"), icon: "💎" },
    { id: "referrals", label: t("account.sections.referrals"), icon: "🎁" },
    { id: "security", label: t("account.sections.security"), icon: "🔒" },
    { id: "preferences", label: t("account.sections.preferences"), icon: "⚙️" },
    { id: "data", label: t("account.sections.data"), icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
      {/* Header */}
      <div className="border-b border-[var(--stroke-soft)] bg-[var(--bg-layer)]/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-subtle hover:bg-[var(--bg-base)] hover:text-[var(--color-foreground)] transition-colors"
              >
                <span>←</span>
                {t("account.page.backLabel")}
              </Link>
              <div className="h-6 w-px bg-[var(--stroke-soft)]" />
              <h1 className="text-lg font-semibold">{t("account.page.title")}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation */}
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]"
                    : "text-subtle hover:bg-[var(--bg-layer)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>

          {/* Main Content */}
          <div className="min-h-[600px]">
            {activeSection === "profile" && <ProfileSection />}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "membership" && <MembershipSection />}
            {activeSection === "referrals" && <ReferralSection />}
            {activeSection === "preferences" && <PreferencesSection />}
            {activeSection === "data" && <DataSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--accent-emerald)] border-r-transparent"></div>
          <p className="mt-4 text-sm text-subtle">加载中...</p>
        </div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
