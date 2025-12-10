/**
 * TOTP (Time-based One-Time Password) Implementation
 * RFC 6238: https://tools.ietf.org/html/rfc6238
 *
 * Provides Time-based OTP generation and validation for MFA
 */

import * as crypto from "crypto";

/**
 * Generate a random TOTP secret (base32 encoded)
 * Secret length: 160 bits (32 base32 characters)
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20); // 160 bits
  return base32Encode(buffer);
}

/**
 * Generate TOTP code for given secret and time
 * @param secret - Base32 encoded secret
 * @param time - Unix timestamp (defaults to current time)
 * @param digits - Number of digits in code (default: 6)
 * @param period - Time step in seconds (default: 30)
 */
export function generateTOTPCode(
  secret: string,
  time: number = Math.floor(Date.now() / 1000),
  digits: number = 6,
  period: number = 30
): string {
  const counter = Math.floor(time / period);
  const secretBuffer = base32Decode(secret);

  // HMAC-SHA1 hash
  const hmac = crypto.createHmac("sha1", secretBuffer);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Generate N-digit code
  const otp = (code % Math.pow(10, digits)).toString().padStart(digits, "0");
  return otp;
}

/**
 * Verify TOTP code
 * @param secret - Base32 encoded secret
 * @param code - User-provided OTP code
 * @param window - Time window for validation (±N periods, default: 1)
 * @param digits - Number of digits in code (default: 6)
 * @param period - Time step in seconds (default: 30)
 */
export function verifyTOTPCode(
  secret: string,
  code: string,
  window: number = 1,
  digits: number = 6,
  period: number = 30
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check current period and ±window periods
  for (let i = -window; i <= window; i++) {
    const time = currentTime + i * period;
    const expectedCode = generateTOTPCode(secret, time, digits, period);

    if (constantTimeCompare(code, expectedCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate OTPAuth URL for QR code
 * Format: otpauth://totp/{issuer}:{accountName}?secret={secret}&issuer={issuer}
 */
export function generateOTPAuthURL(
  secret: string,
  accountName: string,
  issuer: string = "Qiltrack AI",
  digits: number = 6,
  period: number = 30
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: digits.toString(),
    period: period.toString(),
  });

  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    accountName
  )}?${params.toString()}`;
}

/**
 * Generate backup codes for account recovery
 * Format: XXXX-XXXX-XXXX (12 alphanumeric characters, grouped)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const buffer = crypto.randomBytes(6); // 48 bits
    const code = buffer
      .toString("hex")
      .toUpperCase()
      .match(/.{1,4}/g)!
      .join("-");
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup code for storage (SHA-256)
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Verify backup code against hashed value
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  const inputHash = hashBackupCode(code);
  return constantTimeCompare(inputHash, hashedCode);
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt
 * @param key - Encryption key (32 bytes for AES-256)
 */
export function encrypt(data: string, key: string): string {
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, key: string): string {
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Base32 encoding (RFC 4648)
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Base32 decoding (RFC 4648)
 */
function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < input.length; i++) {
    const idx = alphabet.indexOf(input[i].toUpperCase());
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
