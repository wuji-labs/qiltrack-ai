"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Magic Link 测试工具
 * 用于本地开发环境绕过 QQ 邮箱的链接重定向问题
 */
export default function MagicLinkTestPage() {
  const router = useRouter();
  const [tokenHash, setTokenHash] = useState("");
  const [type, setType] = useState<"magiclink" | "recovery">("magiclink");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenHash) {
      alert("请输入 token_hash");
      return;
    }

    // 重定向到确认页面
    const url = `/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`;
    router.push(url);
  };

  const extractTokenFromUrl = () => {
    const clipboardText = prompt("请粘贴完整的邮件链接 URL:");
    if (!clipboardText) return;

    try {
      // 尝试从 URL 中提取 token_hash
      const match = clipboardText.match(/token_hash=([^&]+)/);
      if (match) {
        setTokenHash(decodeURIComponent(match[1]));
        alert("Token 已提取成功！");
      } else {
        alert("无法从 URL 中提取 token_hash");
      }
    } catch (err) {
      alert("解析失败: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-xl">
          <h1 className="text-2xl font-semibold mb-2">Magic Link 测试工具</h1>
          <p className="text-sm text-subtle mb-6">
            用于绕过 QQ 邮箱的链接重定向问题
          </p>

          <div className="space-y-4 mb-6">
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-200 font-semibold mb-2">⚠️ 仅用于开发环境</p>
              <p className="text-xs text-yellow-300/80">
                生产环境使用真实域名不会有此问题
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                认证类型
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "magiclink" | "recovery")}
                className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-4 py-3 text-base focus:outline-none focus:border-[var(--accent-emerald)]"
              >
                <option value="magiclink">Magic Link (登录)</option>
                <option value="recovery">Password Recovery (重置密码)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Token Hash
              </label>
              <textarea
                value={tokenHash}
                onChange={(e) => setTokenHash(e.target.value)}
                placeholder="pkce_792940ad4d471ede867c6c7715361d5b67c04ed38cee338db8b13827"
                rows={3}
                className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-4 py-3 text-sm font-mono focus:outline-none focus:border-[var(--accent-emerald)]"
              />
              <p className="text-xs text-subtle mt-2">
                从邮件链接中复制 token_hash 参数的值
              </p>
            </div>

            <button
              type="button"
              onClick={extractTokenFromUrl}
              className="w-full rounded-xl border border-[var(--stroke-soft)] py-3 text-sm text-dim hover:text-[var(--color-foreground)] hover:border-[var(--accent-emerald)]"
            >
              📋 从完整 URL 中提取 Token
            </button>

            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--accent-emerald)] py-3 text-base font-semibold text-slate-950 hover:brightness-110"
            >
              确认并登录
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--stroke-soft)]">
            <p className="text-xs text-subtle mb-2">使用步骤:</p>
            <ol className="text-xs text-dim space-y-1 list-decimal list-inside">
              <li>在邮件中右键点击链接，选择"复制链接地址"</li>
              <li>点击"从完整 URL 中提取 Token"按钮</li>
              <li>粘贴完整的邮件链接</li>
              <li>或者手动复制 token_hash 参数的值</li>
              <li>点击"确认并登录"</li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-subtle hover:text-[var(--accent-emerald)]"
            >
              ← 返回登录页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
