"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  totalCreditsUsed: number;
  reportsToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReports: 0,
    totalCreditsUsed: 0,
    reportsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      try {
        // Get total users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Get total reports
        const { count: reportCount } = await supabase
          .from("report_posts")
          .select("*", { count: "exact", head: true });

        // Get total credits used
        const { data: creditsData } = await supabase
          .from("report_credits")
          .select("credits_used");

        const totalCreditsUsed = creditsData?.reduce(
          (sum, item) => sum + (item.credits_used || 0),
          0
        ) || 0;

        // Get reports created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
          .from("report_posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString());

        setStats({
          totalUsers: userCount || 0,
          totalReports: reportCount || 0,
          totalCreditsUsed,
          reportsToday: todayCount || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-blue-500",
    },
    {
      label: "Total Reports",
      value: stats.totalReports,
      icon: "📊",
      color: "bg-green-500",
    },
    {
      label: "Credits Used",
      value: stats.totalCreditsUsed,
      icon: "💰",
      color: "bg-yellow-500",
    },
    {
      label: "Reports Today",
      value: stats.reportsToday,
      icon: "📈",
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your Investor AI platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 ${card.color} rounded-md p-3`}
                >
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.label}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {card.value.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">👤</span>
              <div>
                <div className="font-medium text-gray-900">Manage Users</div>
                <div className="text-sm text-gray-500">
                  View and edit user accounts
                </div>
              </div>
            </div>
          </a>

          <a
            href="/admin/credits"
            className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <div className="font-medium text-gray-900">Grant Credits</div>
                <div className="text-sm text-gray-500">
                  Manage user credits
                </div>
              </div>
            </div>
          </a>

          <a
            href="/admin/reports"
            className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">📄</span>
              <div>
                <div className="font-medium text-gray-900">
                  Manage Reports
                </div>
                <div className="text-sm text-gray-500">
                  View and moderate reports
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
