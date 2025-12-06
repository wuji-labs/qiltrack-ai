"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

interface UserWithPlan {
  id: string;
  email: string;
  display_name: string | null;
  plan: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SubscriptionStats {
  totalUsers: number;
  paidUsers: number;
  mrr: number;
  arr: number;
  churnRate: number;
  arpu: number;
  byPlan: Record<string, number>;
  expiringThis7Days: number;
  expiringThis30Days: number;
  newPaidThisMonth: number;
}

const PLAN_CONFIGS: Record<string, { name: string; quota: number; priceMonthly: number; priceYearly: number; color: string }> = {
  free: { name: "Free", quota: 30, priceMonthly: 0, priceYearly: 0, color: "#6b7280" },
  pro: { name: "Pro", quota: 300, priceMonthly: 14.99, priceYearly: 119.88, color: "#10b981" },
  ultra: { name: "Ultra", quota: 1500, priceMonthly: 44.99, priceYearly: 359.88, color: "#8b5cf6" },
};

export default function SubscriptionsPage() {
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalUsers: 0,
    paidUsers: 0,
    mrr: 0,
    arr: 0,
    churnRate: 0,
    arpu: 0,
    byPlan: {},
    expiringThis7Days: 0,
    expiringThis30Days: 0,
    newPaidThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // 筛选
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // 修改套餐
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null);
  const [newPlan, setNewPlan] = useState("");
  const [processing, setProcessing] = useState(false);

