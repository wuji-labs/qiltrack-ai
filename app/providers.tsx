"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { GoogleOneTap } from "@/app/components/GoogleOneTap";
import { KeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GoogleOneTap />
        <KeyboardShortcuts />
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#f4f4f7",
              backdropFilter: "blur(12px)",
            },
            className: "sonner-toast",
          }}
          richColors
          closeButton
        />
        {children}
      </LanguageProvider>
    </ErrorBoundary>
  );
}
