"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  plan: string | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url: string | null;
  last_sign_in_at?: string | null;
}

interface UserWithCredits extends User {
  credits_available?: number;
  credits_used?: number;
  report_count?: number;
}

interface UserStats {
  total: number;
  todayNew: number;
  weekNew: number;
  monthNew: number;
  activeUsers: number;
  paidUsers: number;
  churnRisk: number;
  byPlan: Record<string, number>;
  byRole: Record<string, number>;
}

const PLAN_CONFIGS: Record<string, { name: string; quota: number; color: string; price: number }> = {
  free: { name: "免费版", quota: 60, color: "#6b7280", price: 0 },
  pro: { name: "月费版", quota: 300, color: "#10b981", price: 14.99 },
  annual: { name: "年费版", quota: 600, color: "#8b5cf6", price: 119.99 },
};

const ROLE_CONFIGS: Record<string, { name: string; color: string; icon: string }> = {
  super_admin: { name: "超级管理员", color: "#dc2626", icon: "👑" },
  admin: { name: "管理员", color: "#ea580c", icon: "⭐" },
  developer: { name: "开发者", color: "#8b5cf6", icon: "💻" },
  user: { name: "用户", color: "#3b82f6", icon: "👤" },
  guest: { name: "访客", color: "#6b7280", icon: "👁️" },
};

const ACTIVITY_LEVELS = [
  { min: 0, max: 7, label: "高活跃", color: "#10b981", dots: 5 },
  { min: 7, max: 14, label: "活跃", color: "#3b82f6", dots: 4 },
  { min: 14, max: 30, label: "一般", color: "#f59e0b", dots: 3 },
  { min: 30, max: 90, label: "低活跃", color: "#ef4444", dots: 2 },
  { min: 90, max: Infinity, label: "沉默", color: "#6b7280", dots: 1 },
];

