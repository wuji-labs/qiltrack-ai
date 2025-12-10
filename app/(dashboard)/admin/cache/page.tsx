import { Metadata } from "next";
import { CacheStatsView } from "@/components/admin/cache-stats-view";

export const metadata: Metadata = {
  title: "缓存统计 | 管理后台",
  description: "LLM缓存性能统计和监控",
};

export default function CacheStatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LLM缓存统计</h1>
        <p className="text-muted-foreground">
          监控缓存命中率、成本节省和性能指标
        </p>
      </div>

      <CacheStatsView />
    </div>
  );
}
