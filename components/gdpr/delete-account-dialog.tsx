"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

  const handleDelete = async () => {
    if (!password) {
      setError("请输入密码以确认身份");
      return;
    }

    if (confirmation !== CONFIRMATION_TEXT) {
      setError(`请输入 "${CONFIRMATION_TEXT}" 以确认删除`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmation,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "删除失败");
      }

      // Account deleted successfully - redirect to home page
      router.push("/?deleted=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            删除账户
          </DialogTitle>
          <DialogDescription>
            此操作永久且不可撤销。您的所有数据将被永久删除。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">警告：此操作无法撤销！</p>
              <p className="text-sm">删除账户将永久移除：</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li>个人资料和认证信息</li>
                <li>所有积分和交易记录</li>
                <li>生成的报告和历史记录</li>
                <li>审计日志和活动记录</li>
                <li>订阅和付款信息</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="输入您的密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              输入当前密码以验证身份
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">确认删除</Label>
            <Input
              id="confirmation"
              type="text"
              placeholder={CONFIRMATION_TEXT}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              输入 <code className="font-mono bg-muted px-1 py-0.5 rounded">{CONFIRMATION_TEXT}</code> 以确认
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || !password || confirmation !== CONFIRMATION_TEXT}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  永久删除我的账户
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPassword("");
                setConfirmation("");
                setError("");
              }}
              disabled={loading}
              className="w-full"
            >
              取消
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>在删除账户前，您可以先导出数据进行备份</p>
            <p>如有活跃订阅，删除前需先取消订阅</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
