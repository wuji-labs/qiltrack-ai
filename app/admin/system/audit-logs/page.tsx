"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Json;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  profiles?: {
    email: string;
    display_name: string | null;
  } | null;
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  userActions: number;
  reportActions: number;
  securityEvents: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
}

// 操作类型分类（参考 Clerk 审计日志设计）
const ACTION_CATEGORIES = {
  user: {
    name: "用户操作",
    icon: "👤",
    color: "#3b82f6",
    actions: ["CREATE_USER", "UPDATE_USER", "DELETE_USER", "REGISTER"],
  },
  auth: {
    name: "认证操作",
    icon: "🔐",
    color: "#10b981",
    actions: ["LOGIN", "LOGOUT", "RESET_PASSWORD", "PASSWORD_CHANGE"],
  },
  permission: {
    name: "权限操作",
    icon: "🛡️",
    color: "#dc2626",
    actions: ["ROLE_CHANGE", "PERMISSION_GRANT", "PERMISSION_REVOKE"],
  },
  billing: {
    name: "财务操作",
    icon: "💰",
    color: "#f59e0b",
    actions: ["CHANGE_PLAN", "GRANT_CREDITS", "REVOKE_CREDITS", "REFUND"],
  },
  content: {
    name: "内容操作",
    icon: "📄",
    color: "#8b5cf6",
    actions: ["GENERATE_REPORT", "PUBLISH_REPORT", "DELETE_REPORT"],
  },
  system: {
    name: "系统配置",
    icon: "⚙️",
    color: "#6b7280",
    actions: ["UPDATE_CONFIG", "CACHE_CLEAR", "SYSTEM_RESTART"],
  },
};

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string; danger?: boolean }> = {
  // 用户操作
  LOGIN: { label: "登录", color: "#10b981", icon: "🔓" },
  LOGOUT: { label: "登出", color: "#6b7280", icon: "🔒" },
  REGISTER: { label: "注册", color: "#3b82f6", icon: "📝" },
  CREATE_USER: { label: "创建用户", color: "#10b981", icon: "➕" },
  UPDATE_USER: { label: "更新用户", color: "#f59e0b", icon: "✏️" },
  DELETE_USER: { label: "删除用户", color: "#ef4444", icon: "🗑️", danger: true },

  // 权限操作
  ROLE_CHANGE: { label: "角色变更", color: "#dc2626", icon: "👑", danger: true },
  PERMISSION_GRANT: { label: "授予权限", color: "#f59e0b", icon: "🔑" },
  PERMISSION_REVOKE: { label: "撤销权限", color: "#ef4444", icon: "🚫", danger: true },

  // 财务操作
  CHANGE_PLAN: { label: "修改套餐", color: "#8b5cf6", icon: "📦" },
  GRANT_CREDITS: { label: "授予积分", color: "#10b981", icon: "💎" },
  REVOKE_CREDITS: { label: "撤销积分", color: "#ef4444", icon: "💸", danger: true },
  REFUND: { label: "退款", color: "#ef4444", icon: "↩️", danger: true },

  // 内容操作
  GENERATE_REPORT: { label: "生成报告", color: "#3b82f6", icon: "📊" },
  PUBLISH_REPORT: { label: "发布报告", color: "#10b981", icon: "📤" },
  DELETE_REPORT: { label: "删除报告", color: "#ef4444", icon: "🗑️", danger: true },

  // 系统操作
  RESET_PASSWORD: { label: "重置密码", color: "#f59e0b", icon: "🔄" },
  PASSWORD_CHANGE: { label: "修改密码", color: "#f59e0b", icon: "🔏" },
  UPDATE_CONFIG: { label: "更新配置", color: "#f59e0b", icon: "⚙️" },
  CACHE_CLEAR: { label: "清除缓存", color: "#6b7280", icon: "🧹" },
  SYSTEM_RESTART: { label: "系统重启", color: "#dc2626", icon: "🔄", danger: true },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [dangerOnly, setDangerOnly] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 30;

  // 统计数据
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    todayLogs: 0,
    weekLogs: 0,
    userActions: 0,
    reportActions: 0,
    securityEvents: 0,
    byAction: {},
    byResource: {},
  });

  // 详情弹窗
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    setStatsLoading(true);

    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfDay(subDays(now, 7)).toISOString();

      const [
        { count: totalLogs },
        { count: todayLogs },
        { count: weekLogs },
        { data: allLogs },
      ] = await Promise.all([
        supabase.from("audit_logs").select("*", { count: "exact", head: true }),
        supabase.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("audit_logs").select("action, resource_type").limit(10000),
      ]);

      // 统计各类操作
      const byAction: Record<string, number> = {};
      const byResource: Record<string, number> = {};
      let userActions = 0;
      let reportActions = 0;
      let securityEvents = 0;

      allLogs?.forEach((log: { action: string; resource_type: string | null }) => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        if (log.resource_type) {
          byResource[log.resource_type] = (byResource[log.resource_type] || 0) + 1;
        }

        if (ACTION_CATEGORIES.user.actions.includes(log.action)) {
          userActions++;
        }
        if (ACTION_CATEGORIES.content.actions.includes(log.action)) {
          reportActions++;
        }
        if (ACTION_CATEGORIES.permission.actions.includes(log.action) ||
            ACTION_LABELS[log.action]?.danger) {
          securityEvents++;
        }
      });

      setStats({
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        weekLogs: weekLogs || 0,
        userActions,
        reportActions,
        securityEvents,
        byAction,
        byResource,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 获取日志列表
  const fetchLogs = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      let query = supabase
        .from("audit_logs")
        .select(
          `
          *,
          profiles:user_id(email, display_name)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // 操作类型筛选
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      // 类别筛选
      if (categoryFilter !== "all") {
        const category = ACTION_CATEGORIES[categoryFilter as keyof typeof ACTION_CATEGORIES];
        if (category) {
          query = query.in("action", category.actions);
        }
      }

      // 资源类型筛选
      if (resourceFilter !== "all") {
        query = query.eq("resource_type", resourceFilter);
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

      // 客户端筛选
      let filteredData: AuditLog[] = (data || []) as AuditLog[];

      // 搜索过滤
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(
          (log) =>
            log.profiles?.email?.toLowerCase().includes(term) ||
            log.action.toLowerCase().includes(term) ||
            log.resource_id?.toLowerCase().includes(term)
        );
      }

      // 仅显示危险操作
      if (dangerOnly) {
        filteredData = filteredData.filter(
          (log) => ACTION_LABELS[log.action]?.danger
        );
      }

      setLogs(filteredData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, categoryFilter, resourceFilter, searchTerm, dateRange, dangerOnly]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleExport() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (error) throw error;

      // 创建CSV
      const headers = ["时间", "用户ID", "动作", "资源类型", "资源ID", "IP地址", "详情"];
      const rows = (data as AuditLog[])?.map((log) => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.user_id || "",
        ACTION_LABELS[log.action]?.label || log.action,
        log.resource_type || "",
        log.resource_id || "",
        log.ip_address || "",
        JSON.stringify(log.details || {}),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      alert("导出成功");
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出失败");
    }
  }

  function resetFilters() {
    setSearchTerm("");
    setActionFilter("all");
    setCategoryFilter("all");
    setResourceFilter("all");
    setDangerOnly(false);
    setDateRange({ start: "", end: "" });
    setPage(1);
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const activeFiltersCount = [
    searchTerm,
    actionFilter !== "all",
    categoryFilter !== "all",
    resourceFilter !== "all",
    dangerOnly,
    dateRange.start,
    dateRange.end,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            审计日志
          </h1>
          <p className="mt-1 text-sm text-dim">
            追踪所有管理员操作与系统事件（参考 Clerk 审计日志设计）
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            导出CSV
          </button>
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="总日志数"
          value={stats.totalLogs}
          loading={statsLoading}
          icon="📋"
        />
        <StatCard
          title="今日日志"
          value={stats.todayLogs}
          loading={statsLoading}
          icon="📅"
          highlight
        />
        <StatCard
          title="本周日志"
          value={stats.weekLogs}
          loading={statsLoading}
          icon="📆"
        />
        <StatCard
          title="用户操作"
          value={stats.userActions}
          loading={statsLoading}
          icon="👤"
        />
        <StatCard
          title="内容操作"
          value={stats.reportActions}
          loading={statsLoading}
          icon="📄"
        />
        <StatCard
          title="安全事件"
          value={stats.securityEvents}
          loading={statsLoading}
          icon="🛡️"
          warning={stats.securityEvents > 50}
        />
      </div>

      {/* 操作类型分布 */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-dim">操作类型分布</h3>
          {dangerOnly && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
              仅显示危险操作
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACTION_CATEGORIES).map(([key, category]) => {
            const count = category.actions.reduce((sum, action) => sum + (stats.byAction[action] || 0), 0);
            const isActive = categoryFilter === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setCategoryFilter(isActive ? "all" : key);
                  setPage(1);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: isActive ? `${category.color}20` : "var(--bg-layer)",
                  border: isActive ? `2px solid ${category.color}` : "2px solid transparent",
                }}
              >
                <span>{category.icon}</span>
                <span className="text-sm" style={{ color: isActive ? category.color : "var(--color-foreground)" }}>
                  {category.name}
                </span>
                <span className="text-sm font-bold" style={{ color: category.color }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 筛选器 */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="🔍 搜索用户邮箱、操作或资源ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {/* 操作类型筛选 */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          >
            <option value="all">全部操作</option>
            {Object.entries(ACTION_LABELS).map(([key, { label, icon }]) => (
              <option key={key} value={key}>{icon} {label}</option>
            ))}
          </select>

          {/* 资源类型筛选 */}
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          >
            <option value="all">全部资源</option>
            <option value="user">用户</option>
            <option value="report">报告</option>
            <option value="subscription">订阅</option>
            <option value="credits">积分</option>
            <option value="config">配置</option>
          </select>

          {/* 危险操作开关 */}
          <button
            onClick={() => { setDangerOnly(!dangerOnly); setPage(1); }}
            className={`px-4 py-2.5 rounded-lg text-sm transition-all ${dangerOnly ? "" : "btn-ghost"}`}
            style={dangerOnly ? {
              background: "rgba(239, 68, 68, 0.15)",
              border: "2px solid #ef4444",
              color: "#ef4444",
            } : {}}
          >
            🔴 仅危险操作
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-lg text-sm text-dim hover:text-foreground"
            >
              清除筛选 ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* 日期范围 */}
        <div className="flex gap-4 items-center pt-2 border-t" style={{ borderColor: "var(--stroke-soft)" }}>
          <span className="text-sm text-dim">时间范围:</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          />
          <span className="text-dim">至</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          />
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: "", end: "" })}
              className="text-sm text-dim hover:text-foreground"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 日志列表 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-dim">
            <div className="inline-block w-8 h-8 border-2 border-current border-r-transparent rounded-full animate-spin mb-2" />
            <p>加载中...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-dim">
            <p className="text-4xl mb-2">📋</p>
            <p>暂无审计日志</p>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim w-[160px]">时间</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">操作者</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">操作</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">资源</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dim">详情</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "#6b7280", icon: "📝" };

                  return (
                    <tr
                      key={log.id}
                      className="border-t hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: "var(--stroke-soft)" }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-3 text-sm text-dim">
                        {format(new Date(log.created_at), "MM-dd HH:mm:ss", { locale: zhCN })}
                      </td>
                      <td className="px-4 py-3">
                        {log.profiles ? (
                          <Link
                            href={`/admin/users/${log.user_id}`}
                            className="flex items-center gap-2"
                            style={{ color: "var(--accent-emerald)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "var(--bg-layer)" }}>
                              {(log.profiles.display_name || log.profiles.email)[0].toUpperCase()}
                            </span>
                            <span className="text-sm">{log.profiles.display_name || log.profiles.email}</span>
                          </Link>
                        ) : (
                          <span className="text-sm text-dim flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "var(--bg-layer)" }}>⚙️</span>
                            系统
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: `${actionInfo.color}20`,
                            color: actionInfo.color,
                            border: actionInfo.danger ? `1px solid ${actionInfo.color}` : "none",
                          }}
                        >
                          <span>{actionInfo.icon}</span>
                          {actionInfo.label}
                          {actionInfo.danger && <span className="ml-0.5">⚠️</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {log.resource_type && (
                            <span className="text-dim">{log.resource_type}: </span>
                          )}
                          {log.resource_id ? (
                            <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-layer)" }}>
                              {log.resource_id.length > 24 ? `${log.resource_id.substring(0, 24)}...` : log.resource_id}
                            </code>
                          ) : (
                            <span className="text-dim">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                          className="text-sm"
                          style={{ color: "var(--accent-emerald)" }}
                        >
                          查看详情 →
                        </button>
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

      {/* 详情弹窗 */}
      {selectedLog && (
        <Modal title="日志详情" onClose={() => setSelectedLog(null)}>
          <div className="space-y-4">
            {/* 基础信息 */}
            <div className="grid grid-cols-2 gap-4">
              <InfoBlock label="日志ID" value={<code className="text-xs">{selectedLog.id}</code>} />
              <InfoBlock label="时间" value={format(new Date(selectedLog.created_at), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoBlock
                label="操作者"
                value={
                  selectedLog.profiles ? (
                    <Link href={`/admin/users/${selectedLog.user_id}`} style={{ color: "var(--accent-emerald)" }}>
                      {selectedLog.profiles.email}
                    </Link>
                  ) : (
                    "系统"
                  )
                }
              />
              <InfoBlock
                label="操作类型"
                value={
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: `${ACTION_LABELS[selectedLog.action]?.color || "#6b7280"}20`,
                      color: ACTION_LABELS[selectedLog.action]?.color || "#6b7280",
                    }}
                  >
                    {ACTION_LABELS[selectedLog.action]?.icon} {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                  </span>
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoBlock label="资源类型" value={selectedLog.resource_type || "-"} />
              <InfoBlock label="资源ID" value={selectedLog.resource_id ? <code className="text-xs">{selectedLog.resource_id}</code> : "-"} />
            </div>

            {/* IP 和 User Agent */}
            {(selectedLog.ip_address || selectedLog.user_agent) && (
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="IP地址" value={selectedLog.ip_address || "-"} />
                <InfoBlock
                  label="设备信息"
                  value={
                    selectedLog.user_agent ? (
                      <span className="text-xs truncate block max-w-[200px]" title={selectedLog.user_agent}>
                        {selectedLog.user_agent}
                      </span>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>
            )}

            {/* 详细数据 */}
            <div>
              <div className="text-xs text-dim mb-2">详细数据</div>
              <div
                className="p-4 rounded-lg overflow-auto"
                style={{ background: "var(--bg-layer)", maxHeight: "250px" }}
              >
                <pre className="text-xs whitespace-pre-wrap" style={{ color: "var(--color-foreground)" }}>
                  {JSON.stringify(selectedLog.details, null, 2) || "{}"}
                </pre>
              </div>
            </div>

            {/* 危险操作警告 */}
            {ACTION_LABELS[selectedLog.action]?.danger && (
              <div
                className="p-3 rounded-lg flex items-center gap-2"
                style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
              >
                <span>⚠️</span>
                <span className="text-sm" style={{ color: "#ef4444" }}>
                  这是一个危险操作，已记录在安全审计日志中
                </span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t" style={{ borderColor: "var(--stroke-soft)" }}>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 rounded-lg btn-ghost"
              >
                关闭
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
  icon,
  highlight,
  warning,
}: {
  title: string;
  value: number;
  loading?: boolean;
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
        <div
          className="text-2xl font-bold mt-1"
          style={{ color: warning ? "#ef4444" : highlight ? "#10b981" : "var(--color-foreground)" }}
        >
          {value.toLocaleString()}
        </div>
      )}
    </div>
  );
}

// 信息块组件
function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "var(--bg-layer)" }}>
      <div className="text-xs text-dim mb-1">{label}</div>
      <div className="text-sm" style={{ color: "var(--color-foreground)" }}>{value}</div>
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
        className="glass-card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
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
