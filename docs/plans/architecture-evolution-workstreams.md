# 架构演进任务分配 - Worktree 并行推进方案

> **创建日期**: 2025-12-02
> **总负责人**: HQ
> **预计完成**: 6-8 周
> **并行工作组**: G1, G2, G3, G4

---

## 🎯 总体策略

将架构演进的 4 个 Phase 拆分为 **独立的、可并行的任务流**,分配给不同的 worktree:

- **G1**: 前端优化与组件重构
- **G2**: API 层与中间件
- **G3**: 核心业务逻辑优化
- **G4**: 基础设施与工具链

**关键原则**:

1. ✅ 任务之间**低耦合**,可独立开发和测试
2. ✅ 每个任务都有**明确的验收标准**
3. ✅ 优先修复**高风险问题**(🔴)
4. ✅ 定期同步与集成(每周五合并到 main)

---

## 📊 任务总览

| 工作组 | 主要职责   | Phase 1 任务数 | Phase 2 任务数 |
| ------ | ---------- | -------------- | -------------- |
| **G1** | 前端层     | 3              | 2              |
| **G2** | API 层     | 4              | 3              |
| **G3** | 业务逻辑层 | 2              | 4              |
| **G4** | 基础设施   | 2              | 2              |

---

## Phase 1: 地基加固 (Week 1-2)

### 🔵 G1 - 前端优化组

**分支**: `g1/phase1-frontend-refactor`

#### 任务 1.1: 拆分 ReportGeneratorSection 组件 🔴

**优先级**: P0 (高风险,必须先做)
**预计时间**: 8 小时

**目标**: 将 1300 行的巨型组件拆分为 7 个子组件

**拆分方案**:

```
app/components/report-generator/
├── ReportForm.tsx              (~200行) - 输入表单
├── LanguageSelector.tsx        (~50行)  - 语言选择器
├── StyleSelector.tsx           (~50行)  - 风格选择器
├── ProgressDisplay.tsx         (~100行) - 进度条
├── ReportResult.tsx            (~200行) - 结果展示
├── ExportButtons.tsx           (~100行) - 导出按钮
├── HistoryList.tsx             (~200行) - 历史列表
├── CreditsDisplay.tsx          (~100行) - 积分显示
└── index.tsx                   (~100行) - 组合层
```

**验收标准**:

- [ ] 每个子组件 <300 行
- [ ] 每个子组件有独立的 TypeScript 接口
- [ ] 每个子组件有对应的测试文件
- [ ] 原有功能 100% 保留
- [ ] 通过 `npm run lint` 和 `npm run test`

**依赖**: 无

---

#### 任务 1.2: 添加全局错误边界 🔴

**优先级**: P1
**预计时间**: 2 小时

**目标**: 捕获前端运行时错误,避免白屏

**实现**:

