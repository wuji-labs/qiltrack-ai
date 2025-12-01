# API 开发指南

> **最后更新**: 2025-12-01
> **API 版本**: v2.0

---

## 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [创建新 API](#创建新-api)
4. [错误处理](#错误处理)
5. [认证和授权](#认证和授权)
6. [测试](#测试)
7. [最佳实践](#最佳实践)

---

## 快速开始

### API 文件结构

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api/error-handler";
import { MyService } from "@/lib/core/my-module/service";

export async function GET(request: NextRequest) {
  try {
    // 1. 认证 (如需要)
    const user = await authenticate(request);

    // 2. 参数验证
    const params = validateParams(request);

    // 3. 业务逻辑 (使用 core 层)
    const service = new MyService();
    const result = await service.doSomething(params);

    // 4. 返回结果
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 核心概念

### 1. 三层架构

```
API Route (HTTP 处理)
    ↓
Core Service (业务逻辑)
    ↓
Service Adapter (外部服务)
```

### 2. 职责分离

- **API Route**: 仅负责 HTTP 请求/响应处理
- **Core Service**: 包含业务逻辑
- **Service Adapter**: 封装外部服务调用

### 3. 统一错误处理

所有 API 使用统一的错误处理：

```typescript
import { handleApiError } from "@/lib/api/error-handler";

try {
  // ... 业务逻辑
} catch (error) {
  return handleApiError(error);  // 自动格式化错误响应
}
```

---

## 创建新 API

### 步骤 1: 创建业务逻辑

```typescript
// lib/core/my-module/service.ts
export class MyService {
  async doSomething(params: MyParams): Promise<MyResult> {
    // 实现业务逻辑
    return result;
  }
}
```

### 步骤 2: 创建 API Route

```typescript
// app/api/my-endpoint/route.ts
import { MyService } from "@/lib/core/my-module/service";
import { handleApiError, successResponse } from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/core/errors";

export async function GET(request: NextRequest) {
  try {
    // 参数验证
    const { searchParams } = new URL(request.url);
    const param = searchParams.get("param");

    if (!param) {
      throw new ValidationError("Missing required parameter: param");
    }

    // 调用业务逻辑
    const service = new MyService();
    const result = await service.doSomething({ param });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 步骤 3: 添加类型定义

```typescript
// lib/core/my-module/types.ts
export interface MyParams {
  param: string;
}

export interface MyResult {
  data: string;
}
```

### 步骤 4: 编写测试

```typescript
// lib/core/my-module/service.test.ts
import { describe, it, expect } from "vitest";
import { MyService } from "./service";

describe("MyService", () => {
  it("should do something", async () => {
    const service = new MyService();
    const result = await service.doSomething({ param: "test" });
    expect(result.data).toBe("expected");
  });
});
```

---

## 错误处理

### 标准错误类

```typescript
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InsufficientCreditsError,
  ExternalServiceError,
} from "@/lib/core/errors";

// 使用示例
if (!userId) {
  throw new UnauthorizedError("User not authenticated");
}

if (credits < 1) {
  throw new InsufficientCreditsError("Not enough credits");
}

if (!exists) {
  throw new NotFoundError("Resource not found");
}
```

### 自定义错误

```typescript
// lib/core/my-module/errors.ts
import { AppError } from "@/lib/core/errors";

export class MyCustomError extends AppError {
  constructor(message: string, details?: any) {
    super("MY_CUSTOM_ERROR", message, 400, details);
  }
}
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "积分不足",
    "details": {
      "required": 1,
      "available": 0
    }
  }
}
```

---

## 认证和授权

### 认证

```typescript
import { createServerClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/lib/core/errors";

async function authenticate(request: NextRequest) {
  const supabase = createServerClient(request.cookies);

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user?.id) {
    throw new UnauthorizedError("Session not found");
  }

  return session.user.id;
}
```

### 授权 (管理员检查)

```typescript
import { ForbiddenError } from "@/lib/core/errors";

async function checkAdmin(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data || data.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
}
```

---

## 测试

### 单元测试 (业务逻辑)

```typescript
import { describe, it, expect, vi } from "vitest";
import { MyService } from "@/lib/core/my-module/service";

describe("MyService", () => {
  it("should handle valid input", async () => {
    const service = new MyService();
    const result = await service.doSomething({ param: "test" });
    expect(result.data).toBe("expected");
  });

  it("should throw error on invalid input", async () => {
    const service = new MyService();
    await expect(
      service.doSomething({ param: "" })
    ).rejects.toThrow("Invalid parameter");
  });
});
```

### API 测试 (集成测试)

```typescript
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/my-endpoint/route";

describe("GET /api/my-endpoint", () => {
  it("should return 200 with valid params", async () => {
    const request = new Request("http://localhost/api/my-endpoint?param=test");
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("should return 400 with missing params", async () => {
    const request = new Request("http://localhost/api/my-endpoint");
    const response = await GET(request as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});
```

---

## 最佳实践

### 1. 保持 API Route 简洁

❌ **不好的做法**:
```typescript
export async function POST(request: Request) {
  // 200 行业务逻辑混在 route 中
  const data = await fetchFromAPI();
  const processed = processData(data);
  const sanitized = sanitizeContent(processed);
  // ...
}
```

✅ **好的做法**:
```typescript
export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    const params = await request.json();

    const service = new MyService();
    const result = await service.process(params);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. 使用依赖注入

✅ **推荐**:
```typescript
export class ReportGenerator {
  constructor(
    private llmService: LLMService,
    private dataService: MarketDataService
  ) {}

  async generate(params) {
    // 使用注入的服务
    const data = await this.dataService.fetch();
    const report = await this.llmService.generate(data);
    return report;
  }
}
```

### 3. 参数验证

✅ **始终验证输入**:
```typescript
function validateParams(searchParams: URLSearchParams) {
  const symbol = searchParams.get("symbol")?.toUpperCase().trim();

  if (!symbol) {
    throw new ValidationError("Missing required parameter: symbol");
  }

  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    throw new ValidationError("Invalid symbol format");
  }

  return { symbol };
}
```

### 4. 使用类型定义

✅ **定义清晰的类型**:
```typescript
// types.ts
export interface CreateReportParams {
  symbol: string;
  language: Language;
  tone: ReportTone;
}

export interface CreateReportResult {
  id: string;
  slug: string;
  content: string;
  created_at: string;
}

// service.ts
async createReport(
  params: CreateReportParams
): Promise<CreateReportResult> {
  // ...
}
```

### 5. 错误日志

```typescript
try {
  // ...
} catch (error) {
  console.error("[MY_SERVICE_ERROR]", {
    error: String(error),
    params,
    timestamp: new Date().toISOString(),
  });
  throw error;
}
```

### 6. 性能追踪

```typescript
import { getLangfuseClient } from "@/lib/observability/langfuse";

const langfuse = getLangfuseClient();
const trace = langfuse?.trace({
  name: "my-service.operation",
  metadata: { userId, params },
});

const span = trace?.span({
  name: "step-1",
  input: { data },
});

// 执行操作
const result = await doSomething();

span?.end({ output: { result } });
```

---

## 示例: 完整 API 实现

```typescript
// lib/core/analytics/service.ts
export class AnalyticsService {
  async getStats(userId: string): Promise<Stats> {
    // 业务逻辑
    return stats;
  }
}

// lib/core/analytics/types.ts
export interface Stats {
  totalReports: number;
  creditsUsed: number;
}

// app/api/analytics/route.ts
import { NextRequest } from "next/server";
import { AnalyticsService } from "@/lib/core/analytics/service";
import { handleApiError, successResponse } from "@/lib/api/error-handler";
import { createServerClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/lib/core/errors";

export async function GET(request: NextRequest) {
  try {
    // 1. 认证
    const supabase = createServerClient(request.cookies);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user?.id) {
      throw new UnauthorizedError();
    }

    // 2. 业务逻辑
    const service = new AnalyticsService();
    const stats = await service.getStats(session.user.id);

    // 3. 返回结果
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

// lib/core/analytics/service.test.ts
import { describe, it, expect } from "vitest";
import { AnalyticsService } from "./service";

describe("AnalyticsService", () => {
  it("should return stats", async () => {
    const service = new AnalyticsService();
    const stats = await service.getStats("user-id");
    expect(stats).toHaveProperty("totalReports");
    expect(stats).toHaveProperty("creditsUsed");
  });
});
```

---

## 相关文档

- [架构文档](./README.md)
- [错误处理文档](./error-handling.md)
- [测试指南](./testing-guide.md)

---

**维护者**: Development Team
**反馈**: 请通过 GitHub Issues 提交反馈
