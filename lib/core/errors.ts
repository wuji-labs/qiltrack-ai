/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when user has insufficient credits
 */
export class InsufficientCreditsError extends AppError {
  constructor(message = "积分不足", details?: any) {
    super("INSUFFICIENT_CREDITS", message, 403, details);
  }
}

/**
 * Error thrown when report generation fails
 */
export class ReportGenerationError extends AppError {
  constructor(message: string, details?: any) {
    super("REPORT_GENERATION_FAILED", message, 500, details);
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message = "未授权", details?: any) {
    super("UNAUTHORIZED", message, 401, details);
  }
}

/**
 * Error thrown when user doesn't have required permissions
 */
export class ForbiddenError extends AppError {
  constructor(message = "权限不足", details?: any) {
    super("FORBIDDEN", message, 403, details);
  }
}

/**
 * Error thrown when requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message = "资源不存在", details?: any) {
    super("NOT_FOUND", message, 404, details);
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

/**
 * Error thrown when external service fails
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super("EXTERNAL_SERVICE_ERROR", message, 502, details);
  }
}