```typescript
// app/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // TODO Phase 3: 集成 Sentry
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>出错了</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

**集成到 app/layout.tsx**:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

**验收标准**:

- [ ] 抛出错误时显示友好页面
- [ ] 控制台记录详细错误信息
- [ ] 用户可以刷新恢复
- [ ] 不影响其他页面

**依赖**: 无

---

#### 任务 1.3: 代码格式化统一 🟢

**优先级**: P2
**预计时间**: 1 小时

**目标**: 统一代码风格,提升可读性

**步骤**:

1. 安装 Prettier

   ```bash
   npm install -D prettier
   ```

2. 创建 `.prettierrc`

   ```json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "printWidth": 80,
     "trailingComma": "es5",
     "arrowParens": "avoid"
   }
   ```

3. 添加脚本到 `package.json`

   ```json
   {
     "scripts": {
       "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
       "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
     }
   }
   ```

4. 格式化所有代码
   ```bash
   npm run format
   ```

**验收标准**:

- [ ] 所有文件格式一致
- [ ] `npm run format:check` 无错误
- [ ] VS Code 保存时自动格式化

**依赖**: 无

---

### 🟢 G2 - API 层与中间件组

**分支**: `g2/phase1-api-hardening`

#### 任务 2.1: 同步数据库类型定义 🔴

**优先级**: P0 (最高优先级,阻塞其他任务)
**预计时间**: 1 小时

**目标**: 修复 TypeScript 类型与数据库 schema 不一致的问题

**步骤**:

1. 确认 Supabase CLI 已登录

   ```bash
   npx supabase login
   npx supabase link --project-ref inmtounwqcjwsxkfnsfd
   ```

2. 重新生成类型定义

   ```bash
   npx supabase gen types typescript --linked --schema public > types/database.ts
   ```

3. 验证变更

   ```bash
   git diff types/database.ts
   ```

   **期望**: `quota_limit` 和 `reports_used` 字段已移除

4. 更新所有引用 (如果有)

   ```bash
   # 搜索所有引用旧字段的代码
   git grep "quota_limit"
   git grep "reports_used"
   ```

5. 提交
   ```bash
   git add types/database.ts
   git commit -m "fix: sync database types with latest schema (remove quota_limit, reports_used)"
   ```

**验收标准**:

- [ ] `types/database.ts` 与 Supabase schema 100% 一致
- [ ] `npm run build` 无 TypeScript 错误
- [ ] `git grep "quota_limit"` 无结果(除了迁移文件)

**依赖**: 无 (最优先执行)

---

#### 任务 2.2: 添加 API 限流中间件 🔴

**优先级**: P0
**预计时间**: 4 小时

**目标**: 防止恶意用户耗尽 LLM API 配额

**实现方案**: 使用 Upstash Redis + @upstash/ratelimit

**步骤**:

1. **注册 Upstash**
   - 访问 https://upstash.com
   - 创建 Redis 数据库 (免费层: 10,000 requests/day)
   - 复制 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`

2. **配置环境变量**

   ```bash
   # .env.local
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```

3. **安装依赖**

   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

4. **创建限流模块**

   ```typescript
   // lib/api/rate-limit.ts
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";

   const redis = Redis.fromEnv();

   // 报告生成限流: 每用户每分钟 5 次
   export const reportGenerationRateLimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(5, "1 m"),
     analytics: true,
     prefix: "ratelimit:report",
   });

   // 全局 API 限流: 每 IP 每秒 20 次
   export const globalRateLimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(20, "1 s"),
     analytics: true,
     prefix: "ratelimit:global",
   });

   // 辅助函数: 检查并返回限流响应
   export async function checkRateLimit(identifier: string, ratelimit: Ratelimit) {
     const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

     return {
       success,
       headers: {
         "X-RateLimit-Limit": limit.toString(),
         "X-RateLimit-Remaining": remaining.toString(),
         "X-RateLimit-Reset": reset.toString(),
       },
     };
   }
   ```

5. **集成到 API 路由**

   ```typescript
   // app/api/report/route.ts
   import { reportGenerationRateLimit, checkRateLimit } from '@/lib/api/rate-limit'

   export async function GET(request: Request) {
     try {
       const user = await getCurrentUser()
       if (!user) throw new UnauthorizedError()

       // 限流检查
       const identifier = user.id // 使用 user_id 作为限流标识
       const { success, headers } = await checkRateLimit(
         identifier,
         reportGenerationRateLimit
       )

       if (!success) {
         return NextResponse.json(
           { error: '请求过于频繁,请稍后再试' },
           { status: 429, headers }
         )
       }

       // ... 原有逻辑
       const report = await generateReport({ ... })

       return NextResponse.json(report, { headers })
     } catch (error) {
       return handleApiError(error)
     }
   }
   ```

6. **添加测试**

   ```typescript
   // __tests__/api/rate-limit.test.ts
   import { reportGenerationRateLimit } from "@/lib/api/rate-limit";

   describe("Rate Limit", () => {
     it("should allow 5 requests per minute", async () => {
       const userId = "test-user-123";

       // 前 5 次应该成功
       for (let i = 0; i < 5; i++) {
         const { success } = await reportGenerationRateLimit.limit(userId);
         expect(success).toBe(true);
       }

       // 第 6 次应该失败
       const { success } = await reportGenerationRateLimit.limit(userId);
       expect(success).toBe(false);
     });
   });
   ```

**验收标准**:

- [ ] 同一用户 1 分钟内请求 6 次,第 6 次返回 429
- [ ] 响应头包含 `X-RateLimit-*` 信息
- [ ] 测试覆盖关键场景
- [ ] 不影响正常用户体验

**依赖**: 任务 2.1 (类型定义)

---

