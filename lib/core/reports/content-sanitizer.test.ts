import { describe, it, expect } from "vitest";
import { ContentSanitizer } from "@/lib/core/reports/content-sanitizer";

describe("ContentSanitizer", () => {
  const sanitizer = new ContentSanitizer();

  it("should replace sensitive words", () => {
    const content = "建议买入该股票，目标价为100元";
    const sanitized = sanitizer.sanitize(content, "zh-Hans");

    expect(sanitized).toContain("分析视角");
    expect(sanitized).toContain("市场预期讨论");
    expect(sanitized).not.toContain("买入");
    expect(sanitized).not.toContain("目标价");
  });

  it("should add disclaimer", () => {
    const content = "Test report content";
    const sanitized = sanitizer.sanitize(content, "en");

    expect(sanitized).toContain("auto-generated from public data");
    expect(sanitized).toContain("never constitutes investment advice");
  });

  it("should normalize language codes", () => {
    expect(sanitizer.normalizeLanguage("ja")).toBe("ja");
    expect(sanitizer.normalizeLanguage("ja-jp")).toBe("ja");
    expect(sanitizer.normalizeLanguage("zh-cn")).toBe("zh-Hans");
    expect(sanitizer.normalizeLanguage("zh-hk")).toBe("zh-Hant");
    expect(sanitizer.normalizeLanguage("invalid")).toBe("en");
  });

  it("should detect sensitive words", () => {
    const content = "建议买入该股票";
    const detected = sanitizer.detectSensitiveWords(content);

    expect(detected.length).toBeGreaterThan(0);
    expect(detected).toContain("分析视角");
  });
});
