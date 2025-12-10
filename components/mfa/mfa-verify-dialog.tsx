"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield } from "lucide-react";

interface MFAVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationSuccess: () => void;
  deviceId?: string;
}

export function MFAVerifyDialog({
  open,
  onOpenChange,
  onVerificationSuccess,
  deviceId,
}: MFAVerifyDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!verificationCode || (useBackupCode ? verificationCode.length < 8 : verificationCode.length !== 6)) {
      setError(useBackupCode ? "请输入完整的恢复码" : "请输入6位验证码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          code: verificationCode,
          useBackupCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "验证失败");
      }

      onVerificationSuccess();
      onOpenChange(false);
      setVerificationCode("");
      setUseBackupCode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            双因素认证验证
          </DialogTitle>
          <DialogDescription>
            {useBackupCode
              ? "输入您保存的恢复码"
              : "输入认证器应用中的验证码"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verificationCode">
              {useBackupCode ? "恢复码" : "验证码"}
            </Label>
            <Input
              id="verificationCode"
              placeholder={useBackupCode ? "输入恢复码" : "输入6位数字"}
              value={verificationCode}
              onChange={(e) => {
                const value = useBackupCode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, "").slice(0, 6);
                setVerificationCode(value);
              }}
              onKeyPress={handleKeyPress}
              disabled={loading}
              maxLength={useBackupCode ? 12 : 6}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              {useBackupCode
                ? "恢复码是您在设置MFA时保存的备用代码"
                : "打开您的认证器应用获取验证码"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleVerify}
              disabled={loading || !verificationCode}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : (
                "验证"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode("");
                setError("");
              }}
              disabled={loading}
              className="w-full text-sm"
            >
              {useBackupCode ? "使用认证器验证码" : "使用恢复码"}
            </Button>
          </div>

          {!useBackupCode && (
            <div className="text-center text-xs text-muted-foreground">
              丢失了认证器设备？使用恢复码进行验证
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