  // 批量操作
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPlan, setBatchPlan] = useState("");

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    setStatsLoading(true);

    try {
      const monthStart = startOfMonth(new Date()).toISOString();

      // 获取所有用户
      const { data: allProfiles } = await supabase.from("profiles").select("plan, created_at, updated_at");

      const byPlan: Record<string, number> = {};
      let paidUsers = 0;
      let mrr = 0;
      let newPaidThisMonth = 0;

      allProfiles?.forEach((p: { plan: string | null; created_at: string | null; updated_at: string | null }) => {
        const plan = p.plan || "free";
        byPlan[plan] = (byPlan[plan] || 0) + 1;

        if (plan !== "free") {
          paidUsers++;
          const config = PLAN_CONFIGS[plan];
          if (config) {
            mrr += config.priceMonthly || (config.priceYearly / 12);
          }

          // 本月新付费
          if (p.created_at && new Date(p.created_at) >= new Date(monthStart)) {
            newPaidThisMonth++;
          }
        }
      });

      const totalUsers = allProfiles?.length || 0;
      const arr = mrr * 12;
      const arpu = paidUsers > 0 ? mrr / paidUsers : 0;

      // 模拟流失率计算（实际应该基于历史数据）
      const churnRate = paidUsers > 0 ? (0 / paidUsers) * 100 : 0;

      setStats({
        totalUsers,
        paidUsers,
        mrr,
        arr,
        churnRate,
        arpu,
        byPlan,
        expiringThis7Days: 0, // 需要订阅到期时间字段
        expiringThis30Days: 0,
        newPaidThisMonth,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      let query = supabase
        .from("profiles")
        .select("id, email, display_name, plan, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false });

      // 只显示付费用户
      if (statusFilter === "paid") {
        query = query.neq("plan", "free").not("plan", "is", null);
      } else if (statusFilter === "free") {
        query = query.or("plan.eq.free,plan.is.null");
      }

      if (planFilter !== "all") {
        query = query.eq("plan", planFilter);
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, count, error } = await query.range(
        (page - 1) * pageSize,
        page * pageSize - 1
      );

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 修改套餐
  async function handleChangePlan() {
    if (!selectedUser || !newPlan) return;
    setProcessing(true);

    try {
      const response = await fetch("/api/admin/users/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPlan,
          grantCredits: true,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "修改失败");
      }

      await fetchUsers();
      await fetchStats();
      setShowPlanModal(false);
      setSelectedUser(null);
      setNewPlan("");
      alert(`${selectedUser.email} 的套餐已更改为 ${PLAN_CONFIGS[newPlan]?.name}`);
    } catch (error) {
      alert(`修改失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  // 批量修改套餐
  async function handleBatchChangePlan() {
    if (selectedUsers.size === 0 || !batchPlan) return;
    setProcessing(true);

    try {
      let successCount = 0;
      for (const userId of selectedUsers) {
        try {
          const response = await fetch("/api/admin/users/change-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, newPlan: batchPlan, grantCredits: true }),
          });
          if (response.ok) successCount++;
        } catch (error) {
          console.error(`Change plan for ${userId} failed:`, error);
        }
      }

      await fetchUsers();
      await fetchStats();
      setShowBatchModal(false);
      setSelectedUsers(new Set());
      setBatchPlan("");
      alert(`成功修改 ${successCount} 个用户的套餐`);
    } catch (error) {
      alert(`批量修改失败: ${error instanceof Error ? error.message : "未知错误"}`);
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

  const totalPages = Math.ceil(totalCount / pageSize);
  const conversionRate = stats.totalUsers > 0 ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            订阅管理
          </h1>
          <p className="mt-1 text-sm text-dim">
            订阅数据分析与生命周期管理
          </p>
        </div>
        <div className="flex gap-3">
          {selectedUsers.size > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 rounded-lg btn-gradient text-sm"
            >
              批量修改 ({selectedUsers.size})
            </button>
          )}
          <Link
            href="/admin/plans"
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            套餐配置
          </Link>
          <button
            onClick={() => { fetchUsers(); fetchStats(); }}
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="MRR"
          value={`¥${stats.mrr.toLocaleString()}`}
          loading={statsLoading}
          icon="💰"
          highlight
        />
        <MetricCard
          title="ARR"
          value={`¥${stats.arr.toLocaleString()}`}
          loading={statsLoading}
          icon="📈"
        />
        <MetricCard
          title="付费用户"
          value={stats.paidUsers}
          loading={statsLoading}
          subtitle={`转化率 ${conversionRate}%`}
          icon="💎"
        />
        <MetricCard
          title="ARPU"
          value={`¥${stats.arpu.toFixed(0)}`}
          loading={statsLoading}
          subtitle="平均每用户收入"
          icon="👤"
        />
        <MetricCard
          title="本月新增付费"
          value={stats.newPaidThisMonth}
          loading={statsLoading}
          icon="🎉"
        />
        <MetricCard
          title="月流失率"
          value={`${stats.churnRate.toFixed(1)}%`}
          loading={statsLoading}
          icon="📉"
          warning={stats.churnRate > 5}
        />
      </div>

      {/* 套餐分布 */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            套餐分布
          </h3>
          <Link
            href="/admin/plans"
            className="text-sm hover:underline"
            style={{ color: "var(--accent-emerald)" }}
          >
            管理套餐 →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(PLAN_CONFIGS).map(([key, config]) => {
            const count = stats.byPlan[key] || 0;
            const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(1) : "0";
            const revenue = config.priceMonthly > 0 ? count * config.priceMonthly : count * (config.priceYearly / 12);

            return (
              <button
                key={key}
                onClick={() => {
                  setPlanFilter(planFilter === key ? "all" : key);
                  setPage(1);
                }}
                className="p-4 rounded-lg text-left transition-all hover:scale-105"
                style={{
                  background: planFilter === key ? `${config.color}15` : "var(--bg-layer)",
                  border: planFilter === key ? `2px solid ${config.color}` : "2px solid transparent",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: config.color }} />
                  <span className="text-sm font-medium" style={{ color: config.color }}>{config.name}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
                  {count}
                </div>
                <div className="text-xs text-dim mt-1">{percentage}% · ¥{revenue.toFixed(0)}/月</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 订阅健康度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dim">即将到期 (7天内)</span>
            <span className="text-xl">⏰</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: stats.expiringThis7Days > 0 ? "#f59e0b" : "var(--color-foreground)" }}>
            {stats.expiringThis7Days}
          </div>
          {stats.expiringThis7Days > 0 && (
            <button className="mt-2 text-xs px-3 py-1 rounded btn-ghost" style={{ color: "#f59e0b" }}>
              发送续费提醒
            </button>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dim">即将到期 (30天内)</span>
            <span className="text-xl">📅</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {stats.expiringThis30Days}
          </div>
          <button className="mt-2 text-xs px-3 py-1 rounded btn-ghost">
            查看详情
          </button>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dim">净收入留存 (NRR)</span>
            <span className="text-xl">📊</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: "#10b981" }}>
            100%+
          </div>
          <div className="text-xs text-dim mt-1">目标 &gt; 100%</div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="🔍 搜索用户..."
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

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          >
            <option value="all">全部用户</option>
            <option value="paid">付费用户</option>
            <option value="free">免费用户</option>
          </select>

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
        </div>
      </div>

      {/* 用户列表 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-dim">
            <div className="inline-block w-8 h-8 border-2 border-current border-r-transparent rounded-full animate-spin mb-2" />
            <p>加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-dim">
            <p className="text-4xl mb-2">💳</p>
            <p>暂无订阅数据</p>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">月费</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">积分配额</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">加入时间</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const planConfig = PLAN_CONFIGS[user.plan || "free"] || PLAN_CONFIGS.free;
                  const monthlyPrice = planConfig.priceMonthly || (planConfig.priceYearly / 12);

                  return (
                    <tr
                      key={user.id}
                      className="border-t hover:bg-white/5 transition-colors"
                      style={{ borderColor: "var(--stroke-soft)" }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                            {user.display_name || user.email.split("@")[0]}
                          </div>
                          <div className="text-xs text-dim">{user.email}</div>
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
                      <td className="px-4 py-3 text-sm" style={{ color: monthlyPrice > 0 ? "#10b981" : "var(--text-dim)" }}>
                        {monthlyPrice > 0 ? `¥${monthlyPrice.toFixed(0)}` : "免费"}
                      </td>
                      <td className="px-4 py-3 text-sm text-dim">
                        {planConfig.quota} 积分/月
                      </td>
                      <td className="px-4 py-3 text-sm text-dim">
                        {user.created_at ? format(new Date(user.created_at), "yyyy-MM-dd", { locale: zhCN }) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPlan(user.plan || "free");
                              setShowPlanModal(true);
                            }}
                            className="text-sm font-medium hover:underline"
                            style={{ color: "var(--accent-emerald)" }}
                          >
                            修改套餐
                          </button>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-sm font-medium hover:underline"
                            style={{ color: "#3b82f6" }}
                          >
                            详情
                          </Link>
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
          </div>
        </div>
      )}

      {/* 修改套餐弹窗 */}
      {showPlanModal && selectedUser && (
        <Modal title="修改用户套餐" onClose={() => setShowPlanModal(false)}>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">用户</div>
              <div style={{ color: "var(--color-foreground)" }}>{selectedUser.email}</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">当前套餐</div>
              <div className="mt-1">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: `${PLAN_CONFIGS[selectedUser.plan || "free"]?.color}20`,
                    color: PLAN_CONFIGS[selectedUser.plan || "free"]?.color,
                  }}
                >
                  {PLAN_CONFIGS[selectedUser.plan || "free"]?.name}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-dim mb-2">新套餐</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                  colorScheme: "dark",
                }}
              >
                {Object.entries(PLAN_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name} ({config.quota}积分/月 · ¥{config.priceMonthly || Math.round(config.priceYearly / 12)}/月)
                  </option>
                ))}
              </select>
            </div>
            {newPlan && newPlan !== selectedUser.plan && (
              <div className="p-4 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <div className="text-sm" style={{ color: "#10b981" }}>
                  更改后将自动授予 {PLAN_CONFIGS[newPlan]?.quota || 0} 积分
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleChangePlan}
                disabled={processing || newPlan === selectedUser.plan}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "处理中..." : "确认修改"}
              </button>
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 批量修改弹窗 */}
      {showBatchModal && (
        <Modal title="批量修改套餐" onClose={() => setShowBatchModal(false)}>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">已选择 {selectedUsers.size} 个用户</div>
            </div>
            <div>
              <label className="block text-sm text-dim mb-2">新套餐</label>
              <select
                value={batchPlan}
                onChange={(e) => setBatchPlan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                  colorScheme: "dark",
                }}
              >
                <option value="">请选择套餐...</option>
                {Object.entries(PLAN_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name} ({config.quota}积分/月)
                  </option>
                ))}
              </select>
            </div>
            {batchPlan && (
              <div className="p-4 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <div className="text-sm" style={{ color: "#10b981" }}>
                  每个用户将获得 {PLAN_CONFIGS[batchPlan]?.quota || 0} 积分
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBatchChangePlan}
                disabled={processing || !batchPlan}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "处理中..." : `修改 ${selectedUsers.size} 个用户`}
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

// 指标卡片组件
function MetricCard({
  title,
  value,
  loading,
  subtitle,
  icon,
  highlight,
  warning,
}: {
  title: string;
  value: string | number;
  loading?: boolean;
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
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-dim mt-1">{subtitle}</div>
          )}
        </>
      )}
    </div>
  );
}

// 弹窗组件
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
