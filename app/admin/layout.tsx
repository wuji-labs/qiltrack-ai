"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { supabaseDataProvider } from "@/lib/admin/data-provider";
import { authProvider } from "@/lib/admin/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Admin layout with Refine configuration
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👤" },
    { href: "/admin/credits", label: "Credits", icon: "💰" },
    { href: "/admin/reports", label: "Reports", icon: "📄" },
    { href: "/admin/audit", label: "Audit Logs", icon: "📋" },
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
            label: "Users",
            icon: "👤",
          },
        },
        {
          name: "report_credits",
          list: "/admin/credits",
          edit: "/admin/credits/:id/edit",
          meta: {
            label: "Credits",
            icon: "💰",
          },
        },
        {
          name: "report_posts",
          list: "/admin/reports",
          edit: "/admin/reports/:id/edit",
          show: "/admin/reports/:id",
          meta: {
            label: "Reports",
            icon: "📄",
          },
        },
        {
          name: "audit_logs",
          list: "/admin/audit",
          meta: {
            label: "Audit Logs",
            icon: "📋",
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    Investor AI Admin
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
                            ? "border-indigo-500 text-gray-900"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Site
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </Refine>
  );
}
