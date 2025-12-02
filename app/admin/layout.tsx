"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { supabaseDataProvider } from "@/lib/admin/data-provider";
import { authProvider } from "@/lib/admin/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 后台管理系统布局 - 中文版
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "仪表盘", icon: "📊" },
    { href: "/admin/users", label: "用户管理", icon: "👥" },
    { href: "/admin/credits", label: "积分管理", icon: "💰" },
    { href: "/admin/reports", label: "报告管理", icon: "📄" },
    { href: "/admin/runs", label: "生成记录", icon: "🔄" },
  ];

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={supabaseDataProvider}
      authProvider={authProvider}
      resources={[
        {
          name: "profiles",
          list: "/admin/users",
          edit: "/admin/users/:id/edit",
          show: "/admin/users/:id",
          meta: {
            label: "用户",
            icon: "👥",
          },
        },
        {
          name: "report_credits",
          list: "/admin/credits",
          edit: "/admin/credits/:id/edit",
          meta: {
            label: "积分",
            icon: "💰",
          },
        },
        {
          name: "report_posts",
          list: "/admin/reports",
          edit: "/admin/reports/:id/edit",
          show: "/admin/reports/:id",
          meta: {
            label: "报告",
            icon: "📄",
          },
        },
        {
          name: "report_runs",
          list: "/admin/runs",
          show: "/admin/runs/:id",
          meta: {
            label: "生成记录",
            icon: "🔄",
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        disableTelemetry: true,
      }}
    >
      <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
        {/* 顶部导航栏 */}
        <nav className="frosted-bar sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    Investor AI 管理后台
                  </h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${
                          isActive
                            ? "border-b-2"
                            : "border-transparent text-dim hover:text-foreground"
                        } inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors`}
                        style={{
                          borderColor: isActive ? "var(--accent-emerald)" : "transparent",
                          color: isActive ? "var(--color-foreground)" : "var(--text-dim)",
                        }}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm hover:text-foreground transition-colors"
                  style={{ color: "var(--text-dim)" }}
                >
                  ← 返回网站
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </Refine>
  );
}
