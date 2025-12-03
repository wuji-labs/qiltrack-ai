"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { batchGrantCredits, batchRevokeCredits } from "@/lib/admin/data-provider";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  plan: string | null;
  created_at: string | null;
  avatar_url: string | null;
}

interface UserCredits {
  credits_available: number | null;
  credits_used: number | null;
}

const PLAN_CONFIGS = {
  free: { name: "免费版", quota: 30, color: "#6b7280", price: 0 },
  basic: { name: "基础版", quota: 50, color: "#3b82f6", price: 99 },
  pro: { name: "专业版", quota: 200, color: "#8b5cf6", price: 299 },
  enterprise: { name: "企业版", quota: 999, color: "#f59e0b", price: 999 },
};

export default function UsersPage() {
  const { supabase } = useSupabaseAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // 创建用户
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    email: "",
    password: "",
    display_name: "",
    full_name: "",
    role: "user",
    plan: "free",
    initial_credits: 30,
  });

  // 编辑用户
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordEmail, setPasswordEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 用户详情
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);

  // 批量操作
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<"grant" | "revoke" | "role" | "plan">("grant");
  const [batchRole, setBatchRole] = useState<string>("user");
  const [batchPlan, setBatchPlan] = useState<string>("free");
  const [processing, setProcessing] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, planFilter]);

  async function fetchUsers() {
    setLoading(true);

    try {
      let query = supabase
        .from("profiles")
        .select("id, email, display_name, role, plan, created_at, avatar_url", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter as "admin" | "editor" | "user");
      }

      if (planFilter !== "all") {
        query = query.eq("plan", planFilter as "free" | "basic" | "pro" | "enterprise");
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  }

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "创建用户失败");
      }

      alert(`成功创建用户: ${createData.email}`);
      setShowCreateModal(false);
      setCreateData({
        email: "",
        password: "",
        display_name: "",
        full_name: "",
        role: "user",
        plan: "free",
        initial_credits: 30,
      });
      fetchUsers();
    } catch (error: unknown) {
      console.error("Create user failed:", error);
      alert(`创建用户失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleEditUser() {
    if (!editingUser) return;

    setProcessing(true);

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingUser.id,
          display_name: editingUser.display_name,
          full_name: editingUser.display_name,
          role: editingUser.role,
          plan: editingUser.plan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "更新用户失败");
      }

      alert("用户信息更新成功");
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Update user failed:", error);
      alert(`更新失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleResetPassword(newPassword: string) {
    if (!passwordEmail) return;
    if (newPassword.length < 6) {
      alert("密码至少6位");
      return;
    }

    setProcessing(true);

    try {
      // 通过邮箱查找用户ID
      const { data: user } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", passwordEmail)
        .single();

      if (!user) {
        alert("用户不存在");
        return;
      }

      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: (user as any).id,
          password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "重置密码失败");
      }

      alert("密码重置成功");
      setShowPasswordModal(false);
      setPasswordEmail("");
      setNewPassword("");
    } catch (error: unknown) {
      console.error("Reset password failed:", error);
      alert(`重置密码失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  async function loadUserDetail(user: User) {
    try {
      // 获取用户积分信息
      const { data: credits } = await supabase
        .from("report_credits")
        .select("credits_available, credits_used")
        .eq("user_id", user.id)
        .single();

      setDetailUser(user);
      setUserCredits(credits);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to load user detail:", error);
    }
  }

  async function handleBatchOperation(action: string, value: unknown) {
    if (selectedUsers.size === 0) {
      alert("请先选择用户");
      return;
    }

    setProcessing(true);
    const userIds = Array.from(selectedUsers);

    try {
      switch (action) {
        case "role":
          await (supabase as any)
            .from("profiles")
            .update({ role: value as "admin" | "editor" | "user", updated_at: new Date().toISOString() })
            .in("id", userIds);
          alert(`成功修改 ${userIds.length} 个用户的角色`);
          break;

        case "plan":
          await (supabase as any)
            .from("profiles")
            .update({
              plan: value as "free" | "basic" | "pro" | "enterprise",
              updated_at: new Date().toISOString(),
            })
            .in("id", userIds);
          alert(`成功修改 ${userIds.length} 个用户的套餐`);
          break;

        case "delete":
          if (!confirm(`确定要删除 ${userIds.length} 个用户吗?此操作不可恢复!`)) {
            setProcessing(false);
            return;
          }

          // 批量删除用户
          let deleteCount = 0;
          for (const userId of userIds) {
            try {
              const response = await fetch("/api/admin/users/delete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
              });

              if (response.ok) {
                deleteCount++;
              }
            } catch (error) {
              console.error(`Delete user ${userId} failed:`, error);
            }
          }
          alert(`成功删除 ${deleteCount} 个用户`);
          break;
      }

      setSelectedUsers(new Set());
      setShowBatchModal(false);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Batch operation failed:", error);
      alert(`批量操作失败: ${error instanceof Error ? error.message : "未知错误"}`);
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
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  }

  function getPlanInfo(plan: string | null) {
    const planKey = (plan || "free") as keyof typeof PLAN_CONFIGS;
    return PLAN_CONFIGS[planKey] || PLAN_CONFIGS.free;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            用户管理
          </h1>
          <p className="mt-2 text-sm text-dim">
            完整的用户管理系统 - 创建、编辑、删除、修改密码、会员管理
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 rounded-lg btn-gradient font-semibold"
          >
            + 创建用户
          </button>
          <div className="text-sm text-dim flex items-center">
            共 {totalCount} 个用户
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索邮箱、姓名..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {/* 角色过滤 */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
            }}
          >
            <option value="all">全部角色</option>
            <option value="admin">管理员</option>
            <option value="editor">编辑</option>
            <option value="user">普通用户</option>
          </select>

          {/* 套餐过滤 */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
            }}
          >
            <option value="all">全部套餐</option>
            <option value="free">免费版</option>
            <option value="basic">基础版</option>
            <option value="pro">专业版</option>
            <option value="enterprise">企业版</option>
          </select>

          {/* 批量操作按钮 */}
          {selectedUsers.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBatchAction("role");
                  setShowBatchModal(true);
                }}
                className="px-4 py-2 rounded-lg btn-gradient text-sm"
              >
                修改角色 ({selectedUsers.size})
              </button>
              <button
                onClick={() => {
                  setBatchAction("plan");
                  setShowBatchModal(true);
                }}
                className="px-4 py-2 rounded-lg btn-ghost text-sm"
              >
                修改套餐
              </button>
              <button
                onClick={() => handleBatchOperation("delete", null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                删除用户
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 用户列表 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-dim">加载中...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-dim">暂无用户数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--bg-layer)" }}>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">邮箱</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">姓名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">角色</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">会员套餐</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">报告配额</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const planInfo = getPlanInfo(user.plan);
                  return (
                    <tr
                      key={user.id}
                      className="border-t hover:bg-opacity-50 transition-colors"
                      style={{ borderColor: "var(--stroke-soft)" }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-foreground)" }}>
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-dim">
                        {user.display_name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background:
                              user.role === "admin"
                                ? "rgba(239, 68, 68, 0.2)"
                                : user.role === "editor"
                                ? "rgba(59, 130, 246, 0.2)"
                                : "rgba(107, 114, 128, 0.2)",
                            color:
                              user.role === "admin"
                                ? "#ef4444"
                                : user.role === "editor"
                                ? "#3b82f6"
                                : "#6b7280",
                          }}
                        >
                          {user.role === "admin" ? "管理员" : user.role === "editor" ? "编辑" : "用户"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: `${planInfo.color}20`,
                            color: planInfo.color,
                          }}
                        >
                          {planInfo.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dim">
                        {planInfo.quota} 积分/月
                      </td>
                      <td className="px-4 py-3 text-sm text-subtle">
                        {user.created_at
                          ? format(new Date(user.created_at), "yyyy-MM-dd", { locale: zhCN })
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="text-sm hover:underline"
                            style={{ color: "var(--accent-emerald)" }}
                            onClick={() => loadUserDetail(user)}
                          >
                            详情
                          </button>
                          <button
                            className="text-sm hover:underline"
                            style={{ color: "#3b82f6" }}
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditModal(true);
                            }}
                          >
                            编辑
                          </button>
                          <button
                            className="text-sm hover:underline"
                            style={{ color: "#8b5cf6" }}
                            onClick={() => {
                              setPasswordEmail(user.email);
                              setShowPasswordModal(true);
                            }}
                          >
                            改密码
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
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
          >
            上一页
          </button>
          <div className="px-4 py-2 text-dim">
            第 {page} / {totalPages} 页
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* 创建用户弹窗 */}
      {showCreateModal && (
        <Modal
          title="创建新用户"
          onClose={() => setShowCreateModal(false)}
        >
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
            <InputField
              label="全名"
              value={createData.full_name}
              onChange={(e) => setCreateData({ ...createData, full_name: e.target.value })}
              placeholder="真实姓名"
            />
            <SelectField
              label="角色"
              value={createData.role}
              onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
              options={[
                { value: "user", label: "普通用户" },
                { value: "editor", label: "编辑" },
                { value: "admin", label: "管理员" },
              ]}
            />
            <SelectField
              label="会员套餐"
              value={createData.plan}
              onChange={(e) => {
                const planKey = e.target.value as keyof typeof PLAN_CONFIGS;
                setCreateData({
                  ...createData,
                  plan: e.target.value,
                  initial_credits: PLAN_CONFIGS[planKey].quota,
                });
              }}
              options={[
                { value: "free", label: `免费版 (${PLAN_CONFIGS.free.quota}篇)` },
                { value: "basic", label: `基础版 (${PLAN_CONFIGS.basic.quota}篇)` },
                { value: "pro", label: `专业版 (${PLAN_CONFIGS.pro.quota}篇)` },
                { value: "enterprise", label: `企业版 (${PLAN_CONFIGS.enterprise.quota}篇)` },
              ]}
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
                disabled={processing}
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
        <Modal
          title="编辑用户信息"
          onClose={() => setShowEditModal(false)}
        >
          <div className="space-y-4">
            <div className="text-sm text-dim mb-4">
              邮箱: {editingUser.email}
            </div>
            <InputField
              label="显示名称"
              value={editingUser.display_name || ""}
              onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })}
            />
            <InputField
              label="全名"
              value={editingUser.display_name || ""}
              onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })}
            />
            <SelectField
              label="角色"
              value={editingUser.role || "user"}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              options={[
                { value: "user", label: "普通用户" },
                { value: "editor", label: "编辑" },
                { value: "admin", label: "管理员" },
              ]}
            />
            <SelectField
              label="会员套餐"
              value={editingUser.plan || "free"}
              onChange={(e) => {
                const planKey = e.target.value as keyof typeof PLAN_CONFIGS;
                setEditingUser({
                  ...editingUser,
                  plan: e.target.value,
                });
              }}
              options={[
                { value: "free", label: `免费版 (${PLAN_CONFIGS.free.quota}篇)` },
                { value: "basic", label: `基础版 (${PLAN_CONFIGS.basic.quota}篇)` },
                { value: "pro", label: `专业版 (${PLAN_CONFIGS.pro.quota}篇)` },
                { value: "enterprise", label: `企业版 (${PLAN_CONFIGS.enterprise.quota}篇)` },
              ]}
            />
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
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <Modal
          title="重置用户密码"
          onClose={() => setShowPasswordModal(false)}
        >
          <div className="space-y-4">
            <div className="text-sm text-dim mb-4">
              用户邮箱: {passwordEmail}
            </div>
            <InputField
              label="新密码 (至少6位)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码"
            />
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleResetPassword(newPassword)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "重置中..." : "确认重置"}
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 用户详情弹窗 */}
      {showDetailModal && detailUser && (
        <Modal
          title="用户详细信息"
          onClose={() => setShowDetailModal(false)}
        >
          <div className="space-y-3">
            <DetailRow label="用户ID" value={detailUser.id} />
            <DetailRow label="显示名称" value={detailUser.display_name || "-"} />
            <DetailRow
              label="角色"
              value={
                detailUser.role === "admin" ? "管理员" :
                detailUser.role === "editor" ? "编辑" : "普通用户"
              }
            />
            <DetailRow
              label="会员套餐"
              value={getPlanInfo(detailUser.plan).name}
            />
            {userCredits && (
              <>
                <DetailRow label="可用积分" value={(userCredits.credits_available ?? 0).toString()} />
                <DetailRow label="已用积分" value={(userCredits.credits_used ?? 0).toString()} />
              </>
            )}
            <DetailRow
              label="注册时间"
              value={detailUser.created_at ? format(new Date(detailUser.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN }) : "-"}
            />
          </div>
        </Modal>
      )}

      {/* 批量操作弹窗 */}
      {showBatchModal && (
        <Modal
          title={batchAction === "role" ? "批量修改角色" : "批量修改套餐"}
          onClose={() => setShowBatchModal(false)}
        >
          <div className="space-y-4">
            <div className="text-sm text-dim">
              已选择 {selectedUsers.size} 个用户
            </div>
            {batchAction === "role" ? (
              <SelectField
                label="新角色"
                value={batchRole}
                onChange={(e) => setBatchRole(e.target.value)}
                options={[
                  { value: "user", label: "普通用户" },
                  { value: "editor", label: "编辑" },
                  { value: "admin", label: "管理员" },
                ]}
              />
            ) : (
              <SelectField
                label="新套餐"
                value={batchPlan}
                onChange={(e) => setBatchPlan(e.target.value)}
                options={[
                  { value: "free", label: `免费版 (${PLAN_CONFIGS.free.quota}篇)` },
                  { value: "basic", label: `基础版 (${PLAN_CONFIGS.basic.quota}篇)` },
                  { value: "pro", label: `专业版 (${PLAN_CONFIGS.pro.quota}篇)` },
                  { value: "enterprise", label: `企业版 (${PLAN_CONFIGS.enterprise.quota}篇)` },
                ]}
              />
            )}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleBatchOperation(batchAction, batchAction === "role" ? batchRole : batchPlan)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "处理中..." : "确认修改"}
              </button>
              <button
                onClick={() => setShowBatchModal(false)}
                disabled={processing}
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
          <h3 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-dim hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
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
        className="w-full px-4 py-2 rounded-lg"
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
        className="w-full px-4 py-2 rounded-lg"
        style={{
          background: "var(--bg-layer)",
          border: "1px solid var(--stroke-soft)",
          color: "var(--color-foreground)",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--stroke-soft)" }}>
      <span className="text-sm text-dim">{label}:</span>
      <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
        {value}
      </span>
    </div>
  );
}
