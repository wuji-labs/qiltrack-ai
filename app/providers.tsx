"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { GoogleOneTap } from "@/app/components/GoogleOneTap";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem={false}
        themes={["light", "dark"]}
        disableTransitionOnChange
      >
        <LanguageProvider>
          <GoogleOneTap />
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
