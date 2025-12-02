/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  AppError,
  InsufficientCreditsError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ReportGenerationError,
  ExternalServiceError,
} from "./errors";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should create AppError with all properties", () => {
      const error = new AppError("TEST_CODE", "Test message", 400, { foo: "bar" });

      expect(error.code).toBe("TEST_CODE");
      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ foo: "bar" });
      expect(error.name).toBe("AppError");
    });

    it("should have default status code 500", () => {
      const error = new AppError("TEST_CODE", "Test message");

      expect(error.statusCode).toBe(500);
    });

    it("should capture stack trace", () => {
      const error = new AppError("TEST_CODE", "Test message");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("AppError");
    });

    it("should extend Error correctly", () => {
      const error = new AppError("TEST_CODE", "Test message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("InsufficientCreditsError", () => {
    it("should create with default message", () => {
      const error = new InsufficientCreditsError();

      expect(error.code).toBe("INSUFFICIENT_CREDITS");
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("积分不足");
      expect(error.name).toBe("InsufficientCreditsError");
    });

    it("should create with custom message", () => {
      const error = new InsufficientCreditsError("余额不足");

      expect(error.message).toBe("余额不足");
      expect(error.code).toBe("INSUFFICIENT_CREDITS");
    });

    it("should include details when provided", () => {
      const error = new InsufficientCreditsError("余额不足", { required: 5, available: 2 });

      expect(error.details).toEqual({ required: 5, available: 2 });
    });

    it("should extend AppError", () => {
      const error = new InsufficientCreditsError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InsufficientCreditsError);
    });
  });

  describe("ValidationError", () => {
    it("should create ValidationError with message", () => {
      const error = new ValidationError("Invalid input", { field: "email" });

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid input");
      expect(error.details).toEqual({ field: "email" });
      expect(error.name).toBe("ValidationError");
    });

    it("should work without details", () => {
      const error = new ValidationError("Invalid request");

      expect(error.message).toBe("Invalid request");
      expect(error.details).toBeUndefined();
    });
  });

  describe("UnauthorizedError", () => {
    it("should create with default message", () => {
      const error = new UnauthorizedError();

      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("未授权");
      expect(error.name).toBe("UnauthorizedError");
    });

    it("should create with custom message", () => {
      const error = new UnauthorizedError("Token expired");

      expect(error.message).toBe("Token expired");
    });

    it("should include details when provided", () => {
      const error = new UnauthorizedError("Session invalid", { reason: "expired" });

      expect(error.details).toEqual({ reason: "expired" });
    });
  });

  describe("ForbiddenError", () => {
    it("should create with default message", () => {
      const error = new ForbiddenError();

      expect(error.code).toBe("FORBIDDEN");
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("权限不足");
      expect(error.name).toBe("ForbiddenError");
    });

    it("should create with custom message", () => {
      const error = new ForbiddenError("Admin access required");

      expect(error.message).toBe("Admin access required");
    });

    it("should include details when provided", () => {
      const error = new ForbiddenError("Not admin", { requiredRole: "admin" });

      expect(error.details).toEqual({ requiredRole: "admin" });
    });
  });

  describe("NotFoundError", () => {
    it("should create with default message", () => {
      const error = new NotFoundError();

      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("资源不存在");
      expect(error.name).toBe("NotFoundError");
    });

    it("should create with custom message", () => {
      const error = new NotFoundError("Report not found");

      expect(error.message).toBe("Report not found");
    });

    it("should include details when provided", () => {
      const error = new NotFoundError("User not found", { userId: "123" });

      expect(error.details).toEqual({ userId: "123" });
    });
  });

  describe("ReportGenerationError", () => {
    it("should create ReportGenerationError with message", () => {
      const error = new ReportGenerationError("LLM failed", { provider: "helicone" });

      expect(error.code).toBe("REPORT_GENERATION_FAILED");
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("LLM failed");
      expect(error.details).toEqual({ provider: "helicone" });
      expect(error.name).toBe("ReportGenerationError");
    });

    it("should work without details", () => {
      const error = new ReportGenerationError("Generation failed");

      expect(error.message).toBe("Generation failed");
      expect(error.details).toBeUndefined();
    });
  });

  describe("ExternalServiceError", () => {
    it("should create ExternalServiceError with message", () => {
      const error = new ExternalServiceError("Finnhub API error", { status: 429 });

      expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.message).toBe("Finnhub API error");
      expect(error.details).toEqual({ status: 429 });
      expect(error.name).toBe("ExternalServiceError");
    });

    it("should work without details", () => {
      const error = new ExternalServiceError("Service unavailable");

      expect(error.message).toBe("Service unavailable");
      expect(error.details).toBeUndefined();
    });
  });

  describe("Error Inheritance", () => {
    it("all errors should extend AppError", () => {
      const errors = [
        new InsufficientCreditsError(),
        new ValidationError("test"),
        new UnauthorizedError(),
        new ForbiddenError(),
        new NotFoundError(),
        new ReportGenerationError("test"),
        new ExternalServiceError("test"),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it("all errors should have unique codes", () => {
      const codes = new Set([
        new InsufficientCreditsError().code,
        new ValidationError("test").code,
        new UnauthorizedError().code,
        new ForbiddenError().code,
        new NotFoundError().code,
        new ReportGenerationError("test").code,
        new ExternalServiceError("test").code,
      ]);

      expect(codes.size).toBe(7);
    });
  });
});
