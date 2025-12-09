"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { HeroSection } from "@/app/sections/HeroSection";
import { ModesSection } from "@/app/sections/ModesSection";
import { ReportGeneratorSection } from "@/app/sections/ReportGeneratorSection";
import { WhySection } from "@/app/sections/WhySection";
import { FooterSection } from "@/app/sections/FooterSection";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProgress } from "@/hooks/useProgress";
import { useLanguage } from "@/lib/i18n";
import { type Language } from "@/lib/i18n-config";
import { fetchCredits } from "@/lib/services/api";
import type { ReportTone } from "@/types/report";
import { getFeaturedReports } from "@/lib/content/reportHub";
import { DailyRewardButton } from "@/app/components/DailyRewardButton";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { LanguageSwitchPrompt } from "@/app/components/LanguageSwitchPrompt";
import { ReferralWelcomeBanner } from "@/app/components/ReferralWelcomeBanner";

type TranslationKey = string;

const navItems = [
  { labelKey: "nav.product", href: "#overview" },
  { labelKey: "nav.generator", href: "#generator" },
  { labelKey: "nav.templates", href: "/reports" },
  { labelKey: "nav.pricing", href: "/pricing" },
  { labelKey: "nav.faq", href: "#faq" },
] as const;

type WorkflowStepKey = {
  badge: TranslationKey;
  title: TranslationKey;
  detail: TranslationKey;
};

const workflowSteps: WorkflowStepKey[] = [
  { badge: "workflow.step1.badge", title: "workflow.step1.title", detail: "workflow.step1.detail" },
  { badge: "workflow.step2.badge", title: "workflow.step2.title", detail: "workflow.step2.detail" },
  { badge: "workflow.step3.badge", title: "workflow.step3.title", detail: "workflow.step3.detail" },
  { badge: "workflow.step4.badge", title: "workflow.step4.title", detail: "workflow.step4.detail" },
];

const heroHighlightKeys: ReadonlyArray<{ title: TranslationKey; description: TranslationKey }> = [
  { title: "hero.highlight1.title", description: "hero.highlight1.description" },
  { title: "hero.highlight2.title", description: "hero.highlight2.description" },
  { title: "hero.highlight3.title", description: "hero.highlight3.description" },
];

const faqItems: { question: TranslationKey; answer: TranslationKey }[] = [
  { question: "faq.q1.question", answer: "faq.q1.answer" },
  { question: "faq.q2.question", answer: "faq.q2.answer" },
  { question: "faq.q3.question", answer: "faq.q3.answer" },
  { question: "faq.q4.question", answer: "faq.q4.answer" },
  { question: "faq.q5.question", answer: "faq.q5.answer" },
  { question: "faq.q6.question", answer: "faq.q6.answer" },
  { question: "faq.q7.question", answer: "faq.q7.answer" },
  { question: "faq.q8.question", answer: "faq.q8.answer" },
];

type ToneOption = {
  id: ReportTone;
  emoji: string;
  titleKey: TranslationKey;
  badgeKey: TranslationKey;
  descriptionKey: TranslationKey;
  credits: number;
};

const toneOptions: ToneOption[] = [
  {
    id: "baseline",
    emoji: "🧭",
    titleKey: "tone.baseline.title",
    badgeKey: "tone.baseline.badge",
    descriptionKey: "tone.baseline.description",
    credits: 30,
  },
  {
    id: "buffett",
    emoji: "🏰",
    titleKey: "tone.buffett.title",
    badgeKey: "tone.buffett.badge",
    descriptionKey: "tone.buffett.description",
    credits: 40,
  },
  {
    id: "musk",
    emoji: "🚀",
    titleKey: "tone.musk.title",
    badgeKey: "tone.musk.badge",
    descriptionKey: "tone.musk.description",
    credits: 40,
  },
  {
    id: "muddy",
    emoji: "🛡️",
    titleKey: "tone.muddy.title",
    badgeKey: "tone.muddy.badge",
    descriptionKey: "tone.muddy.description",
    credits: 50,
  },
];

