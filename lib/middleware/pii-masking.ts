/**
 * PII (Personally Identifiable Information) Data Masking Middleware
 *
 * Automatically masks sensitive data in logs and API responses
 * Compliance: GDPR Article 32 (Security of Processing), CCPA, HIPAA
 */

import { maskEmail } from "@/lib/utils/validation";

// PII field patterns to detect
const PII_FIELD_PATTERNS = [
  // Email
  /email/i,
  /e-mail/i,
  /mail/i,

  // Names
  /name/i,
  /firstName/i,
  /lastName/i,
  /fullName/i,
  /displayName/i,

  // Identification
  /ssn/i,
  /social.*security/i,
  /passport/i,
  /license/i,
  /tax.*id/i,

  // Financial
  /credit.*card/i,
  /card.*number/i,
  /cvv/i,
  /account.*number/i,
  /routing.*number/i,
  /iban/i,
  /swift/i,

  // Location
  /address/i,
  /street/i,
  /city/i,
  /postal.*code/i,
  /zip.*code/i,

  // Contact
  /phone/i,
  /mobile/i,
  /tel/i,

  // Authentication
  /password/i,
  /token/i,
  /secret/i,
  /api.*key/i,
  /auth/i,

  // Medical (HIPAA)
  /health/i,
  /medical/i,
  /diagnosis/i,

  // Personal
  /birthday/i,
  /birthdate/i,
  /dob/i,
  /age/i,
  /gender/i,
  /race/i,
  /ethnicity/i,
  /religion/i,
];

/**
 * Check if a field name is likely to contain PII
 */
export function isPIIField(fieldName: string): boolean {
  return PII_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Mask email address
 * Example: john.doe@example.com -> j***e@example.com
 */
export function maskEmailAddress(email: string): string {
  return maskEmail(email);
}

/**
 * Mask phone number
 * Example: +1-234-567-8900 -> +1-***-***-8900
 */
export function maskPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 4) {
    return "***";
  }

  // Keep first digit (country code) and last 4 digits
  const masked = digits.substring(0, 1) + "***" + digits.substring(digits.length - 4);

  // Reconstruct with formatting
  return phone.replace(/\d/g, (match, index) => {
    const digitIndex = phone.substring(0, index).replace(/\D/g, "").length;
    if (digitIndex === 0 || digitIndex >= digits.length - 4) {
      return match;
    }
    return "*";
  });
}

/**
 * Mask credit card number
 * Example: 4532-1234-5678-9010 -> ****-****-****-9010
 */
export function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.length < 4) {
    return "****";
  }

  // Keep last 4 digits only
  const masked = "*".repeat(digits.length - 4) + digits.substring(digits.length - 4);

  // Reconstruct with formatting
  let maskedIndex = 0;
  return cardNumber.replace(/\d/g, () => masked[maskedIndex++] || "*");
}

/**
 * Mask SSN (Social Security Number)
 * Example: 123-45-6789 -> ***-**-6789
 */
export function maskSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, "");

  if (digits.length < 4) {
    return "***";
  }

  // Keep last 4 digits only
  return "***-**-" + digits.substring(digits.length - 4);
}

/**
 * Mask generic string (show first and last character)
 * Example: "John Doe" -> "J******e"
 */
export function maskString(str: string, showChars: number = 1): string {
  if (!str || str.length <= showChars * 2) {
    return "***";
  }

  const start = str.substring(0, showChars);
  const end = str.substring(str.length - showChars);
  const middle = "*".repeat(Math.min(str.length - showChars * 2, 6));

  return start + middle + end;
}

/**
 * Mask IP address (keep first octet only)
 * Example: 192.168.1.100 -> 192.*.*.*
 */
export function maskIPAddress(ip: string): string {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return "***";
  }

  return parts[0] + ".*.*.*";
}

/**
 * Mask UUID (keep first 8 characters)
 * Example: 550e8400-e29b-41d4-a716-446655440000 -> 550e8400-****
 */
