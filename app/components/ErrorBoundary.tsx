"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
    // TODO Phase 3: 集成 Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
          <div className="max-w-md w-full space-y-6 rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <svg
                  className="h-12 w-12 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[var(--color-foreground)]">出错了</h2>
              <p className="text-sm text-[var(--text-subtle)]">抱歉，页面遇到了一些问题</p>
            </div>

            {/* Error Message */}
            {this.state.error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-4">
                <p className="text-sm font-mono text-red-300 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Error Details (collapsible) */}
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--text-dim)] hover:text-[var(--color-foreground)]">
                  显示错误详情 (仅开发模式)
                </summary>
                <pre className="mt-3 text-xs text-[var(--text-subtle)] overflow-auto max-h-48 p-2 rounded bg-[var(--bg-base)] border border-[var(--stroke-soft)]">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 rounded-full bg-[var(--accent-emerald)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-emerald)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-emerald)]"
              >
                刷新页面
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-full border border-[var(--stroke-soft)] px-6 py-3 text-sm font-medium text-[var(--text-dim)] transition hover:border-[var(--accent-emerald)] hover:text-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-emerald)]"
              >
                重试
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-[var(--text-subtle)]">
                如果问题持续存在，请{" "}
                <a
                  href="mailto:support@qiltrack.com"
                  className="text-[var(--accent-emerald)] hover:underline"
                >
                  联系技术支持
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