type CaseStudy = {
  company: string;
  industryKey: TranslationKey;
  tonalityKey: TranslationKey;
  tagKeys: TranslationKey[];
  snippetKey: TranslationKey;
  metricKey: TranslationKey;
};

// Note: caseStudies data prepared for future case studies section
// Currently unused, kept for future implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _caseStudies: CaseStudy[] = [
  {
    company: "NVIDIA",
    industryKey: "case.nvidia.industry",
    tonalityKey: "case.nvidia.tonality",
    tagKeys: ["case.nvidia.tag1", "case.nvidia.tag2", "case.nvidia.tag3"],
    snippetKey: "case.nvidia.snippet",
    metricKey: "case.nvidia.metric",
  },
  {
    company: "Coca-Cola",
    industryKey: "case.coke.industry",
    tonalityKey: "case.coke.tonality",
    tagKeys: ["case.coke.tag1", "case.coke.tag2"],
    snippetKey: "case.coke.snippet",
    metricKey: "case.coke.metric",
  },
  {
    company: "Coinbase",
    industryKey: "case.coinbase.industry",
    tonalityKey: "case.coinbase.tonality",
    tagKeys: ["case.coinbase.tag1", "case.coinbase.tag2"],
    snippetKey: "case.coinbase.snippet",
    metricKey: "case.coinbase.metric",
  },
];

