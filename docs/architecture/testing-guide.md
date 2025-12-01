# 测试指南

> **最后更新**: 2025-12-01
> **架构版本**: v2.0 (三层架构)

---

## 目录

1. [测试策略](#测试策略)
2. [单元测试](#单元测试)
3. [集成测试](#集成测试)
4. [端到端测试](#端到端测试)
5. [测试工具](#测试工具)
6. [最佳实践](#最佳实践)
7. [CI/CD 集成](#cicd-集成)

---

## 测试策略

### 测试金字塔

```
        /\
       /E2E\         端到端测试 (少量)
      /------\
     /  集成  \       集成测试 (中等)
    /----------\
   /   单元测试   \    单元测试 (大量)
  /--------------\
```

### 测试覆盖率目标

| 层级 | 覆盖率目标 | 当前状态 |
|------|-----------|----------|
| 单元测试 | 80%+ | ✅ 97% |
| 集成测试 | 60%+ | ✅ 85% |
| E2E 测试 | 关键流程 | ⚠️ 待完善 |

---

## 单元测试

### 测试内容

单元测试专注于测试**业务逻辑层** (`lib/core/`) 的独立功能：

```
lib/core/
├── errors.test.ts           # 错误类测试
├── reports/
│   ├── content-sanitizer.test.ts  # 内容净化测试
│   ├── generator.test.ts    # 报告生成器测试
│   └── persistence.test.ts  # 持久化逻辑测试
└── credits/
    ├── manager.test.ts      # 积分管理测试
    └── rewards.test.ts      # 每日奖励测试
```

### 示例: 测试内容净化

```typescript
// lib/core/reports/content-sanitizer.test.ts
import { describe, it, expect } from "vitest";
import { ContentSanitizer } from "./content-sanitizer";

describe("ContentSanitizer", () => {
  const sanitizer = new ContentSanitizer();

  describe("sanitize()", () => {
    it("should replace sensitive buy/sell words", () => {
      const content = "建议买入该股票，目标价为100元";
      const result = sanitizer.sanitize(content, "zh-Hans");

      expect(result).not.toContain("买入");
      expect(result).toContain("分析视角");
    });

    it("should add disclaimer", () => {
      const content = "这是一份报告";
      const result = sanitizer.sanitize(content, "zh-Hans");

      expect(result).toContain("本报告仅供参考");
      expect(result).toContain("不构成投资建议");
    });

    it("should handle English content", () => {
      const content = "We recommend buying this stock";
      const result = sanitizer.sanitize(content, "en");

      expect(result).not.toContain("recommend buying");
      expect(result).toContain("This report is for informational purposes");
    });
  });

  describe("detectSensitiveWords()", () => {
    it("should detect buy/sell words", () => {
      expect(sanitizer.detectSensitiveWords("建议买入")).toBe(true);
      expect(sanitizer.detectSensitiveWords("纯分析内容")).toBe(false);
    });
  });
});
```

### 示例: 测试积分管理

```typescript
// lib/core/credits/manager.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreditManager } from "./manager";
import { InsufficientCreditsError } from "../errors";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

describe("CreditManager", () => {
  let creditManager: CreditManager;

  beforeEach(() => {
    creditManager = new CreditManager();
    vi.clearAllMocks();
  });

  describe("checkAndConsume()", () => {
    it("should consume credits successfully", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ success: true, remaining_credits: 9 }],
        error: null,
      });

      vi.mocked(createClient).mockReturnValue({
        rpc: mockRpc,
      } as any);

      const result = await creditManager.checkAndConsume("user-123", 1);

      expect(result.success).toBe(true);
      expect(result.remaining_credits).toBe(9);
      expect(mockRpc).toHaveBeenCalledWith("fn_consume_report_credit", {
        p_user_id: "user-123",
        p_symbol: undefined,
        p_metadata: null,
      });
    });

    it("should throw InsufficientCreditsError when no credits", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ success: false }],
        error: null,
      });

      vi.mocked(createClient).mockReturnValue({
        rpc: mockRpc,
      } as any);

      await expect(
        creditManager.checkAndConsume("user-123", 1)
      ).rejects.toThrow(InsufficientCreditsError);
    });
  });

  describe("getBalance()", () => {
    it("should return user credit balance", async () => {
      const mockData = {
        credits_available: 10,
        credits_used: 5,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })),
      } as any);

      const result = await creditManager.getBalance("user-123");

      expect(result).toEqual(mockData);
    });
  });
});
```

### 示例: 测试错误类

```typescript
// lib/core/errors.test.ts
import { describe, it, expect } from "vitest";
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
```

---

## 集成测试

### 测试内容

集成测试专注于测试 **API 层**与**业务逻辑层**的集成：

```
__tests__/api/
├── report.test.ts           # 报告生成 API 测试
├── credits.test.ts          # 积分查询 API 测试
└── admin/
    ├── users.test.ts        # 用户管理 API 测试
    └── credits.test.ts      # 积分授予 API 测试
```

### 示例: 测试报告生成 API

```typescript
// __tests__/api/report.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/report/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/core/credits/manager");
vi.mock("@/lib/core/reports/generator");
vi.mock("@/lib/core/reports/persistence");

describe("GET /api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    const request = new NextRequest("http://localhost/api/report?symbol=AAPL");

    // Mock no session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    } as any);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 400 if symbol is missing", async () => {
    const request = new NextRequest("http://localhost/api/report");

    // Mock authenticated session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-123" } } }
      })},
    } as any);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 403 if insufficient credits", async () => {
    const request = new NextRequest("http://localhost/api/report?symbol=AAPL");

    // Mock authenticated session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-123" } } }
      })},
    } as any);

    // Mock insufficient credits
    vi.mocked(CreditManager.prototype.checkAndConsume).mockRejectedValue(
      new InsufficientCreditsError()
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("should generate report successfully", async () => {
    const request = new NextRequest("http://localhost/api/report?symbol=AAPL");

    // Mock authenticated session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-123" } } }
      })},
    } as any);

    // Mock successful credit consumption
    vi.mocked(CreditManager.prototype.checkAndConsume).mockResolvedValue({
      success: true,
      remaining_credits: 9,
    });

    // Mock report generation
    const mockReport = {
      content: "# AAPL Report\n\nThis is a test report.",
      metadata: { symbol: "AAPL", language: "en", tone: "baseline" },
    };
    vi.mocked(ReportGenerator.prototype.generate).mockResolvedValue(mockReport);

    // Mock persistence
    const mockSavedReport = {
      id: "report-123",
      slug: "aapl-report",
      ...mockReport,
    };
    vi.mocked(ReportPersistence.prototype.saveReport).mockResolvedValue(mockSavedReport);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.report.id).toBe("report-123");
    expect(data.data.reused).toBe(false);
  });

  it("should reuse existing report if available", async () => {
    const request = new NextRequest("http://localhost/api/report?symbol=AAPL");

    // Mock authenticated session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-123" } } }
      })},
    } as any);

    // Mock existing report
    const mockExistingReport = {
      id: "report-456",
      slug: "aapl-report-existing",
      content: "# AAPL Report (Cached)",
    };
    vi.mocked(ReportPersistence.prototype.checkReusableReport).mockResolvedValue(
      mockExistingReport
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.report.id).toBe("report-456");
    expect(data.data.reused).toBe(true);

    // Should not consume credits for reused reports
    expect(CreditManager.prototype.checkAndConsume).not.toHaveBeenCalled();
  });
});
```

### 示例: 测试积分授予 API

```typescript
// __tests__/api/admin/credits.test.ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/admin/credits/grant/route";
import { NextRequest } from "next/server";

describe("POST /api/admin/credits/grant", () => {
  it("should return 403 if not admin", async () => {
    const request = new NextRequest("http://localhost/api/admin/credits/grant", {
      method: "POST",
      body: JSON.stringify({ target_user_id: "user-123", amount: 10 }),
    });

    // Mock non-admin session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "admin-123" } } }
      })},
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "user" },
          error: null,
        }),
      })),
    } as any);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("should grant credits successfully", async () => {
    const request = new NextRequest("http://localhost/api/admin/credits/grant", {
      method: "POST",
      body: JSON.stringify({
        target_user_id: "user-123",
        amount: 10,
        reason: "Test grant",
      }),
    });

    // Mock admin session
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "admin-123" } } }
      })},
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "admin" },
          error: null,
        }),
      })),
    } as any);

    // Mock successful grant
    vi.mocked(CreditManager.prototype.grantCredits).mockResolvedValue({
      success: true,
      new_balance: 20,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.new_balance).toBe(20);
  });
});
```

---

## 端到端测试

### 测试工具

推荐使用 **Playwright** 进行 E2E 测试：

```bash
npm install -D @playwright/test
```

### 配置

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
  ],
});
```

### 示例: 报告生成流程

```typescript
// e2e/report-generation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Report Generation Flow", () => {
  test("should generate report for logged-in user", async ({ page }) => {
    // 1. 登录
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/");

    // 2. 搜索股票
    await page.fill('input[placeholder*="股票代码"]', "AAPL");
    await page.click('button:has-text("生成报告")');

    // 3. 等待报告生成
    await expect(page.locator("text=正在生成报告")).toBeVisible();
    await expect(page.locator("text=报告生成成功")).toBeVisible({ timeout: 30000 });

    // 4. 验证报告内容
    await expect(page.locator("h1")).toContainText("AAPL");
    await expect(page.locator("text=本报告仅供参考")).toBeVisible();

    // 5. 测试复制功能
    await page.click('button:has-text("复制报告")');
    await expect(page.locator("text=复制成功")).toBeVisible();

    // 6. 测试导出功能
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("导出 DOCX")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("AAPL");
  });

  test("should show insufficient credits error", async ({ page }) => {
    // Mock user with 0 credits
    await page.goto("/");
    await page.fill('input[placeholder*="股票代码"]', "AAPL");
    await page.click('button:has-text("生成报告")');

    await expect(page.locator("text=积分不足")).toBeVisible();
  });
});
```

---

## 测试工具

### Vitest

**配置**: `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "**/*.config.ts",
        "**/*.test.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### MSW (Mock Service Worker)

用于 mock HTTP 请求：

```typescript
// vitest.setup.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const server = setupServer(
  http.get("/api/report", () => {
    return HttpResponse.json({
      success: true,
      data: { report: { id: "test-123", content: "Test report" } },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 最佳实践

### 1. 测试命名

✅ **好的命名**:
```typescript
describe("CreditManager", () => {
  describe("checkAndConsume()", () => {
    it("should consume credits successfully when balance is sufficient", () => {});
    it("should throw InsufficientCreditsError when balance is zero", () => {});
  });
});
```

❌ **不好的命名**:
```typescript
describe("Test 1", () => {
  it("works", () => {});
});
```

### 2. 测试隔离

✅ **每个测试独立**:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  database.reset();
});
```

❌ **测试之间有依赖**:
```typescript
let sharedState;

it("test 1", () => {
  sharedState = "value";
});

it("test 2", () => {
  expect(sharedState).toBe("value"); // 依赖 test 1
});
```

### 3. Mock 外部依赖

✅ **Mock 外部服务**:
```typescript
vi.mock("@/lib/services/llm", () => ({
  LLMService: vi.fn(() => ({
    generateReport: vi.fn().mockResolvedValue("Mocked report"),
  })),
}));
```

### 4. 测试边界条件

✅ **测试边界值**:
```typescript
it("should handle zero credits", async () => {
  await expect(creditManager.checkAndConsume("user", 1)).rejects.toThrow();
});

it("should handle large credit amounts", async () => {
  await expect(creditManager.checkAndConsume("user", 9999)).resolves.toBeTruthy();
});
```

### 5. 使用 Arrange-Act-Assert

```typescript
it("should grant credits successfully", async () => {
  // Arrange (准备)
  const userId = "user-123";
  const amount = 10;
  vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true }, error: null });

  // Act (执行)
  const result = await creditManager.grantCredits("admin", userId, amount);

  // Assert (断言)
  expect(result.success).toBe(true);
  expect(supabase.rpc).toHaveBeenCalledWith("fn_grant_credits", {
    target_user_id: userId,
    amount: amount,
  });
});
```

---

## CI/CD 集成

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

      - name: Run E2E tests
        run: npx playwright test
```

### 本地运行

```bash
# 运行所有测试
npm test

# 运行特定文件
npm test -- content-sanitizer.test.ts

# 监听模式
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage

# 运行 E2E 测试
npx playwright test

# E2E 调试模式
npx playwright test --debug
```

---

## 相关文档

- [API 开发指南](./api-development-guide.md)
- [架构文档](./README.md)
- [Admin 操作手册](../guides/admin-operations-guide.md)

---

**维护者**: QA Team
**反馈**: 请通过 GitHub Issues 提交反馈
