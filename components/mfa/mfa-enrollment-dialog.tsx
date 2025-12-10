"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Download, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface MFAEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrollmentComplete: () => void;
}

export function MFAEnrollmentDialog({
  open,
  onOpenChange,
  onEnrollmentComplete,
}: MFAEnrollmentDialogProps) {
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [deviceName, setDeviceName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnroll = async () => {
    if (!deviceName.trim()) {
      setError("请输入设备名称");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/mfa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "注册失败");
      }

      const data = await response.json();
      setQrCodeUrl(data.data.qrCodeUrl);
      setSecret(data.data.secret);
      setBackupCodes(data.data.backupCodes);
      setDeviceId(data.data.deviceId);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("请输入6位验证码");
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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "验证失败");
      }

      setStep("backup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qiltrack-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    onEnrollmentComplete();
    onOpenChange(false);
    // Reset state
    setStep("setup");
    setDeviceName("");
    setVerificationCode("");
    setQrCodeUrl("");
    setSecret("");
    setBackupCodes([]);
    setDeviceId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            启用双因素认证 (MFA)
          </DialogTitle>
          <DialogDescription>
            {step === "setup" && "为您的账户添加额外的安全保护"}
            {step === "verify" && "验证您的认证器应用"}
            {step === "backup" && "保存恢复码"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "setup" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">设备名称</Label>
              <Input
                id="deviceName"
                placeholder="例如: 我的 iPhone"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                输入一个容易识别的设备名称
              </p>
            </div>

            <Button
              onClick={handleEnroll}
              disabled={loading || !deviceName.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                "下一步"
              )}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  使用认证器应用扫描此二维码
                </p>
                <p className="text-xs text-muted-foreground">
                  推荐: Google Authenticator、Authy、Microsoft Authenticator
                </p>
              </div>

              <div className="w-full space-y-2">
                <Label className="text-xs text-muted-foreground">
                  或手动输入密钥:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">验证码</Label>
              <Input
                id="verificationCode"
                placeholder="输入6位数字"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                输入认证器应用中显示的6位验证码
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("setup")}
                disabled={loading}
                className="flex-1"
              >
                返回
              </Button>
              <Button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
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
            </div>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-medium">请保存这些恢复码!</p>
                <p className="text-sm">
                  如果您丢失了认证器设备，可以使用这些恢复码登录。每个恢复码只能使用一次。
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="text-xs font-mono text-center py-1 px-2 bg-background rounded"
                  >
                    {code}
                  </code>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleDownloadBackupCodes}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                下载恢复码
              </Button>
            </div>

            <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                双因素认证已成功启用！
              </AlertDescription>
            </Alert>

            <Button onClick={handleComplete} className="w-full">
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