#### 任务 2.3: 添加配置验证 🔴

**优先级**: P1
**预计时间**: 2 小时

**目标**: 启动时检查必需环境变量,避免运行时错误

**实现**:

```typescript
// lib/config/validate.ts
import { logger } from "@/lib/logger";

interface ConfigValidation {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const requiredConfig: ConfigValidation[] = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    validator: (v) => v.startsWith("https://"),
    errorMessage: "Must start with https://",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
  },
  {
    key: "FINNHUB_API_KEY",
    required: true,
  },
  {
    key: "NEXTAUTH_SECRET",
    required: true,
    validator: (v) => v.length >= 32,
    errorMessage: "Must be at least 32 characters",
  },
];

// 至少需要一个 LLM 提供商
const llmProviders = ["HELICONE_API_KEY", "OPENROUTER_API_KEY"];

export function validateConfig() {
  const errors: string[] = [];

  // 检查必需变量
  for (const config of requiredConfig) {
    const value = process.env[config.key];

    if (!value) {
      errors.push(`Missing required environment variable: ${config.key}`);
      continue;
    }

    if (config.validator && !config.validator(value)) {
      errors.push(`Invalid ${config.key}: ${config.errorMessage || "Validation failed"}`);
    }
  }

  // 检查 LLM 提供商
  const hasLLMProvider = llmProviders.some((key) => !!process.env[key]);
  if (!hasLLMProvider) {
    errors.push(`At least one LLM provider required: ${llmProviders.join(" or ")}`);
  }

  if (errors.length > 0) {
    logger.error("Configuration validation failed:");
    errors.forEach((err) => logger.error(`  - ${err}`));
    throw new Error("Invalid configuration. Check logs for details.");
  }

  logger.info("Configuration validated successfully");
}
```

**集成到启动流程**:

```typescript
// app/layout.tsx 或 middleware.ts
import { validateConfig } from "@/lib/config/validate";

// 在服务端启动时验证
if (typeof window === "undefined") {
  validateConfig();
}
```

**验收标准**:

- [ ] 缺少必需变量时启动失败
- [ ] 变量格式错误时启动失败
- [ ] 错误信息清晰,指出具体问题
- [ ] 所有变量正确时正常启动

**依赖**: 无

---

#### 任务 2.4: 统一 API 响应格式 🟡

**优先级**: P2
**预计时间**: 2 小时

**目标**: 标准化所有 API 的响应格式

**当前问题**:

- 有些 API 返回 `{ data: ... }`
- 有些直接返回对象
- 错误格式不统一

**目标格式**:

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-02T10:30:00Z",
    "requestId": "req-123"
  }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "积分不足",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-12-02T10:30:00Z",
    "requestId": "req-123"
  }
}
```

**实现**:

```typescript
// lib/api/response.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: Record<string, any>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    },
    { status }
  );
}
```

**迁移所有 API**:

```typescript
// 修改前
return NextResponse.json({ userId, credits });

