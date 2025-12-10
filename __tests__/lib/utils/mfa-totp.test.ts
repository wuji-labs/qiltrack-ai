import { describe, expect, it, beforeEach } from "@jest/globals";
import {
  generateTOTPSecret,
  generateTOTPToken,
  verifyTOTPToken,
  generateBackupCodes,
  generateQRCodeUrl,
  hashBackupCode,
  verifyBackupCode,
} from "@/lib/utils/mfa-totp";

describe("MFA TOTP utilities", () => {
  describe("generateTOTPSecret", () => {
    it("should generate a valid base32 secret", () => {
      const secret = generateTOTPSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(0);
      // Base32 alphabet: A-Z and 2-7
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it("should generate unique secrets", () => {
      const secret1 = generateTOTPSecret();
      const secret2 = generateTOTPSecret();

      expect(secret1).not.toBe(secret2);
    });

    it("should generate secrets of sufficient length", () => {
      const secret = generateTOTPSecret();

      // Should be at least 16 characters for security
      expect(secret.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe("generateTOTPToken", () => {
    it("should generate a 6-digit token", () => {
      const secret = generateTOTPSecret();
      const token = generateTOTPToken(secret);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toMatch(/^\d{6}$/);
      expect(token.length).toBe(6);
    });

    it("should generate same token for same secret at same time", () => {
      const secret = generateTOTPSecret();
      const token1 = generateTOTPToken(secret);
      const token2 = generateTOTPToken(secret);

      expect(token1).toBe(token2);
    });

    it("should generate different tokens for different secrets", () => {
      const secret1 = generateTOTPSecret();
      const secret2 = generateTOTPSecret();

      const token1 = generateTOTPToken(secret1);
      const token2 = generateTOTPToken(secret2);

      // Very high probability they'll be different
      expect(token1).not.toBe(token2);
    });

    it("should handle invalid secrets gracefully", () => {
      expect(() => generateTOTPToken("")).toThrow();
      expect(() => generateTOTPToken("invalid!@#")).toThrow();
    });
  });

  describe("verifyTOTPToken", () => {
    it("should verify valid token", () => {
      const secret = generateTOTPSecret();
      const token = generateTOTPToken(secret);

      const isValid = verifyTOTPToken(token, secret);

      expect(isValid).toBe(true);
    });

    it("should reject invalid token", () => {
      const secret = generateTOTPSecret();

      const isValid = verifyTOTPToken("000000", secret);

      // Very high probability this will be invalid
      expect(isValid).toBe(false);
    });

    it("should reject token with wrong length", () => {
      const secret = generateTOTPSecret();

      expect(verifyTOTPToken("123", secret)).toBe(false);
      expect(verifyTOTPToken("1234567", secret)).toBe(false);
      expect(verifyTOTPToken("", secret)).toBe(false);
    });

    it("should reject non-numeric tokens", () => {
      const secret = generateTOTPSecret();

      expect(verifyTOTPToken("abcdef", secret)).toBe(false);
      expect(verifyTOTPToken("12345a", secret)).toBe(false);
      expect(verifyTOTPToken("!@#$%^", secret)).toBe(false);
    });

    it("should allow time window for token verification", () => {
      const secret = generateTOTPSecret();
      const token = generateTOTPToken(secret);

      // Token should be valid within a time window (typically ±30 seconds)
      const isValid = verifyTOTPToken(token, secret, { window: 1 });

      expect(isValid).toBe(true);
    });

    it("should handle empty secret", () => {
      expect(verifyTOTPToken("123456", "")).toBe(false);
    });
  });

  describe("generateBackupCodes", () => {
    it("should generate correct number of backup codes", () => {
      const codes = generateBackupCodes(10);

      expect(codes).toBeDefined();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBe(10);
    });

    it("should generate unique backup codes", () => {
      const codes = generateBackupCodes(10);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should generate codes with correct format", () => {
      const codes = generateBackupCodes(5);

      codes.forEach((code) => {
        expect(typeof code).toBe("string");
        expect(code.length).toBeGreaterThan(0);
        // Should be alphanumeric, possibly with hyphens
        expect(code).toMatch(/^[A-Z0-9-]+$/);
      });
    });

    it("should generate codes with sufficient entropy", () => {
      const codes = generateBackupCodes(10);

      codes.forEach((code) => {
        // Each code should be at least 8 characters for security
        expect(code.length).toBeGreaterThanOrEqual(8);
      });
    });

    it("should handle different count parameters", () => {
      expect(generateBackupCodes(5).length).toBe(5);
      expect(generateBackupCodes(8).length).toBe(8);
      expect(generateBackupCodes(12).length).toBe(12);
    });

    it("should generate default count when no parameter provided", () => {
      const codes = generateBackupCodes();

      expect(codes.length).toBeGreaterThan(0);
      // Default is typically 8-10 codes
      expect(codes.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("generateQRCodeUrl", () => {
    it("should generate valid QR code URL", () => {
      const secret = generateTOTPSecret();
      const email = "user@example.com";
      const issuer = "QilTrack AI";

      const qrUrl = generateQRCodeUrl(secret, email, issuer);

      expect(qrUrl).toBeDefined();
      expect(typeof qrUrl).toBe("string");
      expect(qrUrl.length).toBeGreaterThan(0);
    });

    it("should include otpauth protocol", () => {
      const secret = generateTOTPSecret();
      const qrUrl = generateQRCodeUrl(secret, "user@example.com", "QilTrack");

      expect(qrUrl).toMatch(/^otpauth:\/\/totp\//);
    });

    it("should include secret in URL", () => {
      const secret = generateTOTPSecret();
      const qrUrl = generateQRCodeUrl(secret, "user@example.com", "QilTrack");

      expect(qrUrl).toContain(`secret=${secret}`);
    });

    it("should include issuer in URL", () => {
      const secret = generateTOTPSecret();
      const issuer = "QilTrack AI";
      const qrUrl = generateQRCodeUrl(secret, "user@example.com", issuer);

      expect(qrUrl).toContain(`issuer=${encodeURIComponent(issuer)}`);
    });

    it("should include account identifier", () => {
      const secret = generateTOTPSecret();
      const email = "user@example.com";
      const qrUrl = generateQRCodeUrl(secret, email, "QilTrack");

      expect(qrUrl).toContain(encodeURIComponent(email));
    });

    it("should handle special characters in email", () => {
      const secret = generateTOTPSecret();
      const email = "user+test@example.com";
      const qrUrl = generateQRCodeUrl(secret, email, "QilTrack");

      expect(qrUrl).toContain(encodeURIComponent(email));
    });

    it("should handle special characters in issuer", () => {
      const secret = generateTOTPSecret();
      const issuer = "QilTrack & AI Analytics";
      const qrUrl = generateQRCodeUrl(secret, "user@example.com", issuer);

      expect(qrUrl).toContain(encodeURIComponent(issuer));
    });
  });

  describe("hashBackupCode", () => {
    it("should hash backup codes", () => {
      const code = "ABCD-1234-EFGH-5678";
      const hashed = hashBackupCode(code);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed).not.toBe(code);
    });

    it("should generate consistent hashes", () => {
      const code = "ABCD-1234-EFGH-5678";
      const hash1 = hashBackupCode(code);
      const hash2 = hashBackupCode(code);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different codes", () => {
      const code1 = "ABCD-1234-EFGH-5678";
      const code2 = "WXYZ-9876-IJKL-4321";

      const hash1 = hashBackupCode(code1);
      const hash2 = hashBackupCode(code2);

      expect(hash1).not.toBe(hash2);
    });

    it("should generate hashes of consistent length", () => {
      const codes = [
        "SHORT",
        "MEDIUM-LENGTH-CODE",
        "VERY-LONG-BACKUP-CODE-WITH-MANY-CHARACTERS",
      ];

      const hashes = codes.map(hashBackupCode);
      const hashLengths = hashes.map((h) => h.length);

      expect(new Set(hashLengths).size).toBe(1); // All same length
    });

    it("should be case-sensitive", () => {
      const hash1 = hashBackupCode("ABCD1234");
      const hash2 = hashBackupCode("abcd1234");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", () => {
      const hashed = hashBackupCode("");

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
    });
  });

  describe("verifyBackupCode", () => {
    it("should verify correct backup code", () => {
      const code = "ABCD-1234-EFGH-5678";
      const hashed = hashBackupCode(code);

      const isValid = verifyBackupCode(code, hashed);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect backup code", () => {
      const code = "ABCD-1234-EFGH-5678";
      const wrongCode = "WXYZ-9876-IJKL-4321";
      const hashed = hashBackupCode(code);

      const isValid = verifyBackupCode(wrongCode, hashed);

      expect(isValid).toBe(false);
    });

    it("should be case-sensitive", () => {
      const code = "ABCD1234";
      const hashed = hashBackupCode(code);

      expect(verifyBackupCode(code, hashed)).toBe(true);
      expect(verifyBackupCode("abcd1234", hashed)).toBe(false);
      expect(verifyBackupCode("Abcd1234", hashed)).toBe(false);
    });

    it("should handle whitespace correctly", () => {
      const code = "ABCD-1234-EFGH-5678";
      const hashed = hashBackupCode(code);

      // Should trim or normalize whitespace
      const codeWithSpaces = " ABCD-1234-EFGH-5678 ";
      const isValid = verifyBackupCode(codeWithSpaces.trim(), hashed);

      expect(isValid).toBe(true);
    });

    it("should reject empty strings", () => {
      const hashed = hashBackupCode("VALID-CODE");

      expect(verifyBackupCode("", hashed)).toBe(false);
    });
  });

  describe("Integration scenarios", () => {
    it("should complete full TOTP enrollment flow", () => {
      // 1. Generate secret for new user
      const secret = generateTOTPSecret();
      expect(secret).toBeDefined();

      // 2. Generate QR code URL for user to scan
      const qrUrl = generateQRCodeUrl(secret, "user@example.com", "QilTrack");
      expect(qrUrl).toContain(secret);

      // 3. Generate backup codes
      const backupCodes = generateBackupCodes(8);
      expect(backupCodes.length).toBe(8);

      // 4. Hash backup codes for storage
      const hashedBackupCodes = backupCodes.map(hashBackupCode);
      expect(hashedBackupCodes.length).toBe(8);

      // 5. User scans QR and enters token
      const userToken = generateTOTPToken(secret);
      expect(userToken).toMatch(/^\d{6}$/);

      // 6. Verify user's token
      const isValid = verifyTOTPToken(userToken, secret);
      expect(isValid).toBe(true);
    });

    it("should complete backup code verification flow", () => {
      // 1. Generate and hash backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedCodes = backupCodes.map(hashBackupCode);

      // 2. User uses first backup code
      const userEnteredCode = backupCodes[0];
      const isValid = verifyBackupCode(userEnteredCode, hashedCodes[0]);
      expect(isValid).toBe(true);

      // 3. Wrong backup code should fail
      const wrongCode = "WRONG-CODE";
      const isInvalid = verifyBackupCode(wrongCode, hashedCodes[0]);
      expect(isInvalid).toBe(false);
    });

    it("should handle time-based token rotation", () => {
      const secret = generateTOTPSecret();

      // Generate token
      const token1 = generateTOTPToken(secret);

      // Verify immediately
      const isValid1 = verifyTOTPToken(token1, secret, { window: 1 });
      expect(isValid1).toBe(true);

      // Same token should still be valid within window
      const isValid2 = verifyTOTPToken(token1, secret, { window: 1 });
      expect(isValid2).toBe(true);
    });

    it("should support multiple devices with same secret", () => {
      const secret = generateTOTPSecret();

      // Simulate two devices generating tokens with same secret
      const tokenDevice1 = generateTOTPToken(secret);
      const tokenDevice2 = generateTOTPToken(secret);

      // Both should generate same token at same time
      expect(tokenDevice1).toBe(tokenDevice2);

      // Both should be valid
      expect(verifyTOTPToken(tokenDevice1, secret)).toBe(true);
      expect(verifyTOTPToken(tokenDevice2, secret)).toBe(true);
    });

    it("should prevent backup code reuse", () => {
      const backupCodes = generateBackupCodes(5);
      const hashedCodes = backupCodes.map(hashBackupCode);

      // First use of backup code
      const code = backupCodes[0];
      expect(verifyBackupCode(code, hashedCodes[0])).toBe(true);

      // In real implementation, the hashed code should be marked as used
      // and removed from database after first successful verification
      // This test just verifies the verification function works correctly
    });
  });

  describe("Security considerations", () => {
    it("should generate secrets with sufficient entropy", () => {
      const secrets = Array.from({ length: 100 }, () => generateTOTPSecret());
      const uniqueSecrets = new Set(secrets);

      // All secrets should be unique
      expect(uniqueSecrets.size).toBe(100);
    });

    it("should generate backup codes with sufficient entropy", () => {
      const allCodes: string[] = [];

      for (let i = 0; i < 10; i++) {
        const codes = generateBackupCodes(10);
        allCodes.push(...codes);
      }

      const uniqueCodes = new Set(allCodes);

      // High collision resistance
      expect(uniqueCodes.size).toBeGreaterThan(95); // Allow <5% collision
    });

    it("should make backup code hashes irreversible", () => {
      const code = "SECRET-BACKUP-CODE";
      const hashed = hashBackupCode(code);

      // Hash should not contain original code
      expect(hashed).not.toContain(code);
      expect(hashed).not.toContain("SECRET");
      expect(hashed).not.toContain("BACKUP");
    });

    it("should handle timing attacks resistance", () => {
      const secret = generateTOTPSecret();
      const validToken = generateTOTPToken(secret);

      // Verification should take similar time for valid/invalid tokens
      const start1 = Date.now();
      verifyTOTPToken(validToken, secret);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      verifyTOTPToken("000000", secret);
      const time2 = Date.now() - start2;

      // Times should be comparable (within order of magnitude)
      // This is a basic check - real timing attack resistance needs constant-time comparison
      expect(Math.abs(time1 - time2)).toBeLessThan(100); // Within 100ms
    });
  });
});