const highlightFallbackKeys: TranslationKey[] = [
  "highlight.default.1",
  "highlight.default.2",
  "highlight.default.3",
];

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, signOut, refreshSession, getUserProfile } = useSupabaseAuth();
  const router = useRouter();
  const progress = useProgress();
  const [selectedTone, setSelectedTone] = useState<ReportTone>("baseline");
  const [remainingQuota, setRemainingQuota] = useState(0);
  const [quotaLoaded, setQuotaLoaded] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);

  // Language detection and prompt
  const {
    shouldShowPrompt,
    detectedLanguage,
    dismissPrompt,
    acceptSwitch,
  } = useLanguageDetection(language as Language);

  // Fetch remaining credits and user profile on mount and when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated) {
        setRemainingQuota(0);
        setQuotaLoaded(true);
        setUserPlan("free");
        return;
      }
      try {
        // 并行获取积分和用户profile
        const [creditsData, profile] = await Promise.all([
          fetchCredits(),
          getUserProfile(),
        ]);
        setRemainingQuota(creditsData.credits?.remaining_credits ?? 0);
        setQuotaLoaded(true);
        setUserPlan(profile?.plan || "free");
        setUserProfile({
          avatar_url: profile?.avatar_url || null,
          display_name: profile?.display_name || null,
        });
      } catch (err) {
        console.error("Failed to load user data:", err);
        setRemainingQuota(0);
        setQuotaLoaded(true);
        setUserPlan("free");
        setUserProfile(null);
      }
    };

    // Fetch immediately
    loadUserData();

    // Auto-refresh every 30 seconds to keep quota in sync
    const interval = setInterval(loadUserData, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const isDark = true;
  const mainBg = isDark
    ? "bg-[var(--bg-base)] text-[var(--color-foreground)] pb-16"
    : "bg-slate-50 text-slate-900";
  const cardSecondary = isDark
    ? "bg-[var(--bg-layer)]/85 border-[var(--stroke-soft)]"
    : "bg-white border-slate-200";
  const subtleText = isDark ? "text-subtle" : "text-slate-500";
  const strongSubtleText = isDark ? "text-dim" : "text-slate-600";

  const navLinks = navItems.map((item) => ({ href: item.href, label: t(item.labelKey) }));
  const heroHighlightList = heroHighlightKeys.map((item) => ({
    title: t(item.title),
    description: t(item.description),
  }));

  const toneOptionsLabeled = toneOptions.map((option) => ({
    id: option.id,
    emoji: option.emoji,
    title: t(option.titleKey),
    badge: t(option.badgeKey),
    description: t(option.descriptionKey),
    credits: option.credits,
  }));
  const toneLabelList = useMemo(
    () => toneOptionsLabeled.map((option) => option.title).join(" / "),
    [toneOptionsLabeled]
  );
  const personaSentence = t("persona.caption", { tones: toneLabelList });

  const module6Items = useMemo(() => {
    try {
      return JSON.parse(t("landing.module6.items")) as string[];
    } catch (err) {
      console.warn("Failed to parse module6 items", err);
      return [];
    }
  }, [t]);

  const featuredReports = useMemo(() => {
    return getFeaturedReports(3).map((report) => ({
      symbol: report.symbol,
      title: report.title,
      snippet: report.snippet,
      date: report.date,
      theme: report.theme,
      url: report.url,
      tags: report.tags,
      cover: report.cover,
      readTime: report.readTime,
    }));
  }, []);

  const workflowList = workflowSteps.map((step) => ({
    badge: t(step.badge),
    title: t(step.title),
    detail: t(step.detail),
  }));
  const faqList = faqItems.map((item) => ({ question: t(item.question), answer: t(item.answer) }));
  const highlightFallback = highlightFallbackKeys.map((key) => t(key));

  // 套餐显示名称映射
  const PLAN_DISPLAY_NAMES: Record<string, string> = {
    free: t("quota.plan.free"),
    pro: t("quota.plan.pro") || "Pro",
    ultra: t("quota.plan.ultra") || "Ultra",
  };

  const planLabel = PLAN_DISPLAY_NAMES[userPlan] || t("quota.plan.free");

  // Refresh quota from API and refresh session
  const refreshQuota = async () => {
    try {
      await refreshSession();
      const creditsData = await fetchCredits();
      setRemainingQuota(creditsData.credits?.remaining_credits ?? 0);
      setQuotaLoaded(true);
    } catch (err) {
      console.error("Failed to refresh credits:", err);
    }
  };

  const handleSmoothScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrimaryCta = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    handleSmoothScroll("#generator");
  };

  return (
    <>
      {/* Language switch prompt */}
      {shouldShowPrompt && detectedLanguage && (
        <LanguageSwitchPrompt
          currentLanguage={language as Language}
          detectedLanguage={detectedLanguage}
          onSwitch={() => {
            setLanguage(detectedLanguage);
            acceptSwitch();
          }}
          onDismiss={dismissPrompt}
        />
      )}

      {/* Referral welcome banner */}
      <Suspense fallback={null}>
        <ReferralWelcomeBanner />
      </Suspense>

      <main
        className={`min-h-screen ${mainBg}`}
        style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont" }}
      >
        <div className="grid min-h-screen grid-rows-[auto,1fr] min-w-0">
          <HeroSection
            navItems={navLinks}
            language={language as Language}
            setLanguage={setLanguage}
            planLabel={planLabel}
            userEmail={user?.email ?? null}
            userImage={userProfile?.avatar_url ?? null}
            userName={userProfile?.display_name ?? null}
            isAuthenticated={isAuthenticated}
            onPrimaryCta={handlePrimaryCta}
            onSmoothScroll={handleSmoothScroll}
            onSignOut={() => signOut()}
            t={t}
          />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 flex justify-center py-10 sm:py-12 min-w-0">
              <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-10 space-y-6 md:space-y-10 min-w-0">
                <section
                  id="generator"
                  className={`rounded-[32px] border p-4 sm:p-5 md:p-6 space-y-6 md:space-y-8 bg-[var(--bg-layer)]/70 border-[var(--stroke-soft)] shadow-[0_18px_60px_rgba(0,0,0,0.28)] overflow-hidden min-w-0`}
                >
                  <ModesSection
                    heading={t("generator.sectionTitle")}
                    options={toneOptionsLabeled}
                    selected={selectedTone}
                    onSelect={setSelectedTone}
                    personaSentence={personaSentence}
                  />

                  <ReportGeneratorSection
                    selectedTone={selectedTone}
                    toneOptions={toneOptionsLabeled}
                    language={language as Language}
                    highlightFallback={highlightFallback}
                    heroHighlights={heroHighlightList}
                    auth={{
                      isAuthenticated: isAuthenticated,
                      remainingQuota: remainingQuota,
                      quotaLoaded: quotaLoaded,
                      planLabel,
                      userEmail: user?.email ?? null,
                      refreshSession: async () => {
                        await refreshSession();
                      },
                      refreshQuota: async () => {
                        await refreshQuota();
                      },
                    }}
                    progress={progress}
                    onRequireLogin={() => router.push("/login")}
                    t={t}
                  />
                </section>

                {/* 每日签到 - 未登录时显示吸引性CTA，登录后显示签到功能 */}
                <DailyRewardButton
                  isLoggedIn={isAuthenticated}
                  onRewardClaimed={(credits) => {
                    setRemainingQuota(credits);
                  }}
                  className="max-w-4xl mx-auto"
                />

                <section
                  id="overview"
                  className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 space-y-6 transition-all duration-200 ease-out ${cardSecondary}`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-80">
                    <div
                      className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-emerald-400/15 blur-[120px]"
                      aria-hidden
                    />
                    <div
                      className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-[120px]"
                      aria-hidden
                    />
                    <div
                      className="absolute inset-4 rounded-[28px] border border-white/5"
                      aria-hidden
                    />
                  </div>

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2 max-w-2xl">
                      <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
                        {t("workflow.sectionLabel")}
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-semibold">{t("workflow.title")}</h2>
                      <p className={`text-base ${subtleText}`}>{t("workflow.caption")}</p>
                    </div>
                    <div className="relative rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-4 py-3 text-sm text-right text-emerald-100 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
                      <p className="font-semibold tracking-[0.16em] uppercase">
                        {t("workflow.status.step", {
                          step: Math.min(progress.currentStep, workflowList.length)
                            .toString()
                            .padStart(2, "0"),
                        })}
                      </p>
                      <p className="text-subtle">
                        {progress.status === "idle" && t("workflow.status.idle")}
                        {progress.status === "running" && t("workflow.status.syncing")}
                        {progress.status === "done" && t("workflow.status.ready")}
                      </p>
                      <div
                        className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-400/10 blur-3xl"
                        aria-hidden
                      />
                    </div>
                  </div>

                  <div className="relative rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
                    <div
                      className="absolute left-4 top-8 bottom-8 hidden lg:block w-px bg-gradient-to-b from-[var(--accent-emerald)] via-[var(--stroke-soft)] to-transparent"
                      aria-hidden
                    />
                    <div className="grid gap-4">
                      {workflowList.map((step, index) => {
                        const stepNumber = index + 1;
                        const clampedStep = Math.min(progress.currentStep, workflowList.length);
                        const isActive =
                          progress.status === "running" && clampedStep === stepNumber;
                        const isCompleted =
                          progress.status === "done" ||
                          (progress.status === "running" && clampedStep > stepNumber);
                        return (
                          <div key={step.title} className="relative pl-12 lg:pl-16">
                            <div className="absolute left-0 lg:left-1 top-1">
                              <div
                                className={`relative h-10 w-10 rounded-2xl ${isCompleted || isActive ? "bg-[var(--accent-emerald)]/20 border-[var(--accent-emerald)]/50" : "bg-[var(--accent-emerald)]/10 border-[var(--stroke-soft)]/50"} border flex items-center justify-center text-sm font-semibold ${isCompleted || isActive ? "text-[var(--accent-emerald)]" : "text-subtle"} shadow-[0_10px_30px_rgba(16,185,129,0.25)]`}
                              >
                                {stepNumber.toString().padStart(2, "0")}
                                <span
                                  className="absolute inset-0 rounded-2xl border border-white/5"
                                  aria-hidden
                                />
                              </div>
                            </div>
                            <div
                              className={`rounded-2xl border ${isCompleted || isActive ? "border-[var(--accent-emerald)]/50 bg-[var(--bg-layer)]/85" : "border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85"} p-4 space-y-2 transition hover:border-[var(--stroke-glow)]/70 hover:shadow-[0_16px_46px_rgba(0,0,0,0.35)]`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className={`text-xs uppercase tracking-[0.22em] ${isCompleted || isActive ? "text-emerald-200" : "text-subtle"}`}
                                >
                                  {step.badge}
                                </span>
                                <span className="hidden sm:inline-flex items-center gap-2 text-xs text-subtle">
                                  {isCompleted && (
                                    <>
                                      <span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)]" />
                                      {t("workflow.step.status.done")}
                                    </>
                                  )}
                                  {isActive && (
                                    <>
                                      <span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
                                      {t("workflow.step.status.running")}
                                    </>
                                  )}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                                {step.title}
                              </h3>
                              <p className={`text-base leading-relaxed ${strongSubtleText}`}>
                                {step.detail}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section
                  id="templates"
                  className={`rounded-3xl border p-5 sm:p-7 space-y-5 transition-all duration-200 ease-out ${cardSecondary} overflow-hidden`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
                        {t("nav.templates")}
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-semibold">
                        {t("gallery.inspired")}
                      </h2>
                      <p className={`text-base mt-1 ${subtleText}`}>{t("gallery.subtitle")}</p>
                    </div>
                    <div className="text-sm text-right text-subtle">
                      <p>{t("gallery.description")}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {featuredReports.map((report) => (
                      <Link
                        key={report.symbol}
                        href={report.url}
                        className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4 flex flex-col gap-4 transition-all duration-200 ease-out hover:border-[var(--stroke-glow)]/70 hover:shadow-[0_12px_32px_rgba(0,0,0,0.28)] hover:-translate-y-1"
                      >
                        <div
                          className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)]/80 aspect-[16/9] bg-cover bg-center shadow-[0_10px_28px_rgba(0,0,0,0.2)]"
                          style={{
                            backgroundImage: report.cover,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                        >
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent"
                            aria-hidden
                          />
                          <div className="relative flex items-start justify-between p-3 text-white">
                            <div className="space-y-1">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-100/90">
                                {report.theme}
                              </p>
                              <p className="text-lg font-semibold leading-tight">{report.symbol}</p>
                            </div>
                            <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-xs backdrop-blur">
                              {report.readTime}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p
                            className="text-base font-semibold text-[var(--color-foreground)] leading-snug"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {report.title}
                          </p>
                          <p
                            className={`text-sm leading-relaxed ${strongSubtleText}`}
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {report.snippet}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 text-xs text-subtle">
                          {report.tags.map((tag) => (
                            <span
                              key={`${report.symbol}-${tag}`}
                              className="rounded-full border border-[var(--stroke-soft)] px-2 py-0.5"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-emerald-300">
                          {new Date(report.date).toLocaleDateString(
                            language === "en" ? "en-US" : "zh-CN",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-dashed border-[var(--stroke-soft)] p-4">
                    <p className={`text-base ${subtleText}`}>{t("gallery.footer")}</p>
                    <Link
                      href="/reports#archive"
                      className="self-start rounded-full border border-emerald-400 px-4 py-2 text-base text-emerald-300 hover:bg-emerald-400/10"
                    >
                      {t("gallery.cta")}
                    </Link>
                  </div>
                </section>

                <WhySection
                  module6Items={module6Items}
                  subtleTextClass={subtleText}
                  valueTitle={t("landing.module6.title")}
                  valueCaption={t("landing.module6.caption")}
                  punchline={t("landing.module6.punchline")}
                  label={t("landing.module6.title")}
                />

                <section
                  id="faq"
                  className={`rounded-3xl border p-5 sm:p-7 space-y-5 transition-all duration-200 ease-out ${cardSecondary} overflow-hidden`}
                >
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">FAQ</p>
                    <h2 className="text-2xl sm:text-3xl font-semibold">{t("faq.title")}</h2>
                    <p className={`text-base ${subtleText}`}>{t("faq.caption")}</p>
                  </div>
                  <div className="space-y-3">
                    {faqList.map((item) => (
                      <details
                        key={item.question}
                        className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out group open:border-[var(--stroke-glow)]/50"
                      >
                        <summary className="cursor-pointer text-base font-semibold text-[var(--color-foreground)] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out">
                          {item.question}
                        </summary>
                        <p
                          className={`mt-2 text-base leading-relaxed ${strongSubtleText} motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:animate-fadeInUp`}
                        >
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterSection disclaimer={t("footer.disclaimer")} dataSource={t("footer.dataSource")} />
    </>
  );
}
