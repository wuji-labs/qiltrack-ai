"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProgressStatus = "idle" | "running" | "done";

const STEP_ONE_TARGET = 80;
const STEP_TWO_TARGET = 99;
const STEP_ONE_INTERVAL = 1125; // 90s / 80 steps
const STEP_TWO_INTERVAL = 5000; // 5s per 1%

export type ProgressState = {
	progress: number;
	status: ProgressStatus;
	text: string | null;
	currentStep: number;
};

const STEP_THRESHOLDS = [0, 10, 22, 35, 50, 65, 80, 92];

export function useProgress() {
	const [progress, setProgress] = useState(0);
	const [status, setStatus] = useState<ProgressStatus>("idle");
	const [text, setText] = useState<string | null>(null);

	const stepOneRef = useRef<NodeJS.Timeout | null>(null);
	const stepTwoRef = useRef<NodeJS.Timeout | null>(null);
	const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

	const clearTimers = useCallback(() => {
		if (stepOneRef.current) clearInterval(stepOneRef.current);
		if (stepTwoRef.current) clearInterval(stepTwoRef.current);
		if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
		stepOneRef.current = null;
		stepTwoRef.current = null;
		resetTimerRef.current = null;
	}, []);

	const reset = useCallback(() => {
		clearTimers();
		setProgress(0);
		setText(null);
		setStatus("idle");
	}, [clearTimers]);

	const start = useCallback((label?: string) => {
		clearTimers();
		setStatus("running");
		setText(label ?? null);
		setProgress(5);

		stepOneRef.current = setInterval(() => {
			setProgress((value) => {
				if (value >= STEP_ONE_TARGET) return value;
				return value + 1;
			});
		}, STEP_ONE_INTERVAL);

		stepTwoRef.current = setInterval(() => {
			setProgress((value) => {
				if (value < STEP_ONE_TARGET) return value;
				if (value >= STEP_TWO_TARGET) return value;
				return value + 1;
			});
		}, STEP_TWO_INTERVAL);
	}, [clearTimers]);

	const complete = useCallback((label?: string) => {
		clearTimers();
		setStatus("done");
		setText(label ?? null);
		setProgress(100);
		resetTimerRef.current = setTimeout(() => {
			reset();
		}, 800);
	}, [clearTimers, reset]);

	const fail = useCallback((label?: string) => {
		clearTimers();
		setStatus("idle");
		setText(label ?? null);
	}, [clearTimers]);

	useEffect(() => reset, [reset]);

	const currentStep = (() => {
		if (status === "done") return STEP_THRESHOLDS.length;
		for (let index = STEP_THRESHOLDS.length - 1; index >= 0; index -= 1) {
			if (progress >= STEP_THRESHOLDS[index]) {
				return index + 1;
			}
		}
		return 1;
	})();

	return {
		progress,
		status,
		text,
		currentStep,
		start,
		complete,
		fail,
		reset,
	};
}
