"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, TrendingUp, DollarSign, Database, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  estimatedSavingsUSD: number;
  topKeys: Array<{ key: string; hits: number }>;
}

export function CacheStatsView() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/cache/stats");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "获取统计信息失败");
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取统计信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const hitRatePercentage = (stats.hitRate * 100).toFixed(2);
  const totalRequests = stats.totalHits + stats.totalMisses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hitRatePercentage}%</div>
            <Progress value={stats.hitRate * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalHits} / {totalRequests} 请求命中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成本节省</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.estimatedSavingsUSD.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              预估累计节省
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缓存命中</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              总命中次数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缓存未命中</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMisses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              总未命中次数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Cached Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>热门缓存键</CardTitle>
              <CardDescription>
                命中次数最多的前10个缓存键
              </CardDescription>
            </div>
            <Button onClick={fetchStats} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.topKeys && stats.topKeys.length > 0 ? (
            <div className="space-y-4">
              {stats.topKeys.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate">{item.key}</p>
                    <p className="text-xs text-muted-foreground">
                      排名 #{index + 1}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.hits.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">命中</p>
                    </div>
                    <div className="w-24">
                      <Progress
                        value={(item.hits / stats.topKeys[0].hits) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无缓存数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>性能洞察</CardTitle>
          <CardDescription>缓存系统性能分析</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">缓存效率评估</p>
              <div className="flex items-center gap-2">
                {stats.hitRate >= 0.7 ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      优秀 - 命中率 {">"}= 70%
                    </span>
                  </>
                ) : stats.hitRate >= 0.5 ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                      良好 - 命中率 {">"}= 50%
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      需改进 - 命中率 {"<"} 50%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">预估月度节省</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  ${(stats.estimatedSavingsUSD * 30).toFixed(2)} / 月
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              注: 成本节省基于假设每个LLM请求平均成本$0.01。实际节省可能因模型和token使用而异。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
