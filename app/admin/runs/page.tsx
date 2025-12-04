"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReportRun {
  id: string;
  user_id: string;
  template_id?: string;
  symbol: string | null;
  tone?: string | null;
  language?: string | null;
  status: string | null;
  model?: string | null;
  duration_ms?: number | null;
  error?: string | null;
  markdown_path?: string | null;
  docx_path?: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    email: string;
    display_name?: string | null;
  };
  company_snapshot?: unknown;
}

export default function ReportRunsPage() {
  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRun, setSelectedRun] = useState<ReportRun | null>(null);
  const [publishing, setPublishing] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    fetchRuns();
  }, [page, statusFilter]);

  async function fetchRuns() {
    const supabase = createClient();
    setLoading(true);

    try {
      let query = supabase
        .from("report_runs")
        .select(
          `
          *,
          profiles:user_id(email, display_name)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRuns(data as any || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch report runs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRuns = runs.filter((run) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      run.symbol?.toLowerCase().includes(searchLower) ||
      run.profiles?.email.toLowerCase().includes(searchLower) ||
      run.profiles?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  async function handlePublishToHub(run: ReportRun) {
    if (!confirm(`确定要将 ${run.symbol} 的报告上架到报告中心吗?`)) {
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch("/api/admin/report/runs/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: run.id,
          title: `${run.symbol} 投资研究报告`,
          summary: `${run.symbol} 的深度投资分析报告`,
          theme: "investment",
          tags: [run.symbol, "investment", "research"],
          lang: run.language || "zh",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "上架失败");
      }

      alert(`成功将 ${run.symbol} 报告上架到报告中心!\n当前状态: 草稿\n您可以在报告管理页面编辑并发布。`);
    } catch (error) {
      console.error("Publish failed:", error);
      alert(`上架失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setPublishing(false);
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  function getStatusColor(status: string | null) {
    switch (status) {
      case "completed":
        return { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981" };
      case "failed":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" };
      case "pending":
        return { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" };
      case "running":
        return { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280" };
    }
  }

  function formatDuration(ms?: number | null) {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 页头 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          生成记录
        </h1>
        <p className="mt-2 text-sm text-dim">查看所有报告生成记录,包括成功和失败的记录</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-sm text-dim">总记录数</div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>{totalCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">成功</div>
          <div className="text-2xl font-bold" style={{ color: "#10b981" }}>
            {runs.filter((r) => r.status === "completed").length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">失败</div>
          <div className="text-2xl font-bold" style={{ color: "#ef4444" }}>
            {runs.filter((r) => r.status === "failed").length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">进行中</div>
          <div className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
            {runs.filter((r) => r.status === "running" || r.status === "pending").length}
          </div>
        </div>
      </div>

      {/* 过滤和搜索 */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索股票代码或用户..."
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
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg-layer)",
                border: "1px solid var(--stroke-soft)",
                color: "var(--color-foreground)",
                colorScheme: "dark",
              }}
            >
              <option value="all">所有状态</option>
              <option value="completed">成功</option>
              <option value="failed">失败</option>
              <option value="running">运行中</option>
              <option value="pending">等待中</option>
            </select>
          </div>
          <button
            onClick={fetchRuns}
            className="px-4 py-2 rounded-lg btn-gradient"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-dim">加载中...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--bg-layer)" }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      股票代码
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      模型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      耗时
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-dim">
                        {searchTerm ? "未找到匹配的记录" : "暂无生成记录"}
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.map((run) => {
                      const statusStyle = getStatusColor(run.status);
                      return (
                        <tr
                          key={run.id}
                          className="border-t hover:bg-opacity-50 transition-colors"
                          style={{ borderColor: "var(--stroke-soft)" }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{run.symbol}</div>
                            <div className="text-xs text-subtle">
                              {run.language || "en"} / {run.tone || "professional"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm" style={{ color: "var(--color-foreground)" }}>
                              {run.profiles?.display_name || run.profiles?.email || "未知用户"}
                            </div>
                            <div className="text-xs text-subtle">{run.profiles?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.color,
                              }}
                            >
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                            {run.model || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                            {formatDuration(run.duration_ms)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                            {run.created_at ? new Date(run.created_at).toLocaleString("zh-CN") : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedRun(run)}
                                className="hover:underline"
                                style={{ color: "var(--accent-emerald)" }}
                              >
                                详情
                              </button>
                              {run.status === "completed" && (
                                <button
                                  onClick={() => handlePublishToHub(run)}
                                  className="hover:underline"
                                  style={{ color: "#10b981" }}
                                >
                                  上架
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "var(--stroke-soft)" }}>
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg btn-ghost disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-dim">
                      显示第 <span className="font-medium">{(page - 1) * pageSize + 1}</span> 到{" "}
                      <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span>{" "}
                      条,共 <span className="font-medium">{totalCount}</span> 条记录
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedRun && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setSelectedRun(null)}
        >
          <div
            className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>生成详情</h2>
                  <p className="text-sm text-subtle mt-1">ID: {selectedRun.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="text-dim hover:text-foreground text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="股票代码" value={selectedRun.symbol || "-"} />
                  <DetailField
                    label="状态"
                    value={
                      <span
                        className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                        style={{
                          background: getStatusColor(selectedRun.status).bg,
                          color: getStatusColor(selectedRun.status).color,
                        }}
                      >
                        {selectedRun.status}
                      </span>
                    }
                  />
                  <DetailField
                    label="用户"
                    value={selectedRun.profiles?.display_name || selectedRun.profiles?.email || "-"}
                  />
                  <DetailField label="模型" value={selectedRun.model || "-"} />
                  <DetailField label="语言" value={selectedRun.language || "en"} />
                  <DetailField label="风格" value={selectedRun.tone || "professional"} />
                  <DetailField label="耗时" value={formatDuration(selectedRun.duration_ms)} />
                  <DetailField
                    label="创建时间"
                    value={selectedRun.created_at ? new Date(selectedRun.created_at).toLocaleString("zh-CN") : "-"}
                  />
                </div>

                {/* 文件路径 */}
                {(() => {
                  const hasFiles = Boolean(selectedRun.markdown_path) || Boolean(selectedRun.docx_path);
                  if (!hasFiles) return null;

                  return (
                    <div>
                      <label className="block text-sm font-medium text-dim mb-2">生成文件</label>
                      <div className="space-y-2">
                        {selectedRun.markdown_path && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-subtle">Markdown:</span>
                            <code className="text-xs px-2 py-1 rounded"
                              style={{
                                background: "var(--bg-layer)",
                                color: "var(--color-foreground)",
                              }}
                            >
                              {String(selectedRun.markdown_path)}
                            </code>
                          </div>
                        )}
                        {selectedRun.docx_path && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-subtle">DOCX:</span>
                            <code className="text-xs px-2 py-1 rounded"
                              style={{
                                background: "var(--bg-layer)",
                                color: "var(--color-foreground)",
                              }}
                            >
                              {String(selectedRun.docx_path)}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 错误信息 */}
                {selectedRun.error && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#ef4444" }}>错误信息</label>
                    <div className="rounded-lg p-4"
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      <pre className="text-xs whitespace-pre-wrap" style={{ color: "#ef4444" }}>
                        {selectedRun.error}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 公司快照数据 */}
                {Boolean(selectedRun.company_snapshot) && (
                  <div>
                    <label className="block text-sm font-medium text-dim mb-2">
                      公司快照数据
                    </label>
                    <div className="rounded-lg p-4 max-h-96 overflow-y-auto"
                      style={{
                        background: "var(--bg-layer)",
                        border: "1px solid var(--stroke-soft)",
                      }}
                    >
                      <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                        {JSON.stringify(selectedRun.company_snapshot, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRun(null)}
                  className="px-4 py-2 rounded-lg btn-ghost"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 辅助组件
function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dim">{label}</label>
      <div className="mt-1 text-sm" style={{ color: "var(--color-foreground)" }}>
        {value}
      </div>
    </div>
  );
}
