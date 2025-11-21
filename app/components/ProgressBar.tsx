"use client";

import type { ReactNode } from "react";

type StepItem = {
	step: number;
	label: string;
};

type ProgressBarProps = {
	percent: number;
	label?: string | null;
	steps: StepItem[];
	activeStep: number;
	extra?: ReactNode;
};

export function ProgressBar({ percent, label, steps, activeStep, extra }: ProgressBarProps) {
	const computedIndex = steps.findIndex((item) => item.step === activeStep);
	const activeIndex = computedIndex === -1 ? 0 : computedIndex;
	const translateX = `calc(-${activeIndex * 100}% - ${activeIndex * 12}px)`;

	return (
		<div className="space-y-3 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4">
			<div className="flex items-center justify-between text-sm uppercase tracking-[0.24em] text-[var(--accent-emerald)]">
				<span>{label ?? ""}</span>
				<span>{Math.round(percent)}%</span>
			</div>
			<div className="progress-track">
				<div className="progress-fill" style={{ width: `${percent}%` }} />
			</div>
			<div className="progress-marquee">
				<div
					className="progress-marquee-track"
					style={{ transform: `translateX(${translateX})` }}
					aria-live="polite"
				>
					{steps.map((item) => {
						const active = activeStep === item.step;
						return (
							<div key={item.step} className={`progress-chip ${active ? "is-active" : ""}`}>
								<div className="progress-chip-index">0{item.step}</div>
								<div className="progress-chip-label">{item.label}</div>
								<div className="progress-chip-glow" aria-hidden />
							</div>
						);
					})}
				</div>
			</div>
			{extra}
		</div>
	);
}
