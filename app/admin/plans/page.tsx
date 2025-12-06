"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PlanConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  credits_monthly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  color: string;
  user_count?: number;
}

const DEFAULT_PLANS: Omit<PlanConfig, "id" | "user_count">[] = [
  {
    name: "Free",
    slug: "free",
    description: "适合体验和新用户",
    price_monthly: 0,
    price_yearly: 0,
    credits_monthly: 30,
    features: ["注册赠送30积分", "每日签到5积分", "在线查看报告", "社区支持"],
    is_active: true,
    sort_order: 1,
    color: "#6b7280",
  },
  {
    name: "Pro",
    slug: "pro",
    description: "适合个人投资者",
    price_monthly: 14.99,
    price_yearly: 119.88,
    credits_monthly: 300,
    features: ["300月度积分", "每日签到15积分", "DOCX导出", "批量3份", "2x优先速度"],
    is_active: true,
    sort_order: 2,
    color: "#10b981",
  },
  {
    name: "Ultra",
    slug: "ultra",
    description: "专业用户和团队",
    price_monthly: 44.99,
    price_yearly: 359.88,
    credits_monthly: 1500,
    features: ["1500月度积分", "每日签到30积分", "PDF+DOCX导出", "批量10份", "4x极速", "API访问"],
    is_active: true,
    sort_order: 3,
    color: "#8b5cf6",
  },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [processing, setProcessing] = useState(false);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPlans();
    fetchUserCounts();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("subscription_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPlans(data.map((p: Record<string, unknown>) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : JSON.parse(String(p.features || "[]")),
        })) as PlanConfig[]);
      } else {
        // 如果没有数据，使用默认配置
        setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}` })));
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}` })));
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserCounts() {
    try {
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("plan");

      const counts: Record<string, number> = {};
      data?.forEach((p: { plan: string | null }) => {
        const plan = p.plan || "free";
        counts[plan] = (counts[plan] || 0) + 1;
      });
      setUserCounts(counts);
    } catch (error) {
      console.error("Failed to fetch user counts:", error);
    }
  }

  async function handleSavePlan() {
    if (!editingPlan) return;
    setProcessing(true);

    try {
      const supabase = createClient();

      if (editingPlan.id.startsWith("default-") || editingPlan.id.startsWith("new-")) {
        // 创建新套餐
        const insertData = {
          name: editingPlan.name,
          slug: editingPlan.slug,
          description: editingPlan.description,
          price_monthly: editingPlan.price_monthly,
          price_yearly: editingPlan.price_yearly,
          credits_monthly: editingPlan.credits_monthly,
          features: editingPlan.features,
          is_active: editingPlan.is_active,
          sort_order: editingPlan.sort_order,
          color: editingPlan.color,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("subscription_plans").insert(insertData);
        if (error) throw error;
      } else {
        // 更新现有套餐
        const updateData = {
          name: editingPlan.name,
          description: editingPlan.description,
          price_monthly: editingPlan.price_monthly,
          price_yearly: editingPlan.price_yearly,
          credits_monthly: editingPlan.credits_monthly,
          features: editingPlan.features,
          is_active: editingPlan.is_active,
          sort_order: editingPlan.sort_order,
          color: editingPlan.color,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("subscription_plans")
          .update(updateData)
          .eq("id", editingPlan.id);
        if (error) throw error;
      }

      alert("套餐配置已保存");
      setShowEditModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error("Save plan failed:", error);
      alert(`保存失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  function handleAddFeature() {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, ""],
    });
  }

  function handleRemoveFeature(index: number) {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures.splice(index, 1);
    setEditingPlan({ ...editingPlan, features: newFeatures });
  }

  function handleFeatureChange(index: number, value: string) {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  }

  const totalRevenue = plans.reduce((sum, plan) => {
    const count = userCounts[plan.slug] || 0;
    return sum + (plan.price_monthly * count);
  }, 0);

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            套餐配置
          </h1>
          <p className="mt-1 text-sm text-dim">
            管理订阅套餐、定价和权益配置
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlan({
              id: `new-${Date.now()}`,
              name: "",
              slug: "",
              description: "",
              price_monthly: 0,
              price_yearly: 0,
              credits_monthly: 0,
              features: [],
              is_active: true,
              sort_order: plans.length + 1,
              color: "#3b82f6",
            });
            setShowEditModal(true);
          }}
          className="px-6 py-2.5 rounded-lg btn-gradient font-semibold"
        >
          + 新建套餐
        </button>
      </div>

      {/* 收入概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-dim">月度收入 (MRR)</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "#10b981" }}>
            ¥{totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">年度收入 (ARR)</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>
            ¥{(totalRevenue * 12).toLocaleString()}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">付费用户</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>
            {Object.entries(userCounts).filter(([k]) => k !== "free").reduce((s, [, v]) => s + v, 0)}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">活跃套餐</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>
            {plans.filter(p => p.is_active).length} / {plans.length}
          </div>
        </div>
      </div>

      {/* 套餐卡片 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-10 bg-white/10 rounded w-3/4 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-4 bg-white/10 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="glass-card p-6 relative transition-all hover:scale-105"
              style={{
                borderColor: plan.is_active ? `${plan.color}50` : "var(--stroke-soft)",
                opacity: plan.is_active ? 1 : 0.6,
              }}
            >
              {/* 状态标签 */}
              {!plan.is_active && (
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs"
                  style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}
                >
                  已停用
                </div>
              )}

              {/* 套餐名称 */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: plan.color }}
                />
                <h3 className="font-bold" style={{ color: plan.color }}>
                  {plan.name}
                </h3>
              </div>

              {/* 描述 */}
              <p className="text-sm text-dim mb-4">{plan.description}</p>

              {/* 价格 */}
              <div className="mb-4">
                <div className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
                  ¥{plan.price_monthly}
                  <span className="text-sm font-normal text-dim">/月</span>
                </div>
                {plan.price_yearly > 0 && (
                  <div className="text-sm text-dim">
                    年付 ¥{plan.price_yearly} (省 ¥{plan.price_monthly * 12 - plan.price_yearly})
                  </div>
                )}
              </div>

              {/* 积分配额 */}
              <div
                className="px-3 py-2 rounded-lg mb-4"
                style={{ background: `${plan.color}15` }}
              >
                <span className="text-lg font-bold" style={{ color: plan.color }}>
                  {plan.credits_monthly}
                </span>
                <span className="text-sm text-dim"> 积分/月</span>
              </div>

              {/* 功能列表 */}
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span style={{ color: plan.color }}>✓</span>
                    <span style={{ color: "var(--color-foreground)" }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* 用户数 */}
              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--stroke-soft)" }}>
                <span className="text-sm text-dim">当前用户</span>
                <span className="font-bold" style={{ color: "var(--color-foreground)" }}>
                  {userCounts[plan.slug] || 0}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg btn-ghost text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    // TODO: 查看统计
                  }}
                  className="flex-1 px-4 py-2 rounded-lg btn-ghost text-sm"
                >
                  统计
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEditModal && editingPlan && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="glass-card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                {editingPlan.id.startsWith("new-") ? "新建套餐" : "编辑套餐"}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-dim hover:text-foreground text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 基础信息 */}
              <div>
                <label className="block text-sm text-dim mb-2">套餐名称 *</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm text-dim mb-2">套餐标识 (slug) *</label>
                <input
                  type="text"
                  value={editingPlan.slug}
                  onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase() })}
                  placeholder="例如: premium"
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-dim mb-2">描述</label>
                <input
                  type="text"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              {/* 定价 */}
              <div>
                <label className="block text-sm text-dim mb-2">月付价格 (¥)</label>
                <input
                  type="number"
                  value={editingPlan.price_monthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm text-dim mb-2">年付价格 (¥)</label>
                <input
                  type="number"
                  value={editingPlan.price_yearly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price_yearly: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              {/* 积分配额 */}
              <div>
                <label className="block text-sm text-dim mb-2">每月积分</label>
                <input
                  type="number"
                  value={editingPlan.credits_monthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, credits_monthly: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              {/* 主题色 */}
              <div>
                <label className="block text-sm text-dim mb-2">主题色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingPlan.color}
                    onChange={(e) => setEditingPlan({ ...editingPlan, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                    style={{ background: "var(--bg-layer)" }}
                  />
                  <input
                    type="text"
                    value={editingPlan.color}
                    onChange={(e) => setEditingPlan({ ...editingPlan, color: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-lg"
                    style={{
                      background: "var(--bg-layer)",
                      border: "1px solid var(--stroke-soft)",
                      color: "var(--color-foreground)",
                    }}
                  />
                </div>
              </div>

              {/* 排序和状态 */}
              <div>
                <label className="block text-sm text-dim mb-2">排序</label>
                <input
                  type="number"
                  value={editingPlan.sort_order}
                  onChange={(e) => setEditingPlan({ ...editingPlan, sort_order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span style={{ color: "var(--color-foreground)" }}>启用此套餐</span>
                </label>
              </div>

              {/* 功能列表 */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-dim">功能列表</label>
                  <button
                    onClick={handleAddFeature}
                    className="text-sm px-3 py-1 rounded btn-ghost"
                  >
                    + 添加功能
                  </button>
                </div>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder="输入功能描述..."
                        className="flex-1 px-4 py-2 rounded-lg"
                        style={{
                          background: "var(--bg-layer)",
                          border: "1px solid var(--stroke-soft)",
                          color: "var(--color-foreground)",
                        }}
                      />
                      <button
                        onClick={() => handleRemoveFeature(index)}
                        className="px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {editingPlan.features.length === 0 && (
                    <div className="text-sm text-dim p-4 text-center rounded-lg" style={{ background: "var(--bg-layer)" }}>
                      暂无功能，点击上方按钮添加
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--stroke-soft)" }}>
              <button
                onClick={handleSavePlan}
                disabled={processing || !editingPlan.name || !editingPlan.slug}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "保存中..." : "保存配置"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