export default function UsersPage() {
  const { supabase } = useSupabaseAuth();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选条件
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [creditsRange, setCreditsRange] = useState<{ min: string; max: string }>({ min: "", max: "" });

  // 统计数据
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    todayNew: 0,
    weekNew: 0,
    monthNew: 0,
    activeUsers: 0,
    paidUsers: 0,
    churnRisk: 0,
    byPlan: {},
    byRole: {},
  });

  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [batchAction, setBatchAction] = useState<"plan" | "delete" | "export">("plan");
  const [batchPlan, setBatchPlan] = useState("free");
  const [processing, setProcessing] = useState(false);

  // 创建用户数据
  const [createData, setCreateData] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "user",
    plan: "free",
    initial_credits: 30,
  });

  const pageSize = 20;

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    if (!supabase) return;
    setStatsLoading(true);

    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfDay(subDays(now, 7)).toISOString();
      const monthStart = startOfDay(subDays(now, 30)).toISOString();
      const activeThreshold = subDays(now, 30).toISOString();

      // 并行请求
      const [
        { count: total },
        { count: todayNew },
        { count: weekNew },
        { count: monthNew },
        { data: allProfiles },
        { data: creditsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("profiles").select("plan, role, updated_at"),
        supabase.from("report_credits").select("user_id, credits_available"),
      ]);

      // 计算各项统计
      const byPlan: Record<string, number> = {};
      const byRole: Record<string, number> = {};
      let activeUsers = 0;
      let paidUsers = 0;

      allProfiles?.forEach((p: { plan?: string; role?: string; updated_at?: string }) => {
        const plan = p.plan || "free";
        const role = p.role || "user";
        byPlan[plan] = (byPlan[plan] || 0) + 1;
        byRole[role] = (byRole[role] || 0) + 1;

        if (p.updated_at && new Date(p.updated_at) >= new Date(activeThreshold)) {
          activeUsers++;
        }
        if (plan !== "free") {
          paidUsers++;
        }
      });

      // 计算流失风险用户（积分低 + 长时间未活跃）
      const churnRisk = creditsData?.filter((c: { credits_available?: number }) =>
        (c.credits_available || 0) < 10
      ).length || 0;

      setStats({
        total: total || 0,
        todayNew: todayNew || 0,
        weekNew: weekNew || 0,
        monthNew: monthNew || 0,
        activeUsers,
        paidUsers,
        churnRisk,
        byPlan,
        byRole,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [supabase]);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from("profiles")
        .select("id, email, display_name, role, plan, created_at, updated_at, avatar_url", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // 搜索
      if (search) {
        query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      // 角色筛选
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      // 套餐筛选
      if (planFilter !== "all") {
        query = query.eq("plan", planFilter);
      }

      // 日期范围筛选
      if (dateRange.start) {
        query = query.gte("created_at", startOfDay(new Date(dateRange.start)).toISOString());
      }
      if (dateRange.end) {
        query = query.lte("created_at", endOfDay(new Date(dateRange.end)).toISOString());
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // 获取用户积分信息
      if (data && data.length > 0) {
        const userIds = data.map((u: { id: string }) => u.id);
        const { data: creditsData } = await supabase
          .from("report_credits")
          .select("user_id, credits_available, credits_used")
          .in("user_id", userIds);

        const { data: reportsData } = await supabase
          .from("report_posts")
          .select("user_id")
          .in("user_id", userIds);

        // 合并数据
        const creditsMap = new Map(creditsData?.map((c: { user_id: string; credits_available: number; credits_used: number }) => [c.user_id, c]));
        const reportsCount = new Map<string, number>();
        reportsData?.forEach((r: { user_id: string }) => {
          reportsCount.set(r.user_id, (reportsCount.get(r.user_id) || 0) + 1);
        });

        const usersWithCredits: UserWithCredits[] = data.map((user: User) => ({
          ...user,
          credits_available: (creditsMap.get(user.id) as { credits_available?: number })?.credits_available || 0,
          credits_used: (creditsMap.get(user.id) as { credits_used?: number })?.credits_used || 0,
          report_count: reportsCount.get(user.id) || 0,
        }));

        setUsers(usersWithCredits);
      } else {
        setUsers([]);
      }

      setTotalCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, page, search, roleFilter, planFilter, dateRange, activityFilter, creditsRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 计算活跃度
  function getActivityLevel(updatedAt: string | null) {
    if (!updatedAt) return ACTIVITY_LEVELS[ACTIVITY_LEVELS.length - 1];
    const daysSince = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return ACTIVITY_LEVELS.find(level => daysSince >= level.min && daysSince < level.max) || ACTIVITY_LEVELS[ACTIVITY_LEVELS.length - 1];
  }

  // 创建用户
  async function handleCreateUser() {
    if (!createData.email || !createData.password) {
      alert("请填写邮箱和密码");
      return;
    }
    if (createData.password.length < 6) {
      alert("密码至少6位");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "创建失败");

      alert(`成功创建用户: ${createData.email}`);
      setShowCreateModal(false);
      setCreateData({ email: "", password: "", display_name: "", role: "user", plan: "free", initial_credits: 30 });
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert(`创建失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  // 编辑用户
  async function handleEditUser() {
    if (!editingUser) return;
    setProcessing(true);

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          display_name: editingUser.display_name,
          plan: editingUser.plan,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "更新失败");

      alert("用户信息更新成功");
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert(`更新失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  // 批量操作
  async function handleBatchOperation() {
    if (selectedUsers.size === 0) {
      alert("请先选择用户");
      return;
    }

    if (!supabase) return;
    setProcessing(true);
    const userIds = Array.from(selectedUsers);

    try {
      if (batchAction === "plan") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({ plan: batchPlan, updated_at: new Date().toISOString() })
          .in("id", userIds);
        alert(`成功修改 ${userIds.length} 个用户的套餐`);
      } else if (batchAction === "delete") {
        if (!confirm(`确定要删除 ${userIds.length} 个用户吗？此操作不可恢复！`)) {
          setProcessing(false);
          return;
        }
        let deleteCount = 0;
        for (const userId of userIds) {
          const response = await fetch("/api/admin/users/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          if (response.ok) deleteCount++;
        }
        alert(`成功删除 ${deleteCount} 个用户`);
      } else if (batchAction === "export") {
        // 导出选中用户数据
        const selectedData = users.filter(u => selectedUsers.has(u.id));
        const csv = [
          ["邮箱", "名称", "角色", "套餐", "积分", "报告数", "注册时间"].join(","),
          ...selectedData.map(u => [
            u.email,
            u.display_name || "",
            ROLE_CONFIGS[u.role || "user"]?.name || u.role,
            PLAN_CONFIGS[u.plan || "free"]?.name || u.plan,
            u.credits_available || 0,
            u.report_count || 0,
            u.created_at ? format(new Date(u.created_at), "yyyy-MM-dd HH:mm") : "",
          ].join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        alert(`已导出 ${selectedData.length} 个用户数据`);
      }

      setSelectedUsers(new Set());
      setShowBatchModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert(`操作失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  function toggleUserSelection(userId: string) {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  }

  function toggleSelectAll() {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  }

  function resetFilters() {
    setSearch("");
    setRoleFilter("all");
    setPlanFilter("all");
    setActivityFilter("all");
    setDateRange({ start: "", end: "" });
    setCreditsRange({ min: "", max: "" });
    setPage(1);
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const activeFiltersCount = [
    search,
    roleFilter !== "all",
    planFilter !== "all",
    activityFilter !== "all",
    dateRange.start,
    dateRange.end,
    creditsRange.min,
    creditsRange.max,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            用户管理
          </h1>
          <p className="mt-1 text-sm text-dim">
            全面的用户生命周期管理与数据分析
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { fetchUsers(); fetchStats(); }}
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            刷新
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 rounded-lg btn-gradient font-semibold"
          >
            + 创建用户
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="总用户"
          value={stats.total}
          loading={statsLoading}
          trend={stats.monthNew > 0 ? `+${stats.monthNew} 本月` : undefined}
          trendUp={true}
        />
        <StatCard
          title="今日新增"
          value={stats.todayNew}
          loading={statsLoading}
          icon="📈"
        />
        <StatCard
          title="本周新增"
          value={stats.weekNew}
          loading={statsLoading}
          icon="📊"
        />
        <StatCard
          title="活跃用户"
          value={stats.activeUsers}
          loading={statsLoading}
          subtitle={stats.total > 0 ? `${((stats.activeUsers / stats.total) * 100).toFixed(1)}%` : "0%"}
          icon="🔥"
        />
        <StatCard
          title="付费用户"
          value={stats.paidUsers}
          loading={statsLoading}
          subtitle={stats.total > 0 ? `${((stats.paidUsers / stats.total) * 100).toFixed(1)}%` : "0%"}
          icon="💎"
          highlight
        />
        <StatCard
          title="流失风险"
          value={stats.churnRisk}
          loading={statsLoading}
          icon="⚠️"
          warning={stats.churnRisk > 10}
        />
      </div>

      {/* 套餐分布 */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-dim mb-3">用户套餐分布</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PLAN_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setPlanFilter(planFilter === key ? "all" : key);
                setPage(1);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: planFilter === key ? `${config.color}20` : "var(--bg-layer)",
                border: planFilter === key ? `2px solid ${config.color}` : "2px solid transparent",
              }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: config.color }}
              />
              <span className="text-sm" style={{ color: planFilter === key ? config.color : "var(--color-foreground)" }}>
                {config.name}
              </span>
              <span className="text-sm font-bold" style={{ color: config.color }}>
                {stats.byPlan[key] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 筛选器 */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="🔍 搜索邮箱、名称..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {/* 角色筛选 */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          >
            <option value="all">全部角色</option>
            {Object.entries(ROLE_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.name}</option>
            ))}
          </select>

          {/* 套餐筛选 */}
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          >
            <option value="all">全部套餐</option>
            {Object.entries(PLAN_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>

          {/* 高级筛选切换 */}
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${showAdvancedFilter ? "btn-gradient" : "btn-ghost"}`}
          >
            高级筛选
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-white/20">{activeFiltersCount}</span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-lg text-sm text-dim hover:text-foreground"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 高级筛选面板 */}
        {showAdvancedFilter && (
          <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4" style={{ borderColor: "var(--stroke-soft)" }}>
            <div>
              <label className="block text-sm text-dim mb-2">注册时间范围</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                    colorScheme: "dark",
                  }}
                />
                <span className="text-dim self-center">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                    colorScheme: "dark",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-dim mb-2">活跃度</label>
              <select
                value={activityFilter}
                onChange={(e) => { setActivityFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                  colorScheme: "dark",
                }}
              >
                <option value="all">全部</option>
                <option value="high">高活跃 (7天内)</option>
                <option value="medium">活跃 (14天内)</option>
                <option value="low">低活跃 (30天内)</option>
                <option value="silent">沉默 (30天+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-dim mb-2">积分余额范围</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={creditsRange.min}
                  onChange={(e) => setCreditsRange({ ...creditsRange, min: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
                <span className="text-dim self-center">-</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={creditsRange.max}
                  onChange={(e) => setCreditsRange({ ...creditsRange, max: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectedUsers.size > 0 && (
        <div className="glass-card p-4 flex items-center justify-between" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
          <span className="text-sm font-medium" style={{ color: "#10b981" }}>
            已选择 {selectedUsers.size} 个用户
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setBatchAction("plan"); setShowBatchModal(true); }}
              className="px-4 py-2 rounded-lg btn-ghost text-sm"
            >
              修改套餐
            </button>
            <button
              onClick={() => { setBatchAction("export"); handleBatchOperation(); }}
              className="px-4 py-2 rounded-lg btn-ghost text-sm"
            >
              导出数据
            </button>
            <button
              onClick={() => { setBatchAction("delete"); handleBatchOperation(); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
            >
              删除用户
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-4 py-2 rounded-lg text-sm text-dim"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 用户列表 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-dim">
            <div className="inline-block w-8 h-8 border-2 border-current border-r-transparent rounded-full animate-spin mb-2" />
            <p>加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-dim">
            <p className="text-4xl mb-2">👥</p>
            <p>暂无用户数据</p>
            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className="mt-2 text-sm text-blue-400 hover:underline">
                清除筛选条件
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--bg-layer)" }}>
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">用户</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">套餐</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">积分</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">报告</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">活跃度</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const planConfig = PLAN_CONFIGS[user.plan || "free"] || PLAN_CONFIGS.free;
                  const roleConfig = ROLE_CONFIGS[user.role || "user"] || ROLE_CONFIGS.user;
                  const activityLevel = getActivityLevel(user.updated_at);

                  return (
                    <tr
                      key={user.id}
                      className="border-t hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: "var(--stroke-soft)" }}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{ background: `${roleConfig.color}20` }}
                          >
                            {roleConfig.icon}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                              {user.display_name || user.email.split("@")[0]}
                            </div>
                            <div className="text-xs text-dim">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: `${planConfig.color}20`, color: planConfig.color }}
                        >
                          {planConfig.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span style={{ color: "var(--color-foreground)" }}>{user.credits_available || 0}</span>
                          <span className="text-dim">/{planConfig.quota}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dim">
                        {user.report_count || 0} 份
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <span
                                key={dot}
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background: dot <= activityLevel.dots ? activityLevel.color : "var(--stroke-soft)",
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs" style={{ color: activityLevel.color }}>
                            {activityLevel.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dim">
                        {user.created_at ? format(new Date(user.created_at), "yyyy-MM-dd", { locale: zhCN }) : "-"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-sm font-medium hover:underline"
                            style={{ color: "var(--accent-emerald)" }}
                          >
                            详情
                          </Link>
                          <button
                            onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                            className="text-sm font-medium hover:underline"
                            style={{ color: "#3b82f6" }}
                          >
                            编辑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-dim">
            显示 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} 共 {totalCount} 条
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg btn-ghost text-sm disabled:opacity-50"
            >
              首页
            </button>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
            >
              上一页
            </button>
            <div className="px-4 py-2 text-dim">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
            >
              下一页
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg btn-ghost text-sm disabled:opacity-50"
            >
              末页
            </button>
          </div>
        </div>
      )}

      {/* 创建用户弹窗 */}
      {showCreateModal && (
        <Modal title="创建新用户" onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <InputField
              label="邮箱 *"
              type="email"
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              placeholder="user@example.com"
            />
            <InputField
              label="密码 * (至少6位)"
              type="password"
              value={createData.password}
              onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
              placeholder="输入密码"
            />
            <InputField
              label="显示名称"
              value={createData.display_name}
              onChange={(e) => setCreateData({ ...createData, display_name: e.target.value })}
              placeholder="用户昵称"
            />
            <SelectField
              label="会员套餐"
              value={createData.plan}
              onChange={(e) => {
                const plan = e.target.value;
                setCreateData({
                  ...createData,
                  plan,
                  initial_credits: PLAN_CONFIGS[plan]?.quota || 30,
                });
              }}
              options={Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
                value: key,
                label: `${config.name} (${config.quota}积分/月)`,
              }))}
            />
            <InputField
              label="初始积分"
              type="number"
              value={createData.initial_credits.toString()}
              onChange={(e) => setCreateData({ ...createData, initial_credits: Number(e.target.value) })}
            />
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateUser}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "创建中..." : "创建用户"}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 编辑用户弹窗 */}
      {showEditModal && editingUser && (
        <Modal title="编辑用户" onClose={() => setShowEditModal(false)}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">邮箱</div>
              <div style={{ color: "var(--color-foreground)" }}>{editingUser.email}</div>
            </div>
            <InputField
              label="显示名称"
              value={editingUser.display_name || ""}
              onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })}
            />
            <SelectField
              label="会员套餐"
              value={editingUser.plan || "free"}
              onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
              options={Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
                value: key,
                label: `${config.name} (${config.quota}积分/月)`,
              }))}
            />
            <div className="p-3 rounded-lg" style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
              <div className="text-sm" style={{ color: "#fbbf24" }}>
                如需修改用户角色，请前往「权限管理」页面操作
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleEditUser}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "保存中..." : "保存修改"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 批量操作弹窗 */}
      {showBatchModal && (
        <Modal title="批量修改套餐" onClose={() => setShowBatchModal(false)}>
          <div className="space-y-4">
            <div className="text-sm text-dim">已选择 {selectedUsers.size} 个用户</div>
            <SelectField
              label="新套餐"
              value={batchPlan}
              onChange={(e) => setBatchPlan(e.target.value)}
              options={Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
                value: key,
                label: `${config.name} (${config.quota}积分/月)`,
              }))}
            />
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBatchOperation}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "处理中..." : "确认修改"}
              </button>
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// 统计卡片组件
function StatCard({
  title,
  value,
  loading,
  trend,
  trendUp,
  subtitle,
  icon,
  highlight,
  warning,
}: {
  title: string;
  value: number;
  loading?: boolean;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  icon?: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className="glass-card p-4 transition-all hover:scale-105"
      style={{
        borderColor: warning ? "rgba(239, 68, 68, 0.3)" : highlight ? "rgba(16, 185, 129, 0.3)" : undefined,
        background: warning ? "rgba(239, 68, 68, 0.05)" : highlight ? "rgba(16, 185, 129, 0.05)" : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm text-dim">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      {loading ? (
        <div className="h-8 mt-1 bg-white/10 rounded animate-pulse" />
      ) : (
        <>
          <div className="text-2xl font-bold mt-1" style={{ color: warning ? "#ef4444" : highlight ? "#10b981" : "var(--color-foreground)" }}>
            {value.toLocaleString()}
          </div>
          {trend && (
            <div className={`text-xs mt-1 ${trendUp ? "text-green-400" : "text-red-400"}`}>
              {trend}
            </div>
          )}
          {subtitle && (
            <div className="text-xs text-dim mt-1">{subtitle}</div>
          )}
        </>
      )}
    </div>
  );
}

// 辅助组件
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="glass-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{title}</h3>
          <button onClick={onClose} className="text-dim hover:text-foreground text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-dim mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg"
        style={{
          background: "var(--bg-layer)",
          border: "1px solid var(--stroke-soft)",
          color: "var(--color-foreground)",
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm text-dim mb-2">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-lg"
        style={{
          background: "var(--bg-layer)",
          border: "1px solid var(--stroke-soft)",
          color: "var(--color-foreground)",
          colorScheme: "dark",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
