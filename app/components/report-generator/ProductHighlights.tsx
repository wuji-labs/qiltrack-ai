"use client";

type ProductHighlightsProps = {
  highlightCards: Array<{ title: string; description: string }>;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function ProductHighlights({ highlightCards, t }: ProductHighlightsProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 sm:p-5 space-y-3">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute -right-8 top-4 h-32 w-32 rounded-full bg-[var(--accent-emerald)]/18 blur-[90px]"
          aria-hidden
        />
        <div
          className="absolute left-0 bottom-0 h-28 w-28 rounded-full bg-[var(--accent-blue)]/12 blur-[90px]"
          aria-hidden
        />
      </div>
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">{t("nav.product")}</p>
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-foreground)]">
            {t("hero.title")}
          </h3>
        </div>
        <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-subtle">
          {t("hero.brandline")}
        </span>
      </div>
      <p className="relative text-sm text-subtle">{t("hero.description")}</p>
      <div className="relative grid gap-3 md:grid-cols-3">
        {highlightCards.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-3 space-y-1"
          >
            <p className="text-sm font-semibold text-emerald-200">{item.title}</p>
            <p className="text-sm text-subtle leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
