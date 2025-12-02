"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  totalCreditsUsed: number;
  reportsToday: number;
  activeUsers: number;
  avgReportsPerUser: number;
}

interface TrendData {
  date: string;
  users: number;
  reports: number;
  credits: number;
}

interface RecentActivity {
  id: string;
  type: string;
  user_email: string;
  description: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReports: 0,
    totalCreditsUsed: 0,
    reportsToday: 0,
    activeUsers: 0,
    avgReportsPerUser: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const supabase = createClient();

    try {
      // 获取基础统计数据
      const [usersResult, reportsResult, creditsResult, todayReportsResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("report_runs").select("*", { count: "exact", head: true }),
        supabase.from("report_credit_events").select("credits_amount"),
        supabase
          .from("report_runs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      // 计算总积分消耗
      const totalCreditsUsed =
        creditsResult.data?.reduce((sum, item) => sum + (item.credits_amount || 0), 0) || 0;

      // 获取活跃用户数 (最近7天有报告生成的用户)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activeUsersData } = await supabase
        .from("report_runs")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const activeUsers = new Set(activeUsersData?.map((r) => r.user_id) || []).size;

      const avgReportsPerUser =
        usersResult.count && usersResult.count > 0
          ? Math.round(((reportsResult.count || 0) / usersResult.count) * 10) / 10
          : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalReports: reportsResult.count || 0,
        totalCreditsUsed,
        reportsToday: todayReportsResult.count || 0,
        activeUsers,
        avgReportsPerUser,
      });

      // 获取过去7天的趋势数据
      await fetchTrendData();

      // 获取最近活动
      await fetchRecentActivities();
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrendData() {
    const supabase = createClient();
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    const trendPromises = last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [usersCount, reportsCount, creditsData] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .lt("created_at", nextDay.toISOString()),
        supabase
          .from("report_runs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString()),
        supabase
          .from("report_credit_events")
          .select("credits_amount")
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString()),
      ]);

      const credits =
        creditsData.data?.reduce((sum, item) => sum + (item.credits_amount || 0), 0) || 0;

      return {
        date: format(date, "MM/dd", { locale: zhCN }),
        users: usersCount.count || 0,
        reports: reportsCount.count || 0,
        credits,
      };
    });

    const trends = await Promise.all(trendPromises);
    setTrendData(trends);
  }

  async function fetchRecentActivities() {
    const supabase = createClient();

    const { data: recentRuns } = await supabase
      .from("report_runs")
      .select(
        `
        id,
        status,
        symbol,
        created_at,
        profiles:user_id (email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentRuns) {
      const activities: RecentActivity[] = recentRuns.map((run: { id: string; status: string; symbol?: string; created_at: string; profiles?: { email?: string } }) => ({
        id: run.id,
        type: run.status === "completed" ? "success" : "warning",
        user_email: run.profiles?.email || "未知用户",
        description: `生成了 ${run.symbol || "未知"} 的投资报告`,
        created_at: run.created_at,
      }));

      setRecentActivities(activities);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-dim">加载仪表盘数据...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "总用户数",
      value: stats.totalUsers,
      icon: "👥",
      color: "#4dd0a6",
      bgColor: "rgba(77, 208, 166, 0.1)",
    },
    {
      label: "总报告数",
      value: stats.totalReports,
      icon: "📊",
      color: "#5be0b0",
      bgColor: "rgba(91, 224, 176, 0.1)",
    },
    {
      label: "总积分消耗",
      value: stats.totalCreditsUsed,
      icon: "💰",
      color: "#3f9dff",
      bgColor: "rgba(63, 157, 255, 0.1)",
    },
    {
      label: "今日报告",
      value: stats.reportsToday,
      icon: "📈",
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      label: "活跃用户",
      value: stats.activeUsers,
      icon: "⚡",
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      subtext: "最近7天",
    },
    {
      label: "人均报告",
      value: stats.avgReportsPerUser,
      icon: "📝",
      color: "#ec4899",
      bgColor: "rgba(236, 72, 153, 0.1)",
      subtext: "平均每人",
    },
  ];

  return (
    <div className="px-4 py-6 space-y-8">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          仪表盘
        </h1>
        <p className="mt-2 text-sm text-dim">Investor AI 平台数据总览</p>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass-card p-6 hover:scale-105 transition-transform duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-dim mb-1">{card.label}</div>
                <div className="text-3xl font-bold" style={{ color: card.color }}>
                  {card.value.toLocaleString()}
                </div>
                {card.subtext && <div className="text-xs text-subtle mt-1">{card.subtext}</div>}
              </div>
              <div className="text-4xl p-4 rounded-2xl" style={{ backgroundColor: card.bgColor }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 报告生成趋势 */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            报告生成趋势
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="var(--text-dim)" />
              <YAxis stroke="var(--text-dim)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-frosted)",
                  border: "1px solid var(--stroke-soft)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="reports"
                stroke="var(--accent-emerald)"
                strokeWidth={2}
                name="报告数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 积分消耗趋势 */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            积分消耗趋势
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="var(--text-dim)" />
              <YAxis stroke="var(--text-dim)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-frosted)",
                  border: "1px solid var(--stroke-soft)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="credits" fill="#3f9dff" name="积分" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
          最近活动
        </h3>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="text-center text-dim py-8">暂无活动记录</div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-opacity-50 transition-colors"
                style={{ backgroundColor: "var(--bg-layer)" }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full`}
                    style={{
                      backgroundColor:
                        activity.type === "success" ? "var(--accent-emerald)" : "#f59e0b",
                    }}
                  />
                  <div>
                    <div style={{ color: "var(--color-foreground)" }}>{activity.user_email}</div>
                    <div className="text-sm text-dim">{activity.description}</div>
                  </div>
                </div>
                <div className="text-sm text-subtle">
                  {format(new Date(activity.created_at), "MM-dd HH:mm", {
                    locale: zhCN,
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
