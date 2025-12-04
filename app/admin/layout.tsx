"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { supabaseDataProvider } from "@/lib/admin/data-provider";
import { authProvider } from "@/lib/admin/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string }[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "概览",
    items: [
      { href: "/admin", label: "仪表盘", icon: "📊" },
    ],
  },
  {
    title: "用户与权限",
    items: [
      { href: "/admin/users", label: "用户管理", icon: "👥" },
      { href: "/admin/permissions", label: "权限管理", icon: "🔐" },
    ],
  },
  {
    title: "订阅与收入",
    items: [
      { href: "/admin/subscriptions", label: "订阅管理", icon: "💳" },
      { href: "/admin/plans", label: "套餐配置", icon: "📦" },
      { href: "/admin/credits", label: "积分管理", icon: "💰" },
    ],
  },
  {
    title: "内容管理",
    items: [
      { href: "/admin/reports", label: "报告文章", icon: "📄" },
      { href: "/admin/runs", label: "生成记录", icon: "🔄" },
    ],
  },
  {
    title: "数据分析",
    items: [
      { href: "/admin/analytics", label: "数据分析", icon: "📈" },
    ],
  },
  {
    title: "系统设置",
    items: [
      { href: "/admin/system/audit-logs", label: "审计日志", icon: "📜" },
      { href: "/admin/system/config", label: "系统配置", icon: "⚙️" },
    ],
  },
];

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        background: "var(--bg-layer)",
        borderRight: "1px solid var(--stroke-soft)",
      }}
    >
      {/* Logo区域 */}
      <div
        className="h-16 flex items-center justify-between px-4 border-b"
        style={{ borderColor: "var(--stroke-soft)" }}
      >
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="font-bold" style={{ color: "var(--color-foreground)" }}>
              Admin
            </span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
          style={{ color: "var(--text-dim)" }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* 导航区域 */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                {group.title}
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-opacity-100"
                          : "hover:bg-opacity-50"
                      }`}
                      style={{
                        background: isActive ? "rgba(91, 224, 176, 0.15)" : "transparent",
                        color: isActive ? "var(--accent-emerald)" : "var(--text-dim)",
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 底部返回链接 */}
      <div className="p-4 border-t" style={{ borderColor: "var(--stroke-soft)" }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-2 rounded-lg text-dim hover:text-foreground transition-colors"
        >
          <span>←</span>
          {!collapsed && <span className="text-sm">返回网站</span>}
        </Link>
      </div>
    </aside>
  );
}

function AdminHeader({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const pathname = usePathname();

  // 生成面包屑
  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, arr) => {
      const href = "/" + arr.slice(0, index + 1).join("/");
      const label = {
        admin: "管理后台",
        users: "用户管理",
        permissions: "权限管理",
        subscriptions: "订阅管理",
        plans: "套餐配置",
        credits: "积分管理",
        reports: "报告管理",
        runs: "生成记录",
        analytics: "数据分析",
        system: "系统设置",
        "audit-logs": "审计日志",
        config: "系统配置",
      }[segment] || segment;

      return { href, label };
    });

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 transition-all duration-300 ${
        sidebarCollapsed ? "left-16" : "left-64"
      }`}
      style={{
        background: "var(--bg-frosted)",
        borderBottom: "1px solid var(--stroke-soft)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* 面包屑导航 */}
        <nav className="flex items-center text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-2 text-subtle">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span style={{ color: "var(--color-foreground)" }}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="text-dim hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-4">
          {/* 快捷操作按钮 */}
          <Link
            href="/admin/users"
            className="px-3 py-1.5 text-xs rounded-lg transition-colors"
            style={{
              background: "rgba(91, 224, 176, 0.1)",
              color: "var(--accent-emerald)",
              border: "1px solid rgba(91, 224, 176, 0.2)",
            }}
          >
            + 新用户
          </Link>

          {/* 系统状态指示器 */}
          <div className="flex items-center gap-2 text-sm text-dim">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            系统正常
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={supabaseDataProvider}
      authProvider={authProvider}
      resources={[
        {
          name: "profiles",
          list: "/admin/users",
          show: "/admin/users/:id",
          meta: { label: "用户", icon: "👥" },
        },
        {
          name: "billing_subscriptions",
          list: "/admin/subscriptions",
          meta: { label: "订阅", icon: "💳" },
        },
        {
          name: "report_credits",
          list: "/admin/credits",
          meta: { label: "积分", icon: "💰" },
        },
        {
          name: "report_posts",
          list: "/admin/reports",
          show: "/admin/reports/:id",
          meta: { label: "报告", icon: "📄" },
        },
        {
          name: "report_runs",
          list: "/admin/runs",
          show: "/admin/runs/:id",
          meta: { label: "生成记录", icon: "🔄" },
        },
        {
          name: "report_templates",
          list: "/admin/templates",
          meta: { label: "模板", icon: "📋" },
        },
        {
          name: "audit_logs",
          list: "/admin/system/audit-logs",
          meta: { label: "审计日志", icon: "📜" },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        disableTelemetry: true,
      }}
    >
      <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
        {/* 侧边栏 */}
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* 顶部导航 */}
        <AdminHeader sidebarCollapsed={sidebarCollapsed} />

        {/* 主内容区域 */}
        <main
          className={`pt-16 min-h-screen transition-all duration-300 ${
            sidebarCollapsed ? "pl-16" : "pl-64"
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </Refine>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
          <div className="text-dim">加载中...</div>
        </div>
      }
    >
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
