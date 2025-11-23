"use client";

import type { ReportTone } from "@/types/report";

type ModeOption = {
	id: ReportTone;
	emoji: string;
	title: string;
	badge: string;
	description: string;
};

type ModesSectionProps = {
	options: ModeOption[];
	selected: ReportTone;
	onSelect: (tone: ReportTone) => void;
	personaSentence: string;
	heading: string;
};

export function ModesSection({ options, selected, onSelect, personaSentence, heading }: ModesSectionProps) {
	return (
		<section className="relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/75 p-5 sm:p-6 space-y-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-10 top-6 h-44 w-44 rounded-full bg-emerald-400/12 blur-[110px]" aria-hidden />
				<div className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-cyan-400/10 blur-[120px]" aria-hidden />
			</div>

			<div className="relative flex flex-wrap items-center justify-between gap-3">
				<div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-1.5 text-sm uppercase tracking-[0.22em] text-[var(--accent-emerald)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
					<span className="rounded-full bg-[var(--accent-emerald)]/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
						Step 1
					</span>
					<span className="whitespace-nowrap">{heading}</span>
					<div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--stroke-soft)]/70" aria-hidden />
				</div>
				<div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 px-4 py-2 text-sm text-dim shadow-[0_10px_32px_rgba(0,0,0,0.18)]">
					<span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" aria-hidden />
					<span className="whitespace-nowrap">{personaSentence}</span>
				</div>
			</div>

			<div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-3">
				{options.map((option) => {
					const active = option.id === selected;
					return (
						<button
							key={option.id}
							type="button"
							onClick={() => onSelect(option.id)}
							className={`relative overflow-hidden text-left rounded-2xl border px-4 py-4 text-sm transition-all duration-200 ease-out backdrop-blur ${
								active
									? "border-[var(--accent-emerald)]/70 bg-[var(--bg-layer)]/90 shadow-[0_18px_42px_rgba(91,224,176,0.18)] -translate-y-1"
									: "border-[var(--stroke-soft)] bg-[var(--bg-base)]/45 hover:border-[var(--accent-emerald)]/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.24)] hover:-translate-y-1"
							}`}
						>
							<div className="pointer-events-none absolute -left-6 top-2 h-16 w-16 rounded-full bg-[var(--accent-emerald)]/12 blur-3xl" aria-hidden />
							<div className="pointer-events-none absolute -right-4 bottom-2 h-12 w-12 rounded-full bg-cyan-400/10 blur-2xl" aria-hidden />
							<div className="relative flex items-center justify-between mb-2">
								<span className="text-lg drop-shadow-sm">{option.emoji}</span>
								{active && (
									<span className="rounded-full border border-[var(--accent-emerald)]/70 bg-[var(--bg-layer)] px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--accent-emerald)] shadow-[0_8px_22px_rgba(91,224,176,0.3)]">
										选中
									</span>
								)}
							</div>
							<p className="text-base font-semibold text-[var(--color-foreground)]">{option.title}</p>
							<p className="text-xs uppercase tracking-[0.22em] text-subtle">{option.badge}</p>
							<p className="mt-2 text-base leading-relaxed text-subtle">{option.description}</p>
						</button>
					);
				})}
			</div>
		</section>
	);
}
