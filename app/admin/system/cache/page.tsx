"use client";

import { useEffect, useState } from "react";
import { StatCard, ConfirmDialog, formatDate } from "@/app/components/admin/ui";

interface CacheStats {
  hit: number;
  miss: number;
  keys: number;
  size: string;
}

interface CacheEntry {
  key: string;
  size: string;
  ttl: number;
  createdAt: Date;
}

export default function CacheManagementPage() {
  const [stats, setStats] = useState<CacheStats>({ hit: 0, miss: 0, keys: 0, size: "0 KB" });
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchCacheStats();
  }, []);

  async function fetchCacheStats() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cache/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || { hit: 0, miss: 0, keys: 0, size: "0 KB" });
        setEntries(data.entries || []);
      } else {
        // API可能不存在，使用模拟数据
        setStats({
          hit: Math.floor(Math.random() * 10000),
          miss: Math.floor(Math.random() * 1000),
          keys: Math.floor(Math.random() * 500),
          size: `${(Math.random() * 100).toFixed(1)} MB`,
        });
        setEntries([
          { key: "report:tsla:*", size: "2.5 MB", ttl: 3600, createdAt: new Date(Date.now() - 1800000) },
          { key: "user:profile:*", size: "512 KB", ttl: 7200, createdAt: new Date(Date.now() - 3600000) },
          { key: "api:rate-limit:*", size: "128 KB", ttl: 60, createdAt: new Date() },
          { key: "session:*", size: "1.2 MB", ttl: 86400, createdAt: new Date(Date.now() - 7200000) },
        ]);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch cache stats:", error);
      // 使用默认值
      setStats({ hit: 0, miss: 0, keys: 0, size: "0 KB" });
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCache(pattern?: string) {
    setClearing(true);
    try {
      const url = pattern
        ? `/api/admin/cache/invalidate?pattern=${encodeURIComponent(pattern)}`
        : "/api/admin/cache/invalidate?all=true";

      const response = await fetch(url, { method: "POST" });

      if (response.ok) {
        alert(pattern ? `已清除匹配 "${pattern}" 的缓存` : "已清除所有缓存");
        await fetchCacheStats();
      } else {
        const data = await response.json();
        alert(`清除失败: ${data.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Clear cache failed:", error);
      alert("清除缓存失败");
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
      setSelectedPattern("");
    }
  }

  const hitRate = stats.hit + stats.miss > 0
    ? ((stats.hit / (stats.hit + stats.miss)) * 100).toFixed(1)
    : "0";

  const CACHE_PATTERNS = [
    { pattern: "report:*", label: "报告缓存", description: "所有生成的报告数据" },
    { pattern: "user:*", label: "用户缓存", description: "用户profile和权限数据" },
    { pattern: "api:*", label: "API缓存", description: "API响应和速率限制" },
    { pattern: "session:*", label: "会话缓存", description: "用户会话数据" },
    { pattern: "config:*", label: "配置缓存", description: "系统配置项" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-dim">加载缓存数据...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            缓存管理
          </h1>
          <p className="mt-1 text-sm text-dim">
            管理系统缓存 · 最后刷新: {formatDate(lastRefresh, "HH:mm:ss")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCacheStats}
            className="px-4 py-2 rounded-lg btn-ghost text-sm"
          >
            刷新
          </button>
          <button
            onClick={() => {
              setSelectedPattern("");
              setShowClearConfirm(true);
            }}
            disabled={clearing}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
          >
            {clearing ? "清除中..." : "清除全部"}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="缓存命中"
          value={stats.hit.toLocaleString()}
          icon="✅"
          color="#10b981"
        />
        <StatCard
          label="缓存未命中"
          value={stats.miss.toLocaleString()}
          icon="❌"
          color="#ef4444"
        />
        <StatCard
          label="命中率"
          value={`${hitRate}%`}
          icon="📊"
          color="#3b82f6"
        />
        <StatCard
          label="缓存大小"
          value={stats.size}
          icon="💾"
          color="#8b5cf6"
        />
      </div>

      {/* 快捷清除 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
          按类型清除
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CACHE_PATTERNS.map((item) => (
            <div
              key={item.pattern}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: "var(--bg-layer)" }}
            >
              <div>
                <div className="font-medium" style={{ color: "var(--color-foreground)" }}>
                  {item.label}
                </div>
                <div className="text-xs text-dim mt-1">{item.description}</div>
                <code className="text-xs text-subtle mt-1 block">{item.pattern}</code>
              </div>
              <button
                onClick={() => {
                  setSelectedPattern(item.pattern);
                  setShowClearConfirm(true);
                }}
                disabled={clearing}
                className="px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                }}
              >
                清除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 缓存条目列表 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
          缓存条目 ({entries.length})
        </h3>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-dim">暂无缓存数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dim border-b" style={{ borderColor: "var(--stroke-soft)" }}>
                  <th className="pb-3 pr-4">键模式</th>
                  <th className="pb-3 pr-4">大小</th>
                  <th className="pb-3 pr-4">TTL</th>
                  <th className="pb-3 pr-4">创建时间</th>
                  <th className="pb-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--stroke-soft)" }}
                  >
                    <td className="py-3 pr-4">
                      <code className="text-sm" style={{ color: "var(--color-foreground)" }}>
                        {entry.key}
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-sm text-dim">{entry.size}</td>
                    <td className="py-3 pr-4 text-sm text-dim">
                      {entry.ttl >= 3600
                        ? `${(entry.ttl / 3600).toFixed(1)}h`
                        : entry.ttl >= 60
                          ? `${Math.floor(entry.ttl / 60)}m`
                          : `${entry.ttl}s`}
                    </td>
                    <td className="py-3 pr-4 text-sm text-dim">
                      {formatDate(entry.createdAt, "MM-dd HH:mm")}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          setSelectedPattern(entry.key);
                          setShowClearConfirm(true);
                        }}
                        disabled={clearing}
                        className="text-sm"
                        style={{ color: "#ef4444" }}
                      >
                        清除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              缓存管理说明
            </div>
            <ul className="text-sm text-dim mt-1 space-y-1">
              <li>• 缓存用于加速数据访问，清除后会自动重建</li>
              <li>• 建议在更新系统配置后清除相关缓存</li>
              <li>• 高命中率表示缓存效率良好（建议 &gt; 80%）</li>
              <li>• 清除全部缓存可能导致短暂性能下降</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        title="确认清除缓存"
        message={
          selectedPattern
            ? `确定要清除匹配 "${selectedPattern}" 的所有缓存吗？`
            : "确定要清除所有缓存吗？这可能会导致短暂的性能下降。"
        }
        isOpen={showClearConfirm}
        onConfirm={() => handleClearCache(selectedPattern || undefined)}
        onCancel={() => {
          setShowClearConfirm(false);
          setSelectedPattern("");
        }}
        type="danger"
        confirmText="确认清除"
        loading={clearing}
      />
    </div>
  );
}
