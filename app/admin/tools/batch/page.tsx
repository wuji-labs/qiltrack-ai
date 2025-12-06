"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SelectField,
  TextAreaField,
  ConfirmDialog,
  formatDate,
} from "@/app/components/admin/ui";

interface BatchOperation {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: {
    key: string;
    label: string;
    type: "select" | "number" | "text" | "textarea";
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];
  execute: (params: Record<string, unknown>, userIds: string[]) => Promise<{ success: number; failed: number }>;
}

interface OperationLog {
  operation: string;
  count: number;
  success: number;
  failed: number;
  time: Date;
}

export default function BatchOperationsPage() {
  const [selectedOperation, setSelectedOperation] = useState<string>("change_plan");
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [userInput, setUserInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [previewUsers, setPreviewUsers] = useState<{ id: string; email: string }[]>([]);

  const BATCH_OPERATIONS: BatchOperation[] = [
    {
      id: "change_plan",
      name: "批量修改套餐",
      description: "批量修改用户的订阅套餐",
      icon: "💎",
      fields: [
        {
          key: "plan",
          label: "目标套餐",
          type: "select",
          options: [
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
            { value: "ultra", label: "Ultra" },
          ],
        },
      ],
      execute: async (params, userIds) => {
        const supabase = createClient();
        let success = 0;
        let failed = 0;

        for (const userId of userIds) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from("profiles")
              .update({ plan: params.plan })
              .eq("id", userId);

            if (error) {
              failed++;
            } else {
              success++;
              // 记录审计日志
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("audit_logs").insert({
                user_id: userId,
                action: "CHANGE_PLAN",
                resource_type: "user",
                resource_id: userId,
                details: { new_plan: params.plan, batch: true },
              });
            }
          } catch {
            failed++;
          }
        }

        return { success, failed };
      },
    },
    {
      id: "grant_credits",
      name: "批量授予积分",
      description: "批量为用户增加积分",
      icon: "💰",
      fields: [
        {
          key: "amount",
          label: "积分数量",
          type: "number",
          placeholder: "输入积分数量",
        },
        {
          key: "reason",
          label: "授予原因",
          type: "text",
          placeholder: "如：促销活动、补偿等",
        },
      ],
      execute: async (params, userIds) => {
        const supabase = createClient();
        let success = 0;
        let failed = 0;

        for (const userId of userIds) {
          try {
            // 获取当前积分
            const { data: current } = await supabase
              .from("report_credits")
              .select("credits_available")
              .eq("user_id", userId)
              .single();

            const currentCredits = (current as { credits_available?: number } | null)?.credits_available || 0;
            const amount = Number(params.amount);

            // 更新或插入积分记录
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from("report_credits")
              .upsert({
                user_id: userId,
                credits_available: currentCredits + amount,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });

            if (error) {
              failed++;
            } else {
              success++;
              // 记录积分事件
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("report_credit_events").insert({
                user_id: userId,
                event_type: "admin_grant",
                credits_amount: amount,
                reason: params.reason || "批量授予",
              });
              // 记录审计日志
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("audit_logs").insert({
                action: "GRANT_CREDITS",
                resource_type: "credits",
                resource_id: userId,
                details: { amount, reason: params.reason, batch: true },
              });
            }
          } catch {
            failed++;
          }
        }

        return { success, failed };
      },
    },
    {
      id: "change_role",
      name: "批量修改角色",
      description: "批量修改用户的系统角色",
      icon: "👤",
      fields: [
        {
          key: "role",
          label: "目标角色",
          type: "select",
          options: [
            { value: "user", label: "普通用户" },
            { value: "developer", label: "开发者" },
            { value: "admin", label: "管理员" },
          ],
        },
      ],
      execute: async (params, userIds) => {
        const supabase = createClient();
        let success = 0;
        let failed = 0;

        for (const userId of userIds) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from("profiles")
              .update({ role: params.role })
              .eq("id", userId);

            if (error) {
              failed++;
            } else {
              success++;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("audit_logs").insert({
                action: "UPDATE_USER",
                resource_type: "user",
                resource_id: userId,
                details: { new_role: params.role, batch: true },
              });
            }
          } catch {
            failed++;
          }
        }

        return { success, failed };
      },
    },
    {
      id: "send_notification",
      name: "批量发送通知",
      description: "向多个用户发送系统通知",
      icon: "📢",
      fields: [
        {
          key: "title",
          label: "通知标题",
          type: "text",
          placeholder: "输入通知标题",
        },
        {
          key: "message",
          label: "通知内容",
          type: "textarea",
          placeholder: "输入通知内容...",
        },
      ],
      execute: async (params, userIds) => {
        const supabase = createClient();
        let success = 0;
        let failed = 0;

        for (const userId of userIds) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from("user_notifications")
              .insert({
                user_id: userId,
                title: params.title,
                message: params.message,
                type: "system",
                read: false,
              });

            if (error) {
              // 表可能不存在，跳过
              failed++;
            } else {
              success++;
            }
          } catch {
            failed++;
          }
        }

        return { success, failed };
      },
    },
    {
      id: "reset_credits",
      name: "批量重置积分",
      description: "将用户积分重置为指定数值",
      icon: "🔄",
      fields: [
        {
          key: "amount",
          label: "重置为",
          type: "number",
          placeholder: "输入积分数量",
        },
      ],
      execute: async (params, userIds) => {
        const supabase = createClient();
        let success = 0;
        let failed = 0;

        for (const userId of userIds) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from("report_credits")
              .upsert({
                user_id: userId,
                credits_available: Number(params.amount),
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });

            if (error) {
              failed++;
            } else {
              success++;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("report_credit_events").insert({
                user_id: userId,
                event_type: "admin_reset",
                credits_amount: Number(params.amount),
                reason: "批量重置",
              });
            }
          } catch {
            failed++;
          }
        }

        return { success, failed };
      },
    },
  ];

  const currentOperation = BATCH_OPERATIONS.find((op) => op.id === selectedOperation);

  async function handlePreview() {
    const supabase = createClient();
    const inputList = userInput
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (inputList.length === 0) {
      alert("请输入用户ID或邮箱");
      return;
    }

    // 尝试按ID和邮箱查询
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .or(`id.in.(${inputList.map(s => `"${s}"`).join(",")}),email.in.(${inputList.map(s => `"${s}"`).join(",")})`);

    if (error) {
      console.error("Preview failed:", error);
      alert("查询用户失败");
      return;
    }

    setPreviewUsers(data || []);
  }

  async function handleExecute() {
    if (!currentOperation || previewUsers.length === 0) return;

    setExecuting(true);
    setShowConfirm(false);

    try {
      const userIds = previewUsers.map((u) => u.id);
      const result = await currentOperation.execute(params, userIds);

      setOperationLogs((prev) => [
        {
          operation: currentOperation.name,
          count: userIds.length,
          success: result.success,
          failed: result.failed,
          time: new Date(),
        },
        ...prev.slice(0, 19),
      ]);

      alert(`执行完成！成功: ${result.success}, 失败: ${result.failed}`);

      // 重置状态
      setPreviewUsers([]);
      setUserInput("");
      setParams({});
    } catch (error) {
      console.error("Batch operation failed:", error);
      alert(`执行失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          批量操作
        </h1>
        <p className="mt-1 text-sm text-dim">对多个用户执行批量管理操作</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：操作选择和参数 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 操作类型选择 */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              选择操作
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BATCH_OPERATIONS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedOperation(op.id);
                    setParams({});
                  }}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedOperation === op.id ? "ring-2 ring-emerald-500" : ""
                  }`}
                  style={{
                    background: selectedOperation === op.id ? "var(--accent-emerald-dim)" : "var(--bg-layer)",
                  }}
                >
                  <div className="text-2xl mb-2">{op.icon}</div>
                  <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                    {op.name}
                  </div>
                  <div className="text-xs text-dim mt-1">{op.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 操作参数 */}
          {currentOperation && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
                操作参数
              </h3>
              <div className="space-y-4">
                {currentOperation.fields.map((field) => {
                  if (field.type === "select") {
                    return (
                      <SelectField
                        key={field.key}
                        label={field.label}
                        value={(params[field.key] as string) || ""}
                        onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
                        options={field.options || []}
                      />
                    );
                  }
                  if (field.type === "textarea") {
                    return (
                      <TextAreaField
                        key={field.key}
                        label={field.label}
                        value={(params[field.key] as string) || ""}
                        onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={4}
                      />
                    );
                  }
                  return (
                    <div key={field.key}>
                      <label className="block text-sm text-dim mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={(params[field.key] as string) || ""}
                        onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          background: "var(--bg-layer)",
                          border: "1px solid var(--stroke-soft)",
                          color: "var(--color-foreground)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 用户选择 */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              选择用户
            </h3>
            <div className="space-y-4">
              <TextAreaField
                label="用户ID或邮箱"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入用户ID或邮箱，每行一个，也可用逗号或分号分隔..."
                rows={6}
              />
              <div className="flex gap-3">
                <button
                  onClick={handlePreview}
                  className="px-4 py-2 rounded-lg btn-ghost text-sm"
                >
                  预览用户
                </button>
                <button
                  onClick={() => setUserInput("")}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ background: "var(--bg-layer)" }}
                >
                  清空
                </button>
              </div>
            </div>
          </div>

          {/* 预览用户列表 */}
          {previewUsers.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                  匹配用户 ({previewUsers.length})
                </h3>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={executing || !currentOperation}
                  className="px-6 py-2 rounded-lg btn-gradient font-semibold disabled:opacity-50"
                >
                  {executing ? "执行中..." : "执行操作"}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {previewUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ background: "var(--bg-layer)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ background: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}
                      >
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                          {user.email}
                        </div>
                        <code className="text-xs text-dim">{user.id.substring(0, 8)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：操作历史 */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              本次会话操作记录
            </h3>
            {operationLogs.length === 0 ? (
              <div className="text-center py-8 text-dim">暂无操作记录</div>
            ) : (
              <div className="space-y-3">
                {operationLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg-layer)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
                        {log.operation}
                      </span>
                      <span className="text-xs text-dim">
                        {formatDate(log.time, "HH:mm:ss")}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-dim">目标: {log.count}</span>
                      <span style={{ color: "#10b981" }}>成功: {log.success}</span>
                      {log.failed > 0 && (
                        <span style={{ color: "#ef4444" }}>失败: {log.failed}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 使用说明 */}
          <div
            className="p-4 rounded-lg"
            style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-medium" style={{ color: "#3b82f6" }}>
                  使用说明
                </div>
                <ul className="text-sm text-dim mt-1 space-y-1">
                  <li>• 支持用户ID和邮箱混合输入</li>
                  <li>• 可用换行、逗号或分号分隔</li>
                  <li>• 执行前请仔细确认用户列表</li>
                  <li>• 所有操作会记录审计日志</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 警告 */}
          <div
            className="p-4 rounded-lg"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-medium" style={{ color: "#ef4444" }}>
                  注意事项
                </div>
                <ul className="text-sm text-dim mt-1 space-y-1">
                  <li>• 批量操作不可撤销</li>
                  <li>• 请谨慎操作管理员账户</li>
                  <li>• 大量用户操作可能需要时间</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        title="确认执行批量操作"
        message={`确定要对 ${previewUsers.length} 个用户执行「${currentOperation?.name}」操作吗？此操作不可撤销。`}
        isOpen={showConfirm}
        onConfirm={handleExecute}
        onCancel={() => setShowConfirm(false)}
        type="danger"
        confirmText="确认执行"
        loading={executing}
      />
    </div>
  );
}
