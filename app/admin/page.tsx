"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  StatCard,
  ActivityFeed,
  type ActivityItem,
  formatRelativeTime,
} from "@/app/components/admin/ui";

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers7d: number;
  paidUsers: number;
  totalReports: number;
  reportsToday: number;
  totalCreditsUsed: number;
  avgReportsPerUser: number;
  // 财务数据
  mrr: number;
  arr: number;
  // 套餐分布
  planDistribution: { name: string; value: number; color: string }[];
}

interface TrendData {
  date: string;
  users: number;
  reports: number;
  credits: number;
  revenue: number;
}

interface TopUser {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  reports_count: number;
}

export default function AdminDashboard() {
  const { supabase } = useSupabaseAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsers7d: 0,
    paidUsers: 0,
    totalReports: 0,
    reportsToday: 0,
    totalCreditsUsed: 0,
    avgReportsPerUser: 0,
    mrr: 0,
    arr: 0,
    planDistribution: [],
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    database: "healthy",
    queue: "healthy",
    storage: "healthy",
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [supabase]);

  async function fetchDashboardData() {
    if (!supabase) return;

    try {
      setLoading(true);

      // 并行获取所有数据
      const [
        usersResult,
        reportsResult,
        creditsResult,
        todayUsersResult,
        todayReportsResult,
        planDistResult,
        subscriptionsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("report_runs").select("*", { count: "exact", head: true }),
        supabase.from("report_credit_events").select("delta"),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase
          .from("report_runs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from("profiles").select("plan"),
        supabase.from("billing_subscriptions").select("*").eq("status", "active"),
      ]);

      // 计算总积分消耗
      const totalCreditsUsed =
        creditsResult.data?.reduce(
          (sum: number, item: { delta?: number }) =>
            sum + Math.abs(item.delta || 0),
          0
        ) || 0;

      // 获取活跃用户数 (最近7天有报告生成的用户)
      const sevenDaysAgo = subDays(new Date(), 7);
      const { data: activeUsersData } = await supabase
        .from("report_runs")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const activeUsers = new Set(activeUsersData?.filter((r: { user_id: string | null }) => r.user_id).map((r: { user_id: string | null }) => r.user_id) || []).size;

      // 套餐分布计算
      const planCounts: Record<string, number> = { free: 0, pro: 0, annual: 0 };
      planDistResult.data?.forEach((p: { plan: string | null }) => {
        const plan = p.plan || "free";
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      const planDistribution = [
        { name: "免费版", value: planCounts.free || 0, color: "#6b7280" },
        { name: "月费版", value: planCounts.pro || 0, color: "#3b82f6" },
        { name: "年费版", value: planCounts.annual || 0, color: "#8b5cf6" },
      ];

      // 计算付费用户和MRR
      const paidUsers = (planCounts.pro || 0) + (planCounts.annual || 0);
      const mrr = (planCounts.pro || 0) * 14.99 + (planCounts.annual || 0) * (119.99 / 12);
      const arr = mrr * 12;

      const avgReportsPerUser =
        usersResult.count && usersResult.count > 0
          ? Math.round(((reportsResult.count || 0) / usersResult.count) * 10) / 10
          : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        newUsersToday: todayUsersResult.count || 0,
        activeUsers7d: activeUsers,
        paidUsers,
        totalReports: reportsResult.count || 0,
        reportsToday: todayReportsResult.count || 0,
        totalCreditsUsed,
        avgReportsPerUser,
        mrr,
        arr,
        planDistribution,
      });

      // 获取趋势数据
      await fetchTrendData();

      // 获取最近活动
      await fetchRecentActivities();

      // 获取活跃用户排行
      await fetchTopUsers();
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrendData() {
    if (!supabase) return;

    const last14Days = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last14Days.push(date);
    }

    const trends: TrendData[] = await Promise.all(
      last14Days.map(async (date) => {
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
            .select("delta")
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDay.toISOString()),
        ]);

        const credits =
          creditsData.data?.reduce(
            (sum: number, item: { delta?: number }) =>
              sum + Math.abs(item.delta || 0),
            0
          ) || 0;

        return {
          date: format(date, "MM/dd", { locale: zhCN }),
          users: usersCount.count || 0,
          reports: reportsCount.count || 0,
          credits,
          revenue: 0, // 可以后续添加真实收入数据
        };
      })
    );

    setTrendData(trends);
  }

  async function fetchRecentActivities() {
    if (!supabase) return;

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
      .limit(15);

    if (recentRuns) {
      const activities: ActivityItem[] = recentRuns.map(
        (run: {
          id: string;
          status: string | null;
          symbol?: string | null;
          created_at: string | null;
          profiles?: { email?: string } | null;
        }) => ({
          id: run.id,
          type: run.status === "completed" ? "success" : run.status === "failed" ? "error" : "info",
          user: run.profiles?.email || "未知用户",
          action: run.status === "completed" ? "生成了报告" : run.status === "failed" ? "报告生成失败" : "正在生成报告",
          target: run.symbol || "",
          time: run.created_at || new Date().toISOString(),
        })
      );

      setRecentActivities(activities);
    }
  }

  async function fetchTopUsers() {
    if (!supabase) return;

    // 获取报告数量最多的用户
    const { data } = await supabase
      .from("report_runs")
      .select("user_id, profiles:user_id(id, email, display_name, plan)")
      .eq("status", "completed");

    if (data) {
      const userCounts: Record<string, { user: TopUser; count: number }> = {};

      data.forEach((run: { user_id: string | null; profiles: { id: string; email: string; display_name: string | null; plan: string | null } | null }) => {
        if (run.profiles && run.user_id) {
          const userId = run.user_id;
          if (!userCounts[userId]) {
            userCounts[userId] = {
              user: {
                id: run.profiles.id,
                email: run.profiles.email,
                display_name: run.profiles.display_name,
                plan: run.profiles.plan || "free",
                reports_count: 0,
              },
              count: 0,
            };
          }
          userCounts[userId].count++;
        }
      });

      const sorted = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({
          ...item.user,
          reports_count: item.count,
        }));

      setTopUsers(sorted);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-dim">加载仪表盘数据...</div>
      </div>
    );
  }

  const COLORS = ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b"];

  return (
    <div className="space-y-8">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            仪表盘
          </h1>
          <p className="mt-1 text-sm text-dim">Qiltrack AI 平台数据总览</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDashboardData} className="px-4 py-2 rounded-lg btn-ghost text-sm">
            刷新数据
          </button>
        </div>
      </div>

      {/* 核心指标卡片 - 第一行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="总用户数"
          value={stats.totalUsers}
          icon="👥"
          color="#4dd0a6"
          trend={{ value: stats.newUsersToday, isUp: true }}
          subtext={`今日新增 ${stats.newUsersToday}`}
        />
        <StatCard
          label="活跃用户"
          value={stats.activeUsers7d}
          icon="⚡"
          color="#f59e0b"
          subtext="最近7天"
        />
        <StatCard
          label="付费用户"
          value={stats.paidUsers}
          icon="💎"
          color="#8b5cf6"
          subtext={`转化率 ${stats.totalUsers > 0 ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1) : 0}%`}
        />
        <StatCard
          label="MRR"
          value={`$${stats.mrr.toFixed(2)}`}
          icon="💰"
          color="#10b981"
          subtext={`ARR: $${stats.arr.toFixed(0)}`}
        />
      </div>

      {/* 核心指标卡片 - 第二行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="总报告数"
          value={stats.totalReports}
          icon="📊"
          color="#5be0b0"
        />
        <StatCard
          label="今日报告"
          value={stats.reportsToday}
          icon="📈"
          color="#3b82f6"
        />
        <StatCard
          label="总积分消耗"
          value={stats.totalCreditsUsed}
          icon="🔥"
          color="#ef4444"
        />
        <StatCard
          label="人均报告"
          value={stats.avgReportsPerUser}
          icon="📝"
          color="#ec4899"
          subtext="平均每用户"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 趋势图 - 跨2列 */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            14天趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
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
              <Area
                type="monotone"
                dataKey="reports"
                stroke="#5be0b0"
                fill="rgba(91, 224, 176, 0.2)"
                strokeWidth={2}
                name="报告数"
              />
              <Area
                type="monotone"
                dataKey="credits"
                stroke="#3b82f6"
                fill="rgba(59, 130, 246, 0.2)"
                strokeWidth={2}
                name="积分消耗"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 套餐分布饼图 */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            套餐分布
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.planDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {stats.planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-frosted)",
                  border: "1px solid var(--stroke-soft)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {stats.planDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-dim">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 下方信息区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快捷操作 */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            快捷操作
          </h3>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-lg transition-colors"
              style={{ background: "var(--bg-layer)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <span style={{ color: "var(--color-foreground)" }}>创建新用户</span>
              </div>
              <span className="text-dim">→</span>
            </Link>
            <Link
              href="/admin/credits"
              className="flex items-center justify-between p-3 rounded-lg transition-colors"
              style={{ background: "var(--bg-layer)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <span style={{ color: "var(--color-foreground)" }}>授予积分</span>
              </div>
              <span className="text-dim">→</span>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-between p-3 rounded-lg transition-colors"
              style={{ background: "var(--bg-layer)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <span style={{ color: "var(--color-foreground)" }}>发布报告</span>
              </div>
              <span className="text-dim">→</span>
            </Link>
            <Link
              href="/admin/system/audit-logs"
              className="flex items-center justify-between p-3 rounded-lg transition-colors"
              style={{ background: "var(--bg-layer)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📜</span>
                <span style={{ color: "var(--color-foreground)" }}>查看日志</span>
              </div>
              <span className="text-dim">→</span>
            </Link>
          </div>
        </div>

        {/* 活跃用户排行 */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            活跃用户 TOP 5
          </h3>
          <div className="space-y-3">
            {topUsers.length === 0 ? (
              <div className="text-center text-dim py-4">暂无数据</div>
            ) : (
              topUsers.map((user, index) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors"
                  style={{ background: "var(--bg-layer)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: index === 0 ? "#fbbf24" : index === 1 ? "#9ca3af" : index === 2 ? "#cd7f32" : "var(--bg-base)",
                        color: index < 3 ? "#000" : "var(--color-foreground)",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: "var(--color-foreground)" }}>
                        {user.display_name || user.email.split("@")[0]}
                      </div>
                      <div className="text-xs text-dim">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "var(--accent-emerald)" }}>
                    {user.reports_count} 篇
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            实时活动
          </h3>
          <ActivityFeed items={recentActivities} maxItems={6} />
        </div>
      </div>

      {/* 系统状态 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
          系统状态
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🗄️</span>
              <span style={{ color: "var(--color-foreground)" }}>数据库</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-sm text-green-400">正常</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <span style={{ color: "var(--color-foreground)" }}>任务队列</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-sm text-green-400">正常</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">☁️</span>
              <span style={{ color: "var(--color-foreground)" }}>存储服务</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-sm text-green-400">正常</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
