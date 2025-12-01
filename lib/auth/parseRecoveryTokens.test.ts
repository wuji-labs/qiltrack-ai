import { describe, it, expect } from "vitest";
import { parseRecoveryTokens, hasRecoveryTokens } from "./parseRecoveryTokens";

describe("parseRecoveryTokens", () => {
  it("should parse code from query params", () => {
    const searchParams = new URLSearchParams("?code=abc123");
    const result = parseRecoveryTokens({ searchParams });

    expect(result.code).toBe("abc123");
    expect(result.tokenHash).toBeUndefined();
    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
  });

  it("should parse code from hash params", () => {
    const searchParams = new URLSearchParams();
    const result = parseRecoveryTokens({ searchParams, hash: "#code=hash123" });

    expect(result.code).toBe("hash123");
  });

  it("should parse token_hash from query params", () => {
    const searchParams = new URLSearchParams("?token_hash=token456");
    const result = parseRecoveryTokens({ searchParams });

    expect(result.tokenHash).toBe("token456");
  });

  it("should fallback to token param for tokenHash", () => {
    const searchParams = new URLSearchParams("?token=fallback789");
    const result = parseRecoveryTokens({ searchParams });

    expect(result.tokenHash).toBe("fallback789");
  });

  it("should parse access_token and refresh_token from hash", () => {
    const searchParams = new URLSearchParams();
    const hash = "#access_token=access123&refresh_token=refresh456";
    const result = parseRecoveryTokens({ searchParams, hash });

    expect(result.accessToken).toBe("access123");
    expect(result.refreshToken).toBe("refresh456");
  });

  it("should prioritize query code over hash code", () => {
    const searchParams = new URLSearchParams("?code=query_code");
    const result = parseRecoveryTokens({ searchParams, hash: "#code=hash_code" });

    expect(result.code).toBe("query_code");
  });

  it("should prioritize token_hash over token", () => {
    const searchParams = new URLSearchParams("?token_hash=hash_token&token=plain_token");
    const result = parseRecoveryTokens({ searchParams });

    expect(result.tokenHash).toBe("hash_token");
  });

  it("should return empty object when no params provided", () => {
    const searchParams = new URLSearchParams();
    const result = parseRecoveryTokens({ searchParams });

    expect(result.code).toBeUndefined();
    expect(result.tokenHash).toBeUndefined();
    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
  });
});

describe("hasRecoveryTokens", () => {
  it("should return true when code is present", () => {
    expect(hasRecoveryTokens({ code: "abc123" })).toBe(true);
  });

  it("should return true when tokenHash is present", () => {
    expect(hasRecoveryTokens({ tokenHash: "token456" })).toBe(true);
  });

  it("should return true when both accessToken and refreshToken are present", () => {
    expect(hasRecoveryTokens({ accessToken: "access123", refreshToken: "refresh456" })).toBe(
      true
    );
  });

  it("should return false when only accessToken is present", () => {
    expect(hasRecoveryTokens({ accessToken: "access123" })).toBe(false);
  });

  it("should return false when only refreshToken is present", () => {
    expect(hasRecoveryTokens({ refreshToken: "refresh456" })).toBe(false);
  });

  it("should return false when no tokens are present", () => {
    expect(hasRecoveryTokens({})).toBe(false);
  });

  it("should return true when multiple token types are present", () => {
    expect(
      hasRecoveryTokens({
        code: "abc",
        tokenHash: "token",
        accessToken: "access",
        refreshToken: "refresh",
      })
    ).toBe(true);
  });
});
