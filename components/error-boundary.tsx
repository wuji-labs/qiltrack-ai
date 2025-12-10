"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      this.logErrorToService(error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Example: Send to backend API for logging
    fetch("/api/errors/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch((err) => {
      console.error("Failed to log error to service:", err);
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  handleReportBug = (): void => {
    const { error, errorInfo } = this.state;

    const subject = encodeURIComponent(`Bug Report: ${error?.name || "Error"}`);
    const body = encodeURIComponent(`
Error Details:
--------------
Name: ${error?.name}
Message: ${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}

Browser: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Additional Information:
-----------------------
[Please describe what you were doing when the error occurred]
    `.trim());

    window.open(`mailto:support@qiltrack.ai?subject=${subject}&body=${body}`);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const { error, errorInfo } = this.state;
      const showDetails = this.props.showDetails ?? process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <Card className="w-full max-w-2xl border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle className="text-2xl">出错了</CardTitle>
              </div>
              <CardDescription>
                应用程序遇到了意外错误。我们已记录此问题,并将尽快修复。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>错误信息</AlertTitle>
                <AlertDescription className="font-mono text-sm mt-2">
                  {error?.message || "Unknown error occurred"}
                </AlertDescription>
              </Alert>

              {/* Error Details (Development Only) */}
              {showDetails && error && (
                <div className="space-y-2">
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      技术细节 (仅在开发环境显示)
                    </summary>
                    <div className="mt-2 space-y-2">
                      {/* Error Stack */}
                      {error.stack && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs font-medium mb-1">Stack Trace:</p>
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {/* Component Stack */}
                      {errorInfo?.componentStack && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs font-medium mb-1">Component Stack:</p>
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>

                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  返回首页
                </Button>

                <Button onClick={this.handleReportBug} variant="outline">
                  <Bug className="mr-2 h-4 w-4" />
                  报告问题
                </Button>
              </div>

              {/* Help Text */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  如果问题持续存在,请联系技术支持:{" "}
                  <a
                    href="mailto:support@qiltrack.ai"
                    className="text-primary hover:underline"
                  >
                    support@qiltrack.ai
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary Hook
 *
 * For catching errors in async operations (useEffect, event handlers)
 * that aren't caught by the Error Boundary component.
 *
 * @example
 * ```tsx
 * const Component = () => {
 *   const throwAsyncError = useAsyncError();
 *
 *   useEffect(() => {
 *     fetchData().catch(throwAsyncError);
 *   }, []);
 * };
 * ```
 */
export function useAsyncError() {
  const [, setError] = React.useState();

  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}

/**
 * Error Reset Component
 *
 * Provides a way to reset error boundary from child components
 *
 * @example
 * ```tsx
 * const ChildComponent = () => {
 *   const resetError = useErrorReset();
 *   return <button onClick={resetError}>Try Again</button>;
 * };
 * ```
 */
const ErrorResetContext = React.createContext<(() => void) | null>(null);

export function useErrorReset() {
  const reset = React.useContext(ErrorResetContext);
  if (!reset) {
    throw new Error("useErrorReset must be used within ErrorBoundaryWithReset");
  }
  return reset;
}

/**
 * Error Boundary with Reset Context
 *
 * Allows child components to reset the error boundary
 */
export function ErrorBoundaryWithReset({
  children,
  ...props
}: ErrorBoundaryProps) {
  const errorBoundaryRef = React.useRef<ErrorBoundary>(null);

  const handleReset = React.useCallback(() => {
    if (errorBoundaryRef.current) {
      // @ts-ignore - accessing private method for reset
      errorBoundaryRef.current.handleReset();
    }
  }, []);

  return (
    <ErrorResetContext.Provider value={handleReset}>
      <ErrorBoundary ref={errorBoundaryRef} {...props}>
        {children}
      </ErrorBoundary>
    </ErrorResetContext.Provider>
  );
}
