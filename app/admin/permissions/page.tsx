"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  DataTable,
  FilterBar,
  RoleBadge,
  Modal,
  SelectField,
  ConfirmDialog,
  formatDate,
  type Column,
} from "@/app/components/admin/ui";

interface UserWithRole extends Record<string, unknown> {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  plan: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const ROLE_CONFIGS = {
  super_admin: {
    name: "超级管理员",
    color: "#dc2626",
    description: "拥有系统全部权限，可管理其他管理员",
    danger: true,
    level: 5,
  },
  admin: {
    name: "管理员",
    color: "#ea580c",
    description: "可管理用户、内容和系统配置",
    danger: true,
    level: 4,
  },
  developer: {
    name: "开发者",
    color: "#8b5cf6",
    description: "可访问API和开发者工具",
    danger: false,
    level: 3,
  },
  user: {
    name: "普通用户",
    color: "#3b82f6",
    description: "标准用户权限",
    danger: false,
    level: 2,
  },
  guest: {
    name: "访客",
    color: "#6b7280",
    description: "仅可浏览公开内容",
    danger: false,
    level: 1,
  },
};

const ROLE_OPTIONS = [
  { value: "guest", label: "访客 - 仅可浏览公开内容" },
  { value: "user", label: "普通用户 - 标准用户权限" },
  { value: "developer", label: "开发者 - 可访问API和开发者工具" },
  { value: "admin", label: "管理员 - 可管理用户、内容和配置" },
  { value: "super_admin", label: "超级管理员 - 拥有系统全部权限" },
];

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // 当前用户角色
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const isSuperAdmin = currentUserRole === "super_admin";

  // 角色修改
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState("");
  const [processing, setProcessing] = useState(false);
  const [roleChangeReason, setRoleChangeReason] = useState("");

