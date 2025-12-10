"use client";

import { FormEvent, useEffect, useMemo, useReducer, useRef } from "react";
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

// State type definition
type GeneratorState = {
  inputValue: string;
  searchResults: SearchResult[];
  searching: boolean;
  selectedSymbol: string | null;
  dropdownClosed: boolean;
  loading: boolean;
  errorState: ErrorState | null;
  reportData: ReportResponse | null;
  exportingDocx: boolean;
  exportingPdf: boolean;
  lastReportTone: string;
  placeholderVariant: PlaceholderVariant;
  showReuseDialog: boolean;
  reuseRunId: string | null;
  pendingSymbol: string | null;
};

// Action types
type GeneratorAction =
  | { type: "SET_INPUT_VALUE"; payload: string }
  | { type: "SET_SEARCH_RESULTS"; payload: SearchResult[] }
  | { type: "SET_SEARCHING"; payload: boolean }
  | { type: "SET_SELECTED_SYMBOL"; payload: string | null }
  | { type: "SET_DROPDOWN_CLOSED"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR_STATE"; payload: ErrorState | null }
  | { type: "SET_REPORT_DATA"; payload: ReportResponse | null }
  | { type: "SET_EXPORTING_DOCX"; payload: boolean }
  | { type: "SET_EXPORTING_PDF"; payload: boolean }
  | { type: "SET_LAST_REPORT_TONE"; payload: string }
  | { type: "SET_PLACEHOLDER_VARIANT"; payload: PlaceholderVariant }
  | { type: "SET_SHOW_REUSE_DIALOG"; payload: boolean }
  | { type: "SET_REUSE_RUN_ID"; payload: string | null }
  | { type: "SET_PENDING_SYMBOL"; payload: string | null }
  | { type: "SELECT_RESULT"; payload: { symbol: string } }
  | { type: "CLEAR_SEARCH" }
  | { type: "START_GENERATION"; payload: { tone: string } }
  | { type: "GENERATION_SUCCESS"; payload: ReportResponse }
  | { type: "GENERATION_ERROR"; payload: ErrorState }
  | { type: "RESET_GENERATION" };

// Reducer function
function generatorReducer(state: GeneratorState, action: GeneratorAction): GeneratorState {
  switch (action.type) {
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "SET_SEARCHING":
      return { ...state, searching: action.payload };
    case "SET_SELECTED_SYMBOL":
      return { ...state, selectedSymbol: action.payload };
    case "SET_DROPDOWN_CLOSED":
      return { ...state, dropdownClosed: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR_STATE":
      return { ...state, errorState: action.payload };
    case "SET_REPORT_DATA":
      return { ...state, reportData: action.payload };
    case "SET_EXPORTING_DOCX":
      return { ...state, exportingDocx: action.payload };
    case "SET_EXPORTING_PDF":
      return { ...state, exportingPdf: action.payload };
    case "SET_LAST_REPORT_TONE":
      return { ...state, lastReportTone: action.payload };
    case "SET_PLACEHOLDER_VARIANT":
      return { ...state, placeholderVariant: action.payload };
    case "SET_SHOW_REUSE_DIALOG":
      return { ...state, showReuseDialog: action.payload };
    case "SET_REUSE_RUN_ID":
      return { ...state, reuseRunId: action.payload };
    case "SET_PENDING_SYMBOL":
      return { ...state, pendingSymbol: action.payload };
    case "SELECT_RESULT":
      return {
        ...state,
        inputValue: action.payload.symbol,
        selectedSymbol: action.payload.symbol,
        searchResults: [],
        dropdownClosed: true,
        errorState: null,
      };
    case "CLEAR_SEARCH":
      return {
        ...state,
        searchResults: [],
        errorState: null,
      };
    case "START_GENERATION":
      return {
        ...state,
        lastReportTone: action.payload.tone,
        loading: true,
        errorState: null,
        reportData: null,
      };
    case "GENERATION_SUCCESS":
      return {
        ...state,
        reportData: action.payload,
        loading: false,
      };
    case "GENERATION_ERROR":
      return {
        ...state,
        errorState: action.payload,
        loading: false,
      };
    case "RESET_GENERATION":
      return {
        ...state,
        loading: false,
        errorState: null,
      };
    default:
      return state;
  }
}

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
  // State management with useReducer
  const [state, dispatch] = useReducer(generatorReducer, {
    inputValue: "",
    searchResults: initialSearchResults ?? [],
    searching: false,
    selectedSymbol: null,
    dropdownClosed: false,
    loading: false,
    errorState: null,
    reportData: null,
    exportingDocx: false,
    exportingPdf: false,
    lastReportTone: "baseline",
    placeholderVariant: "xs",
    showReuseDialog: false,
    reuseRunId: null,
    pendingSymbol: null,
  });

  const suppressNextSearchRef = useRef(false);

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
  const lastToneInfo = toneOptions.find((option) => option.id === state.lastReportTone) || toneOptions[0];
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
    () => t(placeholderKeyByVariant[state.placeholderVariant]),
    [state.placeholderVariant, t]
  );

  // Search effect
  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }

    const q = state.inputValue.trim();
    dispatch({ type: "SET_SELECTED_SYMBOL", payload: null });
    if (!q || q.length < 2) {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      dispatch({ type: "SET_SEARCHING", payload: false });
      return;
    }

    let canceled = false;
    const timer = setTimeout(async () => {
      dispatch({ type: "SET_SEARCHING", payload: true });
      try {
        const results = await searchSymbols(q);
        if (!canceled) dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
      } catch (err) {
        console.error("search exception:", err);
        if (!canceled) dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      } finally {
        if (!canceled) dispatch({ type: "SET_SEARCHING", payload: false });
      }
    }, 400);

    return () => {
      canceled = true;
      clearTimeout(timer);
      dispatch({ type: "SET_SEARCHING", payload: false });
    };
  }, [state.inputValue]);

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
      dispatch({ type: "SET_PLACEHOLDER_VARIANT", payload: next });
    };

    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder);
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  // Handlers
  const handleInputChange = (value: string) => {
    dispatch({ type: "SET_INPUT_VALUE", payload: value });
    dispatch({ type: "SET_DROPDOWN_CLOSED", payload: false });
  };

  const handleSelectResult = (symbol: string) => {
    suppressNextSearchRef.current = true;
    dispatch({ type: "SELECT_RESULT", payload: { symbol } });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, forceRegenerate: boolean = false) => {
    e.preventDefault();
    const raw = state.inputValue.trim();
    if (!raw) {
      dispatch({ type: "SET_ERROR_STATE", payload: { type: "generic", message: t("error.submit.empty") } });
      return;
    }
    // 允许字母、数字、点号、连字符以及中文/日文/韩文（如BRK.A, 苹果, アップル, 애플）
    const rawUpper = raw.toUpperCase();
    if (!/^[A-Z0-9.\-\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\s]+$/.test(rawUpper)) {
      dispatch({ type: "SET_ERROR_STATE", payload: { type: "generic", message: t("error.submit.format") } });
      return;
    }

    // 如果正在搜索，等待搜索完成
    if (state.searching) {
      // 等待最多2秒让搜索完成
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 确定要使用的symbol：优先使用selectedSymbol，否则从搜索结果中查找匹配项
    let symbolToUse = state.selectedSymbol;

    if (!symbolToUse) {
      const validResults = state.searchResults.filter(
        (item) => item.type !== "test" && item.type !== "fallback"
      );

      // 尝试从搜索结果中找到精确匹配的symbol
      const exactMatch = validResults.find((item) => item.symbol.toUpperCase() === raw.toUpperCase());
      if (exactMatch) {
        symbolToUse = exactMatch.symbol;
      } else if (validResults.length > 0) {
        // 如果没有精确匹配但有搜索结果，使用第一个结果
        symbolToUse = validResults[0].symbol;
      }
    }

    // 如果仍然没有找到有效的symbol，显示错误
    if (!symbolToUse) {
      dispatch({ type: "SET_ERROR_STATE", payload: { type: "generic", message: t("error.submit.notFound") } });
      return;
    }

    dispatch({ type: "CLEAR_SEARCH" });

    if (!auth.isAuthenticated && !canBypassAuth) {
      dispatch({ type: "SET_ERROR_STATE", payload: { type: "unauthorized", message: t("generator.alert.unregistered") } });
      onRequireLogin();
      return;
    }

    // 检查积分是否足够（生成报告需要30积分）
    const REPORT_CREDIT_COST = 30;
    if (isQuotaExhausted || auth.remainingQuota < REPORT_CREDIT_COST) {
      dispatch({ type: "SET_ERROR_STATE", payload: {
        type: "quota",
        message: t("generator.alert.insufficientCredits", {
          required: String(REPORT_CREDIT_COST),
          available: String(auth.remainingQuota)
        }) || `积分不足，需要 ${REPORT_CREDIT_COST} 积分，当前余额 ${auth.remainingQuota} 积分`
      } });
      return;
    }

    // Check for reusable report
    if (!forceRegenerate) {
      try {
        const availability = await fetchReportAvailability({
          symbol: symbolToUse,
          lang: language,
          mode: "production",
        });
        if (availability.reusable && availability.reusable_run_id) {
          dispatch({ type: "SET_PENDING_SYMBOL", payload: symbolToUse });
          dispatch({ type: "SET_REUSE_RUN_ID", payload: availability.reusable_run_id });
          dispatch({ type: "SET_SHOW_REUSE_DIALOG", payload: true });
          return;
        }
      } catch (err) {
        console.warn("Availability check failed, proceeding with generation", err);
      }
    }

    // Generate report
    dispatch({ type: "START_GENERATION", payload: { tone: selectedTone } });
    progress.start(t("generator.progress.init"));

    try {
      const data = await generateReport({ symbol: symbolToUse, lang: language, tone: selectedTone });
      await progress.complete(t("generator.progress.done"));
      dispatch({ type: "GENERATION_SUCCESS", payload: data });
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
        dispatch({ type: "GENERATION_ERROR", payload: { type: "unauthorized", message: t("quota.status.mismatch") } });
        onRequireLogin();
      } else if (errorCode === "INSUFFICIENT_CREDITS" || statusCode === 403) {
        // 积分不足错误 - 显示API返回的中文错误信息
        dispatch({ type: "GENERATION_ERROR", payload: { type: "quota", message: message || t("generator.alert.quota") } });
      } else if (errorCode === "quota_exceeded" || statusCode === 429) {
        dispatch({ type: "GENERATION_ERROR", payload: { type: "quota", message: t("generator.alert.quota") } });
      } else if (errorCode === "quota_fetch_failed") {
        dispatch({ type: "GENERATION_ERROR", payload: { type: "generic", message: t("quota.error.generic") } });
      } else {
        const normalized = (message || "").toLowerCase();
        if (normalized.includes("unauthorized")) {
          dispatch({ type: "GENERATION_ERROR", payload: { type: "unauthorized", message: t("quota.status.mismatch") } });
          onRequireLogin();
        } else if (normalized.includes("积分不足") || normalized.includes("insufficient credits")) {
          dispatch({ type: "GENERATION_ERROR", payload: { type: "quota", message } });
        } else if (normalized.includes("quota exceeded") || normalized.includes("429")) {
          dispatch({ type: "GENERATION_ERROR", payload: { type: "quota", message: t("generator.alert.quota") } });
        } else {
          dispatch({ type: "GENERATION_ERROR", payload: { type: "generic", message } });
        }
      }
      progress.fail(message);
    }
  };

  const handleViewHistory = () => {
    dispatch({ type: "SET_SHOW_REUSE_DIALOG", payload: false });
    window.location.assign("/reports#my-reports");
  };

  const handleRegenerate = () => {
    dispatch({ type: "SET_SHOW_REUSE_DIALOG", payload: false });
    // Create a synthetic form event
    const syntheticEvent = new Event("submit", { bubbles: true, cancelable: true });
    const form = document.querySelector("form");
    if (form) {
      handleSubmit(syntheticEvent as any, true);
    }
  };

  const handleUseReused = async () => {
    dispatch({ type: "SET_SHOW_REUSE_DIALOG", payload: false });
    if (!state.pendingSymbol) return;

    // 直接调用API获取复用的报告（API会返回复用的报告内容）
    dispatch({ type: "START_GENERATION", payload: { tone: selectedTone } });
    progress.start(t("generator.progress.loading"));

    try {
      const data = await generateReport({ symbol: state.pendingSymbol, lang: language, tone: selectedTone });
      await progress.complete(t("generator.progress.done"));
      dispatch({ type: "GENERATION_SUCCESS", payload: data });

      // 显示复用提示
      if (data.reused) {
        console.info("[REPORT_REUSED] Using cached report from API");
      }
    } catch (err) {
      console.error("加载复用报告异常:", err);
      const error = err instanceof Error ? err : { message: "" };
      dispatch({ type: "GENERATION_ERROR", payload: { type: "generic", message: error.message || t("error.submit.generic") } });
      progress.fail(error.message || "Failed to load report");
    } finally {
      dispatch({ type: "SET_PENDING_SYMBOL", payload: null });
      dispatch({ type: "SET_REUSE_RUN_ID", payload: null });
    }
  };

  const handleCopyRichText = async () => {
    if (!state.reportData) {
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
    const textPlain = state.reportData.report;

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
    if (!state.reportData) {
      alert(t("alert.export.missing"));
      return;
    }
    dispatch({ type: "SET_EXPORTING_DOCX", payload: true });

    const lines = state.reportData.report.split("\n");
    let titleLine = lines.find((line) => line.trim().startsWith("# "));
    if (!titleLine) {
      const companyName = state.reportData.companyData.profile?.name || state.reportData.symbol;
      const symbol = state.reportData.symbol || "UNKNOWN";
      titleLine = t("report.docx.fallbackTitle", { company: companyName, symbol });
    }

    const fileName = `Qiltrack-AI_Report_${state.reportData.symbol}_${new Date().toLocaleDateString("en-CA")}.docx`;

    try {
      const markdownLines = state.reportData.report.split("\n");
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
      dispatch({ type: "SET_EXPORTING_DOCX", payload: false });
    }
  };

  const handleExportPdf = async () => {
    if (!state.reportData) {
      alert(t("alert.export.missing"));
      return;
    }
    if (!auth.isAuthenticated && !canBypassAuth) {
      dispatch({ type: "SET_ERROR_STATE", payload: { type: "unauthorized", message: t("generator.alert.unregistered") } });
      onRequireLogin();
      return;
    }

    // 权限检查由后端完成，包括 plan 和 subscription_status

    dispatch({ type: "SET_EXPORTING_PDF", payload: true });
    try {
      const response = await fetch("/api/report/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({
          reportRunId: state.reportData.reportRunId,
          report: state.reportData.report,
          companyData: state.reportData.companyData,
          symbol: state.reportData.symbol,
          tone: state.lastReportTone,
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
          dispatch({ type: "SET_ERROR_STATE", payload: { type: "unauthorized", message: t("generator.alert.unregistered") } });
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
        link.download = `Qiltrack-AI_Report_${state.reportData.symbol}.pdf`;
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
      dispatch({ type: "SET_EXPORTING_PDF", payload: false });
    }
  };

  const handleRefreshQuota = async () => {
    try {
      if (auth.refreshQuota) {
        await auth.refreshQuota();
      } else {
        await auth.refreshSession();
      }
      dispatch({ type: "SET_ERROR_STATE", payload: null });
    } catch (refreshError) {
      console.error("刷新额度失败:", refreshError);
      dispatch({ type: "SET_ERROR_STATE", payload: { type: "generic", message: t("quota.error.generic") } });
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

  const hasDropdown = !state.dropdownClosed && (state.searchResults.slice(0, 3).length > 0 || state.searching);
  const currentStageIndex = Math.min(
    workflowList.length - 1,
    Math.max(0, progress.currentStep - 1)
  );
  const progressStageLabel =
    workflowList[currentStageIndex]?.label ?? t("generator.progress.fetching");

  return (
    <div className="space-y-6 md:space-y-8 min-w-0" id="generator">
      <section className="space-y-5 md:space-y-6 min-w-0">
        {(progress.progress > 0 || state.loading) && (
          <ProgressBar
            percent={progress.progress}
            label={progress.text ?? t("generator.progress.preparing")}
            steps={workflowList}
            activeStep={progress.currentStep}
          />
        )}

        <ReportForm
          inputValue={state.inputValue}
          searchResults={state.searchResults}
          searching={state.searching}
          hasDropdown={hasDropdown}
          placeholderText={placeholderText}
          loading={state.loading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onSelectResult={handleSelectResult}
          t={t}
          quotaInfo={{
            isAuthenticated: auth.isAuthenticated,
            remainingQuota: auth.remainingQuota,
            currentModeCredits: selectedToneInfo.credits,
          }}
        />

        <ReuseDialog
          showReuseDialog={state.showReuseDialog}
          onViewHistory={handleViewHistory}
          onRegenerate={handleRegenerate}
          onUseReused={handleUseReused}
          onClose={() => dispatch({ type: "SET_SHOW_REUSE_DIALOG", payload: false })}
          t={t}
        />

        <ErrorAlert
          errorState={state.errorState}
          auth={auth}
          isQuotaExhausted={isQuotaExhausted}
          onDismiss={() => dispatch({ type: "SET_ERROR_STATE", payload: null })}
          onRequireLogin={onRequireLogin}
          onRefreshQuota={handleRefreshQuota}
          onViewPricing={handleViewPricing}
          t={t}
        />

        {state.loading && <ReportSkeleton />}

        <ReportResult
          reportData={state.reportData}
          lastToneInfo={lastToneInfo}
          highlightFallback={highlightFallback}
          exportingDocx={state.exportingDocx}
          exportingPdf={state.exportingPdf}
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