// 修改后
return successResponse({ userId, credits });
```

**验收标准**:

- [ ] 所有 API 响应格式统一
- [ ] 包含 `requestId` 可追踪
- [ ] 前端可以根据 `success` 字段判断成功/失败
- [ ] 更新 API 文档

**依赖**: 任务 2.1

---

### 🟣 G3 - 核心业务逻辑组

**分支**: `g3/phase1-business-logic-cleanup`

#### 任务 3.1: 删除遗留代码 🟢

**优先级**: P2
**预计时间**: 1 小时

**目标**: 清理已被替代的旧代码

**清理清单**:

1. `lib/services/quota.ts` - 已被 `lib/core/credits/manager.ts` 替代
2. `@prisma/client` 依赖 - 项目使用 Supabase Client,不需要 Prisma

**步骤**:

1. 确认无引用

   ```bash
   git grep "quota.ts"
   git grep "@prisma/client"
   git grep "prisma"
   ```

2. 删除文件

   ```bash
   rm lib/services/quota.ts
   ```

3. 卸载依赖

   ```bash
   npm uninstall @prisma/client prisma
   ```

4. 更新 imports (如果有遗留)

   ```typescript
   // 修改前
   import { checkQuota } from "@/lib/services/quota";

   // 修改后
   import { CreditManager } from "@/lib/core/credits/manager";
   const creditManager = new CreditManager();
   ```

5. 提交
   ```bash
   git add .
   git commit -m "chore: remove legacy quota.ts and prisma dependencies"
   ```

**验收标准**:

- [ ] `lib/services/quota.ts` 已删除
- [ ] `package.json` 中无 `prisma` 相关依赖
- [ ] `npm run build` 成功
- [ ] 无 import 错误

**依赖**: 无

---

#### 任务 3.2: 添加业务逻辑测试 🟡

**优先级**: P1
**预计时间**: 6 小时

**目标**: 提升核心业务模块测试覆盖率到 >60%

**测试清单**:

1. **积分管理器** (`lib/core/credits/manager.test.ts`)

   ```typescript
   describe("CreditManager", () => {
     let manager: CreditManager;
     let mockSupabase: any;

     beforeEach(() => {
       mockSupabase = createMockSupabaseClient();
       manager = new CreditManager(mockSupabase);
     });

     describe("checkAndConsume", () => {
       it("should consume credit when balance is sufficient", async () => {
         mockSupabase.rpc.mockResolvedValue({
           data: { success: true, remaining_credits: 24 },
         });

         await expect(manager.checkAndConsume("user-123", "AAPL")).resolves.not.toThrow();
       });

       it("should throw InsufficientCreditsError when balance is 0", async () => {
         mockSupabase.rpc.mockResolvedValue({
           data: { success: false, remaining_credits: 0 },
         });

         await expect(manager.checkAndConsume("user-123", "AAPL")).rejects.toThrow(
           InsufficientCreditsError
         );
       });
     });

     describe("claimDailyReward", () => {
       it("should grant 5 credits on first claim", async () => {
         mockSupabase.rpc.mockResolvedValue({
           data: { success: true, credits_granted: 5 },
         });

         const credits = await manager.claimDailyReward("user-123");
         expect(credits).toBe(5);
       });

       it("should throw error if already claimed today", async () => {
         mockSupabase.rpc.mockResolvedValue({
           data: { success: false, message: "今日已领取" },
         });

         await expect(manager.claimDailyReward("user-123")).rejects.toThrow();
       });
     });
   });
   ```

2. **内容清洗器** (`lib/core/reports/content-sanitizer.test.ts`)

   ```typescript
   describe("ContentSanitizer", () => {
     describe("sanitizeContent", () => {
       it("should remove sensitive trading recommendations", () => {
         const input = "强烈建议买入此股票,立即购买!";
         const output = sanitizeContent(input);
         expect(output).not.toContain("买入");
         expect(output).toContain("[请自行判断]");
       });

       it("should preserve normal analysis text", () => {
         const input = "该公司市盈率为 25,处于行业中等水平";
         const output = sanitizeContent(input);
         expect(output).toBe(input);
       });

       it("should throw ValidationError for invalid markdown", () => {
         const input = "# Title\n\n[Invalid Link](";
         expect(() => sanitizeContent(input)).toThrow(ValidationError);
       });
     });
   });
   ```

3. **错误类** (`lib/core/errors.test.ts`)

   ```typescript
   describe("AppError", () => {
     it("should create InsufficientCreditsError with correct code", () => {
       const error = new InsufficientCreditsError("余额不足");
       expect(error.code).toBe("INSUFFICIENT_CREDITS");
       expect(error.statusCode).toBe(402);
       expect(error.message).toBe("余额不足");
     });

     it("should create ReportGenerationError with details", () => {
       const error = new ReportGenerationError("LLM failed", { provider: "helicone" });
       expect(error.code).toBe("REPORT_GENERATION_FAILED");
       expect(error.details).toEqual({ provider: "helicone" });
     });
   });
   ```

**验收标准**:

- [ ] 核心模块测试覆盖率 >60%
- [ ] 所有测试通过 `npm run test`
- [ ] 关键业务逻辑有边界测试

**依赖**: 任务 2.1

---

### 🟠 G4 - 基础设施与工具链组

**分支**: `g4/phase1-infrastructure-tooling`

#### 任务 4.1: 添加数据库备份脚本 🟡

**优先级**: P1
**预计时间**: 3 小时

**目标**: 定期备份 Supabase 数据库

**实现**:

```bash
# scripts/backup-database.sh
#!/bin/bash

