"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, RefreshCw, Database, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Partition {
  partition_name: string;
  partition_size: string;
  row_count: number;
  partition_start: string;
  partition_end: string;
}

const TABLES = [
  { value: "audit_logs", label: "审计日志 (audit_logs)" },
  { value: "report_credit_events", label: "积分事件 (report_credit_events)" },
];

export function PartitionManager() {
  const [selectedTable, setSelectedTable] = useState("audit_logs");
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPartitions = async (table: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/partitions?table=${table}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "获取分区信息失败");
      }

      const data = await response.json();
      setPartitions(data.data.partitions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取分区信息失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartition = async (monthsAhead: number = 1) => {
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/partitions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          monthsAhead,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "创建分区失败");
      }

      const data = await response.json();
      setSuccess(data.data.message);

      // Refresh partition list
      await fetchPartitions(selectedTable);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建分区失败");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchPartitions(selectedTable);
  }, [selectedTable]);

  return (
    <div className="space-y-6">
      {/* Table Selection */}
      <Card>
        <CardHeader>
          <CardTitle>分区表管理</CardTitle>
          <CardDescription>
            查看和管理数据库表分区，提高查询性能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="选择表" />
                </SelectTrigger>
                <SelectContent>
                  {TABLES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => fetchPartitions(selectedTable)}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Partition Actions */}
      <Card>
        <CardHeader>
          <CardTitle>分区操作</CardTitle>
          <CardDescription>创建新分区或清理旧分区</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleCreatePartition(1)}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  创建下月分区
                </>
              )}
            </Button>

            <Button
              onClick={() => handleCreatePartition(2)}
              variant="outline"
              disabled={creating}
            >
              创建未来2个月
            </Button>

            <Button
              onClick={() => handleCreatePartition(3)}
              variant="outline"
              disabled={creating}
            >
              创建未来3个月
            </Button>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p>建议每月初创建新分区，确保数据有正确的分区存储</p>
              <p className="text-xs text-muted-foreground mt-1">
                可以使用pg_cron自动化此过程
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Partition List */}
      <Card>
        <CardHeader>
          <CardTitle>现有分区</CardTitle>
          <CardDescription>
            {selectedTable} 表的所有分区
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : partitions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分区名称</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>行数</TableHead>
                    <TableHead>范围</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partitions.map((partition, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {partition.partition_name}
                      </TableCell>
                      <TableCell>{partition.partition_size || "N/A"}</TableCell>
                      <TableCell>{partition.row_count?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {partition.partition_start || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无分区数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning about deleting partitions */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            删除旧分区
          </CardTitle>
          <CardDescription className="text-yellow-700 dark:text-yellow-300">
            删除操作仅限超级管理员，且操作不可逆
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            删除旧分区前，请确保已备份重要数据。默认保留期为12个月。
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
            使用 SQL 命令删除: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 py-0.5 rounded">
              SELECT fn_drop_old_partitions('{selectedTable}', 12);
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
