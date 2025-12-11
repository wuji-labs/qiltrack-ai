import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";

// 🎨 复古波普字体配置
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" className={`${anton.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] antialiased"
        style={{
          fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
