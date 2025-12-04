"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Tabs,
  StatusBadge,
  RoleBadge,
  PlanBadge,
  DetailRow,
  Modal,
  InputField,
  SelectField,
  ConfirmDialog,
  formatDate,
  DataTable,
  type Column,
  getPlanInfo,
} from "@/app/components/admin/ui";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  full_name?: string | null;
  avatar_url: string | null;
  role: string | null;
  plan: string | null;
  created_at: string | null;
  updated_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface UserCredits {
  credits_available: number;
  credits_used: number;
  last_reset: string | null;
}

interface CreditEvent {
  id: string;
  event_type: string;
  credits_amount: number;
  reason: string | null;
  created_at: string;
}

interface ReportRun {
  id: string;
  symbol: string | null;
  status: string | null;
  language: string | null;
  duration_ms: number | null;
  created_at: string | null;
}

interface Subscription {
  id: string;
  plan_id: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const PLAN_CONFIGS = {
  free: { name: "免费版", quota: 60, price: 0 },       // 60初始积分，无月度配额
  pro: { name: "月费版", quota: 300, price: 14.99 },   // $14.99/月，300积分/月
  annual: { name: "年费版", quota: 600, price: 119.99 }, // $119.99/年，600积分/月
};

const ROLE_OPTIONS = [
  { value: "guest", label: "访客" },
  { value: "user", label: "用户" },
  { value: "developer", label: "开发者" },
  { value: "admin", label: "管理员" },
  { value: "super_admin", label: "超级管理员" },
];

const PLAN_OPTIONS = [
  { value: "free", label: "免费版 (60初始积分)" },
  { value: "pro", label: "月费版 (300积分/月, $14.99)" },
  { value: "annual", label: "年费版 (600积分/月, $119.99/年)" },
];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditEvents, setCreditEvents] = useState<CreditEvent[]>([]);
  const [reportRuns, setReportRuns] = useState<ReportRun[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");

  // 编辑状态
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    display_name: "",
    role: "",
    plan: "",
  });
  const [saving, setSaving] = useState(false);

  // 积分操作
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantReason, setGrantReason] = useState("admin_manual_grant");

  // 套餐修改
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState("");

  // 删除确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  async function fetchUserData() {
    const supabase = createClient();
    setLoading(true);

    try {
      // 获取用户基本信息
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      setUser(userData);
      setEditData({
        display_name: userData.display_name || "",
        role: userData.role || "user",
        plan: userData.plan || "free",
      });

      // 并行获取其他数据
      const [creditsRes, eventsRes, runsRes, subsRes, logsRes] = await Promise.all([
        supabase.from("report_credits").select("*").eq("user_id", userId).single(),
        supabase.from("report_credit_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("report_runs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("billing_subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("audit_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      ]);

      setCredits(creditsRes.data);
      setCreditEvents(eventsRes.data || []);
      setReportRuns(runsRes.data || []);
      setSubscriptions(subsRes.data || []);
      setAuditLogs(logsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUser() {
    if (!user) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          display_name: editData.display_name,
          role: editData.role,
          plan: editData.plan,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "更新失败");
      }

      await fetchUserData();
      setEditMode(false);
      alert("用户信息已更新");
    } catch (error) {
      console.error("Save failed:", error);
      alert(`保存失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleGrantCredits() {
    if (!user) return;
    setSaving(true);

    try {
      // 使用 API 端点而不是直接操作数据库
      const response = await fetch("/api/admin/users/grant-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: grantAmount,
          reason: grantReason || "管理员手动授予",
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "授予积分失败");
      }

      const result = await response.json();
      await fetchUserData();
      setShowGrantModal(false);
      setGrantAmount(10);
      setGrantReason("admin_manual_grant");
      alert(`成功授予 ${grantAmount} 积分，当前余额: ${result.newBalance}`);
    } catch (error) {
      console.error("Grant credits failed:", error);
      alert(`授予积分失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePlan() {
    if (!user || !newPlan) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/users/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPlan,
          grantCredits: true, // 自动授予对应积分
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "修改失败");
      }

      await fetchUserData();
      setShowPlanModal(false);
      setNewPlan("");
      alert(`套餐已更改为 ${PLAN_CONFIGS[newPlan as keyof typeof PLAN_CONFIGS]?.name}`);
    } catch (error) {
      console.error("Change plan failed:", error);
      alert(`修改套餐失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!user) return;
    setDeleting(true);

    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      alert("用户已删除");
      router.push("/admin/users");
    } catch (error) {
      console.error("Delete failed:", error);
      alert(`删除失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleSendResetEmail() {
    if (!user) return;

    try {
      const response = await fetch("/api/admin/users/send-reset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "发送失败");
      }

      alert(`密码重置邮件已发送到 ${user.email}`);
    } catch (error) {
      console.error("Send reset email failed:", error);
      alert(`发送失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-dim">加载用户数据...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
          用户不存在
        </h2>
        <Link href="/admin/users" className="text-dim hover:text-foreground">
          返回用户列表
        </Link>
      </div>
    );
  }

  const planInfo = getPlanInfo(user.plan || "free");

  const creditColumns: Column<CreditEvent>[] = [
    {
      key: "created_at",
      title: "时间",
      render: (_, record) => formatDate(record.created_at, "MM-dd HH:mm"),
    },
    {
      key: "event_type",
      title: "类型",
      render: (_, record) => (
        <StatusBadge status={record.event_type === "granted" ? "success" : record.event_type === "consumed" ? "warning" : "info"} />
      ),
    },
    {
      key: "credits_amount",
      title: "数量",
      render: (_, record) => (
        <span style={{ color: record.credits_amount > 0 ? "#10b981" : "#ef4444" }}>
          {record.credits_amount > 0 ? "+" : ""}{record.credits_amount}
        </span>
      ),
    },
    { key: "reason", title: "原因", render: (_, record) => record.reason || "-" },
  ];

  const reportColumns: Column<ReportRun>[] = [
    {
      key: "created_at",
      title: "时间",
      render: (_, record) => formatDate(record.created_at, "MM-dd HH:mm"),
    },
    { key: "symbol", title: "股票", render: (_, record) => record.symbol || "-" },
    {
      key: "status",
      title: "状态",
      render: (_, record) => <StatusBadge status={record.status || "pending"} />,
    },
    { key: "language", title: "语言", render: (_, record) => record.language || "en" },
    {
      key: "duration_ms",
      title: "耗时",
      render: (_, record) => record.duration_ms ? `${(record.duration_ms / 1000).toFixed(1)}s` : "-",
    },
    {
      key: "id",
      title: "操作",
      render: (_, record) => (
        <Link href={`/admin/runs/${record.id}`} className="text-sm" style={{ color: "var(--accent-emerald)" }}>
          查看
        </Link>
      ),
    },
  ];

  const auditColumns: Column<AuditLog>[] = [
    {
      key: "created_at",
      title: "时间",
      render: (_, record) => formatDate(record.created_at, "MM-dd HH:mm"),
    },
    { key: "action", title: "动作" },
    { key: "resource_type", title: "资源类型", render: (_, record) => record.resource_type || "-" },
    {
      key: "details",
      title: "详情",
      render: (_, record) => (
        <span className="text-xs text-dim truncate max-w-[200px] inline-block">
          {record.details ? JSON.stringify(record.details).substring(0, 50) : "-"}
        </span>
      ),
    },
  ];

  const tabs = [
    { key: "account", label: "账户信息", icon: "👤" },
    { key: "credits", label: "积分管理", icon: "💰", badge: credits?.credits_available },
    { key: "reports", label: "报告记录", icon: "📊", badge: reportRuns.length },
    { key: "subscription", label: "订阅信息", icon: "💳" },
    { key: "audit", label: "操作日志", icon: "📜" },
  ];

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="text-dim hover:text-foreground">
            ← 返回
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
              用户详情
            </h1>
            <p className="text-sm text-dim mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            {editMode ? "取消编辑" : "编辑"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
          >
            删除用户
          </button>
        </div>
      </div>

      {/* 用户卡片 */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 头像和基本信息 */}
          <div className="flex flex-col items-center md:items-start gap-4 md:w-64">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
              style={{ background: "var(--bg-layer)" }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                "👤"
              )}
            </div>
            <div className="text-center md:text-left">
              <div className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
                {user.display_name || user.email.split("@")[0]}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                <RoleBadge role={user.role || "user"} />
                <PlanBadge plan={user.plan || "free"} />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setShowPlanModal(true)}
                className="w-full px-4 py-2 rounded-lg btn-gradient text-sm font-semibold"
              >
                更改套餐
              </button>
              <button
                onClick={() => setShowGrantModal(true)}
                className="w-full px-4 py-2 rounded-lg btn-ghost text-sm"
              >
                授予积分
              </button>
              <button
                onClick={handleSendResetEmail}
                className="w-full px-4 py-2 rounded-lg btn-ghost text-sm"
              >
                发送重置邮件
              </button>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="flex-1">
            {editMode ? (
              <div className="space-y-4">
                <InputField
                  label="显示名称"
                  value={editData.display_name}
                  onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                />
                {/* 角色更改已移至权限管理功能，避免误操作 */}
                <div className="p-3 rounded-lg" style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                  <div className="text-sm" style={{ color: "#fbbf24" }}>
                    ⚠️ 角色更改请前往「权限管理」功能单独操作，以防止误授权
                  </div>
                </div>
                <SelectField
                  label="套餐"
                  value={editData.plan}
                  onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                  options={PLAN_OPTIONS}
                />
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveUser}
                    disabled={saving}
                    className="px-6 py-2 rounded-lg btn-gradient font-semibold disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存修改"}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-6 py-2 rounded-lg btn-ghost"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow label="用户ID" value={user.id} copyable />
                <DetailRow label="邮箱" value={user.email} copyable />
                <DetailRow label="显示名称" value={user.display_name || "-"} />
                <DetailRow label="角色" value={<RoleBadge role={user.role || "user"} />} />
                <DetailRow label="套餐" value={<PlanBadge plan={user.plan || "free"} />} />
                <DetailRow label="月积分配额" value={`${planInfo.quota} 积分`} />
                <DetailRow label="注册时间" value={formatDate(user.created_at)} />
                <DetailRow label="最后更新" value={formatDate(user.updated_at)} />
                <DetailRow label="Stripe客户ID" value={user.stripe_customer_id || "-"} copyable />
                <DetailRow label="Stripe订阅ID" value={user.stripe_subscription_id || "-"} copyable />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab内容 */}
      <div className="glass-card">
        <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === "account" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                账户统计
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">可用积分</div>
                  <div className="text-2xl font-bold" style={{ color: "#10b981" }}>
                    {credits?.credits_available || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">已用积分</div>
                  <div className="text-2xl font-bold" style={{ color: "#6b7280" }}>
                    {credits?.credits_used || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">报告数量</div>
                  <div className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
                    {reportRuns.length}
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">成功率</div>
                  <div className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>
                    {reportRuns.length > 0
                      ? `${((reportRuns.filter(r => r.status === "completed").length / reportRuns.length) * 100).toFixed(0)}%`
                      : "-"
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "credits" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                  积分流水
                </h3>
                <button
                  onClick={() => setShowGrantModal(true)}
                  className="px-4 py-2 rounded-lg btn-gradient text-sm"
                >
                  + 授予积分
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">可用积分</div>
                  <div className="text-2xl font-bold" style={{ color: "#10b981" }}>
                    {credits?.credits_available || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">已消耗</div>
                  <div className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                    {credits?.credits_used || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                  <div className="text-sm text-dim">总获得</div>
                  <div className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
                    {(credits?.credits_available || 0) + (credits?.credits_used || 0)}
                  </div>
                </div>
              </div>
              <DataTable columns={creditColumns} data={creditEvents} emptyText="暂无积分记录" />
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                报告生成记录
              </h3>
              <DataTable
                columns={reportColumns}
                data={reportRuns}
                emptyText="暂无报告记录"
                onRowClick={(record) => router.push(`/admin/runs/${record.id}`)}
              />
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                订阅信息
              </h3>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-dim">暂无订阅记录</div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold" style={{ color: "var(--color-foreground)" }}>
                            {sub.plan_id || "未知套餐"}
                          </div>
                          <div className="text-sm text-dim mt-1">
                            {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                          </div>
                        </div>
                        <StatusBadge status={sub.status || "inactive"} />
                      </div>
                      {sub.stripe_subscription_id && (
                        <div className="text-xs text-dim mt-2">
                          Stripe ID: {sub.stripe_subscription_id}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                操作日志
              </h3>
              <DataTable columns={auditColumns} data={auditLogs} emptyText="暂无操作日志" />
            </div>
          )}
        </div>
      </div>

      {/* 授予积分弹窗 */}
      <Modal
        title="授予积分"
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        size="sm"
      >
        <div className="space-y-4">
          <InputField
            label="积分数量"
            type="number"
            value={grantAmount.toString()}
            onChange={(e) => setGrantAmount(Number(e.target.value))}
          />
          <InputField
            label="授予原因"
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            placeholder="例如: 补偿、奖励、测试"
          />
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGrantCredits}
              disabled={saving || grantAmount <= 0}
              className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
            >
              {saving ? "处理中..." : `授予 ${grantAmount} 积分`}
            </button>
            <button
              onClick={() => setShowGrantModal(false)}
              className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* 更改套餐弹窗 */}
      <Modal
        title="更改用户套餐"
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
            <div className="text-sm text-dim">当前套餐</div>
            <div className="flex items-center gap-2 mt-1">
              <PlanBadge plan={user.plan || "free"} />
              <span className="text-dim">({planInfo.quota} 积分/月)</span>
            </div>
          </div>
          <SelectField
            label="新套餐"
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            options={[
              { value: "", label: "请选择套餐..." },
              ...PLAN_OPTIONS,
            ]}
          />
          {newPlan && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(91, 224, 176, 0.1)" }}>
              <div className="text-sm" style={{ color: "var(--accent-emerald)" }}>
                更改后将自动授予 {PLAN_CONFIGS[newPlan as keyof typeof PLAN_CONFIGS]?.quota} 积分
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleChangePlan}
              disabled={saving || !newPlan}
              className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
            >
              {saving ? "处理中..." : "确认更改"}
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

      {/* 删除确认 */}
      <ConfirmDialog
        title="删除用户"
        message={`确定要删除用户 ${user.email} 吗？此操作不可恢复，将删除该用户的所有数据。`}
        isOpen={showDeleteConfirm}
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
        confirmText="确认删除"
        loading={deleting}
      />
    </div>
  );
}
