"use client";

import { useCallback, useEffect, useState } from "react";

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
	const activeOption = options.find((option) => option.id === selected);
	// Only switch to dropdown on very narrow viewports; portrait alone should still show grid rows.
	const computeDropdownLayout = useCallback(() => {
		if (typeof window === "undefined") return false;
		const isTightWidth = window.innerWidth < 760;
		return isTightWidth;
	}, []);
	const [useDropdownLayout, setUseDropdownLayout] = useState<boolean>(false);

	useEffect(() => {
		const handleResize = () => setUseDropdownLayout(computeDropdownLayout());

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [computeDropdownLayout]);

	return (
		<section className="relative overflow-hidden rounded-[20px] sm:rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/75 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-10 top-6 h-44 w-44 rounded-full bg-emerald-400/12 blur-[110px]" aria-hidden />
				<div className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-cyan-400/10 blur-[120px]" aria-hidden />
			</div>

			<div className="relative flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3">
				<div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm uppercase tracking-[0.22em] text-[var(--accent-emerald)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
					<span className="rounded-full bg-[var(--accent-emerald)]/20 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-emerald-200">
						Step 1
					</span>
					<span className="whitespace-nowrap text-xs sm:text-sm">{heading}</span>
					<div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--stroke-soft)]/70" aria-hidden />
				</div>
				<div className="inline-flex w-full sm:w-auto items-start gap-2 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-dim shadow-[0_10px_32px_rgba(0,0,0,0.18)]">
					<span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" aria-hidden />
					<span className="text-xs sm:text-sm leading-relaxed break-words">{personaSentence}</span>
				</div>
			</div>

			{/* Compact layout: premium dropdown to keep hero content above the fold on portrait widths */}
			{useDropdownLayout ? (
				<div className="space-y-3 sm:space-y-4">
					<div className="relative">
						<div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/10 via-[var(--bg-layer)] to-cyan-400/10 blur-[2px]" aria-hidden />
						<select
							value={selected}
							onChange={(event) => onSelect(event.target.value as ReportTone)}
							aria-label={heading}
							className="relative w-full appearance-none rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/85 px-4 py-3 text-sm sm:text-base font-semibold text-[var(--color-foreground)] shadow-[0_14px_38px_rgba(0,0,0,0.28)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-emerald)]/60"
						>
							{options.map((option) => (
								<option key={option.id} value={option.id}>
									{option.emoji} {option.title}
								</option>
							))}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
							<span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] text-sm text-subtle shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
								<svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
									<path
										fill="currentColor"
										d="M4.3 7.3a1 1 0 0 1 1.4 0L10 11.6l4.3-4.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 0 1 0-1.4Z"
									/>
								</svg>
							</span>
						</div>
					</div>
					{activeOption && (
						<div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
							<div className="pointer-events-none absolute -left-10 top-6 h-28 w-28 rounded-full bg-[var(--accent-emerald)]/12 blur-3xl" aria-hidden />
							<div className="pointer-events-none absolute -right-8 bottom-2 h-20 w-20 rounded-full bg-cyan-400/10 blur-2xl" aria-hidden />
							<div className="relative flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<span className="text-2xl drop-shadow-sm">{activeOption.emoji}</span>
									<div>
										<p className="text-lg font-semibold text-[var(--color-foreground)]">{activeOption.title}</p>
										<p className="text-[10px] uppercase tracking-[0.24em] text-subtle">{activeOption.badge}</p>
									</div>
								</div>
								<span className="rounded-full border border-[var(--accent-emerald)]/70 bg-[var(--bg-layer)] px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[var(--accent-emerald)] shadow-[0_8px_22px_rgba(91,224,176,0.3)]">
									选中
								</span>
							</div>
							<p className="relative mt-2 text-sm leading-relaxed text-subtle">{activeOption.description}</p>
						</div>
					)}
				</div>
			) : (
				<div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
					{options.map((option) => {
						const active = option.id === selected;
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => onSelect(option.id)}
								className={`relative overflow-hidden text-left rounded-lg sm:rounded-2xl border px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm transition-all duration-200 ease-out backdrop-blur min-h-[44px] flex flex-col justify-start ${
									active
										? "border-[var(--accent-emerald)]/70 bg-[var(--bg-layer)]/90 shadow-[0_18px_42px_rgba(91,224,176,0.18)] -translate-y-1"
										: "border-[var(--stroke-soft)] bg-[var(--bg-base)]/45 hover:border-[var(--accent-emerald)]/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.24)] hover:-translate-y-1"
								}`}
							>
								<div className="pointer-events-none absolute -left-6 top-2 h-16 w-16 rounded-full bg-[var(--accent-emerald)]/12 blur-3xl" aria-hidden />
								<div className="pointer-events-none absolute -right-4 bottom-2 h-12 w-12 rounded-full bg-cyan-400/10 blur-2xl" aria-hidden />
								<div className="relative flex items-center justify-between mb-2">
									<span className="text-lg sm:text-xl drop-shadow-sm">{option.emoji}</span>
									{active && (
										<span className="rounded-full border border-[var(--accent-emerald)]/70 bg-[var(--bg-layer)] px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] uppercase tracking-[0.22em] text-[var(--accent-emerald)] shadow-[0_8px_22px_rgba(91,224,176,0.3)]">
											选中
										</span>
									)}
								</div>
								<p className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] line-clamp-2">{option.title}</p>
								<p className="text-[9px] sm:text-xs uppercase tracking-[0.22em] text-subtle line-clamp-1">{option.badge}</p>
								<p className="mt-1.5 sm:mt-2 text-xs sm:text-base leading-relaxed text-subtle line-clamp-3">{option.description}</p>
							</button>
						);
					})}
				</div>
			)}
		</section>
	);
}
