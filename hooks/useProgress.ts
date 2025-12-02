"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProgressStatus = "idle" | "running" | "done";

const STEP_ONE_TARGET = 60;
const STEP_TWO_TARGET = 80;
const STEP_THREE_TARGET = 95;
const STEP_FOUR_TARGET = 99;

const STEP_ONE_INTERVAL = 164; // ~9s from 5% → 60%
const STEP_TWO_INTERVAL = 650; // ~13s from 60% → 80%
const STEP_THREE_INTERVAL = 400; // ~6s from 80% → 95%
const STEP_FOUR_INTERVAL = 1750; // ~7s from 95% → 99%

const FINISH_INTERVAL = 80;
const FINISH_HOLD = 520;

export type ProgressState = {
  progress: number;
  status: ProgressStatus;
  text: string | null;
  currentStep: number;
} & {
  start: (label?: string) => void;
  complete: (label?: string) => Promise<void>;
  forceComplete: () => void;
  fail: (label?: string) => void;
  reset: () => void;
};

const STEP_THRESHOLDS = [0, 10, 22, 35, 50, 65, 80, 92];

export function useProgress() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProgressStatus>("idle");
  const [text, setText] = useState<string | null>(null);

  const stepOneRef = useRef<NodeJS.Timeout | null>(null);
  const stepTwoRef = useRef<NodeJS.Timeout | null>(null);
  const stepThreeRef = useRef<NodeJS.Timeout | null>(null);
  const stepFourRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (stepOneRef.current) clearInterval(stepOneRef.current);
    if (stepTwoRef.current) clearInterval(stepTwoRef.current);
    if (stepThreeRef.current) clearInterval(stepThreeRef.current);
    if (stepFourRef.current) clearInterval(stepFourRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (finishRef.current) clearInterval(finishRef.current);
    stepOneRef.current = null;
    stepTwoRef.current = null;
    stepThreeRef.current = null;
    stepFourRef.current = null;
    resetTimerRef.current = null;
    finishRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setProgress(0);
    setText(null);
    setStatus("idle");
  }, [clearTimers]);

  const start = useCallback(
    (label?: string) => {
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

      stepThreeRef.current = setInterval(() => {
        setProgress((value) => {
          if (value < STEP_TWO_TARGET) return value;
          if (value >= STEP_THREE_TARGET) return value;
          return value + 1;
        });
      }, STEP_THREE_INTERVAL);

      stepFourRef.current = setInterval(() => {
        setProgress((value) => {
          if (value < STEP_THREE_TARGET) return value;
          if (value >= STEP_FOUR_TARGET) return value;
          return value + 1;
        });
      }, STEP_FOUR_INTERVAL);
    },
    [clearTimers]
  );

  const complete = useCallback(
    (label?: string) =>
      new Promise<void>((resolve) => {
        clearTimers();
        setStatus("running");
        setText(label ?? null);
        setProgress((value) => Math.max(value, STEP_FOUR_TARGET));
        finishRef.current = setInterval(() => {
          setProgress((value) => {
            if (value >= 100) {
              if (finishRef.current) clearInterval(finishRef.current);
              setStatus("done");
              resetTimerRef.current = setTimeout(() => {
                reset();
                resolve();
              }, FINISH_HOLD);
              return 100;
            }
            const delta = Math.max(1, Math.round((100 - value) / 4));
            return Math.min(100, value + delta);
          });
        }, FINISH_INTERVAL);
      }),
    [clearTimers, reset]
  );

  const forceComplete = useCallback(() => {
    clearTimers();
    setStatus("done");
    setProgress(100);
    resetTimerRef.current = setTimeout(() => {
      reset();
    }, FINISH_HOLD);
  }, [clearTimers, reset]);

  const fail = useCallback(
    (label?: string) => {
      clearTimers();
      setStatus("idle");
      setText(label ?? null);
    },
    [clearTimers]
  );

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
    forceComplete,
    fail,
    reset,
  };
}
