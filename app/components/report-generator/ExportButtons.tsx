"use client";

type ExportButtonsProps = {
  exportingDocx: boolean;
  exportingPdf: boolean;
  onCopyRichText: () => Promise<void>;
  onExportDocx: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function ExportButtons({
  exportingDocx,
  exportingPdf,
  onCopyRichText,
  onExportDocx,
  onExportPdf,
  t,
}: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onCopyRichText}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-400/90 px-4 py-2 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
      >
        {t("report.action.copy")}
      </button>
      <button
        type="button"
        onClick={onExportDocx}
        disabled={exportingDocx}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-base text-dim transition hover:border-emerald-300 hover:text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exportingDocx ? t("report.action.exporting") : t("report.action.export")}
      </button>
      <button
        type="button"
        onClick={onExportPdf}
        disabled={exportingPdf}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-base text-dim transition hover:border-emerald-300 hover:text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exportingPdf ? t("report.action.exporting") : t("report.pdf.cta")}
      </button>
    </div>
  );
}
