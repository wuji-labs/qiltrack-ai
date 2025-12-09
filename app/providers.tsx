"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { GoogleOneTap } from "@/app/components/GoogleOneTap";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GoogleOneTap />
        {children}
      </LanguageProvider>
    </ErrorBoundary>
  );
}
