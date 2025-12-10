import { describe, expect, it } from "@jest/globals";
import {
  validateSymbol,
  validateEmail,
  validateUUID,
  validateInteger,
  sanitizeString,
  validateURL,
  maskEmail,
  ValidationError,
} from "@/lib/utils/validation";

describe("validation utils", () => {
  describe("validateSymbol", () => {
    it("should validate valid stock symbols", () => {
      expect(validateSymbol("AAPL")).toBe("AAPL");
      expect(validateSymbol("BRK.B")).toBe("BRK.B");
      expect(validateSymbol("VOO")).toBe("VOO");
      expect(validateSymbol("TSLA")).toBe("TSLA");
    });

    it("should convert lowercase to uppercase", () => {
      expect(validateSymbol("aapl")).toBe("AAPL");
      expect(validateSymbol("tsla")).toBe("TSLA");
    });

    it("should trim whitespace", () => {
      expect(validateSymbol("  AAPL  ")).toBe("AAPL");
      expect(validateSymbol("\tTSLA\n")).toBe("TSLA");
    });

    it("should reject invalid symbols", () => {
      expect(() => validateSymbol("")).toThrow(ValidationError);
      expect(() => validateSymbol(null as any)).toThrow(ValidationError);
      expect(() => validateSymbol(undefined as any)).toThrow(ValidationError);
      expect(() => validateSymbol("AAP<L")).toThrow(ValidationError);
      expect(() => validateSymbol("AAP>L")).toThrow(ValidationError);
      expect(() => validateSymbol("AAP;L")).toThrow(ValidationError);
      expect(() => validateSymbol("AAP'L")).toThrow(ValidationError);
      expect(() => validateSymbol("AAP\"L")).toThrow(ValidationError);
    });
  });

  describe("validateEmail", () => {
    it("should validate valid emails", () => {
      expect(validateEmail("user@example.com")).toBe("user@example.com");
      expect(validateEmail("john.doe@company.co.uk")).toBe("john.doe@company.co.uk");
      expect(validateEmail("test+tag@gmail.com")).toBe("test+tag@gmail.com");
    });

    it("should trim whitespace", () => {
      expect(validateEmail("  user@example.com  ")).toBe("user@example.com");
    });

    it("should reject invalid emails", () => {
      expect(() => validateEmail("")).toThrow(ValidationError);
      expect(() => validateEmail("notanemail")).toThrow(ValidationError);
      expect(() => validateEmail("@example.com")).toThrow(ValidationError);
      expect(() => validateEmail("user@")).toThrow(ValidationError);
      expect(() => validateEmail("user@.com")).toThrow(ValidationError);
      expect(() => validateEmail(null as any)).toThrow(ValidationError);
    });
  });

  describe("validateUUID", () => {
    it("should validate valid UUIDs", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(validateUUID(uuid)).toBe(uuid);
    });

    it("should trim whitespace", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(validateUUID(`  ${uuid}  `)).toBe(uuid);
    });

    it("should reject invalid UUIDs", () => {
      expect(() => validateUUID("")).toThrow(ValidationError);
      expect(() => validateUUID("not-a-uuid")).toThrow(ValidationError);
      expect(() => validateUUID("550e8400-e29b-41d4-a716")).toThrow(ValidationError);
      expect(() => validateUUID(null as any)).toThrow(ValidationError);
    });
  });

  describe("validateInteger", () => {
    it("should validate valid integers", () => {
      expect(validateInteger(123)).toBe(123);
      expect(validateInteger("456")).toBe(456);
      expect(validateInteger(0)).toBe(0);
    });

    it("should enforce min/max bounds", () => {
      expect(validateInteger(50, 0, 100)).toBe(50);
      expect(() => validateInteger(-1, 0, 100)).toThrow(ValidationError);
      expect(() => validateInteger(101, 0, 100)).toThrow(ValidationError);
    });

    it("should reject non-integers", () => {
      expect(() => validateInteger("abc")).toThrow(ValidationError);
      expect(() => validateInteger(3.14)).toThrow(ValidationError);
      expect(() => validateInteger(NaN)).toThrow(ValidationError);
      expect(() => validateInteger(null as any)).toThrow(ValidationError);
    });
  });

  describe("sanitizeString", () => {
    it("should sanitize and truncate strings", () => {
      expect(sanitizeString("Hello World")).toBe("Hello World");
      expect(sanitizeString("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
      expect(sanitizeString("Hello<br>World")).toBe("HellobrWorld");
    });

    it("should trim whitespace", () => {
      expect(sanitizeString("  Hello  ")).toBe("Hello");
    });

    it("should enforce max length", () => {
      const longString = "a".repeat(2000);
      expect(sanitizeString(longString, 100).length).toBe(100);
    });

    it("should return empty string for invalid input", () => {
      expect(sanitizeString("")).toBe("");
      expect(sanitizeString(null as any)).toBe("");
    });
  });

  describe("maskEmail", () => {
    it("should mask email addresses", () => {
      expect(maskEmail("john.doe@example.com")).toBe("j******e@example.com");
      expect(maskEmail("a@test.com")).toBe("a@test.com"); // Too short to mask
      expect(maskEmail("test@example.com")).toBe("t***t@example.com");
    });

    it("should handle edge cases", () => {
      expect(maskEmail("a@b.com")).toBe("a@b.com");
      expect(maskEmail("ab@test.com")).toBe("ab@test.com");
    });
  });

  describe("validateURL", () => {
    it("should validate valid URLs", () => {
      expect(validateURL("https://example.com")).toBe("https://example.com");
      expect(validateURL("http://localhost:3000")).toBe("http://localhost:3000");
      expect(validateURL("https://sub.domain.com/path?query=1")).toMatch(/^https?:\/\//);
    });

    it("should enforce allowed domains", () => {
      expect(
        validateURL("https://example.com/path", ["example.com", "test.com"])
      ).toBe("https://example.com/path");

      expect(() =>
        validateURL("https://evil.com", ["example.com", "test.com"])
      ).toThrow(ValidationError);
    });

    it("should reject invalid URLs", () => {
      expect(() => validateURL("")).toThrow(ValidationError);
      expect(() => validateURL("not a url")).toThrow(ValidationError);
      expect(() => validateURL("javascript:alert(1)")).toThrow(ValidationError);
      expect(() => validateURL("file:///etc/passwd")).toThrow(ValidationError);
    });
  });

  describe("XSS protection", () => {
    it("should reject XSS attempts in symbol validation", () => {
      expect(() => validateSymbol("<script>")).toThrow(ValidationError);
      expect(() => validateSymbol("'; DROP TABLE--")).toThrow(ValidationError);
      expect(() => validateSymbol("AAPL' OR '1'='1")).toThrow(ValidationError);
    });

    it("should sanitize HTML in string sanitization", () => {
      const xss = "<img src=x onerror=alert(1)>";
      const sanitized = sanitizeString(xss);
      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
    });
  });
});
