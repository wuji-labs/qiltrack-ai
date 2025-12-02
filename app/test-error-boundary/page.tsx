"use client";

import { useState } from "react";

/**
 * ErrorBoundary 测试页面
 * 访问 /test-error-boundary 来测试全局错误边界
 */
export default function TestErrorBoundaryPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("这是一个测试错误 - ErrorBoundary 应该捕获它");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <div className="max-w-md w-full space-y-6 rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 p-6 sm:p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">ErrorBoundary 测试</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            点击按钮触发一个错误,验证 ErrorBoundary 是否正常工作
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShouldThrow(true)}
            className="w-full rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            触发错误
          </button>

          <a
            href="/"
            className="block w-full text-center rounded-full border border-[var(--stroke-soft)] px-6 py-3 text-sm font-medium text-[var(--text-dim)] transition hover:border-[var(--accent-emerald)] hover:text-[var(--color-foreground)]"
          >
            返回首页
          </a>
        </div>

        <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/50 p-4">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">验收标准:</h2>
          <ul className="text-xs text-[var(--text-subtle)] space-y-1 list-disc list-inside">
            <li>点击按钮后应该显示错误页面</li>
            <li>错误页面应该有友好的 UI</li>
            <li>应该显示错误信息</li>
            <li>应该有"刷新页面"和"重试"按钮</li>
            <li>控制台应该记录错误详情</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-xs text-[var(--text-subtle)]">仅用于开发测试,生产环境应删除此页面</p>
        </div>
      </div>
    </div>
  );
}
