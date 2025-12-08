"use client";

import type { Language } from "@/lib/i18n-config";
import type { ReportResponse, ReportTone, SearchResult, SimilarReport } from "@/types/report";
import type { ProgressState } from "@/hooks/useProgress";

export type ToneOption = {
  id: ReportTone;
  emoji: string;
  title: string;
  badge: string;
  description: string;
  credits: number;
};

export type AuthInfo = {
  isAuthenticated: boolean;
  remainingQuota: number;
  planLabel: string;
  userEmail: string | null;
  refreshSession: () => Promise<void>;
  refreshQuota?: () => Promise<void>;
  quotaLoaded?: boolean;
};

export type ErrorKind = "unauthorized" | "quota" | "generic";

export type ErrorState = {
  type: ErrorKind;
  message: string;
};

export type ReportGeneratorProps = {
  selectedTone: ReportTone;
  toneOptions: ToneOption[];
  language: Language;
  highlightFallback: string[];
  heroHighlights: { title: string; description: string }[];
  auth: AuthInfo;
  initialSearchResults?: SearchResult[];
  progress: ProgressState & {
    start: (label?: string) => void;
    complete: (label?: string) => Promise<void>;
    fail: (label?: string) => void;
    reset: () => void;
    forceComplete: () => void;
  };
  onRequireLogin: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

export type PlaceholderVariant = "xs" | "sm" | "md" | "xl";