  // 二次确认（针对敏感角色）
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: UserWithRole; role: string } | null>(null);

  // 统计数据
  const [roleStats, setRoleStats] = useState<Record<string, number>>({});

  // 获取当前用户角色
  useEffect(() => {
    async function fetchCurrentUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const role = (profile as unknown as { role?: string } | null)?.role;
        setCurrentUserRole(role || "user");
      }
    }
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, roleFilter, searchTerm]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);

    try {
      // 获取用户列表
      let query = supabase
        .from("profiles")
        .select("id, email, display_name, role, plan, created_at, updated_at", { count: "exact" })
        .order("role", { ascending: false })
        .order("created_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }

      const { data, count, error } = await query.range(
        (page - 1) * pageSize,
        page * pageSize - 1
      );

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);

      // 获取角色统计
      const { data: allProfiles } = await supabase.from("profiles").select("role");
      const stats: Record<string, number> = { super_admin: 0, admin: 0, developer: 0, user: 0, guest: 0 };
      allProfiles?.forEach((p: { role?: string }) => {
        const role = p.role || "user";
        stats[role] = (stats[role] || 0) + 1;
      });
      setRoleStats(stats);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleRoleChangeRequest() {
    if (!selectedUser || !newRole) return;

    const targetRoleConfig = ROLE_CONFIGS[newRole as keyof typeof ROLE_CONFIGS];

    // 如果是危险角色，需要二次确认
    if (targetRoleConfig?.danger) {
      setPendingRoleChange({ user: selectedUser, role: newRole });
      setShowDangerConfirm(true);
      setShowRoleModal(false);
    } else {
      executeRoleChange(selectedUser, newRole);
    }
  }

  async function executeRoleChange(user: UserWithRole, role: string) {
    setProcessing(true);

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role,
          roleChangeReason,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "修改失败");
      }

      await fetchData();
      setShowRoleModal(false);
      setShowDangerConfirm(false);
      setSelectedUser(null);
      setNewRole("");
      setRoleChangeReason("");
      setPendingRoleChange(null);

      const roleConfig = ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS];
      alert(`${user.email} 的角色已更改为「${roleConfig?.name || role}」`);
    } catch (error) {
      console.error("Change role failed:", error);
      alert(`修改失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  }

  const columns: Column<UserWithRole>[] = [
    {
      key: "email",
      title: "用户",
      render: (_, record) => (
        <div>
          <div style={{ color: "var(--color-foreground)" }}>
            {record.display_name || record.email.split("@")[0]}
          </div>
          <div className="text-xs text-dim">{record.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      title: "当前角色",
      render: (_, record) => <RoleBadge role={record.role || "user"} />,
    },
    {
      key: "description",
      title: "权限说明",
      render: (_, record) => {
        const config = ROLE_CONFIGS[record.role as keyof typeof ROLE_CONFIGS] || ROLE_CONFIGS.user;
        return (
          <span className="text-sm text-dim">{config.description}</span>
        );
      },
    },
    {
      key: "updated_at",
      title: "最后更新",
      render: (_, record) => formatDate(record.updated_at || record.created_at, "yyyy-MM-dd HH:mm"),
    },
    {
      key: "id",
      title: "操作",
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(record);
              setNewRole(record.role || "user");
              setShowRoleModal(true);
            }}
            className="text-sm font-medium"
            style={{ color: "var(--accent-emerald)" }}
          >
            修改角色
          </button>
          <Link
            href={`/admin/users/${record.id}`}
            className="text-sm"
            style={{ color: "#3b82f6" }}
            onClick={(e) => e.stopPropagation()}
          >
            详情
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            权限管理
          </h1>
          <p className="mt-1 text-sm text-dim">管理用户角色和系统权限（敏感操作需二次确认）</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg btn-ghost text-sm">
          刷新
        </button>
      </div>

      {/* 安全提示 */}
      <div className="p-4 rounded-lg" style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-semibold" style={{ color: "#fbbf24" }}>权限变更须谨慎</div>
            <div className="text-sm text-dim mt-1">
              {isSuperAdmin ? (
                "您是超级管理员，可以授予任何角色权限。"
              ) : (
                "您是普通管理员，只能修改为 访客/用户/开发者 角色。只有超级管理员才能授予管理员权限。"
              )}
              所有权限变更都会被记录到审计日志中。
            </div>
          </div>
        </div>
      </div>

      {/* 角色统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(ROLE_CONFIGS).map(([key, config]) => (
          <div
            key={key}
            className="p-4 rounded-lg cursor-pointer transition-all hover:scale-105"
            style={{
              background: "var(--bg-layer)",
              border: roleFilter === key ? `2px solid ${config.color}` : "2px solid transparent"
            }}
            onClick={() => setRoleFilter(roleFilter === key ? "all" : key)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: config.color }}>{config.name}</span>
              {config.danger && <span className="text-xs">🔒</span>}
            </div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>
              {roleStats[key] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* 过滤器 */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="搜索用户邮箱或名称..."
        filters={[
          {
            key: "role",
            label: "角色",
            value: roleFilter,
            onChange: (value) => {
              setRoleFilter(value);
              setPage(1);
            },
            options: [
              { value: "all", label: "全部角色" },
              { value: "super_admin", label: "超级管理员" },
              { value: "admin", label: "管理员" },
              { value: "developer", label: "开发者" },
              { value: "user", label: "普通用户" },
              { value: "guest", label: "访客" },
            ],
          },
        ]}
      />

      {/* 用户列表 */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyText="暂无用户数据"
        pagination={{
          page,
          pageSize,
          total: totalCount,
          onChange: setPage,
        }}
      />

      {/* 修改角色弹窗 */}
      <Modal
        title="修改用户角色"
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
          setRoleChangeReason("");
        }}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">用户</div>
              <div style={{ color: "var(--color-foreground)" }}>{selectedUser.email}</div>
            </div>

            <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
              <div className="text-sm text-dim">当前角色</div>
              <div className="mt-1">
                <RoleBadge role={selectedUser.role || "user"} />
              </div>
            </div>

            <SelectField
              label="新角色"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={ROLE_OPTIONS.filter(opt => {
                // 非超级管理员不能设置 admin 或 super_admin
                if (!isSuperAdmin && (opt.value === "admin" || opt.value === "super_admin")) {
                  return false;
                }
                return true;
              })}
            />

            {!isSuperAdmin && (newRole === "admin" || newRole === "super_admin") && (
              <div className="p-4 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <div className="text-sm" style={{ color: "#ef4444" }}>
                  只有超级管理员才能授予管理员或超级管理员权限
                </div>
              </div>
            )}

            {newRole && ROLE_CONFIGS[newRole as keyof typeof ROLE_CONFIGS]?.danger && (
              <div className="p-4 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-semibold" style={{ color: "#ef4444" }}>高危操作警告</div>
                    <div className="text-sm text-dim mt-1">
                      授予此角色将使用户能够访问管理后台和敏感数据。请确认用户身份后再操作。
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-dim mb-2">变更原因（可选）</label>
              <textarea
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                placeholder="记录此次权限变更的原因..."
                className="w-full px-4 py-2 rounded-lg resize-none"
                style={{
                  background: "var(--bg-layer)",
                  border: "1px solid var(--stroke-soft)",
                  color: "var(--color-foreground)",
                  minHeight: "80px",
                }}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleRoleChangeRequest}
                disabled={processing || newRole === selectedUser.role}
                className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
              >
                {processing ? "处理中..." : "确认修改"}
              </button>
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 危险角色二次确认 */}
      <ConfirmDialog
        title="确认授予管理权限？"
        message={
          pendingRoleChange
            ? `您即将授予 ${pendingRoleChange.user.email} 「${ROLE_CONFIGS[pendingRoleChange.role as keyof typeof ROLE_CONFIGS]?.name}」权限。\n\n该用户将能够访问管理后台、查看敏感数据、修改系统配置等。此操作将被记录到审计日志中。\n\n请再次确认此操作。`
            : ""
        }
        isOpen={showDangerConfirm}
        onConfirm={() => {
          if (pendingRoleChange) {
            executeRoleChange(pendingRoleChange.user, pendingRoleChange.role);
          }
        }}
        onCancel={() => {
          setShowDangerConfirm(false);
          setPendingRoleChange(null);
        }}
        type="danger"
        confirmText="确认授予权限"
        loading={processing}
      />
    </div>
  );
}
