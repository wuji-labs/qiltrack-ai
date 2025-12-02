"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";
import { fetchReportHistory } from "@/lib/services/api";

type HistoryItem = {
  id: string;
  symbol: string;
  created_at: string;
  status: string;
  docx_signed_url?: string | null;
  markdown_signed_url?: string | null;
  mode?: string | null;
};

const PAGE_SIZE = 10;

export default function ReportHistoryPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useSupabaseAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReportHistory(page, PAGE_SIZE);
        if (cancelled) return;
        setHistory(data.reports as HistoryItem[]);
        setPages(Math.max(1, data.pagination.pages));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load report history", err);
        setError("Failed to load report history. Please retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, page]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 text-center shadow-xl">
          <h1 className="text-2xl font-semibold">{t("account.page.title")}</h1>
          <p className="text-sm text-subtle">{t("account.page.loginPrompt")}</p>
          <Link
            href="/login"
            className="block w-full rounded-xl bg-[var(--accent-emerald)] py-2.5 text-base font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] transition hover:brightness-105"
          >
            {t("account.page.signIn")}
          </Link>
          <Link
            href="/"
            className="block w-full rounded-xl border border-[var(--stroke-soft)] py-2.5 text-base text-dim hover:text-[var(--color-foreground)]"
          >
            {t("account.page.returnHome")}
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "success" || status === "published" || status === "approved") {
      return "text-emerald-300 border-emerald-400/40 bg-emerald-400/5";
    }
    if (status === "failed" || status === "rejected") {
      return "text-rose-300 border-rose-400/40 bg-rose-400/5";
    }
    return "text-amber-200 border-amber-300/40 bg-amber-400/5";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-3 text-sm text-subtle">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-3 py-1.5 hover:text-[var(--color-foreground)]"
          >
            <span className="text-base">鈫?</span>
            {t("account.page.backLabel")}
          </Link>
          <span>{t("account.page.title")} / History</span>
        </div>

        <div className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Report History</h1>
              <p className="text-sm text-subtle">
                View generated reports and download signed copies.
              </p>
            </div>
            <div className="text-sm text-subtle">{user?.email}</div>
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}
          {loading && <p className="text-sm text-subtle">Loading history...</p>}

          {!loading && history.length === 0 ? (
            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-6 text-sm text-subtle">
              No report runs yet. Generate a report to see it here.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{item.symbol}</p>
                    <p className="text-xs text-subtle">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    {item.mode && <p className="text-xs text-subtle">Mode: {item.mode}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}
                    >
                      {item.status}
                    </span>
                    {item.docx_signed_url && (
                      <a
                        href={item.docx_signed_url}
                        className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-xs text-[var(--accent-emerald)] hover:underline"
                        download
                      >
                        Download DOCX
                      </a>
                    )}
                    {item.markdown_signed_url && (
                      <a
                        href={item.markdown_signed_url}
                        className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-xs text-dim hover:underline"
                        download
                      >
                        Download Markdown
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-subtle">
            <span>
              Page {page} / {pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                disabled={page === 1}
              >
                {t("reports.pagination.prev")}
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                disabled={page === pages}
              >
                {t("reports.pagination.next")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
