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
  const activeStepItem = steps.find((item) => item.step === activeStep);
  const currentStepLabel = activeStepItem?.label ?? label ?? "";

  return (
    <div className="space-y-3 border-2 border-black bg-white shadow-[var(--shadow-retro)] p-4">
      {/* Desktop: Show label and percentage */}
      <div className="hidden md:flex items-center justify-between text-sm font-bold uppercase tracking-[0.24em] text-[var(--text-primary)]">
        <span>{label ?? ""}</span>
        <span>{Math.round(percent)}%</span>
      </div>

      {/* Mobile: Show current step and percentage */}
      <div className="flex md:hidden items-center justify-between text-sm font-bold text-[var(--text-primary)]">
        <span className="text-xs font-bold uppercase truncate flex-1 mr-2">{currentStepLabel}</span>
        <span className="text-sm font-bold tracking-wider">{Math.round(percent)}%</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {/* Desktop: Show all steps */}
      <div className="hidden md:block progress-stack" aria-live="polite">
        {steps.map((item) => {
          const active = activeStep === item.step;
          return (
            <div key={item.step} className={`progress-chip ${active ? "is-active" : ""}`}>
              <div className="progress-chip-index">0{item.step}</div>
              <div className="progress-chip-label" key={item.step}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Show simplified step indicator */}
      <div className="flex md:hidden items-center justify-center gap-2 py-2" aria-live="polite">
        {steps.map((item) => {
          const active = activeStep === item.step;
          const completed = item.step < activeStep;
          return (
            <div
              key={item.step}
              className={`h-2 border border-black transition-all duration-300 ${
                active
                  ? "w-8 bg-[var(--accent-primary)]"
                  : completed
                  ? "w-2 bg-[var(--accent-primary)]/60"
                  : "w-2 bg-gray-200"
              }`}
              aria-label={`${item.label} ${active ? "(current)" : completed ? "(completed)" : ""}`}
            />
          );
        })}
      </div>

      {extra}
    </div>
  );
}
