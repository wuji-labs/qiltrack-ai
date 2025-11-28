import type { ReactNode } from "react";

type WhySectionProps = {
	module6Items: string[];
	subtleTextClass: string;
	valueTitle: ReactNode;
	valueCaption: ReactNode;
	punchline: ReactNode;
	label: string;
};

export function WhySection({ module6Items, subtleTextClass, valueTitle, valueCaption, punchline, label }: WhySectionProps) {
	return (
		<section className="relative overflow-hidden rounded-3xl bg-[var(--bg-layer)]/88 p-5 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-10 top-8 h-48 w-48 rounded-full bg-[var(--accent-emerald)]/16 blur-[120px]" aria-hidden />
				<div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[var(--accent-blue)]/14 blur-[140px]" aria-hidden />
			</div>

			<div className="relative overflow-hidden rounded-3xl border border-[var(--stroke-soft)] bg-gradient-to-br from-[var(--bg-layer)]/95 via-[var(--bg-layer)]/88 to-[var(--bg-layer)]/92 p-5 sm:p-6 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
				<div className="pointer-events-none absolute inset-0 opacity-70">
					<div className="absolute -right-8 top-4 h-28 w-28 rounded-full bg-[var(--accent-emerald)]/16 blur-[100px]" aria-hidden />
					<div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-[var(--accent-blue)]/14 blur-[120px]" aria-hidden />
				</div>
				<div className="relative space-y-2">
					<p className="text-xs uppercase tracking-[0.26em] text-emerald-200">{label}</p>
					<h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-foreground)]">{valueTitle}</h2>
					<p className={`text-base leading-relaxed ${subtleTextClass}`}>{valueCaption}</p>
				</div>
				<div className="relative rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 p-4 space-y-3">
					<p className="text-sm font-semibold text-[var(--color-foreground)]">{punchline}</p>
					<div className="space-y-2">
						{module6Items.map((line, idx) => (
							<div key={line} className="flex items-start gap-3">
								<span className="mt-0.5 h-5 w-5 rounded-full bg-[var(--accent-emerald)]/18 border border-[var(--accent-emerald)]/50 text-[11px] font-semibold text-[var(--accent-emerald)] flex items-center justify-center">
									{idx + 1}
								</span>
								<p className={`text-sm sm:text-base leading-relaxed ${subtleTextClass}`}>{line}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
