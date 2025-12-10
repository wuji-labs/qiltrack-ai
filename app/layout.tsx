import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ErrorBoundary } from "@/components/error-boundary";

// 使用系统字体替代 Google Fonts 以避免构建时网络依赖
// 如需使用自定义字体，请下载字体文件并使用 next/font/local

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
    <html lang="en">
      <body
        className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] antialiased font-sans"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
        }}
      >
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
          <CookieConsentBanner />
        </ErrorBoundary>
      </body>
    </html>
  );
}
