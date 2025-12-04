"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Modal,
  InputField,
  TextAreaField,
  ConfirmDialog,
  formatDate,
} from "@/app/components/admin/ui";

interface SystemConfig {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ConfigGroup {
  title: string;
  icon: string;
  configs: {
    key: string;
    label: string;
    description: string;
    type: "string" | "number" | "boolean" | "json";
    defaultValue: unknown;
  }[];
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    title: "用户配置",
    icon: "👥",
    configs: [
      {
        key: "user.default_plan",
        label: "默认套餐",
        description: "新用户注册时的默认套餐",
        type: "string",
        defaultValue: "free",
      },
      {
        key: "user.default_credits",
        label: "初始积分",
        description: "新用户注册时获得的初始积分",
        type: "number",
        defaultValue: 30,
      },
      {
        key: "user.allow_registration",
        label: "允许注册",
        description: "是否允许新用户注册",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    title: "报告配置",
    icon: "📊",
    configs: [
      {
        key: "report.default_model",
        label: "默认模型",
        description: "报告生成使用的默认AI模型",
        type: "string",
        defaultValue: "gpt-4",
      },
      {
        key: "report.max_concurrent",
        label: "最大并发数",
        description: "同时生成报告的最大数量",
        type: "number",
        defaultValue: 5,
      },
      {
        key: "report.timeout_ms",
        label: "超时时间(ms)",
        description: "报告生成超时时间",
        type: "number",
        defaultValue: 300000,
      },
    ],
  },
  {
    title: "积分配置",
    icon: "💰",
    configs: [
      {
        key: "credits.report_cost",
        label: "报告消耗",
        description: "生成一份报告消耗的积分",
        type: "number",
        defaultValue: 1,
      },
      {
        key: "credits.monthly_reset",
        label: "月度重置",
        description: "是否每月重置积分",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  {
    title: "系统配置",
    icon: "⚙️",
    configs: [
      {
        key: "system.maintenance_mode",
        label: "维护模式",
        description: "启用后普通用户无法访问",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "system.debug_mode",
        label: "调试模式",
        description: "启用后显示详细错误信息",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "system.announcement",
        label: "系统公告",
        description: "显示在用户界面顶部的公告",
        type: "string",
        defaultValue: "",
      },
    ],
  },
];

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*");

      if (error) {
        // 表可能不存在，使用默认值
        console.log("Using default configs");
      }

      // 构建配置对象
      const configMap: Record<string, unknown> = {};

      // 先设置默认值
      CONFIG_GROUPS.forEach((group) => {
        group.configs.forEach((config) => {
          configMap[config.key] = config.defaultValue;
        });
      });

      // 用数据库值覆盖
      data?.forEach((item: SystemConfig) => {
        configMap[item.key] = item.value.value ?? item.value;
      });

      setConfigs(configMap);
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig(key: string, value: unknown) {
    const supabase = createClient();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("system_config")
        .upsert(
          {
            key,
            value: { value },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      setConfigs((prev) => ({ ...prev, [key]: value }));
      setEditingKey(null);

      // 记录审计日志
      await supabase.from("audit_logs").insert({
        action: "UPDATE_CONFIG",
        resource_type: "config",
        resource_id: key,
        details: { new_value: value },
      });
    } catch (error) {
      console.error("Save config failed:", error);
      alert(`保存失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetAll() {
    const supabase = createClient();
    setSaving(true);

    try {
      // 删除所有配置
      await supabase.from("system_config").delete().neq("key", "");

      // 重新加载默认值
      await fetchConfigs();
      setShowResetConfirm(false);
      alert("已恢复默认配置");
    } catch (error) {
      console.error("Reset failed:", error);
      alert(`重置失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(key: string, currentValue: unknown) {
    setEditingKey(key);
    setEditValue(
      typeof currentValue === "object"
        ? JSON.stringify(currentValue, null, 2)
        : String(currentValue)
    );
  }

  function renderConfigValue(config: ConfigGroup["configs"][0], value: unknown) {
    const isEditing = editingKey === config.key;

    if (isEditing) {
      return (
        <div className="space-y-2">
          {config.type === "boolean" ? (
            <select
              value={String(editValue)}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          ) : config.type === "json" ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          ) : (
            <input
              type={config.type === "number" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
              }}
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                let parsedValue: unknown = editValue;
                if (config.type === "number") {
                  parsedValue = Number(editValue);
                } else if (config.type === "boolean") {
                  parsedValue = editValue === "true";
                } else if (config.type === "json") {
                  try {
                    parsedValue = JSON.parse(editValue);
                  } catch {
                    alert("无效的JSON格式");
                    return;
                  }
                }
                handleSaveConfig(config.key, parsedValue);
              }}
              disabled={saving}
              className="px-3 py-1 rounded text-sm btn-gradient"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => setEditingKey(null)}
              className="px-3 py-1 rounded text-sm btn-ghost"
            >
              取消
            </button>
          </div>
        </div>
      );
    }

    // 显示值
    if (config.type === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: value ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: value ? "#10b981" : "#ef4444",
            }}
          >
            {value ? "是" : "否"}
          </span>
          <button
            onClick={() => startEdit(config.key, value)}
            className="text-sm"
            style={{ color: "var(--accent-emerald)" }}
          >
            修改
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span style={{ color: "var(--color-foreground)" }}>
          {config.type === "json" ? (
            <code className="text-xs">{JSON.stringify(value).substring(0, 50)}</code>
          ) : (
            String(value) || <span className="text-dim">未设置</span>
          )}
        </span>
        <button
          onClick={() => startEdit(config.key, value)}
          className="text-sm"
          style={{ color: "var(--accent-emerald)" }}
        >
          修改
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-dim">加载配置...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            系统配置
          </h1>
          <p className="mt-1 text-sm text-dim">管理系统全局配置项</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
          >
            恢复默认
          </button>
          <button onClick={fetchConfigs} className="px-4 py-2 rounded-lg btn-ghost text-sm">
            刷新
          </button>
        </div>
      </div>

      {/* 配置分组 */}
      <div className="space-y-6">
        {CONFIG_GROUPS.map((group) => (
          <div key={group.title} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{group.icon}</span>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                {group.title}
              </h2>
            </div>

            <div className="space-y-4">
              {group.configs.map((config) => (
                <div
                  key={config.key}
                  className="p-4 rounded-lg"
                  style={{ background: "var(--bg-layer)" }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                        {config.label}
                      </div>
                      <div className="text-xs text-dim mt-1">{config.description}</div>
                      <code className="text-xs text-subtle">{config.key}</code>
                    </div>
                  </div>
                  <div className="mt-3">
                    {renderConfigValue(config, configs[config.key])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 恢复默认确认 */}
      <ConfirmDialog
        title="恢复默认配置"
        message="确定要将所有配置恢复为默认值吗？此操作不可恢复。"
        isOpen={showResetConfirm}
        onConfirm={handleResetAll}
        onCancel={() => setShowResetConfirm(false)}
        type="danger"
        confirmText="确认恢复"
        loading={saving}
      />
    </div>
  );
}
