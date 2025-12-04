"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditManager } from "@/lib/core/credits/manager";
import { batchGrantCredits, batchRevokeCredits } from "@/lib/admin/data-provider";

interface CreditInfo {
  user_id: string;
  email: string;
  display_name?: string;
  credits_available: number;
  credits_used: number;
  last_updated: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<CreditInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantingCredits, setGrantingCredits] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>("admin_manual_grant");
  const [batchMode, setBatchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCredits();
  }, []);

  async function fetchCredits() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("report_credits")
        .select(
          `
          user_id,
          credits_available,
          credits_used,
          updated_at,
          profiles!inner(email, display_name)
        `
        )
        .order("updated_at", { ascending: false }) as any;

      if (error) throw error;

      const formatted =
        data?.map((item: any) => ({
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
  }

  async function handleGrantCredits(e: React.FormEvent) {
    e.preventDefault();
    setGrantingCredits(true);

    try {
      if (batchMode && selectedUsers.size === 0) {
        alert("Please select at least one user");
        return;
      }

      if (!batchMode && !selectedUser) {
        alert("Please select a user");
        return;
      }

      if (batchMode) {
        // 批量授予积分
        await batchGrantCredits(Array.from(selectedUsers), amount, reason);
        alert(`Successfully granted ${amount} credits to ${selectedUsers.size} users!`);
        setSelectedUsers(new Set());
      } else {
        // 单个授予积分
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          alert("You must be logged in to grant credits");
          return;
        }

        const creditManager = new CreditManager();
        await creditManager.grantCredits(user.id, selectedUser, amount, reason);
        alert(`Successfully granted ${amount} credits!`);
        setSelectedUser("");
      }

      // Reset form
      setAmount(10);
      setReason("admin_manual_grant");

      // Refresh credits list
      await fetchCredits();
    } catch (error) {
      console.error("Failed to grant credits:", error);
      alert(`Failed to grant credits: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setGrantingCredits(false);
    }
  }

  async function handleRevokeCredits() {
    if (selectedUsers.size === 0) {
      alert("Please select at least one user");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to revoke ${amount} credits from ${selectedUsers.size} users?`
      )
    ) {
      return;
    }

    setGrantingCredits(true);

    try {
      await batchRevokeCredits(Array.from(selectedUsers), amount, reason);
      alert(`Successfully revoked ${amount} credits from ${selectedUsers.size} users!`);
      setSelectedUsers(new Set());
      setAmount(10);
      setReason("admin_manual_revoke");
      await fetchCredits();
    } catch (error) {
      console.error("Failed to revoke credits:", error);
      alert(
        `Failed to revoke credits: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setGrantingCredits(false);
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

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 页头 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          积分管理
        </h1>
        <p className="mt-2 text-sm text-dim">查看和管理用户积分,支持批量授予和撤销</p>
      </div>

      {/* 操作模式切换 */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setBatchMode(false);
              setSelectedUsers(new Set());
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              !batchMode
                ? "btn-gradient"
                : "btn-ghost"
            }`}
          >
            单个操作
          </button>
          <button
            onClick={() => {
              setBatchMode(true);
              setSelectedUser("");
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              batchMode ? "btn-gradient" : "btn-ghost"
            }`}
          >
            批量操作
          </button>
          {batchMode && selectedUsers.size > 0 && (
            <span className="text-sm text-dim">已选择 {selectedUsers.size} 个用户</span>
          )}
        </div>
      </div>

      {/* 操作表单 */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-medium mb-4" style={{ color: "var(--color-foreground)" }}>
          {batchMode ? "批量操作积分" : "授予积分"}
        </h2>
        <form onSubmit={handleGrantCredits} className="space-y-4">
          {!batchMode && (
            <div>
              <label className="block text-sm font-medium text-dim mb-2">选择用户</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                  colorScheme: "dark",
                }}
              >
                <option value="">请选择用户...</option>
                {credits.map((credit) => (
                  <option key={credit.user_id} value={credit.user_id}>
                    {credit.display_name || credit.email} (当前: {credit.credits_available} 积分)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dim mb-2">积分数量</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              max="1000"
              required
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dim mb-2">原因说明</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如: 奖励、补偿、测试"
              required
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={
                grantingCredits ||
                (!batchMode && !selectedUser) ||
                (batchMode && selectedUsers.size === 0)
              }
              className="flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              {grantingCredits
                ? "处理中..."
                : batchMode
                  ? `授予 ${selectedUsers.size} 个用户`
                  : "授予积分"}
            </button>

            {batchMode && selectedUsers.size > 0 && (
              <button
                type="button"
                onClick={handleRevokeCredits}
                disabled={grantingCredits}
                className="flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                {grantingCredits ? "处理中..." : `撤销 ${selectedUsers.size} 个用户`}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 搜索栏 */}
      {batchMode && (
        <div className="glass-card p-4 mb-4">
          <input
            type="text"
            placeholder="搜索用户 (邮箱或姓名)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
            }}
          />
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
                  {batchMode && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedUsers.size === filteredCredits.length && filteredCredits.length > 0
                        }
                        onChange={toggleAllUsers}
                        className="w-4 h-4"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    可用积分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    已使用
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    总授予
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                    最后更新
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={batchMode ? 6 : 5} className="px-6 py-4 text-center text-dim">
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
                        backgroundColor: selectedUsers.has(credit.user_id) ? "rgba(99, 102, 241, 0.1)" : "transparent"
                      }}
                    >
                      {batchMode && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(credit.user_id)}
                            onChange={() => toggleUserSelection(credit.user_id)}
                            className="w-4 h-4"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                          {credit.display_name || credit.email}
                        </div>
                        <div className="text-sm text-subtle">{credit.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            background: "rgba(16, 185, 129, 0.2)",
                            color: "#10b981",
                          }}
                        >
                          {credit.credits_available}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            background: "rgba(107, 114, 128, 0.2)",
                            color: "#6b7280",
                          }}
                        >
                          {credit.credits_used}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                        {credit.credits_available + credit.credits_used}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                        {new Date(credit.last_updated).toLocaleString("zh-CN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
