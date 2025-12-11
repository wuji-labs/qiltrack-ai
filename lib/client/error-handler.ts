"use client";

import { toast } from "sonner";

/**
 * Error severity levels
 */
export type ErrorSeverity = "error" | "warning" | "info";

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  /** Custom user-facing message */
  message?: string;
  /** Additional description or context */
  description?: string;
  /** Severity level (default: "error") */
  severity?: ErrorSeverity;
  /** Whether to log to console (default: true) */
  log?: boolean;
  /** Whether to report to monitoring service (default: false for now) */
  report?: boolean;
  /** Toast duration in milliseconds */
  duration?: number;
}

/**
 * Extracts a user-friendly message from an error object
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    // Handle API error responses
    if ("error" in error && typeof error.error === "object" && error.error !== null) {
      const errorObj = error.error as Record<string, unknown>;
      if ("message" in errorObj && typeof errorObj.message === "string") {
        return errorObj.message;
      }
    }
    // Handle response with message
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "未知错误";
}

/**
 * Extracts error code from an error object
 */
function extractErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "object" && error.error !== null) {
      const errorObj = error.error as Record<string, unknown>;
      if ("code" in errorObj && typeof errorObj.code === "string") {
        return errorObj.code;
      }
    }
    if ("code" in error && typeof error.code === "string") {
      return error.code;
    }
  }
  return undefined;
}

/**
 * Client-side error handler for consistent error handling and user feedback
 *
 * @example
 * ```typescript
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleClientError(error, {
 *     message: "操作失败",
 *     description: "请稍后重试",
 *     severity: "error",
 *     log: true,
 *   });
 * }
 * ```
 */
export function handleClientError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const {
    message,
    description,
    severity = "error",
    log = true,
    report = false,
    duration,
  } = options;

  // Extract error details
  const errorMessage = extractErrorMessage(error);
  const errorCode = extractErrorCode(error);

  // Log to console if enabled
  if (log) {
    const logPrefix = `[ClientError${errorCode ? `:${errorCode}` : ""}]`;
    if (severity === "error") {
      console.error(logPrefix, error);
    } else if (severity === "warning") {
      console.warn(logPrefix, error);
    } else {
      console.info(logPrefix, error);
    }
  }

  // Report to monitoring service if enabled
  // TODO: Integrate with Sentry/LogRocket when ready
  if (report) {
    // captureException(error);
  }

  // Show user-friendly toast notification
  const toastMessage = message || errorMessage;
  const toastDescription = description || (message ? errorMessage : undefined);
  const toastDuration = duration || (severity === "error" ? 5000 : 3000);

  const toastOptions = {
    description: toastDescription,
    duration: toastDuration,
  };

  switch (severity) {
    case "error":
      toast.error(toastMessage, toastOptions);
      break;
    case "warning":
      toast.warning(toastMessage, toastOptions);
      break;
    case "info":
      toast.info(toastMessage, toastOptions);
      break;
  }
}

/**
 * Specialized error handlers for common scenarios
 */
export const ErrorHandlers = {
  /**
   * Handle network/API errors
   */
  network: (error: unknown, customMessage?: string) => {
    handleClientError(error, {
      message: customMessage || "网络请求失败",
      description: "请检查网络连接后重试",
      severity: "error",
      log: true,
    });
  },

  /**
   * Handle authentication errors
   */
  auth: (error: unknown, customMessage?: string) => {
    handleClientError(error, {
      message: customMessage || "身份验证失败",
      description: "请重新登录",
      severity: "error",
      log: true,
    });
  },

  /**
   * Handle validation errors
   */
  validation: (error: unknown, customMessage?: string) => {
    handleClientError(error, {
      message: customMessage || "输入验证失败",
      severity: "warning",
      log: false,
    });
  },

  /**
   * Handle permission errors
   */
  permission: (error: unknown, customMessage?: string) => {
    handleClientError(error, {
      message: customMessage || "权限不足",
      description: "您没有执行此操作的权限",
      severity: "error",
      log: true,
    });
  },

  /**
   * Handle quota/rate limit errors
   */
  quota: (error: unknown, customMessage?: string) => {
    handleClientError(error, {
      message: customMessage || "配额已用完",
      description: "请稍后重试或升级您的套餐",
      severity: "warning",
      log: true,
    });
  },

  /**
   * Handle generic errors (fallback)
   */
  generic: (error: unknown, customMessage?: string) => {
    handleClientError(error, {
      message: customMessage || "操作失败",
      description: "请稍后重试",
      severity: "error",
      log: true,
    });
  },
};

/**
 * Async wrapper that automatically handles errors
 *
 * @example
 * ```typescript
 * const handleSubmit = withErrorHandler(
 *   async () => {
 *     await submitForm();
 *   },
 *   { message: "表单提交失败" }
 * );
 * ```
 */
export function withErrorHandler<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): () => Promise<T | undefined> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      handleClientError(error, options);
      return undefined;
    }
  };
}
