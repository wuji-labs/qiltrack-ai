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
	const fallbackIndex = Math.min(steps.length - 1, Math.floor((percent / 100) * (steps.length - 1)));
	const activeIndex = computedIndex === -1 ? fallbackIndex : computedIndex;

	const pipPositions = steps.map((_, idx) => {
		if (steps.length === 1) return 100;
		return (idx / (steps.length - 1)) * 100;
	});

	return (
		<div className="space-y-3 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4">
			<div className="flex items-center justify-between text-sm uppercase tracking-[0.24em] text-[var(--accent-emerald)]">
				<span>{label ?? ""}</span>
				<span>{Math.round(percent)}%</span>
			</div>
			<div className="progress-track">
				<div className="progress-track-backdrop" aria-hidden />
				<div className="progress-fill" style={{ width: `${percent}%` }}>
					<span className="progress-fill-sheen" aria-hidden />
					<span className="progress-fill-glow" aria-hidden />
				</div>
			</div>
			<div className="progress-stack" aria-live="polite">
				{steps.map((item) => {
					const active = activeStep === item.step;
					return (
						<div key={item.step} className={`progress-chip ${active ? "is-active" : ""}`}>
							<span className="progress-chip-ring" aria-hidden />
							<div className="progress-chip-index">0{item.step}</div>
							<div className="progress-chip-label" key={item.step}>
								{item.label}
							</div>
							<div className="progress-chip-glow" aria-hidden />
						</div>
					);
				})}
			</div>
			{extra}
		</div>
	);
}
