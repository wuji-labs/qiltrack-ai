import { describe, expect, it } from "@jest/globals";
import {
  maskEmailAddress,
  maskPhoneNumber,
  maskCreditCard,
  maskSSN,
  maskPII,
  isPIIField,
  maskPIIInLog,
} from "@/lib/middleware/pii-masking";

describe("PII masking utilities", () => {
  describe("maskEmailAddress", () => {
    it("should mask email addresses correctly", () => {
      expect(maskEmailAddress("john.doe@example.com")).toBe("j******e@example.com");
      expect(maskEmailAddress("test@example.com")).toBe("t***t@example.com");
      expect(maskEmailAddress("a@test.com")).toBe("a@test.com"); // Too short to mask
    });

    it("should handle edge cases", () => {
      expect(maskEmailAddress("ab@test.com")).toBe("ab@test.com");
      expect(maskEmailAddress("")).toBe("");
      expect(maskEmailAddress("invalid-email")).toBe("invalid-email");
    });

    it("should preserve domain", () => {
      const masked = maskEmailAddress("user@company.co.uk");
      expect(masked).toContain("@company.co.uk");
      expect(masked).not.toContain("user");
    });
  });

  describe("maskPhoneNumber", () => {
    it("should mask US phone numbers", () => {
      expect(maskPhoneNumber("+1-555-123-4567")).toContain("***");
      expect(maskPhoneNumber("555-123-4567")).toContain("***");
      expect(maskPhoneNumber("(555) 123-4567")).toContain("***");
    });

    it("should mask international phone numbers", () => {
      expect(maskPhoneNumber("+86 138 0013 8000")).toContain("***");
      expect(maskPhoneNumber("+44 20 7123 4567")).toContain("***");
    });

    it("should preserve last 4 digits", () => {
      const masked = maskPhoneNumber("555-123-4567");
      expect(masked).toContain("4567");
    });

    it("should handle invalid inputs", () => {
      expect(maskPhoneNumber("")).toBe("");
      expect(maskPhoneNumber("123")).toBe("123"); // Too short
    });
  });

  describe("maskCreditCard", () => {
    it("should mask credit card numbers", () => {
      expect(maskCreditCard("4532-1234-5678-9010")).toBe("****-****-****-9010");
      expect(maskCreditCard("4532123456789010")).toBe("************9010");
      expect(maskCreditCard("4532 1234 5678 9010")).toBe("**** **** **** 9010");
    });

    it("should preserve last 4 digits", () => {
      const masked = maskCreditCard("4532-1234-5678-9010");
      expect(masked).toContain("9010");
      expect(masked).not.toContain("4532");
    });

    it("should handle different card formats", () => {
      expect(maskCreditCard("378282246310005")).toBe("***********0005"); // Amex
      expect(maskCreditCard("5555-5555-5555-4444")).toBe("****-****-****-4444"); // Mastercard
    });

    it("should handle invalid inputs", () => {
      expect(maskCreditCard("")).toBe("");
      expect(maskCreditCard("123")).toBe("123"); // Too short
    });
  });

  describe("maskSSN", () => {
    it("should mask Social Security Numbers", () => {
      expect(maskSSN("123-45-6789")).toBe("***-**-6789");
      expect(maskSSN("123456789")).toBe("*****6789");
    });

    it("should preserve last 4 digits", () => {
      const masked = maskSSN("123-45-6789");
      expect(masked).toContain("6789");
      expect(masked).not.toContain("123");
    });

    it("should handle invalid inputs", () => {
      expect(maskSSN("")).toBe("");
      expect(maskSSN("123")).toBe("123"); // Too short
    });
  });

  describe("isPIIField", () => {
    it("should identify common PII field names", () => {
      // Email fields
      expect(isPIIField("email")).toBe(true);
      expect(isPIIField("userEmail")).toBe(true);
      expect(isPIIField("email_address")).toBe(true);

      // Phone fields
      expect(isPIIField("phone")).toBe(true);
      expect(isPIIField("phoneNumber")).toBe(true);
      expect(isPIIField("mobile")).toBe(true);
      expect(isPIIField("telephone")).toBe(true);

      // Credit card fields
      expect(isPIIField("creditCard")).toBe(true);
      expect(isPIIField("cardNumber")).toBe(true);
      expect(isPIIField("ccNumber")).toBe(true);

      // SSN fields
      expect(isPIIField("ssn")).toBe(true);
      expect(isPIIField("socialSecurity")).toBe(true);

      // Address fields
      expect(isPIIField("address")).toBe(true);
      expect(isPIIField("street")).toBe(true);
      expect(isPIIField("zipCode")).toBe(true);
      expect(isPIIField("postalCode")).toBe(true);

      // Name fields
      expect(isPIIField("firstName")).toBe(true);
      expect(isPIIField("lastName")).toBe(true);
      expect(isPIIField("fullName")).toBe(true);

      // Other PII
      expect(isPIIField("password")).toBe(true);
      expect(isPIIField("dob")).toBe(true);
      expect(isPIIField("birthDate")).toBe(true);
      expect(isPIIField("passport")).toBe(true);
    });

    it("should not identify non-PII fields", () => {
      expect(isPIIField("username")).toBe(false);
      expect(isPIIField("id")).toBe(false);
      expect(isPIIField("createdAt")).toBe(false);
      expect(isPIIField("status")).toBe(false);
      expect(isPIIField("type")).toBe(false);
      expect(isPIIField("amount")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isPIIField("EMAIL")).toBe(true);
      expect(isPIIField("Email")).toBe(true);
      expect(isPIIField("PhoneNumber")).toBe(true);
      expect(isPIIField("CREDIT_CARD")).toBe(true);
    });
  });

  describe("maskPII", () => {
    it("should mask PII in simple objects", () => {
      const input = {
        email: "user@example.com",
        phone: "555-123-4567",
        username: "johndoe",
      };

      const masked = maskPII(input);

      expect(masked.email).not.toBe("user@example.com");
      expect(masked.email).toContain("@example.com");
      expect(masked.phone).toContain("***");
      expect(masked.username).toBe("johndoe"); // Not PII
    });

    it("should mask PII in nested objects", () => {
      const input = {
        user: {
          email: "user@example.com",
          profile: {
            phone: "555-123-4567",
            creditCard: "4532-1234-5678-9010",
          },
        },
        metadata: {
          ip: "192.168.1.1",
        },
      };

      const masked = maskPII(input);

      expect(masked.user.email).not.toBe("user@example.com");
      expect(masked.user.profile.phone).toContain("***");
      expect(masked.user.profile.creditCard).toContain("9010");
      expect(masked.user.profile.creditCard).not.toContain("4532");
    });

    it("should mask PII in arrays", () => {
      const input = {
        users: [
          { email: "user1@example.com", name: "User 1" },
          { email: "user2@example.com", name: "User 2" },
        ],
      };

      const masked = maskPII(input);

      expect(masked.users[0].email).not.toBe("user1@example.com");
      expect(masked.users[1].email).not.toBe("user2@example.com");
      expect(masked.users[0].name).toBe("User 1");
    });

    it("should handle null and undefined values", () => {
      const input = {
        email: null,
        phone: undefined,
        creditCard: "",
      };

      const masked = maskPII(input);

      expect(masked.email).toBeNull();
      expect(masked.phone).toBeUndefined();
      expect(masked.creditCard).toBe("");
    });

    it("should not mutate original object", () => {
      const input = {
        email: "user@example.com",
        phone: "555-123-4567",
      };

      const originalEmail = input.email;
      const originalPhone = input.phone;

      maskPII(input);

      expect(input.email).toBe(originalEmail);
      expect(input.phone).toBe(originalPhone);
    });

    it("should handle circular references", () => {
      const input: any = {
        email: "user@example.com",
      };
      input.self = input; // Circular reference

      expect(() => maskPII(input)).not.toThrow();
    });
  });

  describe("maskPIIInLog", () => {
    it("should mask email addresses in log messages", () => {
      const log = "User john.doe@example.com logged in successfully";
      const masked = maskPIIInLog(log);

      expect(masked).not.toContain("john.doe@example.com");
      expect(masked).toContain("@example.com");
    });

    it("should mask multiple email addresses", () => {
      const log = "Transfer from user1@example.com to user2@example.com";
      const masked = maskPIIInLog(log);

      expect(masked).not.toContain("user1@example.com");
      expect(masked).not.toContain("user2@example.com");
      expect(masked).toContain("@example.com");
    });

    it("should mask phone numbers in log messages", () => {
      const log = "User called from 555-123-4567";
      const masked = maskPIIInLog(log);

      expect(masked).toContain("***");
      expect(masked).not.toContain("555-123");
    });

    it("should mask credit card numbers in log messages", () => {
      const log = "Payment with card 4532-1234-5678-9010 processed";
      const masked = maskPIIInLog(log);

      expect(masked).toContain("9010");
      expect(masked).not.toContain("4532");
    });

    it("should mask SSN in log messages", () => {
      const log = "SSN 123-45-6789 verified";
      const masked = maskPIIInLog(log);

      expect(masked).toContain("6789");
      expect(masked).not.toContain("123-45");
    });

    it("should mask multiple PII types in one message", () => {
      const log = "User john@example.com with phone 555-123-4567 and card 4532-1234-5678-9010";
      const masked = maskPIIInLog(log);

      expect(masked).not.toContain("john@example.com");
      expect(masked).not.toContain("555-123-4567");
      expect(masked).not.toContain("4532-1234-5678-9010");
    });

    it("should handle logs without PII", () => {
      const log = "User logged in successfully";
      const masked = maskPIIInLog(log);

      expect(masked).toBe(log);
    });

    it("should handle empty strings", () => {
      expect(maskPIIInLog("")).toBe("");
    });
  });

  describe("Real-world scenarios", () => {
    it("should mask PII in audit log entries", () => {
      const auditLog = {
        action: "user_login",
        user: {
          email: "admin@company.com",
          phone: "+1-555-987-6543",
        },
        metadata: {
          ip: "192.168.1.100",
          userAgent: "Mozilla/5.0",
        },
        timestamp: "2024-01-15T10:30:00Z",
      };

      const masked = maskPII(auditLog);

      expect(masked.user.email).not.toBe("admin@company.com");
      expect(masked.user.phone).toContain("***");
      expect(masked.metadata.ip).toBe("192.168.1.100"); // IP not masked
      expect(masked.timestamp).toBe("2024-01-15T10:30:00Z");
    });

    it("should mask PII in error messages", () => {
      const errorMessage = `
        Authentication failed for user john.doe@example.com.
        Phone verification sent to 555-123-4567.
        Card ending in 9010 declined.
      `;

      const masked = maskPIIInLog(errorMessage);

      expect(masked).not.toContain("john.doe@example.com");
      expect(masked).not.toContain("555-123-4567");
      expect(masked).toContain("9010");
    });

    it("should mask PII in API request logs", () => {
      const requestLog = {
        method: "POST",
        path: "/api/user/update",
        body: {
          email: "user@example.com",
          phone: "555-123-4567",
          creditCard: "4532-1234-5678-9010",
          preferences: {
            newsletter: true,
          },
        },
        headers: {
          authorization: "Bearer token123",
        },
      };

      const masked = maskPII(requestLog);

      expect(masked.body.email).not.toBe("user@example.com");
      expect(masked.body.phone).toContain("***");
      expect(masked.body.creditCard).not.toContain("4532");
      expect(masked.body.preferences.newsletter).toBe(true);
    });
  });
});