export function maskUUID(uuid: string): string {
  return uuid.substring(0, 8) + "-****";
}

/**
 * Automatically detect and mask PII in a string value
 */
export function autoMaskValue(value: string): string {
  // Email pattern
  if (/@/.test(value) && /\.[a-z]{2,}$/i.test(value)) {
    return maskEmailAddress(value);
  }

  // Phone pattern
  if (/^[\d\s\-\+\(\)]{10,}$/.test(value)) {
    return maskPhoneNumber(value);
  }

  // Credit card pattern (13-19 digits with optional separators)
  if (/^[\d\s\-]{13,19}$/.test(value.replace(/\s/g, ""))) {
    return maskCreditCard(value);
  }

  // SSN pattern
  if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
    return maskSSN(value);
  }

  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return maskUUID(value);
  }

  // IP address pattern
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
    return maskIPAddress(value);
  }

  // Generic masking for long strings
  if (value.length > 10) {
    return maskString(value);
  }

  return value;
}

/**
 * Recursively mask PII in an object
 * @param obj - Object to mask
 * @param depth - Maximum recursion depth (default: 10)
 */
export function maskPII(obj: any, depth: number = 10): any {
  if (depth <= 0) {
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => maskPII(item, depth - 1));
  }

  // Handle objects
  if (typeof obj === "object") {
    const masked: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field is PII
      if (isPIIField(key)) {
        if (typeof value === "string") {
          masked[key] = autoMaskValue(value);
        } else {
          masked[key] = "***";
        }
      } else if (typeof value === "object") {
        // Recursively mask nested objects
        masked[key] = maskPII(value, depth - 1);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  return obj;
}

/**
 * Mask PII in JSON string
 */
export function maskPIIInJSON(jsonString: string): string {
  try {
    const obj = JSON.parse(jsonString);
    const masked = maskPII(obj);
    return JSON.stringify(masked);
  } catch (error) {
    console.error("[PII_MASK] Failed to parse JSON", error);
    return jsonString;
  }
}

/**
 * Mask PII in log message
 * Detects common PII patterns in plain text
 */
export function maskPIIInLog(message: string): string {
  let masked = message;

  // Mask email addresses
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (email) =>
    maskEmailAddress(email)
  );

  // Mask phone numbers (various formats)
  masked = masked.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, (phone) =>
    maskPhoneNumber(phone)
  );

  // Mask credit card numbers
  masked = masked.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, (card) =>
    maskCreditCard(card)
  );

  // Mask SSN
  masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, (ssn) => maskSSN(ssn));

  // Mask IPv4 addresses
  masked = masked.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, (ip) => maskIPAddress(ip));

  // Mask UUIDs
  masked = masked.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    (uuid) => maskUUID(uuid)
  );

  return masked;
}

/**
 * Create a PII-safe logger wrapper
 * All log messages are automatically masked
 */
export function createSafeLogger(namespace: string) {
  const log = (level: "info" | "warn" | "error", message: string, data?: any) => {
    const maskedMessage = maskPIIInLog(message);
    const maskedData = data ? maskPII(data) : undefined;

    const logMethod = console[level] || console.log;
    if (maskedData) {
      logMethod(`[${namespace}] ${maskedMessage}`, maskedData);
    } else {
      logMethod(`[${namespace}] ${maskedMessage}`);
    }
  };

  return {
    info: (message: string, data?: any) => log("info", message, data),
    warn: (message: string, data?: any) => log("warn", message, data),
    error: (message: string, data?: any) => log("error", message, data),
  };
}

/**
 * Express/Next.js middleware to mask PII in API responses
 */
export function createPIIMaskingMiddleware() {
  return (req: any, res: any, next: any) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to mask PII
    res.json = (body: any) => {
      const masked = maskPII(body);
      return originalJson(masked);
    };

    next();
  };
}
