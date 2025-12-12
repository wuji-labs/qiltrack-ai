import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";

// 使用运行时加载字体以避免构建时网络依赖
// Inter, Anton, JetBrains Mono 通过 <link> 标签在 <head> 中加载

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
      <head>
        {/* 加载 Inter（正文字体）、Anton（标题字体）、JetBrains Mono（数据字体） */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Anton&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen antialiased font-sans"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
