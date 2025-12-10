import { Metadata } from "next";
import { PartitionManager } from "@/components/admin/partition-manager";

export const metadata: Metadata = {
  title: "分区管理 | 管理后台",
  description: "数据库分区管理和维护",
};

export default function PartitionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">数据库分区管理</h1>
        <p className="text-muted-foreground">
          管理表分区，提高查询性能和维护效率
        </p>
      </div>

      <PartitionManager />
    </div>
  );
}
