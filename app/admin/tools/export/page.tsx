"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SelectField, formatDate } from "@/app/components/admin/ui";

interface ExportConfig {
  resource: string;
  format: "csv" | "json";
  dateRange: "all" | "7d" | "30d" | "90d";
}

const EXPORT_RESOURCES = [
  { value: "profiles", label: "用户数据", fields: ["id", "email", "display_name", "plan", "role", "created_at"] },
  { value: "report_runs", label: "报告记录", fields: ["id", "user_id", "symbol", "status", "duration_ms", "created_at"] },
  { value: "report_credits", label: "积分数据", fields: ["user_id", "credits_available", "credits_used", "updated_at"] },
  { value: "report_credit_events", label: "积分流水", fields: ["user_id", "event_type", "credits_amount", "reason", "created_at"] },
  { value: "audit_logs", label: "审计日志", fields: ["user_id", "action", "resource_type", "resource_id", "created_at"] },
  { value: "billing_subscriptions", label: "订阅数据", fields: ["user_id", "plan_id", "status", "current_period_start", "current_period_end"] },
];

export default function DataExportPage() {
  const [config, setConfig] = useState<ExportConfig>({
    resource: "profiles",
    format: "csv",
    dateRange: "all",
  });
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<
    { resource: string; format: string; count: number; time: Date }[]
  >([]);

  async function handleExport() {
    const supabase = createClient();
    setExporting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from(config.resource).select("*");

      // 应用日期范围
      if (config.dateRange !== "all") {
        const days = config.dateRange === "7d" ? 7 : config.dateRange === "30d" ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query.limit(50000);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("没有数据可导出");
        return;
      }

      // 导出文件
      if (config.format === "csv") {
        exportAsCSV(data, config.resource);
      } else {
        exportAsJSON(data, config.resource);
      }

      // 记录导出历史
      setExportHistory((prev) => [
        { resource: config.resource, format: config.format, count: data.length, time: new Date() },
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      console.error("Export failed:", error);
      alert(`导出失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setExporting(false);
    }
  }

  function exportAsCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value).includes(",") ? `"${value}"` : String(value);
      })
    );

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadFile(csv, `${filename}-${formatDate(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
  }

  function exportAsJSON(data: Record<string, unknown>[], filename: string) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}-${formatDate(new Date(), "yyyy-MM-dd")}.json`, "application/json");
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectedResource = EXPORT_RESOURCES.find((r) => r.value === config.resource);

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          数据导出
        </h1>
        <p className="mt-1 text-sm text-dim">导出平台数据为CSV或JSON格式</p>
      </div>

      {/* 导出配置 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
          导出配置
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SelectField
            label="数据类型"
            value={config.resource}
            onChange={(e) => setConfig({ ...config, resource: e.target.value })}
            options={EXPORT_RESOURCES.map((r) => ({ value: r.value, label: r.label }))}
          />

          <SelectField
            label="文件格式"
            value={config.format}
            onChange={(e) => setConfig({ ...config, format: e.target.value as "csv" | "json" })}
            options={[
              { value: "csv", label: "CSV (Excel兼容)" },
              { value: "json", label: "JSON" },
            ]}
          />

          <SelectField
            label="时间范围"
            value={config.dateRange}
            onChange={(e) => setConfig({ ...config, dateRange: e.target.value as ExportConfig["dateRange"] })}
            options={[
              { value: "all", label: "全部数据" },
              { value: "7d", label: "最近7天" },
              { value: "30d", label: "最近30天" },
              { value: "90d", label: "最近90天" },
            ]}
          />
        </div>

        {/* 包含字段 */}
        {selectedResource && (
          <div className="mt-6">
            <div className="text-sm text-dim mb-2">包含字段</div>
            <div className="flex flex-wrap gap-2">
              {selectedResource.fields.map((field) => (
                <span
                  key={field}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ background: "var(--bg-layer)", color: "var(--color-foreground)" }}
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-3 rounded-lg btn-gradient font-semibold disabled:opacity-50"
          >
            {exporting ? "导出中..." : "开始导出"}
          </button>
        </div>
      </div>

      {/* 快捷导出 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
          快捷导出
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {EXPORT_RESOURCES.slice(0, 4).map((resource) => (
            <button
              key={resource.value}
              onClick={() => {
                setConfig({ resource: resource.value, format: "csv", dateRange: "all" });
                setTimeout(handleExport, 100);
              }}
              disabled={exporting}
              className="p-4 rounded-lg text-left transition-colors disabled:opacity-50"
              style={{ background: "var(--bg-layer)" }}
            >
              <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                {resource.label}
              </div>
              <div className="text-xs text-dim mt-1">导出CSV</div>
            </button>
          ))}
        </div>
      </div>

      {/* 导出历史 */}
      {exportHistory.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            本次会话导出记录
          </h3>
          <div className="space-y-2">
            {exportHistory.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--bg-layer)" }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg">
                    {record.format === "csv" ? "📊" : "📋"}
                  </span>
                  <div>
                    <div style={{ color: "var(--color-foreground)" }}>
                      {EXPORT_RESOURCES.find((r) => r.value === record.resource)?.label}
                    </div>
                    <div className="text-xs text-dim">
                      {record.count} 条记录 · {record.format.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-dim">{formatDate(record.time, "HH:mm:ss")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 注意事项 */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-medium" style={{ color: "#fbbf24" }}>
              数据安全提示
            </div>
            <ul className="text-sm text-dim mt-1 space-y-1">
              <li>• 导出的数据包含敏感信息，请妥善保管</li>
              <li>• 每次导出最多50,000条记录</li>
              <li>• 建议定期备份重要数据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
