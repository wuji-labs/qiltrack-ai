"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>{children}</LanguageProvider>
    </ErrorBoundary>
  );
}
