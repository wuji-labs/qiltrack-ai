import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, InsufficientCreditsError, ValidationError } from "./errors";

describe("Error Classes", () => {
  it("should create AppError with correct properties", () => {
    const error = new AppError("TEST_CODE", "Test message", 400, { foo: "bar" });

    expect(error.code).toBe("TEST_CODE");
    expect(error.message).toBe("Test message");
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ foo: "bar" });
    expect(error.name).toBe("AppError");
  });

  it("should create InsufficientCreditsError with defaults", () => {
    const error = new InsufficientCreditsError();

    expect(error.code).toBe("INSUFFICIENT_CREDITS");
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain("积分不足");
  });

  it("should create ValidationError with custom message", () => {
    const error = new ValidationError("Invalid input", { field: "email" });

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid input");
    expect(error.details).toEqual({ field: "email" });
  });
});
