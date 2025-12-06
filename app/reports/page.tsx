"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useVisibilityStagger } from "./hooks/useVisibilityStagger";
import { getSeedReportCards, listSeedCategories, mapApiPostToCard } from "@/lib/content/reportHub";
import {
  fetchReportPosts,
  fetchPopularReports,
  fetchReportHistory,
  bulkUnfeatureReports,
} from "@/lib/services/api";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { ReportCard } from "@/types/report";

const seedReports = getSeedReportCards();
const defaultCategories = ["All", ...listSeedCategories()];
const PAGE_SIZE = 12;

type MembershipBadgeVariant = "featured" | "grid";

// 权限徽章 - 支持三种档位 - 简约高级设计
function AccessBadge({
  variant,
  accessLevel,
  labels,
}: {
  variant: MembershipBadgeVariant;
  accessLevel: "timed-free" | "pro" | "ultra";
  labels: {
    "timed-free": string;
    pro: string;
    ultra: string;
  };
}) {
  const label = labels[accessLevel];

  // 根据档位设定颜色 - 简约而高级的设计
  const colorMap = {
    "timed-free": {
      bg: "bg-emerald-600/20",
      border: "border-emerald-500/50",
      text: "text-emerald-300",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      icon: "text-emerald-300",
    },
    pro: {
      bg: "bg-amber-600/20",
      border: "border-amber-500/50",
      text: "text-amber-300",
      glow: "shadow-[0_0_20px_rgba(251,146,60,0.3)]",
      icon: "text-amber-300",
    },
    ultra: {
      bg: "bg-purple-600/20",
      border: "border-purple-500/50",
      text: "text-purple-300",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
      icon: "text-purple-300",
    },
  };

  const colors = colorMap[accessLevel];

  if (variant === "featured") {
    return (
      <div
        className={`pointer-events-none absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full px-4 py-2 ${colors.bg} border ${colors.border} ${colors.text} backdrop-blur-md ${colors.glow}`}
        aria-label={label}
      >
        <svg
          viewBox="0 0 16 16"
          className={`h-4 w-4 shrink-0 ${colors.icon}`}
          fill="currentColor"
          stroke="none"
        >
          <path d="M13 4L6 11L3 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
      </div>
    );
  }

  // Grid variant - 简约设计
  return (
    <div
      className="pointer-events-none absolute top-2 right-2 z-10"
      aria-label={label}
    >
      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${colors.bg} border ${colors.border} backdrop-blur-md ${colors.glow}`}>
        <div className={`h-2 w-2 rounded-full ${colors.icon}`} />
      </div>
    </div>
  );
}

function LockGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M5 7V5.4a3 3 0 0 1 6 0V7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.3 7.2h7.4v4.9a1.9 1.9 0 0 1-1.9 1.9H6.2a1.9 1.9 0 0 1-1.9-1.9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 9.5v1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function applyLocalFilter(items: ReportCard[], theme: string, lang: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchTheme = theme === "All" || item.theme === theme;
    const matchLang = lang === "all" || (item.language ?? "en") === lang;
    const matchQuery =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.snippet.toLowerCase().includes(normalizedQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
    return matchTheme && matchLang && matchQuery;
  });
}

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const auth = useSupabaseAuth();
  const membershipLabel = t("reports.card.membershipBadge");
  const timedFreeLabel = t("reports.card.timedFreeBadge");
  const proLabel = t("reports.card.proBadge");
  const accessLabels = {
    "timed-free": timedFreeLabel,
    pro: proLabel,
    ultra: membershipLabel,
  };

  // Category translation map
  const categoryTranslationMap: Record<string, string> = {
    All: "reports.category.all",
    "Cloud + AI": "reports.category.cloud-ai",
    Semiconductor: "reports.category.semiconductor",
    "Defense & Aerospace": "reports.category.defense-aerospace",
    Mobility: "reports.category.mobility",
    Healthtech: "reports.category.healthtech",
    Media: "reports.category.media",
  };

  const getCategoryLabel = (category: string) => {
    const key = categoryTranslationMap[category];
    return key ? t(key as any) : category;
  };
  const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0]);
  // Language selector follows system language by default
  const getInitialLang = () => {
    // 优先使用主页语言设置，映射到报告页面的语言选项
    if (language === "en") return "en";
    if (language === "ja") return "ja";
    if (language === "ko") return "ko";
    if (language === "zh-Hant") return "zh-Hant";
    if (language === "zh-Hans") return "zh-Hans";
    return "all";
  };
  const [selectedLang, setSelectedLang] = useState<"all" | "en" | "ja" | "ko" | "zh-Hant" | "zh-Hans">(getInitialLang());

  // 当首页语言变化时，同步报告中心的语言选择
  useEffect(() => {
    const newLang = getInitialLang();
    setSelectedLang(newLang);
    setPageIndex(1); // 重置到第一页
  }, [language]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [reports, setReports] = useState<ReportCard[]>(seedReports);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isApiData, setIsApiData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: seedReports.length,
    pages: Math.max(1, Math.ceil(seedReports.length / PAGE_SIZE)),
  });
  const [popularReports, setPopularReports] = useState<string[]>([]);
  const [myReports, setMyReports] = useState<
    Array<{
      id: string;
      symbol: string;
      created_at: string;
      status: string;
      mode?: string | null;
      markdown_signed_url?: string | null;
      docx_signed_url?: string | null;
    }>
  >([]);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useVisibilityStagger(gridRef as React.RefObject<HTMLElement>, {
    itemSelector: "[data-stagger-item]",
    threshold: 0.1,
    deps: [pageIndex, selectedCategory, reports],
  });

  useEffect(() => {
    if (!gridRef.current) return;
    const items = Array.from(
      gridRef.current.querySelectorAll("[data-stagger-item]")
    ) as HTMLElement[];
    items.forEach((item) => {
      item.setAttribute("data-visible", "false");
    });
  }, [pageIndex, reports]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Check URL hash to auto-open My Reports section and scroll to it
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#my-reports") {
      setShowMyReports(true);
      // 延迟滚动，等待渲染完成
      setTimeout(() => {
        const myReportsSection = document.getElementById("my-reports-section");
        if (myReportsSection) {
          myReportsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.isAuthenticated) {
        setIsAdmin(false);
        setUserPlan(null);
        return;
      }
      const profile = await auth.getUserProfile();
      const plan = (profile as any)?.plan || null;
      setUserPlan(plan);
      const isAdminPlan = plan === "admin";
      const isAdminEmail = auth.user?.email?.endsWith("@qiltrack.com");
      setIsAdmin(isAdminPlan || !!isAdminEmail);
    };
    checkAdmin();
  }, [auth]);

  // Load reports (always latest mode)
  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReportPosts({
          page: pageIndex,
          limit: PAGE_SIZE,
          theme: selectedCategory === "All" ? undefined : selectedCategory,
          lang: selectedLang === "all" ? undefined : selectedLang,
          query: debouncedQuery || undefined,
        });

        if (cancelled) return;
        const mapped = data.posts.map(mapApiPostToCard);

        // If API returns empty and we have filters, fallback to seed reports
        // But if "All" is selected with no other filters, trust the API result
        const hasActiveFilters =
          (selectedCategory !== "All") ||
          (selectedLang !== "all") ||
          (debouncedQuery !== "");

        if (mapped.length === 0 && hasActiveFilters) {
          let fallback = applyLocalFilter(
            seedReports,
            selectedCategory,
            selectedLang,
            debouncedQuery
          );

          // If filtered results are still empty, show all seed reports
          if (fallback.length === 0) {
            fallback = seedReports;
          }

          setReports(fallback);
          setIsApiData(false);
          setPagination({
            page: 1,
            pageSize: PAGE_SIZE,
            total: fallback.length,
            pages: Math.max(1, Math.ceil(fallback.length / PAGE_SIZE)),
          });
          // Mark first 3 reports as popular
          setPopularReports(fallback.slice(0, 3).map((r) => r.slug));
        } else if (mapped.length === 0 && !hasActiveFilters) {
          // "All" selected with no filters, but API returned empty
          // Use seed reports as fallback
          setReports(seedReports);
          setIsApiData(false);
          setPagination({
            page: 1,
            pageSize: PAGE_SIZE,
            total: seedReports.length,
            pages: Math.max(1, Math.ceil(seedReports.length / PAGE_SIZE)),
          });
          setPopularReports(seedReports.slice(0, 3).map((r) => r.slug));
        } else {
          // API returned data successfully
          setReports(mapped);
          setIsApiData(true);
          setPagination(data.pagination);

          const dynamicCategories = new Set<string>(listSeedCategories());
          mapped.forEach((item) => {
            if (item.theme) dynamicCategories.add(item.theme);
          });
          setCategories(["All", ...Array.from(dynamicCategories)]);
          // Mark first 3 reports as popular
          setPopularReports(mapped.slice(0, 3).map((r) => r.slug));
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load report posts", err);
        setIsApiData(false);

        const fallback = applyLocalFilter(
          seedReports,
          selectedCategory,
          selectedLang,
          debouncedQuery
        );
        const total = fallback.length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const normalizedPage = Math.min(pageIndex, pages);

        setReports(fallback);
        setPagination({
          page: normalizedPage,
          pageSize: PAGE_SIZE,
          total,
          pages,
        });
        // Mark first 3 reports as popular
        setPopularReports(fallback.slice(0, 3).map((r) => r.slug));
        if (pageIndex !== normalizedPage) {
          setPageIndex(normalizedPage);
        }
        setError("Unable to load latest reports from the API. Showing fallback samples.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReports();
    return () => {
      cancelled = true;
    };
  }, [pageIndex, selectedCategory, selectedLang, debouncedQuery]);

  // Load my reports when section is shown
  useEffect(() => {
    if (showMyReports && auth.isAuthenticated && myReports.length === 0) {
      const loadMyReports = async () => {
        setLoadingMyReports(true);
        try {
          const data = await fetchReportHistory(1, 10);
          setMyReports(data.reports);
        } catch (err) {
          console.error("Failed to load my reports", err);
        } finally {
          setLoadingMyReports(false);
        }
      };
      loadMyReports();
    }
  }, [showMyReports, auth.isAuthenticated, myReports.length]);

  const pageSize = isApiData ? pagination.pageSize : PAGE_SIZE;
  const totalPages = isApiData
    ? pagination.pages
    : Math.max(1, Math.ceil(reports.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages);
  const totalCount = isApiData ? pagination.total : reports.length;

  // Deduplicate reports by company/symbol - show only the latest report per company
  const deduplicatedReports = useMemo(() => {
    const seenCompanies = new Map<string, ReportCard>();

    // Sort by date descending to ensure we keep the latest
    const sortedReports = [...reports].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const report of sortedReports) {
      // Extract company identifier from title or slug
      const companyKey = report.slug.split("-")[0]?.toLowerCase() || report.title.toLowerCase();

      if (!seenCompanies.has(companyKey)) {
        seenCompanies.set(companyKey, report);
      }
    }

    return Array.from(seenCompanies.values());
  }, [reports]);

  const pagedReports = useMemo(() => {
    if (isApiData) return deduplicatedReports;
    const start = (currentPage - 1) * pageSize;
    return deduplicatedReports.slice(start, start + pageSize);
  }, [isApiData, deduplicatedReports, currentPage, pageSize]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleBulkUnfeature = async () => {
    if (!confirm(t("reports.admin.unfeature.confirm"))) return;
    setBulkActionLoading(true);
    try {
      const result = await bulkUnfeatureReports({ olderThanDays: 30 });
      alert(`Successfully unfeatured ${result.unfeaturedCount} reports`);
      // Refresh the page to reload reports
      window.location.reload();
    } catch (err) {
      console.error("Bulk unfeature failed", err);
      alert("Failed to unfeature reports. Please check console.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const isReportPopular = (slug: string) => {
    return popularReports.some((s) => s.toLowerCase() === slug);
  };

  const handleReportClick = (e: React.MouseEvent, slug: string, report: ReportCard) => {
    const accessLevel = report.accessLevel || "timed-free";

    // 限时免费：任何人都能打开（用于 SEO）
    if (accessLevel === "timed-free") return;

    // Pro 内容：Pro 或 Ultra 用户可以访问
    if (accessLevel === "pro") {
      // Pro 或 Ultra 用户可以访问
      if (userPlan === "pro" || userPlan === "ultra") return;
      // 管理员可以访问
      if (isAdmin) return;
    }

    if (accessLevel === "ultra") {
      // 仅 Ultra 用户和管理员可访问
      if (userPlan === "ultra" || isAdmin) return;
    }

    // 禁止访问：显示提示
    e.preventDefault();
    if (!auth.isAuthenticated) {
      // Not logged in - redirect to login
      window.location.assign("/#generator");
    } else {
      // Logged in but not authorized - show paywall
      setShowPaywall(true);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.45)] text-center">
          <div className="pointer-events-none absolute inset-0 hero-mesh" aria-hidden />
          <div className="relative mx-auto max-w-3xl space-y-4">
            <p
              className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)] animate-fade-in-up"
              style={{ animationDelay: "0ms" }}
            >
              {t("reports.page.hero.kicker")}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-semibold leading-tight animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              {t("reports.page.hero.title")}
            </h1>
            <p
              className="text-base text-dim animate-fade-in-up"
              style={{ animationDelay: "160ms" }}
            >
              {t("reports.page.hero.description")}
            </p>
            <div
              className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)] transition-colors motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:glow-pulse"
              >
                {t("reports.page.hero.backHome")}
              </Link>
              <Link
                href="#popular"
                className="btn-gradient px-5 py-2 text-sm font-semibold motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
              >
                {t("reports.page.hero.popularCompanies")}
              </Link>
              <Link
                href="#my-reports"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMyReports(true);
                  window.location.hash = "#my-reports";
                  // 滚动到顶部显示"我的报告"
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 100);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)] transition-colors motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:glow-pulse"
              >
                {t("reports.page.hero.myReports")}
              </Link>
            </div>
          </div>
        </section>

        {/* My Reports Section - 显示在 Hero 之后 */}
        {showMyReports && auth.isAuthenticated && (
          <section id="my-reports-section" className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] border border-[var(--accent-emerald)]/30 bg-gradient-to-br from-[var(--bg-layer)]/95 via-[var(--bg-layer)]/90 to-[var(--bg-base)]/85 p-6 sm:p-8 shadow-[0_0_60px_rgba(91,224,176,0.1),0_26px_90px_rgba(0,0,0,0.4)]">
              {/* Decorative gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-emerald)]/5 via-transparent to-transparent rounded-[32px]" aria-hidden />

              {/* Header */}
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--accent-emerald)]/40">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[var(--accent-emerald)]" fill="currentColor">
                      <path d="M4 4a2 2 0 012-2h4a2 2 0 012 2v1h2a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1h2V4zm6 0H6v1h4V4z"/>
                    </svg>
                    <span className="text-xs font-semibold text-[var(--accent-emerald)] uppercase tracking-wider">
                      {t("reports.page.hero.myReports")}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)]">
                    打开我的报告
                  </h2>
                  <p className="text-sm text-dim">
                    {myReports.length > 0
                      ? `${myReports.length} 份报告`
                      : "查看您生成的所有报告"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMyReports(false);
                    window.location.hash = "";
                  }}
                  className="self-start sm:self-center inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)] hover:border-[var(--accent-emerald)]/50 transition-all duration-200"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  关闭
                </button>
              </div>

              {/* Content */}
              <div className="relative">
                {loadingMyReports ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-emerald)]/30 border-t-[var(--accent-emerald)]" />
                      <p className="text-sm text-dim">加载报告中...</p>
                    </div>
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-[var(--accent-emerald)]/10 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 text-[var(--accent-emerald)]/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-base font-medium text-[var(--color-foreground)]">还没有报告</p>
                      <p className="text-sm text-dim">前往首页生成您的第一份 AI 投研报告</p>
                    </div>
                    <Link
                      href="/#generator"
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-emerald)] px-5 py-2.5 text-sm font-semibold text-slate-950 hover:shadow-[0_0_24px_rgba(91,224,176,0.4)] transition-all duration-200"
                    >
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 4v8M4 8h8" strokeLinecap="round" />
                      </svg>
                      生成报告
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {myReports.map((report, index) => {
                      const reportViewUrl = report.markdown_signed_url || `/reports/view/${report.id}`;
                      return (
                        <a
                          key={report.id}
                          href={reportViewUrl}
                          target={report.markdown_signed_url ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-[20px] border border-[var(--stroke-soft)] bg-[var(--bg-base)]/80 p-5 transition-all duration-300 hover:border-[var(--accent-emerald)]/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(91,224,176,0.1)] cursor-pointer block"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="absolute top-4 right-4">
                            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                              report.status === "completed"
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                : report.status === "processing"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-slate-400"
                            }`} />
                          </div>
                          <div className="mb-4">
                            <h4 className="text-xl font-bold text-[var(--accent-emerald)] tracking-wide">
                              {report.symbol}
                            </h4>
                            <p className="text-xs text-subtle mt-1">
                              {formatDate(report.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                              report.status === "completed"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : report.status === "processing"
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-slate-500/15 text-slate-300 border border-slate-500/30"
                            }`}>
                              {report.status === "completed" ? "已完成" : report.status === "processing" ? "生成中" : report.status}
                            </span>
                            {report.mode && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-medium uppercase tracking-wider">
                                {report.mode}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--stroke-soft)]">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-emerald)]/10 text-xs font-medium text-[var(--accent-emerald)]">
                              点击查看报告
                            </span>
                            {report.docx_signed_url && (
                              <span
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(report.docx_signed_url!, '_blank');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--stroke-soft)] text-xs font-medium text-dim hover:text-[var(--color-foreground)] hover:border-[var(--accent-emerald)]/40 transition-all cursor-pointer"
                              >
                                下载 DOCX
                              </span>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section id="popular" className="space-y-8 scroll-mt-28 md:scroll-mt-32">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)]">
              {t("reports.page.archiveTag")}
            </p>
            <h2 className="text-2xl font-semibold">{t("reports.page.archiveTitle")}</h2>
            <p className="text-sm text-dim">{t("reports.page.archiveDescription")}</p>
          </div>

          {/* Filter Section - Search & Language on top */}
          <div className="space-y-4">
            {/* Search & Language Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPageIndex(1);
                }}
                className="flex items-center gap-2 rounded-full border border-[var(--accent-emerald)] bg-gradient-to-r from-[var(--accent-emerald)]/5 to-[var(--bg-base)]/90 px-4 py-2 transition-all duration-300 shadow-[0_0_20px_rgba(91,224,176,0.4),inset_0_0_20px_rgba(91,224,176,0.1)] hover:shadow-[0_0_30px_rgba(91,224,176,0.5),inset_0_0_20px_rgba(91,224,176,0.15)]"
              >
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("reports.page.searchPlaceholder") ?? "Search reports"}
                  className="bg-transparent text-sm focus:outline-none min-w-[180px] placeholder-[var(--accent-emerald)]/40"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[var(--accent-emerald)] px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-[0_0_16px_rgba(91,224,176,0.4)] hover:shadow-[0_0_24px_rgba(91,224,176,0.6)] transition-shadow duration-200 active:scale-95"
                >
                  {t("reports.page.searchCta") ?? "Search"}
                </button>
              </form>
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value as typeof selectedLang);
                  setPageIndex(1);
                }}
                className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-base)]/80 px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:outline-none"
              >
                <option value="all">{t("reports.page.allLanguages")}</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh-Hant">繁體中文</option>
                <option value="zh-Hans">简体中文</option>
              </select>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setPageIndex(1);
                  }}
                  className={`relative rounded-full border px-4 py-1 text-sm transition-all duration-200 ease-out ${
                    selectedCategory === category
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] motion-safe:hover:glow-pulse scale-100"
                      : "border-[var(--stroke-soft)] text-dim hover:border-[var(--accent-emerald)]/50 hover:scale-102"
                  }`}
                  data-selected={selectedCategory === category ? "true" : "false"}
                  style={
                    selectedCategory === category
                      ? {
                          boxShadow: "0 0 12px rgba(91, 224, 176, 0.4)",
                        }
                      : {}
                  }
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-amber-400">{error}</p>}
          {loading && (
            <p className="text-xs text-subtle">
              {t("reports.page.loading") ?? "Loading latest reports..."}
            </p>
          )}

          {pagedReports.length === 0 && !loading ? (
            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 p-6 text-sm text-subtle">
              {t("reports.page.empty") ?? "No reports match the current filters yet."}
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                {pagedReports.slice(0, 3).map((report) => {
                  const isPopular = isReportPopular(report.slug);
                  return (
                    <Link
                      key={`${report.slug}-featured`}
                      href={`/reports/${report.slug}`}
                      onClick={(e) => handleReportClick(e, report.slug, report)}
                      className="group relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-2 group-hover:shadow-elevated"
                    >
                      <div className="relative mb-5 overflow-hidden rounded-[20px]">
                        {report.accessLevel && (
                          <AccessBadge
                            variant="featured"
                            accessLevel={report.accessLevel as "timed-free" | "pro" | "ultra"}
                            labels={accessLabels}
                          />
                        )}
                        <div
                          className="h-40 sm:h-48 bg-[var(--bg-base)] transition-transform duration-300 ease-out group-hover:scale-104 group-hover:-translate-y-6px"
                          style={{
                            backgroundImage: report.cover,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      </div>
                      <p className="text-xs uppercase tracking-[0.3em] text-dim">
                        {formatDate(report.date)}
                      </p>
                      <h3
                        className="mt-2 text-2xl font-semibold leading-tight animate-fade-in-up"
                        style={{ animationDelay: "120ms" }}
                      >
                        {report.title}
                      </h3>
                      <p className="mt-3 text-sm text-dim leading-relaxed">{report.snippet}</p>
                      <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[var(--accent-emerald)]">
                        <span>{report.theme}</span>
                        <span>{t("reports.card.readMore")}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" ref={gridRef}>
                {pagedReports.slice(3).map((report) => {
                  const isPopular = isReportPopular(report.slug);
                  return (
                    <Link
                      key={`${report.slug}-tile`}
                      data-stagger-item
                      href={`/reports/${report.slug}`}
                      onClick={(e) => handleReportClick(e, report.slug, report)}
                      className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                      style={{
                        opacity: "var(--item-opacity, 0)",
                        transform: "var(--item-transform, translateY(8px))",
                      }}
                    >
                      {isPopular && (
                        <span className="mb-2 self-start rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--accent-emerald)]/50 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-emerald)]">
                          {t("reports.sort.popular")}
                        </span>
                      )}
                      <div
                        className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--bg-layer)]"
                        style={{
                          backgroundImage: report.cover,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        {report.accessLevel && (
                          <AccessBadge
                            variant="grid"
                            accessLevel={report.accessLevel as "timed-free" | "pro" | "ultra"}
                            labels={accessLabels}
                          />
                        )}
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-dim">
                        {formatDate(report.date)}
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {report.title}
                      </p>
                      <p className="mt-2 text-xs text-subtle">{report.snippet}</p>
                      <div className="mt-4 flex items-center justify-between text-[0.75rem] text-[var(--accent-emerald)]">
                        <span>{report.author}</span>
                        <span>{t("reports.card.readMore")}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {reports.length > 0 && (
            <div className="flex items-center justify-between text-xs text-subtle">
              <span>{t("reports.page.seoNote", { count: String(totalCount) })}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageIndex((prev) => Math.max(prev - 1, 1))}
                  className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  disabled={currentPage === 1}
                >
                  {t("reports.pagination.prev")}
                </button>
                <button
                  type="button"
                  onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages))}
                  className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  disabled={currentPage === totalPages}
                >
                  {t("reports.pagination.next")}
                </button>
              </div>
            </div>
          )}
        </section>

        {!auth.isAuthenticated && (
          <section id="my-reports" className="space-y-8 scroll-mt-28 md:scroll-mt-32">
            <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-base text-amber-50">
              <p>{t("generator.alert.unregistered")}</p>
              <button
                type="button"
                onClick={() => window.location.assign("/#generator")}
                className="mt-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                {t("quota.action.login")}
              </button>
            </div>
          </section>
        )}
      </div>

      {showPaywall && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg"
          onClick={() => setShowPaywall(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-[32px] border border-[var(--accent-emerald)]/30 bg-gradient-to-br from-[var(--bg-layer)]/95 via-[var(--bg-layer)]/90 to-[var(--bg-layer)]/85 p-8 shadow-[0_0_60px_rgba(91,224,176,0.2),0_26px_90px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[var(--accent-emerald)]/5 to-transparent pointer-events-none" />

            <button
              type="button"
              onClick={() => setShowPaywall(false)}
              className="absolute top-6 right-6 p-2 hover:bg-[var(--stroke-soft)]/50 rounded-full transition-all duration-200"
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-[var(--color-foreground)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="relative space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--accent-emerald)]/50">
                  <span className="text-xs font-semibold text-[var(--accent-emerald)] uppercase tracking-wider">高级内容</span>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-emerald)] to-teal-400 bg-clip-text text-transparent">
                  {t("reports.paywall.premium")}
                </h3>
                <p className="text-sm text-dim leading-relaxed">{t("reports.paywall.premium")}</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.location.assign("/pricing#quota")}
                  className="rounded-full bg-gradient-to-r from-[var(--accent-emerald)] to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:shadow-[0_0_30px_rgba(91,224,176,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  立即升级
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaywall(false)}
                  className="rounded-full border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 px-6 py-3 text-sm font-semibold text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/10 hover:border-[var(--accent-emerald)]/50 transition-all duration-200"
                >
                  返回查看
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </main>
  );
}
