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
	return (
		<div className="space-y-3 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4">
			<div className="flex items-center justify-between text-sm uppercase tracking-[0.24em] text-[var(--accent-emerald)]">
				<span>{label ?? ""}</span>
				<span>{Math.round(percent)}%</span>
			</div>
			<div className="progress-track">
				<div className="progress-fill" style={{ width: `${percent}%` }} />
			</div>
			<div className="grid gap-2 text-base text-subtle sm:grid-cols-2">
				{steps.map((item) => {
					const active = activeStep === item.step;
					return (
						<div
							key={item.step}
							className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
								active
									? "border-[var(--stroke-glow)]/70 text-[var(--accent-blue)]"
									: "border-[var(--stroke-soft)]"
							}`}
						>
							<span
								className={`h-5 w-5 rounded-full text-xs flex items-center justify-center ${
									active
										? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
										: "bg-[var(--bg-layer)] text-subtle"
								}`}
							>
								{item.step}
							</span>
							<span>{item.label}</span>
						</div>
					);
				})}
			</div>
			{extra}
		</div>
	);
}
