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

  const totalPages = Math.ceil(totalCount / pageSize);

  function getStatusColor(status: string | null) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function formatDuration(ms?: number | null) {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">生成记录</h1>
        <p className="mt-2 text-sm text-gray-600">查看所有报告生成记录,包括成功和失败的记录</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">总记录数</div>
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">成功</div>
          <div className="text-2xl font-bold text-green-600">
            {runs.filter((r) => r.status === "completed").length}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">失败</div>
          <div className="text-2xl font-bold text-red-600">
            {runs.filter((r) => r.status === "failed").length}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">进行中</div>
          <div className="text-2xl font-bold text-blue-600">
            {runs.filter((r) => r.status === "running" || r.status === "pending").length}
          </div>
        </div>
      </div>

      {/* 过滤和搜索 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索股票代码或用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      股票代码
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      模型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      耗时
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? "未找到匹配的记录" : "暂无生成记录"}
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{run.symbol}</div>
                          <div className="text-xs text-gray-500">
                            {run.language || "en"} / {run.tone || "professional"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {run.profiles?.display_name || run.profiles?.email || "未知用户"}
                          </div>
                          <div className="text-xs text-gray-500">{run.profiles?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              run.status
                            )}`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {run.model || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(run.duration_ms)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {run.created_at ? new Date(run.created_at).toLocaleString("zh-CN") : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedRun(run)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(page - 1) * pageSize + 1}</span> 到{" "}
                    <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span>{" "}
                    条,共 <span className="font-medium">{totalCount}</span> 条记录
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">生成详情</h2>
                  <p className="text-sm text-gray-500 mt-1">ID: {selectedRun.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">股票代码</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRun.symbol}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <span
                      className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedRun.status
                      )}`}
                    >
                      {selectedRun.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">用户</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRun.profiles?.display_name || selectedRun.profiles?.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">模型</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRun.model || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">语言</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRun.language || "en"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">风格</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRun.tone || "professional"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">耗时</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDuration(selectedRun.duration_ms)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">创建时间</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRun.created_at
                        ? new Date(selectedRun.created_at).toLocaleString("zh-CN")
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* 文件路径 */}
                {(() => {
                  const hasFiles = Boolean(selectedRun.markdown_path) || Boolean(selectedRun.docx_path);
                  if (!hasFiles) return null;

                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">生成文件</label>
                      <div className="space-y-2">
                        {selectedRun.markdown_path && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Markdown:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {String(selectedRun.markdown_path)}
                            </code>
                          </div>
                        )}
                        {selectedRun.docx_path && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">DOCX:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
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
                    <label className="block text-sm font-medium text-red-700 mb-2">错误信息</label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <pre className="text-xs text-red-900 whitespace-pre-wrap">
                        {selectedRun.error}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 公司快照数据 */}
                {Boolean(selectedRun.company_snapshot) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司快照数据
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-gray-900">
                        {JSON.stringify(selectedRun.company_snapshot, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRun(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
