"use client";

import { useState, useRef, useEffect, memo } from "react";
import { type SearchResult } from "@/types/report";
import { type PlaceholderVariant } from "./types";
import { reportQuerySchema } from "./validation";

type ReportFormProps = {
  inputValue: string;
  searchResults: SearchResult[];
  searching: boolean;
  hasDropdown: boolean;
  placeholderText: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSelectResult: (symbol: string) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  quotaInfo: {
    isAuthenticated: boolean;
    remainingQuota: number;
    currentModeCredits: number;
  };
};

const maxVisibleResults = 3;

export function ReportForm({
  inputValue,
  searchResults,
  searching,
  hasDropdown,
  placeholderText,
  loading,
  onInputChange,
  onSubmit,
  onSelectResult,
  t,
  quotaInfo,
}: ReportFormProps) {
  const visibleResults = searchResults.slice(0, maxVisibleResults);
  const [validationError, setValidationError] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasDropdown || visibleResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < visibleResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        // 如果用户已经用键盘选择了某个项，使用该项
        // 否则自动选择第一个结果
        const indexToSelect = focusedIndex >= 0 ? focusedIndex : 0;
        if (visibleResults[indexToSelect]) {
          onSelectResult(visibleResults[indexToSelect].symbol);
          setFocusedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setFocusedIndex(-1);
        break;
    }
  };

  const handleInputChange = (value: string) => {
    onInputChange(value);
    // 实时验证
    const result = reportQuerySchema.safeParse({ query: value });
    if (!result.success && value.length > 0) {
      setValidationError(result.error.issues[0].message);
    } else {
      setValidationError("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = reportQuerySchema.safeParse({ query: inputValue });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }
    setValidationError("");
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden space-y-5 rounded-[28px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 sm:p-6 shadow-[0_20px_70px_rgba(0,0,0,0.34)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-[var(--accent-emerald)]/12 blur-[110px]"
          aria-hidden
        />
        <div
          className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-[var(--accent-blue)]/10 blur-[140px]"
          aria-hidden
        />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.2em] text-subtle min-w-0">
        <div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-1.5 text-[var(--accent-emerald)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
          <span className="rounded-full bg-[var(--accent-emerald)]/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
            {t("generator.step.two")}
          </span>
          <span>{t("generator.input.label")}</span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)]/70 bg-[var(--bg-layer)]/85 px-3.5 py-1.5 text-sm text-[var(--color-foreground)] whitespace-nowrap">
          {quotaInfo.isAuthenticated ? (
            <>
              <span
                className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"
                aria-hidden
              />
              <span>余额：{quotaInfo.remainingQuota}</span>
              {quotaInfo.currentModeCredits > 0 && (
                <span className="text-amber-400 font-medium">
                  | -{quotaInfo.currentModeCredits}
                </span>
              )}
            </>
          ) : (
            <>
              <span
                className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"
                aria-hidden
              />
              {t("generator.account.cta")}
            </>
          )}
        </span>
      </div>

      <div className="relative flex flex-col gap-5 sm:gap-6 min-w-0">
        <div className="flex-1">
          <div className="group relative overflow-hidden rounded-[24px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 shadow-[0_18px_50px_rgba(0,0,0,0.28)] min-w-0">
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute -left-6 top-2 h-24 w-24 rounded-full bg-[var(--accent-emerald)]/20 blur-[90px]"
                aria-hidden
              />
              <div
                className="absolute right-0 bottom-0 h-28 w-28 rounded-full bg-[var(--accent-blue)]/16 blur-[110px]"
                aria-hidden
              />
              <div
                className="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0)),radial-gradient(circle_at_16%_12%,rgba(91,224,176,0.14),transparent_34%)]"
                aria-hidden
              />
            </div>

            <div className="relative flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-subtle min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 px-2 py-1 text-[var(--accent-emerald)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)] animate-ping"
                    aria-hidden
                  />
                  Live
                </span>
                <span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-2 py-1">
                  US
                </span>
                <span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-2 py-1">
                  Beta
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] text-dim">
                三步完成：选模式 → 输入代码 → 生成
              </span>
            </div>

            <div className="relative px-4 pb-4">
              <div className="relative rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--bg-base)]/65 px-4 py-3 backdrop-blur-xl transition group-focus-within:border-[var(--accent-emerald)]/70 group-focus-within:shadow-[0_0_0_2px_rgba(91,224,176,0.45)]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[var(--accent-emerald)]">
                  🔎
                </span>
                <input
                  id="report-query-input"
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(event) => handleInputChange(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  autoComplete="off"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
                  className="w-full bg-transparent pl-10 pr-24 py-2.5 text-base text-[var(--color-foreground)] placeholder:text-subtle focus:outline-none transition-shadow duration-200 ease-out"
                  aria-label={t("generator.input.label")}
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? "validation-error" : undefined}
                  aria-expanded={hasDropdown}
                  aria-controls={hasDropdown ? "search-results-dropdown" : undefined}
                  aria-activedescendant={focusedIndex >= 0 ? `result-${focusedIndex}` : undefined}
                  role="combobox"
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] text-subtle">
                  <span className="rounded-full border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 px-2.5 py-0.5 text-[var(--accent-emerald)]">
                    Ticker / Name
                  </span>
                </div>
              </div>

              {validationError && (
                <div id="validation-error" role="alert" className="mt-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
                  {validationError}
                </div>
              )}

              {hasDropdown && (
                <div
                  id="search-results-dropdown"
                  ref={dropdownRef}
                  role="listbox"
                  className="mt-2 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 shadow-[0_18px_45px_rgba(0,0,0,0.32)] backdrop-blur"
                >
                  {searching && (
                    <div className="px-4 py-2 text-sm text-subtle">{t("generator.searching")}</div>
                  )}
                  {!searching && visibleResults.length === 0 && (
                    <div className="px-4 py-2 text-sm text-subtle">
                      {t("generator.search.empty")}
                    </div>
                  )}
                  {!searching &&
                    visibleResults.map((item, index) => (
                      <button
                        type="button"
                        id={`result-${index}`}
                        key={`${item.symbol}-${item.displaySymbol ?? item.description}`}
                        onClick={() => {
                          onSelectResult(item.symbol);
                          setFocusedIndex(-1);
                        }}
                        onMouseEnter={() => setFocusedIndex(index)}
                        role="option"
                        aria-selected={focusedIndex === index}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                          focusedIndex === index
                            ? "bg-[var(--bg-layer)] ring-2 ring-[var(--accent-emerald)]/30"
                            : "hover:bg-[var(--bg-layer)]"
                        } focus:outline-none focus-visible:bg-[var(--bg-layer)]`}
                      >
                        <p className="font-semibold text-[var(--color-foreground)]">
                          {item.symbol}
                        </p>
                        <p className="text-subtle text-xs">
                          {item.description || item.displaySymbol || item.type || ""}
                        </p>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            className="relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--accent-emerald)] via-emerald-300 to-cyan-300 px-8 sm:px-12 py-4 text-base sm:text-lg font-semibold text-slate-950 shadow-[0_22px_50px_rgba(91,224,176,0.35)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(91,224,176,0.45)] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]/60 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={loading || !!validationError}
          >
            <span
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.35),rgba(255,255,255,0))] opacity-70"
              aria-hidden
            />
            <span className="relative inline-flex items-center gap-2">
              {loading ? t("generator.loading") : t("generator.submit")}
              {loading && (
                <span className="inline-block h-4 w-4 align-middle border-2 border-emerald-200/40 border-t-[var(--accent-emerald)] rounded-full animate-spinner" />
              )}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ReportForm);
