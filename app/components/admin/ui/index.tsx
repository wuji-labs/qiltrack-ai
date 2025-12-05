"use client";

import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

// ============== 基础组件 ==============

// 统计卡片
export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  bgColor?: string;
  trend?: { value: number; isUp: boolean };
  subtext?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, color = "#4dd0a6", bgColor, trend, subtext, onClick }: StatCardProps) {
  return (
    <div
      className={`glass-card p-6 ${onClick ? "cursor-pointer hover:scale-105" : ""} transition-transform duration-200`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-dim mb-1">{label}</div>
          <div className="text-3xl font-bold" style={{ color }}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {trend && (
            <div className={`text-xs mt-1 ${trend.isUp ? "text-green-400" : "text-red-400"}`}>
              {trend.isUp ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
          {subtext && <div className="text-xs text-subtle mt-1">{subtext}</div>}
        </div>
        {icon && (
          <div
            className="text-4xl p-4 rounded-2xl"
            style={{ backgroundColor: bgColor || `${color}15` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// 状态标签
export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  completed: { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981", label: "完成" },
  success: { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981", label: "成功" },
  active: { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981", label: "活跃" },
  published: { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981", label: "已发布" },
  failed: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444", label: "失败" },
  error: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444", label: "错误" },
  expired: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444", label: "已过期" },
  pending: { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", label: "等待中" },
  draft: { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", label: "草稿" },
  running: { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", label: "运行中" },
  processing: { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", label: "处理中" },
  cancelled: { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", label: "已取消" },
  inactive: { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", label: "未激活" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.inactive;
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}`}
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

// 角色标签
export interface RoleBadgeProps {
  role: string;
}

const ROLE_STYLES: Record<string, { name: string; color: string; icon: string }> = {
  super_admin: { name: "超级管理员", color: "#dc2626", icon: "👑" },
  admin: { name: "管理员", color: "#ea580c", icon: "⭐" },
  developer: { name: "开发者", color: "#8b5cf6", icon: "💻" },
  user: { name: "用户", color: "#3b82f6", icon: "👤" },
  guest: { name: "访客", color: "#6b7280", icon: "👁️" },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.user;
  return (
    <span
      className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full gap-1"
      style={{ background: `${style.color}20`, color: style.color }}
    >
      <span>{style.icon}</span>
      <span>{style.name}</span>
    </span>
  );
}

// 套餐标签
export interface PlanBadgeProps {
  plan: string;
}

const PLAN_STYLES: Record<string, { name: string; color: string; quota: number }> = {
  free: { name: "免费会员", color: "#6b7280", quota: 0 },
  pro: { name: "月费会员", color: "#3b82f6", quota: 300 },
  annual: { name: "年费会员", color: "#8b5cf6", quota: 600 },
  enterprise: { name: "企业版", color: "#f59e0b", quota: 9999 },
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const style = PLAN_STYLES[plan] || PLAN_STYLES.free;
  return (
    <span
      className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
      style={{ background: `${style.color}20`, color: style.color }}
    >
      {style.name}
    </span>
  );
}

export function getPlanInfo(plan: string) {
  return PLAN_STYLES[plan] || PLAN_STYLES.free;
}

// ============== 表单组件 ==============

export interface InputFieldProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  className,
}: InputFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-dim mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg disabled:opacity-50"
        style={{
          background: "var(--bg-layer)",
          border: error ? "1px solid #ef4444" : "1px solid var(--stroke-soft)",
          color: "var(--color-foreground)",
        }}
      />
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}

export interface TextAreaFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required,
  disabled,
  className,
}: TextAreaFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-dim mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg disabled:opacity-50"
        style={{
          background: "var(--bg-layer)",
          border: "1px solid var(--stroke-soft)",
          color: "var(--color-foreground)",
        }}
      />
    </div>
  );
}

export interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  className,
}: SelectFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-dim mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg disabled:opacity-50"
        style={{
          background: "var(--bg-layer)",
          border: "1px solid var(--stroke-soft)",
          color: "var(--color-foreground)",
          colorScheme: "dark",
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

// ============== 弹窗组件 ==============

export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: ReactNode;
}

export function Modal({ title, isOpen, onClose, children, size = "md", footer }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className={`glass-card ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--stroke-soft)" }}>
          <h3 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {title}
          </h3>
          <button onClick={onClose} className="text-dim hover:text-foreground text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-6 border-t" style={{ borderColor: "var(--stroke-soft)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  confirmText = "确认",
  cancelText = "取消",
  type = "warning",
  loading,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
    warning: { bg: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", border: "rgba(251, 191, 36, 0.3)" },
    info: { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
  };

  return (
    <Modal title={title} isOpen={isOpen} onClose={onCancel} size="sm">
      <p className="text-dim mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50"
          style={{
            background: typeStyles[type].bg,
            color: typeStyles[type].color,
            border: `1px solid ${typeStyles[type].border}`,
          }}
        >
          {loading ? "处理中..." : confirmText}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-lg btn-ghost disabled:opacity-50"
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
}

// ============== 数据表格组件 ==============

export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: string | ((record: T) => string);
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectChange?: (keys: Set<string>) => void;
  onRowClick?: (record: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyText = "暂无数据",
  rowKey = "id",
  selectable,
  selectedKeys = new Set(),
  onSelectChange,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  const getRowKey = (record: T): string => {
    if (typeof rowKey === "function") return rowKey(record);
    return String((record as Record<string, unknown>)[rowKey as string]);
  };

  const toggleSelectAll = () => {
    if (!onSelectChange) return;
    if (selectedKeys.size === data.length) {
      onSelectChange(new Set());
    } else {
      onSelectChange(new Set(data.map(getRowKey)));
    }
  };

  const toggleSelect = (key: string) => {
    if (!onSelectChange) return;
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onSelectChange(newKeys);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

  return (
    <div className="glass-card overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-dim">加载中...</div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center text-dim">{emptyText}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--bg-layer)" }}>
                <tr>
                  {selectable && (
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedKeys.size === data.length && data.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-dim uppercase tracking-wider"
                      style={{ width: col.width }}
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((record, index) => {
                  const key = getRowKey(record);
                  return (
                    <tr
                      key={key}
                      className={`border-t transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                      style={{
                        borderColor: "var(--stroke-soft)",
                        backgroundColor: selectedKeys.has(key) ? "rgba(99, 102, 241, 0.1)" : "transparent",
                      }}
                      onClick={() => onRowClick?.(record)}
                    >
                      {selectable && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(key)}
                            onChange={() => toggleSelect(key)}
                            className="w-4 h-4"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm" style={{ color: "var(--color-foreground)" }}>
                          {col.render ? col.render((record as Record<string, unknown>)[col.key], record, index) : String((record as Record<string, unknown>)[col.key] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "var(--stroke-soft)" }}>
              <div className="text-sm text-dim">
                显示第 {(pagination.page - 1) * pagination.pageSize + 1} 到{" "}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条,共 {pagination.total} 条
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => pagination.onChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
                >
                  上一页
                </button>
                <div className="px-4 py-2 text-dim">
                  {pagination.page} / {totalPages}
                </div>
                <button
                  onClick={() => pagination.onChange(Math.min(totalPages, pagination.page + 1))}
                  disabled={pagination.page === totalPages}
                  className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============== Tab组件 ==============

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function Tabs({ items, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex border-b" style={{ borderColor: "var(--stroke-soft)" }}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeKey === item.key ? "text-foreground" : "text-dim hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            {item.icon && <span>{item.icon}</span>}
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className="px-1.5 py-0.5 text-xs rounded-full"
                style={{ background: "var(--accent-emerald)", color: "#000" }}
              >
                {item.badge}
              </span>
            )}
          </span>
          {activeKey === item.key && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: "var(--accent-emerald)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ============== 详情组件 ==============

export interface DetailRowProps {
  label: string;
  value: ReactNode;
  copyable?: boolean;
}

export function DetailRow({ label, value, copyable }: DetailRowProps) {
  const handleCopy = () => {
    if (typeof value === "string") {
      navigator.clipboard.writeText(value);
    }
  };

  return (
    <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--stroke-soft)" }}>
      <span className="text-sm text-dim">{label}:</span>
      <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--color-foreground)" }}>
        {value}
        {copyable && typeof value === "string" && (
          <button onClick={handleCopy} className="text-xs text-dim hover:text-foreground">
            复制
          </button>
        )}
      </span>
    </div>
  );
}

// ============== 日期格式化工具 ==============

export function formatDate(date: string | Date | null | undefined, formatStr = "yyyy-MM-dd HH:mm") {
  if (!date) return "-";
  try {
    return format(new Date(date), formatStr, { locale: zhCN });
  } catch {
    return "-";
  }
}

export function formatRelativeTime(date: string | Date | null | undefined) {
  if (!date) return "-";
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date, "MM-dd HH:mm");
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
}

// ============== 搜索过滤组件 ==============

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }[];
  actions?: ReactNode;
}

export function FilterBar({ searchValue, onSearchChange, searchPlaceholder = "搜索...", filters, actions }: FilterBarProps) {
  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
            }}
          />
        </div>
        {filters?.map((filter) => (
          <select
            key={filter.key}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--stroke-soft)",
              color: "var(--color-foreground)",
              colorScheme: "dark",
            }}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {actions}
      </div>
    </div>
  );
}

// ============== 活动流组件 ==============

export interface ActivityItem {
  id: string;
  type: "success" | "warning" | "error" | "info";
  user: string;
  action: string;
  target?: string;
  time: string;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  loading?: boolean;
}

export function ActivityFeed({ items, maxItems = 10, loading }: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  if (loading) {
    return <div className="text-center text-dim py-4">加载中...</div>;
  }

  if (displayItems.length === 0) {
    return <div className="text-center text-dim py-4">暂无活动记录</div>;
  }

  const typeColors = {
    success: "#10b981",
    warning: "#fbbf24",
    error: "#ef4444",
    info: "#3b82f6",
  };

  return (
    <div className="space-y-3">
      {displayItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 rounded-lg transition-colors"
          style={{ backgroundColor: "var(--bg-layer)" }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: typeColors[item.type] }}
            />
            <div>
              <div style={{ color: "var(--color-foreground)" }}>
                <span className="font-medium">{item.user}</span>
                <span className="text-dim ml-2">{item.action}</span>
                {item.target && <span className="text-dim"> {item.target}</span>}
              </div>
            </div>
          </div>
          <div className="text-sm text-subtle">{formatRelativeTime(item.time)}</div>
        </div>
      ))}
    </div>
  );
}

// ============== 空状态组件 ==============

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
        {title}
      </h3>
      {description && <p className="text-dim mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="px-6 py-2 rounded-lg btn-gradient font-semibold">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============== 加载状态 ==============

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} border-2 border-t-transparent rounded-full animate-spin`}
        style={{ borderColor: "var(--accent-emerald)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-dim">加载中...</p>
      </div>
    </div>
  );
}
