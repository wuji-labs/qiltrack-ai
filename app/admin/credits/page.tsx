"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { batchGrantCredits, batchRevokeCredits } from "@/lib/admin/data-provider";

interface CreditInfo {
  user_id: string;
  email: string;
  display_name?: string;
  credits_available: number;
  credits_used: number;
  last_updated: string;
}

type OperationType = "add" | "subtract" | "set";

interface ModalState {
  isOpen: boolean;
  user: CreditInfo | null;
  operation: OperationType;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<CreditInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // 操作模态框状态
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    user: null,
    operation: "add",
  });
  const [modalAmount, setModalAmount] = useState<number>(10);
  const [modalReason, setModalReason] = useState<string>("");

  // 批量操作
  const [batchAmount, setBatchAmount] = useState<number>(10);
  const [batchReason, setBatchReason] = useState<string>("admin_batch_operation");

  const fetchCredits = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("report_credits")
        .select(`
          user_id,
          credits_available,
          credits_used,
          updated_at,
          profiles!inner(email, display_name)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = data?.map((item: any) => ({
        user_id: item.user_id,
        email: item.profiles.email,
        display_name: item.profiles.display_name || item.profiles.email,
        credits_available: item.credits_available ?? 0,
        credits_used: item.credits_used ?? 0,
        last_updated: item.updated_at ?? new Date().toISOString(),
      })) || [];

      setCredits(formatted);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // 打开操作模态框
  function openModal(user: CreditInfo, operation: OperationType) {
    setModal({ isOpen: true, user, operation });
    setModalAmount(operation === "set" ? user.credits_available : 10);
    setModalReason(
      operation === "add"
        ? "admin_manual_grant"
        : operation === "subtract"
          ? "admin_manual_deduct"
          : "admin_manual_set"
    );
  }

  // 关闭模态框
  function closeModal() {
    setModal({ isOpen: false, user: null, operation: "add" });
    setModalAmount(10);
    setModalReason("");
  }

  // 执行单用户操作 - 通过 API 路由
  async function handleSingleOperation() {
    if (!modal.user) return;
    setProcessing(true);

    try {
      const targetUserId = modal.user.user_id;
      const currentCredits = modal.user.credits_available;

      let actualAmount = modalAmount;

      if (modal.operation === "subtract") {
        // 扣减积分：确保不会扣成负数
        actualAmount = Math.min(actualAmount, currentCredits);
        if (actualAmount <= 0) {
          alert("该用户没有足够的积分可扣减");
          setProcessing(false);
          return;
        }
        actualAmount = -actualAmount; // 负数表示扣减
      } else if (modal.operation === "set") {
        // 设置积分：计算差值
        actualAmount = modalAmount - currentCredits;
        if (actualAmount === 0) {
          alert("积分已是该值，无需修改");
          setProcessing(false);
          return;
        }
      }

      // 调用 API 路由
      const response = await fetch("/api/admin/users/grant-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          amount: actualAmount,
          reason: modalReason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "操作失败");
      }

      const operationLabel = modal.operation === "add" ? "增加" : modal.operation === "subtract" ? "扣减" : "设置";
      alert(`成功${operationLabel}积分！新余额: ${result.newBalance}`);
      closeModal();
      await fetchCredits();
    } catch (error) {
      console.error("操作失败:", error);
      alert(`操作失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  // 批量加积分
  async function handleBatchAdd() {
    if (selectedUsers.size === 0) {
      alert("请先选择用户");
      return;
    }

    if (!confirm(`确定要给 ${selectedUsers.size} 个用户增加 ${batchAmount} 积分吗？`)) {
      return;
    }

    setProcessing(true);
    try {
      await batchGrantCredits(Array.from(selectedUsers), batchAmount, batchReason);
      alert(`成功给 ${selectedUsers.size} 个用户增加了 ${batchAmount} 积分！`);
      setSelectedUsers(new Set());
      await fetchCredits();
    } catch (error) {
      console.error("批量操作失败:", error);
      alert(`批量操作失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  // 批量减积分
  async function handleBatchSubtract() {
    if (selectedUsers.size === 0) {
      alert("请先选择用户");
      return;
    }

    if (!confirm(`确定要从 ${selectedUsers.size} 个用户扣减 ${batchAmount} 积分吗？`)) {
      return;
    }

    setProcessing(true);
    try {
      await batchRevokeCredits(Array.from(selectedUsers), batchAmount, batchReason);
      alert(`成功从 ${selectedUsers.size} 个用户扣减了 ${batchAmount} 积分！`);
      setSelectedUsers(new Set());
      await fetchCredits();
    } catch (error) {
      console.error("批量操作失败:", error);
      alert(`批量操作失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  function toggleUserSelection(userId: string) {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }

  function toggleAllUsers() {
    if (selectedUsers.size === filteredCredits.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredCredits.map((c) => c.user_id)));
    }
  }

  const filteredCredits = credits.filter((credit) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      credit.email.toLowerCase().includes(searchLower) ||
      credit.display_name?.toLowerCase().includes(searchLower)
    );
  });

  // 统计信息
  const totalCredits = credits.reduce((sum, c) => sum + c.credits_available, 0);
  const totalUsed = credits.reduce((sum, c) => sum + c.credits_used, 0);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 页头 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          积分管理
        </h1>
        <p className="mt-2 text-sm text-dim">搜索用户，管理积分：加分、减分、设置积分</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-sm text-dim">用户总数</div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {credits.length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">总可用积分</div>
          <div className="text-2xl font-bold" style={{ color: "#10b981" }}>
            {totalCredits.toLocaleString()}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">总已使用</div>
          <div className="text-2xl font-bold" style={{ color: "#6b7280" }}>
            {totalUsed.toLocaleString()}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">已选择</div>
          <div className="text-2xl font-bold" style={{ color: "#6366f1" }}>
            {selectedUsers.size}
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 搜索用户 (邮箱或姓名)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-base"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-sm text-dim">
            {filteredCredits.length} / {credits.length} 用户
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedUsers.size > 0 && (
        <div className="glass-card p-4 border-l-4" style={{ borderLeftColor: "#6366f1" }}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                已选择 {selectedUsers.size} 个用户
              </span>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="text-xs text-dim hover:text-foreground underline"
              >
                清除选择
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={batchAmount}
                onChange={(e) => setBatchAmount(Number(e.target.value))}
                min="1"
                max="10000"
                className="w-24 px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                }}
              />
              <span className="text-sm text-dim">积分</span>
            </div>

            <input
              type="text"
              value={batchReason}
              onChange={(e) => setBatchReason(e.target.value)}
              placeholder="操作原因"
              className="flex-1 min-w-[150px] px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={handleBatchAdd}
                disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                ➕ 批量加分
              </button>
              <button
                onClick={handleBatchSubtract}
                disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                ➖ 批量减分
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 积分列表 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-dim">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--bg-layer)" }}>
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredCredits.length && filteredCredits.length > 0}
                      onChange={toggleAllUsers}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    可用积分
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    已使用
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    总授予
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    最后更新
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dim uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-dim">
                      {searchTerm ? "未找到匹配的用户" : "暂无积分记录"}
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((credit) => (
                    <tr
                      key={credit.user_id}
                      className="border-t hover:bg-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--stroke-soft)",
                        backgroundColor: selectedUsers.has(credit.user_id)
                          ? "rgba(99, 102, 241, 0.1)"
                          : "transparent",
                      }}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(credit.user_id)}
                          onChange={() => toggleUserSelection(credit.user_id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                          {credit.display_name || credit.email}
                        </div>
                        <div className="text-xs text-subtle">{credit.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 inline-flex text-sm font-bold rounded-lg"
                          style={{
                            background: "rgba(16, 185, 129, 0.2)",
                            color: "#10b981",
                          }}
                        >
                          {credit.credits_available}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-subtle">{credit.credits_used}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-subtle">
                        {credit.credits_available + credit.credits_used}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-subtle">
                        {new Date(credit.last_updated).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openModal(credit, "add")}
                            className="px-2 py-1 rounded text-xs font-medium hover:brightness-110"
                            style={{
                              background: "rgba(16, 185, 129, 0.2)",
                              color: "#10b981",
                            }}
                            title="加积分"
                          >
                            ➕
                          </button>
                          <button
                            onClick={() => openModal(credit, "subtract")}
                            className="px-2 py-1 rounded text-xs font-medium hover:brightness-110"
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                            }}
                            title="减积分"
                          >
                            ➖
                          </button>
                          <button
                            onClick={() => openModal(credit, "set")}
                            className="px-2 py-1 rounded text-xs font-medium hover:brightness-110"
                            style={{
                              background: "rgba(99, 102, 241, 0.2)",
                              color: "#6366f1",
                            }}
                            title="设置积分"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 操作模态框 */}
      {modal.isOpen && modal.user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--stroke-soft)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              {modal.operation === "add"
                ? "➕ 增加积分"
                : modal.operation === "subtract"
                  ? "➖ 扣减积分"
                  : "✏️ 设置积分"}
            </h3>

            <div className="mb-4 p-3 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">目标用户</div>
              <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                {modal.user.display_name || modal.user.email}
              </div>
              <div className="text-xs text-subtle">{modal.user.email}</div>
              <div className="mt-2 text-sm">
                当前积分: <span className="font-bold" style={{ color: "#10b981" }}>{modal.user.credits_available}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dim mb-2">
                  {modal.operation === "set" ? "设置为" : "积分数量"}
                </label>
                <input
                  type="number"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(Number(e.target.value))}
                  min={modal.operation === "set" ? 0 : 1}
                  max="100000"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
                {modal.operation !== "set" && (
                  <div className="mt-1 text-xs text-dim">
                    操作后: {modal.operation === "add"
                      ? modal.user.credits_available + modalAmount
                      : Math.max(0, modal.user.credits_available - modalAmount)} 积分
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dim mb-2">操作原因</label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="例如: 活动奖励、补偿、测试"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--bg-layer)",
                    border: "1px solid var(--stroke-soft)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={processing}
                className="flex-1 px-4 py-2 rounded-lg font-medium"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                }}
              >
                取消
              </button>
              <button
                onClick={handleSingleOperation}
                disabled={processing || modalAmount <= 0}
                className="flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                style={{
                  background:
                    modal.operation === "add"
                      ? "rgba(16, 185, 129, 0.2)"
                      : modal.operation === "subtract"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(99, 102, 241, 0.2)",
                  color:
                    modal.operation === "add"
                      ? "#10b981"
                      : modal.operation === "subtract"
                        ? "#ef4444"
                        : "#6366f1",
                  border: `1px solid ${
                    modal.operation === "add"
                      ? "rgba(16, 185, 129, 0.3)"
                      : modal.operation === "subtract"
                        ? "rgba(239, 68, 68, 0.3)"
                        : "rgba(99, 102, 241, 0.3)"
                  }`,
                }}
              >
                {processing ? "处理中..." : "确认"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