# 配置
PROJECT_REF="inmtounwqcjwsxkfnsfd"
BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 使用 pg_dump 导出
npx supabase db dump \
  --project-ref "$PROJECT_REF" \
  --schema public \
  --file "$BACKUP_FILE"

# 压缩
gzip "$BACKUP_FILE"

echo "✅ Backup completed: ${BACKUP_FILE}.gz"

# 清理 30 天前的备份
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# 可选: 上传到云存储
# aws s3 cp "${BACKUP_FILE}.gz" s3://my-bucket/backups/
```

**添加到 package.json**:

```json
{
  "scripts": {
    "backup:db": "bash scripts/backup-database.sh"
  }
}
```

**验收标准**:

- [ ] 运行 `npm run backup:db` 生成备份文件
- [ ] 备份文件包含所有表和数据
- [ ] 自动清理旧备份
- [ ] 添加定时任务说明 (GitHub Actions/Cron)

**依赖**: 无

---

#### 任务 4.2: 改进开发者体验工具 🟢

**优先级**: P2
**预计时间**: 2 小时

**目标**: 提升本地开发效率

**改进清单**:

1. **添加环境变量检查脚本**

   ```bash
   # scripts/check-env.sh
   #!/bin/bash

   echo "🔍 Checking environment variables..."

   REQUIRED_VARS=(
     "NEXT_PUBLIC_SUPABASE_URL"
     "NEXT_PUBLIC_SUPABASE_ANON_KEY"
     "SUPABASE_SERVICE_ROLE_KEY"
     "FINNHUB_API_KEY"
   )

   MISSING_VARS=()

   for VAR in "${REQUIRED_VARS[@]}"; do
     if [ -z "${!VAR}" ]; then
       MISSING_VARS+=("$VAR")
     fi
   done

   if [ ${#MISSING_VARS[@]} -eq 0 ]; then
     echo "✅ All required variables are set"
     exit 0
   else
     echo "❌ Missing variables:"
     printf '  - %s\n' "${MISSING_VARS[@]}"
     exit 1
   fi
   ```

2. **添加快速启动脚本**

   ```bash
   # scripts/dev-start.sh
   #!/bin/bash

   echo "🚀 Starting development environment..."

   # 检查环境变量
   npm run env:check || exit 1

   # 检查依赖
   if [ ! -d "node_modules" ]; then
     echo "📦 Installing dependencies..."
     npm ci
   fi

   # 启动开发服务器
   npm run dev
   ```

3. **添加 VS Code 推荐配置**

   ```json
   // .vscode/extensions.json
   {
     "recommendations": [
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "bradlc.vscode-tailwindcss",
       "supabase.supabase-vscode"
     ]
   }
   ```

   ```json
   // .vscode/settings.json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

**验收标准**:

- [ ] `npm run env:check` 可以检查环境变量
- [ ] `bash scripts/dev-start.sh` 一键启动
- [ ] VS Code 打开项目时提示安装推荐扩展

**依赖**: 无

---

## 🔄 集成与同步流程

### 每周五集成日

**流程**:

1. 各组完成当周任务并自测
2. 提交 PR 到 main 分支
3. HQ 审查所有 PR
4. 按优先级合并 (高优先级先合并)
5. 合并后运行完整测试套件
6. 部署到 staging 环境验证

**PR 命名规范**:

```
[G1/Phase1] 拆分 ReportGeneratorSection 组件
[G2/Phase1] 添加 API 限流中间件
[G3/Phase1] 删除遗留代码
[G4/Phase1] 添加数据库备份脚本
```

### 冲突解决策略

**预防**:

- 每天早上同步 main 到各 worktree
  ```bash
  cd D:\Projects\qiltrack-ai-g1
  git fetch origin
  git rebase origin/main
  ```

**发生冲突时**:

1. G1-Claude 尝试自动解决
2. 无法解决时通知 G1-Codex
3. G1-Codex 分析冲突并给出解决方案
4. 实在无法解决时上报 HQ

---

## 📊 进度跟踪

### 看板状态

| 任务 ID | 组别 | 任务名称                    | 状态    | 负责人    | 预计完成 |
| ------- | ---- | --------------------------- | ------- | --------- | -------- |
| G1-1.1  | G1   | 拆分 ReportGeneratorSection | ⏳ Todo | G1-Claude | Week 1   |
| G1-1.2  | G1   | 添加全局错误边界            | ⏳ Todo | G1-Claude | Week 1   |
| G1-1.3  | G1   | 代码格式化统一              | ⏳ Todo | G1-Claude | Week 1   |
| G2-2.1  | G2   | 同步数据库类型              | ⏳ Todo | G2-Claude | Week 1   |
| G2-2.2  | G2   | API 限流                    | ⏳ Todo | G2-Claude | Week 1   |
| G2-2.3  | G2   | 配置验证                    | ⏳ Todo | G2-Claude | Week 1   |
| G2-2.4  | G2   | 统一 API 响应               | ⏳ Todo | G2-Claude | Week 2   |
| G3-3.1  | G3   | 删除遗留代码                | ⏳ Todo | G3-Claude | Week 1   |
| G3-3.2  | G3   | 业务逻辑测试                | ⏳ Todo | G3-Claude | Week 2   |
| G4-4.1  | G4   | 数据库备份                  | ⏳ Todo | G4-Claude | Week 1   |
| G4-4.2  | G4   | 开发工具改进                | ⏳ Todo | G4-Claude | Week 1   |

**状态说明**:

- ⏳ Todo: 未开始
- 🔄 In Progress: 进行中
- 🔍 In Review: 代码审查中
- ✅ Done: 已完成
- 🚫 Blocked: 被阻塞

---

## 📝 下一步行动

### 立即开始 (Week 1 Day 1)

**老板 (你) 的操作**:

1. **重置所有工作区**

   ```powershell
   .\scripts\reset-worktree.ps1 -Name g1
   .\scripts\reset-worktree.ps1 -Name g2
   .\scripts\reset-worktree.ps1 -Name g3
   .\scripts\reset-worktree.ps1 -Name g4
   ```

2. **创建任务分支**

   ```powershell
   cd D:\Projects\qiltrack-ai-g1
   git checkout -b g1/phase1-frontend-refactor

   cd D:\Projects\qiltrack-ai-g2
   git checkout -b g2/phase1-api-hardening

   cd D:\Projects\qiltrack-ai-g3
   git checkout -b g3/phase1-business-logic-cleanup

   cd D:\Projects\qiltrack-ai-g4
   git checkout -b g4/phase1-infrastructure-tooling
   ```

3. **分配任务给各组 Codex**

   **给 G1-Codex**:

   ```
   @G1-Codex
   Report: docs/plans/architecture-evolution-workstreams.md
   Status: 新任务 - Phase 1 前端优化
   Next: 阅读文档并开始任务 G1-1.1 (拆分 ReportGeneratorSection)
   ```

   **给 G2-Codex**:

   ```
   @G2-Codex
   Report: docs/plans/architecture-evolution-workstreams.md
   Status: 新任务 - Phase 1 API 加固
   Next: 阅读文档并开始任务 G2-2.1 (同步数据库类型) - 最高优先级!
   ```

   **给 G3-Codex**:

   ```
   @G3-Codex
   Report: docs/plans/architecture-evolution-workstreams.md
   Status: 新任务 - Phase 1 业务逻辑清理
   Next: 阅读文档并开始任务 G3-3.1 (删除遗留代码)
   ```

   **给 G4-Codex**:

   ```
   @G4-Codex
   Report: docs/plans/architecture-evolution-workstreams.md
   Status: 新任务 - Phase 1 基础设施
   Next: 阅读文档并开始任务 G4-4.1 (数据库备份脚本)
   ```

4. **开始传话筒模式** 🎙️
   - 在各个 Codex 和 Claude 之间复制粘贴消息
   - 按照《老板操作手册》的流程

---

## 🎯 Phase 1 成功标准

**Week 1-2 结束时,整个项目应该达到**:

- ✅ 所有 🔴 高风险问题清零
- ✅ TypeScript 无类型错误
- ✅ 所有组件 <300 行
- ✅ API 有限流保护
- ✅ 测试覆盖率 >50%
- ✅ 代码格式统一
- ✅ 有数据库备份机制
- ✅ 配置验证完善

**这将为 Phase 2 (缓存与队列) 打下坚实基础!**

---

_最后更新: 2025-12-02_
