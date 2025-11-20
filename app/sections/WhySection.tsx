import type { ReactNode } from "react";

type CombinedItem = { title: string; body: string };

type WhySectionProps = {
	combinedItems: CombinedItem[];
	module6Items: string[];
	subtleTextClass: string;
	combinedTitle: ReactNode;
	combinedCaption: ReactNode;
	valueTitle: ReactNode;
	valueCaption: ReactNode;
	labels: {
		combined: string;
		module6: string;
	};
};

export function WhySection({
	combinedItems,
	module6Items,
	subtleTextClass,
	combinedTitle,
	combinedCaption,
	valueTitle,
	valueCaption,
	labels,
}: WhySectionProps) {
	return (
		<section className="relative overflow-hidden rounded-3xl border bg-[var(--bg-layer)]/88 p-5 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-10 top-8 h-48 w-48 rounded-full bg-[var(--accent-emerald)]/16 blur-[120px]" aria-hidden />
				<div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[var(--accent-blue)]/14 blur-[140px]" aria-hidden />
			</div>

			<div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<div className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/92 p-5 sm:p-6 flex flex-col gap-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{labels.combined}</p>
							<h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-foreground)]">{combinedTitle}</h2>
						</div>
						<div className="rounded-full border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--accent-emerald)]">
							{labels.module6}
						</div>
					</div>
					<p className="text-base text-dim leading-relaxed">{combinedCaption}</p>

					<div className="grid md:grid-cols-3 gap-3">
						{combinedItems.map((item) => (
							<div
								key={item.title}
								className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 space-y-2 transition hover:border-[var(--stroke-glow)]/70 hover:shadow-[0_14px_44px_rgba(0,0,0,0.32)]"
							>
								<p className="text-sm font-semibold text-emerald-200">{item.title}</p>
								<p className={`text-base ${subtleTextClass}`}>{item.body}</p>
							</div>
						))}
					</div>
				</div>

				<div className="relative overflow-hidden rounded-3xl border border-[var(--stroke-soft)] bg-gradient-to-br from-[var(--bg-layer)]/95 via-[var(--bg-layer)]/88 to-[var(--bg-layer)]/92 p-5 sm:p-6 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
					<div className="pointer-events-none absolute inset-0 opacity-70">
						<div className="absolute -right-8 top-4 h-28 w-28 rounded-full bg-[var(--accent-emerald)]/16 blur-[100px]" aria-hidden />
						<div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-[var(--accent-blue)]/14 blur-[120px]" aria-hidden />
					</div>
					<div className="relative space-y-2">
						<p className="text-xs uppercase tracking-[0.26em] text-emerald-200">{labels.module6}</p>
						<h3 className="text-lg sm:text-xl font-semibold text-[var(--color-foreground)]">{valueTitle}</h3>
						<p className="text-base text-dim leading-relaxed">{valueCaption}</p>
					</div>
					<div className="relative rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 p-4 space-y-3">
						<p className="text-sm font-semibold text-[var(--color-foreground)]">付费后你得到什么</p>
						<div className="space-y-2">
							{module6Items.map((line, idx) => (
								<div key={line} className="flex items-start gap-3">
									<span className="mt-0.5 h-5 w-5 rounded-full bg-[var(--accent-emerald)]/18 border border-[var(--accent-emerald)]/50 text-[11px] font-semibold text-[var(--accent-emerald)] flex items-center justify-center">
										{idx + 1}
									</span>
									<p className="text-sm sm:text-base text-dim leading-relaxed">{line}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
