/**
 * Input validation utilities for API security
 *
 * Implements whitelist validation to prevent injection attacks
 */

import { ValidationError } from "@/lib/core/errors";

/**
 * Validate stock symbol format
 * Allows: A-Z, 0-9, hyphen, dot (common in stock symbols)
 * Max length: 10 characters
 */
export function validateSymbol(symbol: string | null | undefined): string {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError("Missing required parameter: symbol");
  }

  const trimmed = symbol.toUpperCase().trim();

  // Length validation
  if (trimmed.length === 0) {
    throw new ValidationError("Symbol cannot be empty");
  }

  if (trimmed.length > 10) {
    throw new ValidationError("Invalid symbol: too long (max 10 characters)");
  }

  // Whitelist validation: only allow alphanumeric, hyphen, and dot
  if (!/^[A-Z0-9\-.]+$/.test(trimmed)) {
    throw new ValidationError(
      "Invalid symbol format. Only letters, numbers, hyphens, and dots are allowed"
    );
  }

  // Additional safety: prevent common XSS patterns
  const dangerousPatterns = ['<', '>', '"', "'", '&', '(', ')', ';', '|', '`'];
  if (dangerousPatterns.some(pattern => trimmed.includes(pattern))) {
    throw new ValidationError("Invalid symbol: contains forbidden characters");
  }

  return trimmed;
}

/**
 * Validate email format
 */
export function validateEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    throw new ValidationError("Invalid email address");
  }

  const trimmed = email.trim().toLowerCase();

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(trimmed)) {
    throw new ValidationError("Invalid email address format");
  }

  // Max length check
  if (trimmed.length > 254) {
    throw new ValidationError("Email address too long");
  }

  return trimmed;
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string | null | undefined): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new ValidationError("Invalid UUID");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    throw new ValidationError("Invalid UUID format");
  }

  return uuid.toLowerCase();
}

/**
 * Validate integer within range
 */
export function validateInteger(
  value: string | number | null | undefined,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined) {
    throw new ValidationError("Missing required integer value");
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(num) || !Number.isInteger(num)) {
    throw new ValidationError("Invalid integer value");
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`Value must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`Value must be at most ${max}`);
  }

  return num;
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newline and tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

export function validatePagination(
  page?: string | number,
  pageSize?: string | number
): PaginationParams {
  const pageNum = page ? validateInteger(page, 1, 1000) : 1;
  const pageSizeNum = pageSize ? validateInteger(pageSize, 1, 100) : 20;

  return {
    page: pageNum,
    pageSize: pageSizeNum,
    offset: (pageNum - 1) * pageSizeNum,
  };
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): void {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Size check
  if (file.size > maxSize) {
    throw new ValidationError(
      `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`
    );
  }

  // MIME type check
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Extension check
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new ValidationError(
        `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`
      );
    }
  }
}

/**
 * Hash user ID for logging (privacy protection)
 */
export function hashUserId(userId: string): string {
  // Simple hash for privacy - use first 8 chars of user ID
  return userId.substring(0, 8) + '...';
}

/**
 * Mask email for logging
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';

  const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Validate URL
 */
export function validateURL(url: string, allowedDomains?: string[]): string {
  try {
    const parsed = new URL(url);

    // Only allow https (or http for localhost)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new ValidationError("Only HTTPS URLs are allowed");
    }

    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      throw new ValidationError("HTTP only allowed for localhost");
    }

    // Domain whitelist
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        throw new ValidationError(
          `Domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`
        );
      }
    }

    return parsed.toString();
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Invalid URL format");
  }
}
