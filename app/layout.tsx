import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Qiltrack AI",
  description: "三分钟生成结构化美股投研报告，支持模糊搜索、富文本复制与 DOCX 导出。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased font-sans">
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
          <CookieConsentBanner />
        </ErrorBoundary>
      </body>
    </html>
  );
}
