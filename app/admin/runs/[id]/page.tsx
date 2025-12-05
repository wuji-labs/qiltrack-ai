"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Tabs,
  StatusBadge,
  DetailRow,
  Modal,
  ConfirmDialog,
  formatDate,
} from "@/app/components/admin/ui";

interface ReportRun {
  id: string;
  user_id: string;
  template_id: string | null;
  symbol: string | null;
  tone: string | null;
  language: string | null;
  status: string | null;
  model: string | null;
  company_snapshot: Record<string, unknown> | null;
  duration_ms: number | null;
  error: string | null;
  markdown_path: string | null;
  docx_path: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    email: string;
    display_name: string | null;
  };
  report_templates?: {
    name: string;
    slug: string;
  };
}

export default function ReportRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<ReportRun | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (runId) {
      fetchRunData();
    }
  }, [runId]);

  async function fetchRunData() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("report_runs")
        .select(`
          *,
          profiles:user_id(email, display_name),
          report_templates:template_id(name, slug)
        `)
        .eq("id", runId)
        .single();

      if (error) throw error;
      const runData = data as unknown as ReportRun;
      setRun(runData);

      // 如果有markdown路径，尝试获取内容
      if (runData.markdown_path) {
        await fetchMarkdownContent(runData.markdown_path);
      }
    } catch (error) {
      console.error("Failed to fetch run data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMarkdownContent(path: string) {
    setContentLoading(true);
    try {
      const supabase = createClient();

      // 尝试从storage获取
      const { data, error } = await supabase.storage
        .from("reports")
        .download(path);

      if (error) {
        console.error("Download error:", error);
        // 尝试直接获取签名URL
        const { data: signedData } = await supabase.storage
          .from("reports")
          .createSignedUrl(path, 3600);

        if (signedData?.signedUrl) {
          const response = await fetch(signedData.signedUrl);
          const text = await response.text();
          setMarkdownContent(text);
        }
      } else if (data) {
        const text = await data.text();
        setMarkdownContent(text);
      }
    } catch (error) {
      console.error("Failed to fetch markdown content:", error);
      setMarkdownContent("无法加载报告内容");
    } finally {
      setContentLoading(false);
    }
  }

  async function handlePublishToHub() {
    if (!run) return;
    setPublishing(true);

    try {
      const response = await fetch("/api/admin/report/runs/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: run.id,
          title: `${run.symbol} 投资研究报告`,
          summary: `${run.symbol} 的深度投资分析报告`,
          theme: "investment",
          tags: [run.symbol, "investment", "research"].filter(Boolean),
          lang: run.language || "zh",
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "发布失败");
      }

      setShowPublishModal(false);
      alert("报告已发布到报告中心！");
    } catch (error) {
      console.error("Publish failed:", error);
      alert(`发布失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!run) return;

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("report_runs") as any).delete().eq("id", run.id);

      if (error) throw error;

      alert("记录已删除");
      router.push("/admin/runs");
    } catch (error) {
      console.error("Delete failed:", error);
      alert(`删除失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  function formatDuration(ms: number | null) {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-dim">加载报告数据...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
          报告不存在
        </h2>
        <Link href="/admin/runs" className="text-dim hover:text-foreground">
          返回生成记录
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "info", label: "基本信息", icon: "📋" },
    { key: "content", label: "报告内容", icon: "📄" },
    { key: "snapshot", label: "公司数据", icon: "📊" },
    { key: "raw", label: "原始数据", icon: "🔧" },
  ];

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/admin/runs" className="text-dim hover:text-foreground">
            ← 返回
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: "var(--color-foreground)" }}>
              {run.symbol || "未知股票"} 报告详情
              <StatusBadge status={run.status || "pending"} />
            </h1>
            <p className="text-sm text-dim mt-1">ID: {run.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {run.status === "completed" && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 rounded-lg btn-gradient text-sm"
            >
              发布到报告中心
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
          >
            删除
          </button>
        </div>
      </div>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-dim">状态</div>
          <div className="mt-1">
            <StatusBadge status={run.status || "pending"} size="lg" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">耗时</div>
          <div className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {formatDuration(run.duration_ms)}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">模型</div>
          <div className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {run.model || "-"}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-dim">语言</div>
          <div className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {run.language === "zh" ? "中文" : run.language === "en" ? "English" : run.language || "-"}
          </div>
        </div>
      </div>

      {/* 错误信息 */}
      {run.error && (
        <div
          className="p-4 rounded-lg"
          style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
        >
          <div className="text-sm font-semibold mb-2" style={{ color: "#ef4444" }}>
            错误信息
          </div>
          <pre className="text-xs whitespace-pre-wrap" style={{ color: "#ef4444" }}>
            {run.error}
          </pre>
        </div>
      )}

      {/* Tab内容 */}
      <div className="glass-card">
        <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow label="报告ID" value={run.id} copyable />
                <DetailRow label="股票代码" value={run.symbol || "-"} />
                <DetailRow
                  label="用户"
                  value={
                    <Link href={`/admin/users/${run.user_id}`} style={{ color: "var(--accent-emerald)" }}>
                      {run.profiles?.display_name || run.profiles?.email || run.user_id}
                    </Link>
                  }
                />
                <DetailRow label="模板" value={run.report_templates?.name || "-"} />
                <DetailRow label="语言" value={run.language || "en"} />
                <DetailRow label="风格" value={run.tone || "professional"} />
                <DetailRow label="模型" value={run.model || "-"} />
                <DetailRow label="耗时" value={formatDuration(run.duration_ms)} />
                <DetailRow label="创建时间" value={formatDate(run.created_at)} />
                <DetailRow label="更新时间" value={formatDate(run.updated_at)} />
              </div>

              {(run.markdown_path || run.docx_path) && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
                    生成文件
                  </h4>
                  <div className="space-y-2">
                    {run.markdown_path && (
                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                        <span className="text-lg">📄</span>
                        <div className="flex-1">
                          <div className="text-sm" style={{ color: "var(--color-foreground)" }}>Markdown</div>
                          <code className="text-xs text-dim">{run.markdown_path}</code>
                        </div>
                        <button
                          onClick={() => setActiveTab("content")}
                          className="text-sm"
                          style={{ color: "var(--accent-emerald)" }}
                        >
                          查看内容
                        </button>
                      </div>
                    )}
                    {run.docx_path && (
                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-layer)" }}>
                        <span className="text-lg">📝</span>
                        <div className="flex-1">
                          <div className="text-sm" style={{ color: "var(--color-foreground)" }}>DOCX</div>
                          <code className="text-xs text-dim">{run.docx_path}</code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "content" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                  报告内容预览
                </h3>
                {markdownContent && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(markdownContent);
                      alert("内容已复制到剪贴板");
                    }}
                    className="text-sm"
                    style={{ color: "var(--accent-emerald)" }}
                  >
                    复制内容
                  </button>
                )}
              </div>

              {contentLoading ? (
                <div className="text-center py-8 text-dim">加载报告内容...</div>
              ) : markdownContent ? (
                <div
                  className="prose prose-invert max-w-none p-6 rounded-lg overflow-auto"
                  style={{ background: "var(--bg-layer)", maxHeight: "70vh" }}
                >
                  <ReactMarkdown>{markdownContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8 text-dim">
                  {run.markdown_path ? "无法加载报告内容" : "该报告没有生成内容文件"}
                </div>
              )}
            </div>
          )}

          {activeTab === "snapshot" && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
                公司快照数据
              </h3>
              {run.company_snapshot ? (
                <div
                  className="p-4 rounded-lg overflow-auto"
                  style={{ background: "var(--bg-layer)", maxHeight: "70vh" }}
                >
                  <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                    {JSON.stringify(run.company_snapshot, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-dim">无公司快照数据</div>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
                原始记录数据
              </h3>
              <div
                className="p-4 rounded-lg overflow-auto"
                style={{ background: "var(--bg-layer)", maxHeight: "70vh" }}
              >
                <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                  {JSON.stringify(run, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 发布确认弹窗 */}
      <Modal
        title="发布到报告中心"
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-dim">
            确定要将此报告发布到报告中心吗？发布后将创建为草稿状态，您可以在报告管理页面进一步编辑和正式发布。
          </p>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg-layer)" }}>
            <div className="text-sm text-dim">报告标题</div>
            <div style={{ color: "var(--color-foreground)" }}>{run.symbol} 投资研究报告</div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handlePublishToHub}
              disabled={publishing}
              className="flex-1 px-4 py-2.5 rounded-lg btn-gradient font-semibold disabled:opacity-50"
            >
              {publishing ? "发布中..." : "确认发布"}
            </button>
            <button
              onClick={() => setShowPublishModal(false)}
              className="flex-1 px-4 py-2.5 rounded-lg btn-ghost"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        title="删除报告记录"
        message="确定要删除此报告记录吗？此操作不可恢复。"
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
        confirmText="确认删除"
      />
    </div>
  );
}
