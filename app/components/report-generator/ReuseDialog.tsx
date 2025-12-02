"use client";

type ReuseDialogProps = {
  showReuseDialog: boolean;
  onViewHistory: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function ReuseDialog({
  showReuseDialog,
  onViewHistory,
  onRegenerate,
  onClose,
  t,
}: ReuseDialogProps) {
  if (!showReuseDialog) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="relative mx-4 max-w-md rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/95 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.5)]">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
          {t("reports.reuse.title")}
        </h3>
        <p className="mt-2 text-sm text-dim">{t("reports.reuse.sub")}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewHistory}
            className="rounded-full bg-[var(--accent-emerald)] px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-[var(--accent-emerald)]/90"
          >
            {t("reports.reuse.viewHistory")}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-full border border-[var(--stroke-soft)] px-5 py-2.5 text-sm text-dim hover:text-[var(--color-foreground)]"
          >
            {t("reports.reuse.regenerate")}
          </button>
          <button type="button" onClick={onClose} className="text-xs text-subtle hover:text-dim">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
