"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as docx from "docx";
import { saveAs } from "file-saver";

import { ProgressBar } from "@/app/components/ProgressBar";
import {
  fetchReportAvailability,
  generateReport,
  searchSymbols,
} from "@/lib/services/api";
import type { ReportResponse, SearchResult } from "@/types/report";

import { type ReportGeneratorProps, type ErrorState, type PlaceholderVariant } from "./types";
import { ReportForm } from "./ReportForm";
import { ErrorAlert } from "./ErrorAlert";
import { ReportSkeleton } from "./Skeleton";
import { ReportResult } from "./ReportResult";
import { ReuseDialog } from "./ReuseDialog";
import { CreditsDisplay } from "./CreditsDisplay";
import { ProductHighlights } from "./ProductHighlights";

const placeholderKeyByVariant: Record<PlaceholderVariant, string> = {
  xs: "generator.input.placeholder.xs",
  sm: "generator.input.placeholder.sm",
  md: "generator.input.placeholder.md",
  xl: "generator.input.placeholder",
};

const getPlaceholderVariant = (width: number): PlaceholderVariant => {
  if (width >= 1024) return "xl";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "xs";
};

export function ReportGeneratorSection({
  selectedTone,
  toneOptions,
  language,
  highlightFallback,
  heroHighlights,
  auth,
  initialSearchResults,
  progress,
  onRequireLogin,
  t,
}: ReportGeneratorProps) {
  // State management
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>(initialSearchResults ?? []);
  const [searching, setSearching] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const suppressNextSearchRef = useRef(false);
  const [dropdownClosed, setDropdownClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [lastReportTone, setLastReportTone] = useState<typeof selectedTone>("baseline");
  const [placeholderVariant, setPlaceholderVariant] = useState<PlaceholderVariant>("xs");
  const [showReuseDialog, setShowReuseDialog] = useState(false);
  const [reuseRunId, setReuseRunId] = useState<string | null>(null);
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);

  // Test bypass should only work in development and requires explicit token in URL
  const testToken = process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN;
  const isDevelopment = process.env.NODE_ENV === "development";
  // Only allow bypass in development with explicit testToken in URL params
  const canBypassAuth = false; // Disabled - production security fix
  const isQuotaExhausted =
    !canBypassAuth &&
    auth.isAuthenticated &&
    (auth.quotaLoaded ?? false) &&
    auth.remainingQuota <= 0;

  const selectedToneInfo =
    toneOptions.find((option) => option.id === selectedTone) || toneOptions[0];
  const lastToneInfo = toneOptions.find((option) => option.id === lastReportTone) || toneOptions[0];
  const selectedToneTitle = selectedToneInfo.title;

  const highlightCards = useMemo(
    () =>
      heroHighlights.length
        ? heroHighlights
        : highlightFallback.map((desc, index) => ({
            title: `${t("hero.title")} · ${index + 1}`,
            description: desc,
          })),
    [heroHighlights, highlightFallback, t]
  );

  const placeholderText = useMemo(
    () => t(placeholderKeyByVariant[placeholderVariant]),
    [placeholderVariant, t]
  );

  // Search effect
  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }

    const q = inputValue.trim();
    setSelectedSymbol(null);
    if (!q || q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let canceled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchSymbols(q);
        if (!canceled) setSearchResults(results);
      } catch (err) {
        console.error("search exception:", err);
        if (!canceled) setSearchResults([]);
      } finally {
        if (!canceled) setSearching(false);
      }
    }, 400);

    return () => {
      canceled = true;
      clearTimeout(timer);
      setSearching(false);
    };
  }, [inputValue]);

  // Hash focus effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const focusInput = () => {
      const element = document.querySelector<HTMLInputElement>("#report-query-input");
      element?.focus();
    };

    const handleHash = () => {
      if (window.location.hash === "#generator") {
        setTimeout(focusInput, 200);
      }
    };

    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Placeholder variant effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePlaceholder = () => {
      const next = getPlaceholderVariant(window.innerWidth);
      setPlaceholderVariant((current) => (current === next ? current : next));
    };

    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder);
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  // Handlers
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setDropdownClosed(false);
  };

  const handleSelectResult = (symbol: string) => {
    setInputValue(symbol);
    setSelectedSymbol(symbol);
    setSearchResults([]);
    suppressNextSearchRef.current = true;
    setDropdownClosed(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, forceRegenerate: boolean = false) => {
    e.preventDefault();
    const raw = inputValue.trim().toUpperCase();
    if (!raw) {
      setErrorState({ type: "generic", message: t("error.submit.empty") });
      return;
    }
    if (!/^[A-Z]+$/.test(raw)) {
      setErrorState({ type: "generic", message: t("error.submit.format") });
      return;
    }
    const validResults = searchResults.filter(
      (item) => item.type !== "test" && item.type !== "fallback"
    );
    const matchedFromResults = validResults.some((item) => item.symbol.toUpperCase() === raw);
    const matchedFromSelection = selectedSymbol ? selectedSymbol.toUpperCase() === raw : false;
    if (!matchedFromResults && !matchedFromSelection) {
      setErrorState({ type: "generic", message: t("error.submit.notFound") });
      return;
    }
    setSearchResults([]);

    if (!auth.isAuthenticated && !canBypassAuth) {
      setErrorState({ type: "unauthorized", message: t("generator.alert.unregistered") });
      onRequireLogin();
      return;
    }

    // 检查积分是否足够（生成报告需要30积分）
    const REPORT_CREDIT_COST = 30;
    if (isQuotaExhausted || auth.remainingQuota < REPORT_CREDIT_COST) {
      setErrorState({
        type: "quota",
        message: t("generator.alert.insufficientCredits", {
          required: String(REPORT_CREDIT_COST),
          available: String(auth.remainingQuota)
        }) || `积分不足，需要 ${REPORT_CREDIT_COST} 积分，当前余额 ${auth.remainingQuota} 积分`
      });
      return;
    }

    // Check for reusable report
    if (!forceRegenerate) {
      try {
        const availability = await fetchReportAvailability({
          symbol: raw,
          lang: language,
          mode: "production",
        });
        if (availability.reusable && availability.reusable_run_id) {
          setPendingSymbol(raw);
          setReuseRunId(availability.reusable_run_id);
          setShowReuseDialog(true);
          return;
        }
      } catch (err) {
        console.warn("Availability check failed, proceeding with generation", err);
      }
    }

    // Generate report
    setLastReportTone(selectedTone);
    setLoading(true);
    setErrorState(null);
    setReportData(null);
    progress.start(t("generator.progress.init"));

    try {
      const data = await generateReport({ symbol: raw, lang: language, tone: selectedTone });
      await progress.complete(t("generator.progress.done"));
      setReportData(data);
      await auth.refreshSession();
      if (auth.refreshQuota) {
        await auth.refreshQuota();
      }
    } catch (err) {
      console.error("调用接口异常:", err);
      const error = err instanceof Error ? err : { message: "", code: undefined };
      const message = error.message || t("error.submit.generic");
      const errorCode = (error as { code?: string; statusCode?: number }).code;
      const statusCode = (error as { code?: string; statusCode?: number }).statusCode;

      if (errorCode === "unauthorized" || errorCode === "UNAUTHORIZED" || statusCode === 401) {
        setErrorState({ type: "unauthorized", message: t("quota.status.mismatch") });
        onRequireLogin();
      } else if (errorCode === "INSUFFICIENT_CREDITS" || statusCode === 403) {
        // 积分不足错误 - 显示API返回的中文错误信息
        setErrorState({ type: "quota", message: message || t("generator.alert.quota") });
      } else if (errorCode === "quota_exceeded" || statusCode === 429) {
        setErrorState({ type: "quota", message: t("generator.alert.quota") });
      } else if (errorCode === "quota_fetch_failed") {
        setErrorState({ type: "generic", message: t("quota.error.generic") });
      } else {
        const normalized = (message || "").toLowerCase();
        if (normalized.includes("unauthorized")) {
          setErrorState({ type: "unauthorized", message: t("quota.status.mismatch") });
          onRequireLogin();
        } else if (normalized.includes("积分不足") || normalized.includes("insufficient credits")) {
          setErrorState({ type: "quota", message });
        } else if (normalized.includes("quota exceeded") || normalized.includes("429")) {
          setErrorState({ type: "quota", message: t("generator.alert.quota") });
        } else {
          setErrorState({ type: "generic", message });
        }
      }
      progress.fail(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    setShowReuseDialog(false);
    window.location.assign("/reports#my-reports");
  };

  const handleRegenerate = () => {
    setShowReuseDialog(false);
    // Create a synthetic form event
    const syntheticEvent = new Event("submit", { bubbles: true, cancelable: true });
    const form = document.querySelector("form");
    if (form) {
      handleSubmit(syntheticEvent as any, true);
    }
  };

  const handleUseReused = async () => {
    setShowReuseDialog(false);
    if (!pendingSymbol) return;

    // 直接调用API获取复用的报告（API会返回复用的报告内容）
    setLastReportTone(selectedTone);
    setLoading(true);
    setErrorState(null);
    setReportData(null);
    progress.start(t("generator.progress.loading"));

    try {
      const data = await generateReport({ symbol: pendingSymbol, lang: language, tone: selectedTone });
      await progress.complete(t("generator.progress.done"));
      setReportData(data);

      // 显示复用提示
      if (data.reused) {
        console.info("[REPORT_REUSED] Using cached report from API");
      }
    } catch (err) {
      console.error("加载复用报告异常:", err);
      const error = err instanceof Error ? err : { message: "" };
      setErrorState({ type: "generic", message: error.message || t("error.submit.generic") });
      progress.fail(error.message || "Failed to load report");
    } finally {
      setLoading(false);
      setPendingSymbol(null);
      setReuseRunId(null);
    }
  };

  const handleCopyRichText = async () => {
    if (!reportData) {
      alert(t("alert.copy.missing"));
      return;
    }

    // We need a ref to the rendered content
    const reportContentRef = document.querySelector(".report-markdown-content");
    if (!reportContentRef) {
      alert(t("alert.copy.missing"));
      return;
    }

    const contentHtml = reportContentRef.innerHTML;
    const textPlain = reportData.report;

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      try {
        const htmlBlob = new Blob([contentHtml], { type: "text/html" });
        const textBlob = new Blob([textPlain], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
        alert(t("alert.copy.success"));
        return;
      } catch (error) {
        console.warn("使用 ClipboardItem API 复制失败，尝试回退:", error);
      }
    }

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(reportContentRef as Node);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges();
      alert(t("alert.copy.fallback"));
    } catch (execError) {
      console.error("富文本复制失败:", execError);
      alert(t("alert.copy.error"));
    }
  };

  const handleExportDocx = async () => {
    if (!reportData) {
      alert(t("alert.export.missing"));
      return;
    }
    setExportingDocx(true);

    const lines = reportData.report.split("\n");
    let titleLine = lines.find((line) => line.trim().startsWith("# "));
    if (!titleLine) {
      const companyName = reportData.companyData.profile?.name || reportData.symbol;
      const symbol = reportData.symbol || "UNKNOWN";
      titleLine = t("report.docx.fallbackTitle", { company: companyName, symbol });
    }

    const fileName = `Qiltrack-AI_Report_${reportData.symbol}_${new Date().toLocaleDateString("en-CA")}.docx`;

    try {
      const markdownLines = reportData.report.split("\n");
      const docxChildren: docx.Paragraph[] = [];
      markdownLines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        let paragraph = new docx.Paragraph({});
        if (trimmedLine.startsWith("# ")) {
          paragraph = new docx.Paragraph({
            text: trimmedLine.replace("# ", ""),
            heading: docx.HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            alignment: docx.AlignmentType.CENTER,
          });
        } else if (trimmedLine.startsWith("## ")) {
          paragraph = new docx.Paragraph({
            text: trimmedLine.replace("## ", ""),
            heading: docx.HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          });
        } else if (trimmedLine.startsWith("### ")) {
          paragraph = new docx.Paragraph({
            text: trimmedLine.replace("### ", ""),
            heading: docx.HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 50 },
          });
        } else if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
          paragraph = new docx.Paragraph({
            text: trimmedLine.substring(2).trim(),
            bullet: { level: 0 },
            spacing: { before: 50, after: 50 },
          });
        } else {
          const runs: docx.Run[] = [];
          const parts = trimmedLine.split("**");
          parts.forEach((part, index) => {
            const isBold = index % 2 === 1;
            runs.push(
              new docx.Run({
                text: part,
                bold: isBold,
                font: { name: "Microsoft YaHei" },
              })
            );
          });
          paragraph = new docx.Paragraph({ children: runs, spacing: { before: 100, after: 100 } });
        }

        docxChildren.push(paragraph);
      });

      const docFile = new docx.Document({
        styles: {
          default: {
            document: {
              run: {
                font: { name: "Microsoft YaHei" },
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: docx.convertInchesToTwip(1),
                  right: docx.convertInchesToTwip(1),
                  bottom: docx.convertInchesToTwip(1),
                  left: docx.convertInchesToTwip(1),
                },
              },
            },
            children: docxChildren,
          },
        ],
      });

      const blob = await docx.Packer.toBlob(docFile);
      saveAs(blob, fileName);
      alert(t("alert.export.success"));
    } catch (err) {
      console.error("DOCX 导出失败:", err);
      alert(t("alert.export.error"));
    } finally {
      setExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportData) {
      alert(t("alert.export.missing"));
      return;
    }
    if (!auth.isAuthenticated && !canBypassAuth) {
      setErrorState({ type: "unauthorized", message: t("generator.alert.unregistered") });
      onRequireLogin();
      return;
    }

    // 权限检查由后端完成，包括 plan 和 subscription_status

    setExportingPdf(true);
    try {
      const response = await fetch("/api/report/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({
          reportRunId: reportData.reportRunId,
          report: reportData.report,
          companyData: reportData.companyData,
          symbol: reportData.symbol,
          tone: lastReportTone,
          planLabel: auth.planLabel,
          lang: language, // 传递当前语言给 PDF 生成
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        downloadUrl?: string;
        pdfBase64?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        if (data?.code === "plan_required") {
          alert(t("report.pdf.error.plan"));
        } else if (data?.code === "not_authenticated") {
          setErrorState({ type: "unauthorized", message: t("generator.alert.unregistered") });
          onRequireLogin();
        } else {
          alert(data?.error || t("alert.export.error"));
        }
        return;
      }

      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (data.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        link.download = `Qiltrack-AI_Report_${reportData.symbol}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      alert(t("alert.export.error"));
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(t("alert.export.error"));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleRefreshQuota = async () => {
    try {
      if (auth.refreshQuota) {
        await auth.refreshQuota();
      } else {
        await auth.refreshSession();
      }
      setErrorState(null);
    } catch (refreshError) {
      console.error("刷新额度失败:", refreshError);
      setErrorState({ type: "generic", message: t("quota.error.generic") });
    }
  };

  const handleViewPricing = () => {
    if (typeof window === "undefined") return;
    window.location.assign("/pricing#quota");
  };

  // Workflow for progress
  const workflowList = [
    { step: 1, label: t("generator.progress.stage1") },
    { step: 2, label: t("generator.progress.stage2") },
    { step: 3, label: t("generator.progress.stage3") },
    { step: 4, label: t("generator.progress.stage4") },
    { step: 5, label: t("generator.progress.stage5") },
    { step: 6, label: t("generator.progress.stage6") },
    { step: 7, label: t("generator.progress.stage7") },
    { step: 8, label: t("generator.progress.stage8") },
  ];

  const hasDropdown = !dropdownClosed && (searchResults.slice(0, 3).length > 0 || searching);
  const currentStageIndex = Math.min(
    workflowList.length - 1,
    Math.max(0, progress.currentStep - 1)
  );
  const progressStageLabel =
    workflowList[currentStageIndex]?.label ?? t("generator.progress.fetching");

  return (
    <div className="space-y-6 md:space-y-8 min-w-0" id="generator">
      <section className="space-y-5 md:space-y-6 min-w-0">
        {(progress.progress > 0 || loading) && (
          <ProgressBar
            percent={progress.progress}
            label={progress.text ?? t("generator.progress.preparing")}
            steps={workflowList}
            activeStep={progress.currentStep}
          />
        )}

        <ReportForm
          inputValue={inputValue}
          searchResults={searchResults}
          searching={searching}
          hasDropdown={hasDropdown}
          placeholderText={placeholderText}
          loading={loading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onSelectResult={handleSelectResult}
          t={t}
          quotaInfo={{
            isAuthenticated: auth.isAuthenticated,
            remainingQuota: auth.remainingQuota,
          }}
        />

        <ReuseDialog
          showReuseDialog={showReuseDialog}
          onViewHistory={handleViewHistory}
          onRegenerate={handleRegenerate}
          onUseReused={handleUseReused}
          onClose={() => setShowReuseDialog(false)}
          t={t}
        />

        <ErrorAlert
          errorState={errorState}
          auth={auth}
          isQuotaExhausted={isQuotaExhausted}
          onDismiss={() => setErrorState(null)}
          onRequireLogin={onRequireLogin}
          onRefreshQuota={handleRefreshQuota}
          onViewPricing={handleViewPricing}
          t={t}
        />

        {loading && <ReportSkeleton />}

        <ReportResult
          reportData={reportData}
          lastToneInfo={lastToneInfo}
          highlightFallback={highlightFallback}
          exportingDocx={exportingDocx}
          exportingPdf={exportingPdf}
          onCopyRichText={handleCopyRichText}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          t={t}
        />
      </section>

      <section className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-5 sm:p-6 space-y-4 shadow-[0_16px_60px_rgba(0,0,0,0.3)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <CreditsDisplay
            auth={auth}
            isQuotaExhausted={isQuotaExhausted}
            onRefreshSession={auth.refreshSession}
            onRequireLogin={onRequireLogin}
            t={t}
          />
          <ProductHighlights highlightCards={highlightCards} t={t} />
        </div>
      </section>
    </div>
  );
}
