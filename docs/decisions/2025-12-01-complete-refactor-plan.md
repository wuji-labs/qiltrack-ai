# Investor AI 完整架构重构方案

> **文档版本**: v1.0
> **创建日期**: 2025-12-01
> **作者**: Architecture Team
> **目标**: 将现有项目从单体架构升级为符合 SaaS 标准的模块化架构

---

## 📋 目录

1. [现状分析](#1-现状分析)
2. [目标架构](#2-目标架构)
3. [技术选型](#3-技术选型)
4. [核心改造内容](#4-核心改造内容)
5. [详细实施步骤](#5-详细实施步骤)
6. [目录结构设计](#6-目录结构设计)
7. [时间与资源估算](#7-时间与资源估算)
8. [风险评估与应对](#8-风险评估与应对)
9. [验收标准](#9-验收标准)

---

## 1. 现状分析

### 1.1 项目概况

**Investor AI** 是一个基于 AI 的美股投研报告生成平台，当前技术栈：
- Next.js 16.0.3 (App Router)
- Supabase (PostgreSQL + Auth + Storage)
- OpenRouter/Helicone (LLM 服务)
- TypeScript 5+

**代码统计**：
- 87 个 TS/TSX 文件
- 21 个 API 路由
- 核心 API 文件：`app/api/report/route.ts` (795 行)

### 1.2 核心问题（按优先级排序）

#### 🔴 P0 - 严重问题

**问题 1: 业务逻辑混杂在 API 路由中**
```typescript
// 当前：app/api/report/route.ts (795 行)
export async function POST(request: Request) {
  // ❌ 包含所有业务逻辑：
  // - LLM 调用
  // - 数据获取与整合
  // - 内容净化
  // - Storage 上传
  // - 积分扣除
}
```
**影响**：
- 代码难以测试（需要 mock 多个外部依赖）
- 逻辑无法复用
- 违反单一职责原则
- 维护成本高

**问题 2: 配额系统重复实现**
```sql
-- 存在两套配额系统：
-- 1. profiles 表
profiles.quota_limit      -- 配额上限
profiles.reports_used     -- 已使用次数

-- 2. report_credits 表
report_credits.credits_available  -- 可用积分
report_credits.credits_used       -- 已用积分
```
**影响**：
- 数据可能不一致
- 业务逻辑混乱
- 增加维护成本

**问题 3: 缺少核心服务层（core/）**
```
当前结构：
lib/
├── services/
│   ├── api.ts          # ❌ 仅客户端 API 调用
│   └── quota.ts        # ⚠️ 部分封装
└── supabase/

目标结构：
lib/
├── core/               # ❌ 不存在
│   ├── reports/
│   ├── credits/
│   └── users/
```
**影响**：
- 业务逻辑散落各处
- 无法支持微服务化
- 代码复用困难

#### 🟡 P1 - 重要问题

**问题 4: Admin 面板功能不完整**

当前只有报告管理，缺少：
- ❌ 用户管理（查看、编辑、删除用户）
- ❌ 积分管理（手动调整、批量操作）
- ❌ 审计日志查看
- ❌ 系统配置管理

**问题 5: 错误处理不统一**
```typescript
// app/api/report/route.ts
throw new Error(`Embedding request failed: ${res.status}`);

// lib/services/api.ts
const error = new Error(message) as Error & { code?: string };
error.code = apiError?.code;
throw error;
```

**问题 6: 测试覆盖率低**
- 已测试：`api.test.ts`, `quota.test.ts` (约 15%)
- 未测试：报告生成核心逻辑、Admin API、内容净化

#### 🟢 P2 - 优化项

- 缺少 API 文档（OpenAPI/Swagger）
- 类型定义不统一（camelCase vs snake_case）
- 无性能监控（Redis 缓存、CDN 加速）

### 1.3 与 ADR 目标的差距

| ADR 要求 | 当前状态 | 完成度 |
|---------|---------|--------|
| 业务逻辑迁移到 `core/` 层 | ❌ 未实现 | 0% |
| 创建独立的 `/admin` 面板 | ⚠️ 部分实现（仅报告管理） | 30% |
| 核心服务层（reports/credits/users） | ❌ 未实现 | 10% |
| 统一 API 端点与服务通信 | ⚠️ 部分实现 | 50% |
| 数据库模型与 RLS | ✅ 已完成 | 100% |
| 可扩展性与微服务支持 | ❌ 未准备 | 5% |

**总体进度：约 32.5%**

---

## 2. 目标架构

### 2.1 架构原则

1. **关注点分离**：UI、业务逻辑、数据访问三层解耦
2. **单一职责**：每个模块只负责一件事
3. **依赖倒置**：高层模块不依赖低层模块，都依赖抽象
4. **可测试性**：核心逻辑可独立测试，无需启动完整应用
5. **可扩展性**：便于未来拆分为微服务

### 2.2 目标三层架构

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer (表现层)              │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  User Frontend      │  │   Admin Panel       │  │
│  │  (Next.js Pages)    │  │   (Refine)          │  │
│  └─────────────────────┘  └─────────────────────┘  │
└───────────────────┬─────────────┬───────────────────┘
                    │             │
┌───────────────────▼─────────────▼───────────────────┐
│              API Layer (接口层)                       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Next.js API Routes                          │  │
│  │  - /api/report        - /api/admin/*        │  │
│  │  - /api/auth          - /api/credits        │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│          Business Logic Layer (业务逻辑层)            │
│  ┌────────────────────────────────────────────────┐ │
│  │  lib/core/                                     │ │
│  │  ┌───────────────┐  ┌──────────────────────┐ │ │
│  │  │ reports/      │  │ credits/             │ │ │
│  │  │ - generator   │  │ - manager            │ │ │
│  │  │ - reuse       │  │ - events             │ │ │
│  │  │ - export      │  │ - transactions       │ │ │
│  │  └───────────────┘  └──────────────────────┘ │ │
│  │  ┌───────────────┐  ┌──────────────────────┐ │ │
│  │  │ users/        │  │ admin/               │ │ │
│  │  │ - profile     │  │ - user-management    │ │ │
│  │  │ - auth        │  │ - audit              │ │ │
│  │  └───────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│            Data & Service Layer (数据与服务层)        │
│  ┌──────────────────┐  ┌──────────────────────┐    │
│  │ Supabase Client  │  │ External Services    │    │
│  │ - Auth           │  │ - Finnhub API        │    │
│  │ - Database       │  │ - LLM (OpenRouter)   │    │
│  │ - Storage        │  │ - Langfuse           │    │
│  └──────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 2.3 核心设计决策

#### 决策 1: 引入 Refine 作为 Admin 框架

**理由**：
- ✅ 开箱即用的 CRUD（列表、表单、详情页）
- ✅ 内置权限管理（RBAC）
- ✅ 自动生成 API 调用（Data Provider）
- ✅ 搜索/过滤/排序/分页全部内置
- ✅ 与 Next.js App Router 完美集成
- ✅ 节省 40-50% 开发时间

**替代方案对比**：
| 框架 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Refine** | 轻量、灵活、Next.js 集成好 | 社区相对较小 | ✅ 推荐 |
| React Admin | 功能强大、社区大 | 较重、学习曲线陡 | 复杂 Admin |
| AdminJS | 自动生成、零配置 | 定制性差 | 简单 CRUD |
| 手写 | 完全控制 | 开发慢、维护成本高 | ❌ 不推荐 |

**技术栈**：
```json
{
  "@refinedev/core": "^4.47.0",
  "@refinedev/nextjs-router": "^6.0.0",
  "@refinedev/simple-rest": "^5.0.0",
  "@refinedev/react-table": "^5.6.0"
}
```

#### 决策 2: 统一配额系统为 Credits 模型

**当前问题**：
```sql
-- 两套系统并存
profiles.quota_limit / profiles.reports_used  -- ❌ 废弃
report_credits.*                               -- ✅ 保留
```

**解决方案**：
1. 完全移除 `profiles.quota_limit` 和 `reports_used` 字段
2. 所有配额操作通过 `report_credits` 表
3. 使用 RPC 函数确保原子性：
   - `fn_consume_report_credit()`
   - `fn_grant_credits(amount, reason)`
   - `fn_get_user_credits()`

#### 决策 3: 创建 `lib/core/` 业务逻辑层

**目标结构**：
```
lib/core/
├── reports/
│   ├── generator.ts       # 报告生成核心逻辑
│   ├── reuse.ts          # 报告复用逻辑
│   ├── export.ts         # PDF/Word 导出
│   └── content-sanitizer.ts  # 内容净化
├── credits/
│   ├── manager.ts        # 积分管理
│   ├── transactions.ts   # 交易日志
│   └── rewards.ts        # 每日签到奖励
├── users/
│   ├── profile.ts        # 用户资料管理
│   └── preferences.ts    # 用户偏好设置
└── admin/
    ├── user-management.ts  # 用户 CRUD
    ├── audit.ts          # 审计日志
    └── system-config.ts  # 系统配置
```

**每个模块的职责**：
- **reports/generator.ts**: LLM 调用、数据整合、报告生成
- **credits/manager.ts**: 积分查询、扣除、充值
- **users/profile.ts**: 用户信息更新、权限检查
- **admin/user-management.ts**: 管理员操作用户

---

## 3. 技术选型

### 3.1 核心技术栈（保持不变）

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | Next.js | 16.0.3 | App Router + SSR |
| **UI** | Tailwind CSS | 4.0 | 样式框架 |
| **语言** | TypeScript | 5+ | 类型安全 |
| **数据库** | Supabase (PostgreSQL) | - | 数据存储 + Auth |
| **LLM** | OpenRouter/Helicone | - | AI 报告生成 |

### 3.2 新增技术栈

#### Admin 面板
```json
{
  "@refinedev/core": "^4.47.0",
  "@refinedev/nextjs-router": "^6.0.0",
  "@refinedev/simple-rest": "^5.0.0",
  "@refinedev/react-table": "^5.6.0",
  "@refinedev/inferencer": "^4.5.0"  // 自动生成 CRUD 页面
}
```

#### 测试增强
```json
{
  "vitest": "^2.1.8",              // 保持
  "@vitest/coverage-v8": "^2.1.8", // 新增：覆盖率报告
  "msw": "^2.0.0"                  // 新增：API Mock
}
```

#### 错误追踪与监控
```json
{
  "@sentry/nextjs": "^8.0.0",      // 新增：错误追踪
  "@vercel/analytics": "^1.0.0"    // 新增：性能监控
}
```

#### API 文档
```json
{
  "swagger-jsdoc": "^6.2.8",       // 新增：生成 OpenAPI 文档
  "swagger-ui-react": "^5.0.0"     // 新增：API 文档 UI
}
```

### 3.3 数据库变更

#### 新增表

**admin_settings** - 系统配置表
```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**audit_logs** - 审计日志（增强版）
```sql
-- 已存在，需增强索引
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### 移除字段

```sql
-- 废弃 profiles 表中的配额字段
ALTER TABLE profiles DROP COLUMN IF EXISTS quota_limit;
ALTER TABLE profiles DROP COLUMN IF EXISTS reports_used;
```

#### 新增 RPC 函数

```sql
-- 管理员授予积分
CREATE OR REPLACE FUNCTION fn_grant_credits(
  target_user_id UUID,
  amount INT,
  reason TEXT DEFAULT 'admin_grant'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- 更新积分
  UPDATE report_credits
  SET credits_available = credits_available + amount,
      last_updated = NOW()
  WHERE user_id = target_user_id;

  -- 记录事件
  INSERT INTO report_credit_events (user_id, event_type, credits_amount, metadata)
  VALUES (target_user_id, 'admin_grant', amount, jsonb_build_object('reason', reason));

  -- 审计日志
  INSERT INTO audit_logs (user_id, action, table_name, details)
  VALUES (auth.uid(), 'GRANT_CREDITS', 'report_credits',
          jsonb_build_object('target_user', target_user_id, 'amount', amount));

  RETURN jsonb_build_object('success', true, 'credits_added', amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. 核心改造内容

### 4.1 业务逻辑重构

#### 当前 `app/api/report/route.ts` (795 行)

**拆分为**：

**1. `lib/core/reports/generator.ts`** (核心生成逻辑)
```typescript
export class ReportGenerator {
  constructor(
    private llmService: LLMService,
    private dataService: MarketDataService,
    private sanitizer: ContentSanitizer
  ) {}

  async generate(params: GenerateReportParams): Promise<Report> {
    // 1. 获取市场数据
    const marketData = await this.dataService.fetchCompanyData(params.symbol);

    // 2. 调用 LLM 生成报告
    const rawReport = await this.llmService.generateReport(marketData, params);

    // 3. 内容净化
    const sanitized = this.sanitizer.sanitize(rawReport);

    return sanitized;
  }
}
```

**2. `lib/services/llm.ts`** (LLM 服务适配器)
```typescript
export class LLMService {
  async generateReport(data: MarketData, params: ReportParams): Promise<string> {
    // Helicone 优先，失败回退到 OpenRouter
    try {
      return await this.callHelicone(data, params);
    } catch (error) {
      return await this.callOpenRouter(data, params);
    }
  }

  private async callHelicone(...) { /* ... */ }
  private async callOpenRouter(...) { /* ... */ }
}
```

**3. `lib/services/market-data.ts`** (Finnhub 数据获取)
```typescript
export class MarketDataService {
  async fetchCompanyData(symbol: string): Promise<MarketData> {
    const [profile, quote, metrics, news] = await Promise.all([
      this.getProfile(symbol),
      this.getQuote(symbol),
      this.getMetrics(symbol),
      this.getNews(symbol)
    ]);

    return { profile, quote, metrics, news };
  }
}
```

**4. `lib/core/reports/content-sanitizer.ts`** (内容净化)
```typescript
export class ContentSanitizer {
  sanitize(content: string): string {
    const replacements = {
      '买入': '分析视角',
      '目标价': '市场预期讨论',
      // ...更多敏感词
    };

    let sanitized = content;
    for (const [bad, good] of Object.entries(replacements)) {
      sanitized = sanitized.replace(new RegExp(bad, 'gi'), good);
    }

    return this.addDisclaimer(sanitized);
  }
}
```

**5. 新的 `app/api/report/route.ts`** (仅负责 HTTP 处理)
```typescript
import { ReportGenerator } from '@/lib/core/reports/generator';
import { CreditManager } from '@/lib/core/credits/manager';

export async function POST(request: Request) {
  // 1. 认证
  const user = await authenticate(request);

  // 2. 验证请求
  const params = await request.json();
  validateParams(params);

  // 3. 检查积分
  const creditManager = new CreditManager();
  await creditManager.checkAndConsume(user.id, 1);

  // 4. 生成报告（业务逻辑）
  const generator = new ReportGenerator(
    new LLMService(),
    new MarketDataService(),
    new ContentSanitizer()
  );
  const report = await generator.generate(params);

  // 5. 保存到数据库
  const saved = await saveReport(report, user.id);

  return Response.json(saved);
}
```

**优势**：
- ✅ 每个类职责单一
- ✅ 可独立测试（mock 依赖）
- ✅ 可复用（CLI、定时任务、Webhook 都可调用）
- ✅ 易于维护（修改 LLM 提示词只需改 `LLMService`）

### 4.2 统一配额系统

#### 数据库迁移

**Migration: 20251201_unify_credits.sql**
```sql
-- 1. 数据迁移（将 profiles 的配额数据迁移到 report_credits）
UPDATE report_credits rc
SET
  credits_available = p.quota_limit - p.reports_used,
  credits_used = p.reports_used
FROM profiles p
WHERE rc.user_id = p.id
  AND p.quota_limit IS NOT NULL;

-- 2. 移除废弃字段
ALTER TABLE profiles DROP COLUMN IF EXISTS quota_limit;
ALTER TABLE profiles DROP COLUMN IF EXISTS reports_used;

-- 3. 确保所有用户都有 credits 记录（历史用户可能没有）
INSERT INTO report_credits (user_id, credits_available, credits_used)
SELECT p.id, 30, 0  -- 默认 30 积分
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM report_credits rc WHERE rc.user_id = p.id
);
```

#### 统一的 Credits Manager

**lib/core/credits/manager.ts**
```typescript
export class CreditManager {
  /**
   * 检查并消费积分（原子操作）
   */
  async checkAndConsume(userId: string, amount: number = 1): Promise<void> {
    const { data, error } = await supabase.rpc('fn_consume_report_credit', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error || !data?.success) {
      throw new InsufficientCreditsError('积分不足');
    }
  }

  /**
   * 获取用户积分余额
   */
  async getBalance(userId: string): Promise<number> {
    const { data } = await supabase
      .from('report_credits')
      .select('credits_available')
      .eq('user_id', userId)
      .single();

    return data?.credits_available ?? 0;
  }

  /**
   * 管理员授予积分
   */
  async grantCredits(
    adminId: string,
    targetUserId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    // 检查管理员权限
    await this.checkAdminPermission(adminId);

    const { error } = await supabase.rpc('fn_grant_credits', {
      target_user_id: targetUserId,
      amount,
      reason
    });

    if (error) throw error;
  }
}
```

### 4.3 Refine Admin 集成

#### 安装 Refine

```bash
npm install @refinedev/core @refinedev/nextjs-router @refinedev/simple-rest @refinedev/react-table @tanstack/react-table
```

#### 创建 Supabase Data Provider

**lib/admin/data-provider.ts**
```typescript
import { DataProvider } from "@refinedev/core";
import { supabase } from "@/lib/supabase/client";

export const supabaseDataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    let query = supabase.from(resource).select('*', { count: 'exact' });

    // 分页
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      query = query.range((current - 1) * pageSize, current * pageSize - 1);
    }

    // 排序
    if (sorters && sorters.length > 0) {
      const { field, order } = sorters[0];
      query = query.order(field, { ascending: order === 'asc' });
    }

    // 过滤
    if (filters) {
      filters.forEach(filter => {
        if (filter.operator === 'eq') {
          query = query.eq(filter.field, filter.value);
        }
        // 更多操作符...
      });
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const { data, error } = await supabase
      .from(resource)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data };
  },

  create: async ({ resource, variables }) => {
    const { data, error } = await supabase
      .from(resource)
      .insert(variables)
      .select()
      .single();

    if (error) throw error;

    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const { data, error } = await supabase
      .from(resource)
      .update(variables)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const { data, error } = await supabase
      .from(resource)
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data };
  },

  // 更多方法...
};
```

#### Refine 配置

**app/admin/layout.tsx**
```typescript
"use client";

import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { supabaseDataProvider } from "@/lib/admin/data-provider";
import { authProvider } from "@/lib/admin/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RefineKbarProvider>
      <Refine
        routerProvider={routerProvider}
        dataProvider={supabaseDataProvider}
        authProvider={authProvider}
        resources={[
          {
            name: "profiles",
            list: "/admin/users",
            create: "/admin/users/create",
            edit: "/admin/users/edit/:id",
            show: "/admin/users/show/:id",
            meta: {
              label: "用户管理",
              icon: "👤",
            },
          },
          {
            name: "report_credits",
            list: "/admin/credits",
            edit: "/admin/credits/edit/:id",
            meta: {
              label: "积分管理",
              icon: "💰",
            },
          },
          {
            name: "report_posts",
            list: "/admin/reports",
            create: "/admin/reports/create",
            edit: "/admin/reports/edit/:id",
            meta: {
              label: "报告管理",
              icon: "📊",
            },
          },
          {
            name: "audit_logs",
            list: "/admin/audit",
            meta: {
              label: "审计日志",
              icon: "📋",
            },
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow">
            {/* Admin 导航栏 */}
          </nav>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
        <RefineKbar />
      </Refine>
    </RefineKbarProvider>
  );
}
```

#### 用户管理页面（自动生成）

**app/admin/users/page.tsx**
```typescript
"use client";

import { useTable } from "@refinedev/react-table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

interface User {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  created_at: string;
}

export default function UserList() {
  const columns: ColumnDef<User>[] = [
    { accessorKey: "email", header: "邮箱" },
    { accessorKey: "full_name", header: "姓名" },
    { accessorKey: "plan", header: "套餐" },
    { accessorKey: "created_at", header: "注册时间" },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div>
          <button onClick={() => editUser(row.original.id)}>编辑</button>
          <button onClick={() => deleteUser(row.original.id)}>删除</button>
        </div>
      ),
    },
  ];

  const { getHeaderGroups, getRowModel } = useTable({
    columns,
    refineCoreProps: {
      resource: "profiles",
    },
  });

  return (
    <div>
      <h1>用户管理</h1>
      <table>
        <thead>
          {getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 积分管理页面

**app/admin/credits/page.tsx**
```typescript
"use client";

import { useState } from "react";
import { CreditManager } from "@/lib/core/credits/manager";

export default function CreditManagement() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  const grantCredits = async () => {
    const manager = new CreditManager();
    await manager.grantCredits(
      "admin-user-id", // 从 session 获取
      userId,
      amount,
      reason
    );
    alert("积分授予成功");
  };

  return (
    <div>
      <h1>积分管理</h1>
      <form onSubmit={(e) => { e.preventDefault(); grantCredits(); }}>
        <input
          type="text"
          placeholder="用户 ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="number"
          placeholder="积分数量"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <input
          type="text"
          placeholder="原因"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit">授予积分</button>
      </form>
    </div>
  );
}
```

### 4.4 统一错误处理

#### 创建标准错误类

**lib/core/errors.ts**
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(message = "积分不足") {
    super("INSUFFICIENT_CREDITS", message, 403);
  }
}

export class ReportGenerationError extends AppError {
  constructor(message: string, details?: any) {
    super("REPORT_GENERATION_FAILED", message, 500, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "未授权") {
    super("UNAUTHORIZED", message, 401);
  }
}
```

#### API 错误处理中间件

**lib/api/error-handler.ts**
```typescript
import { NextResponse } from "next/server";
import { AppError } from "@/lib/core/errors";

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // 标准化错误
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "服务器内部错误",
      },
    },
    { status: 500 }
  );
}
```

#### 在 API 路由中使用

**app/api/report/route.ts**
```typescript
import { handleApiError } from "@/lib/api/error-handler";
import { InsufficientCreditsError } from "@/lib/core/errors";

export async function POST(request: Request) {
  try {
    // ... 业务逻辑

    if (credits < 1) {
      throw new InsufficientCreditsError();
    }

    // ...

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 5. 详细实施步骤

### 阶段 0: 准备工作（1-2 天）

#### 0.1 创建功能分支
```bash
git checkout -b refactor/saas-architecture
```

#### 0.2 安装新依赖
```bash
# Refine
npm install @refinedev/core @refinedev/nextjs-router @refinedev/simple-rest @refinedev/react-table @tanstack/react-table

# 测试工具
npm install -D @vitest/coverage-v8 msw

# 监控（可选）
npm install @sentry/nextjs @vercel/analytics

# API 文档（可选）
npm install swagger-jsdoc swagger-ui-react
```

#### 0.3 更新文档
- 更新 `docs/decisions/2025-12-01-saas-architecture-and-restructure.md`
- 添加本文档：`docs/decisions/2025-12-01-complete-refactor-plan.md`

---

### 阶段 1: 核心服务层重构（5-7 天）

#### 1.1 创建目录结构（0.5 天）
```bash
mkdir -p lib/core/{reports,credits,users,admin}
mkdir -p lib/services
```

#### 1.2 实现 Credits Manager（1 天）

**任务清单**：
- [ ] 创建 `lib/core/credits/manager.ts`
- [ ] 实现 `checkAndConsume()` 方法
- [ ] 实现 `getBalance()` 方法
- [ ] 实现 `grantCredits()` 方法（管理员）
- [ ] 编写单元测试 `lib/core/credits/manager.test.ts`

#### 1.3 拆分报告生成逻辑（3-4 天）

**Day 1: 创建服务适配器**
- [ ] `lib/services/llm.ts` - LLM 调用封装
- [ ] `lib/services/market-data.ts` - Finnhub API 封装
- [ ] `lib/services/storage.ts` - Supabase Storage 封装

**Day 2: 实现核心生成逻辑**
- [ ] `lib/core/reports/generator.ts` - 报告生成器
- [ ] `lib/core/reports/content-sanitizer.ts` - 内容净化
- [ ] `lib/core/reports/types.ts` - 类型定义

**Day 3: 实现报告复用与导出**
- [ ] `lib/core/reports/reuse.ts` - 报告复用逻辑
- [ ] `lib/core/reports/export.ts` - PDF/Word 导出

**Day 4: 重构 API 路由**
- [ ] 更新 `app/api/report/route.ts` 使用新的服务层
- [ ] 删除旧的内联逻辑
- [ ] 确保所有功能正常

#### 1.4 编写测试（1 天）
- [ ] `lib/core/reports/generator.test.ts`
- [ ] `lib/services/llm.test.ts`
- [ ] `lib/services/market-data.test.ts`
- [ ] 使用 MSW mock 外部 API

#### 1.5 验证与测试（0.5 天）
```bash
npm run test
npm run dev  # 手动测试报告生成
```

---

### 阶段 2: 统一配额系统（2-3 天）

#### 2.1 数据库迁移（0.5 天）

**创建迁移文件**：
```bash
# 创建 supabase/migrations/20251201120000_unify_credits.sql
```

**迁移内容**：
```sql
-- 1. 数据迁移
UPDATE report_credits rc
SET
  credits_available = COALESCE(p.quota_limit, 30) - COALESCE(p.reports_used, 0),
  credits_used = COALESCE(p.reports_used, 0)
FROM profiles p
WHERE rc.user_id = p.id;

-- 2. 确保所有用户都有 credits 记录
INSERT INTO report_credits (user_id, credits_available, credits_used)
SELECT p.id, 30, 0
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM report_credits rc WHERE rc.user_id = p.id
);

-- 3. 移除废弃字段
ALTER TABLE profiles DROP COLUMN IF EXISTS quota_limit;
ALTER TABLE profiles DROP COLUMN IF EXISTS reports_used;

-- 4. 新增 RPC 函数
CREATE OR REPLACE FUNCTION fn_grant_credits(
  target_user_id UUID,
  amount INT,
  reason TEXT DEFAULT 'admin_grant'
)
RETURNS JSONB AS $$
-- (见前文)
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**执行迁移**：
```bash
supabase db push
```

#### 2.2 更新代码引用（1 天）

**搜索并替换**：
```bash
# 搜索所有使用 profiles.quota_limit 的代码
grep -r "quota_limit" app/
grep -r "reports_used" app/
```

**更新为**：
```typescript
// 旧代码
const { quota_limit, reports_used } = profile;

// 新代码
const creditManager = new CreditManager();
const balance = await creditManager.getBalance(userId);
```

#### 2.3 测试迁移（0.5 天）

**验证清单**：
- [ ] 新用户注册时自动创建 credits 记录（30 积分）
- [ ] 报告生成正常扣除积分
- [ ] 每日签到正常增加积分
- [ ] 管理员可以手动授予积分
- [ ] 数据库中无 `quota_limit` 和 `reports_used` 字段

#### 2.4 清理代码（1 天）
- [ ] 删除 `lib/services/quota.ts`（已被 `CreditManager` 替代）
- [ ] 删除相关测试 `lib/services/quota.test.ts`
- [ ] 更新类型定义 `types/database.ts`

---

### 阶段 3: Refine Admin 集成（5-7 天）

#### 3.1 基础集成（1 天）

**Day 1: 安装与配置**
- [ ] 安装 Refine 依赖
- [ ] 创建 `lib/admin/data-provider.ts`
- [ ] 创建 `lib/admin/auth-provider.ts`
- [ ] 创建 `app/admin/layout.tsx`（Refine 容器）

#### 3.2 用户管理（2 天）

**Day 2: 列表与详情**
- [ ] `app/admin/users/page.tsx` - 用户列表
- [ ] `app/admin/users/[id]/page.tsx` - 用户详情
- [ ] 添加搜索、过滤、排序功能

**Day 3: 编辑与删除**
- [ ] `app/admin/users/[id]/edit/page.tsx` - 编辑用户
- [ ] 实现软删除（标记 `deleted_at`）
- [ ] 添加批量操作（批量删除、批量导出）

#### 3.3 积分管理（1-2 天）

**Day 4: 积分列表**
- [ ] `app/admin/credits/page.tsx` - 积分列表
- [ ] 显示每个用户的积分余额、使用情况
- [ ] 添加积分变动历史（`report_credit_events`）

**Day 5: 积分操作**
- [ ] `app/admin/credits/grant/page.tsx` - 授予积分表单
- [ ] 实现批量授予积分
- [ ] 添加积分回收功能（扣除积分）

#### 3.4 报告管理迁移（1 天）

**Day 6: 迁移现有功能**
- [ ] 将 `app/admin/reports/page.tsx` 迁移到 Refine
- [ ] 使用 Refine 的 `useTable` hook
- [ ] 保留封面上传功能
- [ ] 添加批量发布/下架功能

#### 3.5 审计日志（1 天）

**Day 7: 日志查看器**
- [ ] `app/admin/audit/page.tsx` - 审计日志列表
- [ ] 添加过滤器（按用户、按操作类型、按时间范围）
- [ ] 实现日志导出（CSV）

---

### 阶段 4: 错误处理与测试（3-5 天）

#### 4.1 统一错误处理（1-2 天）

**Day 1: 创建错误类**
- [ ] `lib/core/errors.ts` - 标准错误类
- [ ] `lib/api/error-handler.ts` - 错误处理中间件

**Day 2: 更新所有 API 路由**
- [ ] 为每个 API 路由添加 `try-catch`
- [ ] 使用 `handleApiError` 统一处理
- [ ] 确保返回格式一致

#### 4.2 增加测试覆盖率（2-3 天）

**Day 3: 核心业务逻辑测试**
- [ ] `lib/core/reports/generator.test.ts` (目标 80% 覆盖率)
- [ ] `lib/core/credits/manager.test.ts` (目标 90% 覆盖率)
- [ ] `lib/services/llm.test.ts`

**Day 4: API 路由集成测试**
- [ ] `app/api/report/route.test.ts`
- [ ] `app/api/credits/route.test.ts`
- [ ] 使用 MSW mock Supabase 和外部 API

**Day 5: E2E 测试（可选）**
- [ ] 使用 Playwright 测试完整流程
- [ ] 用户注册 → 生成报告 → 扣除积分

#### 4.3 生成测试报告
```bash
npm run test -- --coverage
# 目标：整体覆盖率 > 70%
```

---

### 阶段 5: 文档与监控（2-3 天）

#### 5.1 API 文档生成（1 天）

**使用 Swagger JSDoc**：
```typescript
// app/api/report/route.ts
/**
 * @swagger
 * /api/report:
 *   post:
 *     summary: 生成投资报告
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: AAPL
 *               lang:
 *                 type: string
 *                 enum: [en, zh-Hans, zh-Hant, ja, ko]
 *     responses:
 *       200:
 *         description: 报告生成成功
 */
```

**生成文档页面**：
- [ ] `app/api-docs/page.tsx` - Swagger UI
- [ ] 自动生成 OpenAPI 规范

#### 5.2 错误监控（1 天）

**集成 Sentry**：
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**添加自定义追踪**：
```typescript
// lib/core/reports/generator.ts
try {
  const report = await this.generate(params);
} catch (error) {
  Sentry.captureException(error, {
    tags: { module: 'report-generator' },
    extra: { symbol: params.symbol }
  });
  throw error;
}
```

#### 5.3 更新文档（1 天）
- [ ] 更新 `README.md`
- [ ] 编写 `docs/architecture/core-services.md`
- [ ] 编写 `docs/guides/admin-guide.md`（管理员操作手册）
- [ ] 编写 `docs/api/api-reference.md`

---

### 阶段 6: 最终验证与部署（2-3 天）

#### 6.1 功能验证（1 天）

**验收清单**：
- [ ] 用户注册流程正常
- [ ] 报告生成功能正常（各种语言、模式）
- [ ] 积分扣除与查询正常
- [ ] Admin 面板所有功能正常
  - [ ] 用户管理（CRUD）
  - [ ] 积分授予/扣除
  - [ ] 报告管理
  - [ ] 审计日志查看
- [ ] 错误处理符合预期
- [ ] 测试覆盖率 > 70%

#### 6.2 性能测试（1 天）

**负载测试**：
```bash
# 使用 Apache Bench 测试 API 性能
ab -n 1000 -c 10 http://localhost:3000/api/report
```

**检查项**：
- [ ] 报告生成响应时间 < 30s (P95)
- [ ] 积分查询响应时间 < 200ms (P95)
- [ ] Admin 面板加载时间 < 2s

#### 6.3 部署前检查（0.5 天）

**环境变量检查**：
```bash
npm run env:check
```

**构建测试**：
```bash
npm run build
npm run start  # 测试生产环境
```

#### 6.4 灰度发布（0.5 天）

**部署策略**：
1. 先部署到 Staging 环境测试
2. 监控 Sentry 错误率
3. 无问题后合并到 `main` 分支
4. 部署到 Production

---

## 6. 目录结构设计

### 6.1 重构后的完整目录结构

```
D:\Projects\investor-ai-g2\
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── account/
│   │   ├── history/
│   │   ├── change-password/
│   │   └── reset-password/
│   ├── admin/                      # 🆕 Refine Admin 面板
│   │   ├── layout.tsx             # Refine 容器
│   │   ├── page.tsx               # Admin 首页（Dashboard）
│   │   ├── users/                 # 🆕 用户管理
│   │   │   ├── page.tsx           # 用户列表
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx       # 用户详情
│   │   │   │   └── edit/page.tsx  # 编辑用户
│   │   │   └── create/page.tsx    # 新增用户
│   │   ├── credits/               # 🆕 积分管理
│   │   │   ├── page.tsx           # 积分列表
│   │   │   └── grant/page.tsx     # 授予积分
│   │   ├── reports/               # ✅ 报告管理（已有，迁移到 Refine）
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   └── audit/                 # 🆕 审计日志
│   │       └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   ├── users/route.ts     # ✅ 使用新的 UserService
│   │   │   └── credits/route.ts   # ✅ 使用 CreditManager
│   │   ├── report/
│   │   │   └── route.ts           # 🔧 重构：仅 HTTP 处理
│   │   └── credits/
│   │       └── balance/route.ts   # 🆕 查询积分余额
│   ├── reports/
│   ├── sections/
│   └── components/
│
├── lib/
│   ├── core/                       # 🆕 业务逻辑核心层
│   │   ├── reports/
│   │   │   ├── generator.ts       # 🆕 报告生成器
│   │   │   ├── reuse.ts          # 🆕 报告复用逻辑
│   │   │   ├── export.ts         # 🆕 PDF/Word 导出
│   │   │   ├── content-sanitizer.ts # 🆕 内容净化
│   │   │   └── types.ts          # 类型定义
│   │   ├── credits/
│   │   │   ├── manager.ts        # 🆕 积分管理器
│   │   │   ├── transactions.ts   # 🆕 交易日志
│   │   │   └── rewards.ts        # 🆕 每日奖励
│   │   ├── users/
│   │   │   ├── profile.ts        # 🆕 用户资料管理
│   │   │   └── preferences.ts    # 🆕 用户偏好
│   │   ├── admin/
│   │   │   ├── user-management.ts # 🆕 用户 CRUD
│   │   │   └── audit.ts          # 🆕 审计日志
│   │   └── errors.ts             # 🆕 标准错误类
│   │
│   ├── services/                   # 🔧 外部服务适配器
│   │   ├── llm.ts                # 🆕 LLM 服务（Helicone/OpenRouter）
│   │   ├── market-data.ts        # 🆕 Finnhub API 封装
│   │   ├── storage.ts            # 🆕 Supabase Storage 封装
│   │   ├── api.ts                # ✅ 保留：客户端 API 调用
│   │   └── quota.ts              # ❌ 删除：被 CreditManager 替代
│   │
│   ├── admin/                      # 🆕 Refine 配置
│   │   ├── data-provider.ts      # Supabase Data Provider
│   │   └── auth-provider.ts      # Refine Auth Provider
│   │
│   ├── api/                        # 🆕 API 工具
│   │   └── error-handler.ts      # 统一错误处理
│   │
│   ├── supabase/                   # ✅ Supabase 客户端
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── observability/              # ✅ 可观测性
│   │   └── langfuse.ts
│   │
│   ├── report/                     # ✅ 报告模板（前端展示）
│   ├── content/                    # ✅ 内容管理
│   └── auth/                       # ✅ 认证工具
│
├── hooks/                          # ✅ React Hooks
├── types/                          # ✅ TypeScript 类型
│   ├── database.ts
│   └── report.ts
│
├── supabase/
│   └── migrations/
│       ├── ...
│       └── 20251201120000_unify_credits.sql  # 🆕 统一配额迁移
│
├── scripts/
│   ├── update-helicone-models.js
│   └── check-env.js
│
├── docs/
│   ├── decisions/
│   │   ├── 2025-12-01-saas-architecture-and-restructure.md
│   │   └── 2025-12-01-complete-refactor-plan.md  # 🆕 本文档
│   ├── architecture/
│   │   └── core-services.md       # 🆕 核心服务说明
│   ├── guides/
│   │   ├── admin-guide.md         # 🆕 管理员操作手册
│   │   └── worktree-multi-team.md
│   └── api/
│       └── api-reference.md       # 🆕 API 参考文档
│
├── tests/                          # 🆕 集成测试
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
└── README.md
```

### 6.2 核心模块职责说明

#### `lib/core/reports/`
- **generator.ts**: 报告生成核心逻辑，编排 LLM、数据获取、内容净化
- **reuse.ts**: 检查是否有可复用的报告（7 天内相同参数）
- **export.ts**: 将报告导出为 PDF、Word、Markdown 等格式
- **content-sanitizer.ts**: 敏感词替换、免责声明注入

#### `lib/core/credits/`
- **manager.ts**: 积分管理核心逻辑（查询、扣除、授予）
- **transactions.ts**: 积分交易日志记录
- **rewards.ts**: 每日签到奖励逻辑

#### `lib/core/users/`
- **profile.ts**: 用户资料更新、权限检查
- **preferences.ts**: 用户偏好设置（语言、主题等）

#### `lib/core/admin/`
- **user-management.ts**: 管理员操作用户（CRUD）
- **audit.ts**: 审计日志查询与分析

#### `lib/services/`
- **llm.ts**: 封装 LLM 调用（Helicone 优先，失败回退到 OpenRouter）
- **market-data.ts**: 封装 Finnhub API（公司信息、报价、新闻）
- **storage.ts**: 封装 Supabase Storage（上传封面、报告 JSON）

---

## 7. 时间与资源估算

### 7.1 工作量估算（人天）

| 阶段 | 任务 | 工作量 | 依赖 |
|------|------|--------|------|
| **阶段 0** | 准备工作 | 1-2 天 | - |
| **阶段 1** | 核心服务层重构 | 5-7 天 | 阶段 0 |
| **阶段 2** | 统一配额系统 | 2-3 天 | 阶段 1 |
| **阶段 3** | Refine Admin 集成 | 5-7 天 | 阶段 1 |
| **阶段 4** | 错误处理与测试 | 3-5 天 | 阶段 1, 2, 3 |
| **阶段 5** | 文档与监控 | 2-3 天 | 阶段 4 |
| **阶段 6** | 最终验证与部署 | 2-3 天 | 阶段 5 |
| **总计** | | **20-30 天** | |

### 7.2 里程碑与交付物

| 里程碑 | 日期 | 交付物 | 验收标准 |
|--------|------|--------|---------|
| **M1: 核心服务层完成** | Day 7 | `lib/core/` 完整实现 | 单元测试通过，API 路由重构完成 |
| **M2: 配额系统统一** | Day 10 | 数据库迁移完成 | 无 `quota_limit` 字段，积分功能正常 |
| **M3: Admin 面板上线** | Day 17 | Refine 集成完成 | 用户/积分/报告管理全部可用 |
| **M4: 测试覆盖完成** | Day 22 | 测试覆盖率 > 70% | CI/CD 通过，无关键 bug |
| **M5: 文档与监控** | Day 25 | API 文档、Sentry | 文档完整，错误监控正常 |
| **M6: 生产环境部署** | Day 30 | 灰度发布完成 | 无 P0/P1 bug，性能达标 |

### 7.3 人力资源分配

**推荐团队配置**（可根据实际调整）：
- **后端工程师（1 人）**: 负责阶段 1、2（核心服务层、配额系统）
- **全栈工程师（1 人）**: 负责阶段 3（Refine Admin）
- **测试工程师（0.5 人）**: 负责阶段 4（测试覆盖）
- **技术作家（0.5 人）**: 负责阶段 5（文档编写）

**总人力**: 约 3 人 × 4 周 = **12 人周**

---

## 8. 风险评估与应对

### 8.1 技术风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|---------|
| **Refine 学习曲线** | 中 | 中 | 提前学习官方文档，使用 Inferencer 自动生成代码 |
| **数据库迁移失败** | 低 | 高 | 先在 Staging 环境测试，备份生产数据 |
| **LLM 服务不稳定** | 中 | 中 | 已有 Failover 机制（Helicone → OpenRouter） |
| **测试覆盖不足** | 中 | 中 | 优先覆盖核心逻辑（报告生成、积分管理） |
| **性能回归** | 低 | 中 | 部署前进行负载测试，监控响应时间 |

### 8.2 业务风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|---------|
| **重构期间功能不可用** | 低 | 高 | 使用功能分支开发，主分支保持稳定 |
| **积分数据不一致** | 中 | 高 | 迁移前备份，迁移后对账验证 |
| **用户体验变差** | 低 | 中 | 保持前端 UI 不变，仅后端重构 |
| **Admin 面板权限泄露** | 低 | 高 | 实现严格的 RBAC，审计所有管理员操作 |

### 8.3 进度风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|---------|
| **工作量估算不足** | 中 | 中 | 预留 20% buffer 时间（30 天 → 36 天） |
| **依赖阻塞** | 低 | 中 | 优先完成核心服务层（其他模块依赖它） |
| **人员变动** | 低 | 高 | 编写详细文档，代码 Review 保证知识共享 |

### 8.4 应急预案

**Plan B: 如果 Refine 集成失败**
- 回退到手写 Admin 面板
- 使用现有 `app/admin/reports/` 架构
- 仅实现核心功能（用户管理、积分授予）
- 工作量增加 5-7 天

**Plan C: 如果时间不足**
- 优先完成 P0 任务（核心服务层、配额系统）
- P1 任务（Admin 完整功能）后续迭代
- P2 任务（API 文档、监控）推迟到下一版本

---

## 9. 验收标准

### 9.1 功能验收

#### 核心业务功能
- [ ] 用户可以正常注册（获得 30 积分）
- [ ] 用户可以生成报告（扣除 1 积分）
- [ ] 积分不足时无法生成报告
- [ ] 每日签到可获得奖励积分
- [ ] 报告复用功能正常（7 天内相同参数）
- [ ] 报告导出功能正常（PDF、Word）

#### Admin 面板功能
- [ ] 管理员可以查看所有用户
- [ ] 管理员可以编辑用户信息
- [ ] 管理员可以授予/扣除积分
- [ ] 管理员可以查看积分变动历史
- [ ] 管理员可以管理报告（CRUD）
- [ ] 管理员可以查看审计日志
- [ ] 非管理员无法访问 Admin 面板

### 9.2 技术验收

#### 代码质量
- [ ] ESLint 无错误
- [ ] TypeScript 编译通过
- [ ] 所有单元测试通过
- [ ] 测试覆盖率 > 70%
- [ ] 核心模块测试覆盖率 > 80%

#### 性能指标
- [ ] 报告生成响应时间 < 30s (P95)
- [ ] 积分查询响应时间 < 200ms (P95)
- [ ] Admin 面板加载时间 < 2s (P95)
- [ ] Lighthouse Score > 90 (Performance)

#### 安全性
- [ ] 所有 Admin API 有权限校验
- [ ] RLS 策略正确配置
- [ ] 敏感信息不在日志中泄露
- [ ] SQL 注入风险已排除
- [ ] XSS 攻击风险已排除

### 9.3 文档验收

- [ ] `README.md` 已更新（包含新架构说明）
- [ ] `docs/architecture/core-services.md` 已创建
- [ ] `docs/guides/admin-guide.md` 已创建
- [ ] `docs/api/api-reference.md` 已创建（或 Swagger UI 可用）
- [ ] 所有新增函数都有 JSDoc 注释
- [ ] 数据库迁移脚本有注释说明

### 9.4 部署验收

- [ ] Staging 环境部署成功
- [ ] Production 环境部署成功
- [ ] 环境变量检查通过
- [ ] 数据库迁移执行成功
- [ ] 无回滚操作
- [ ] Sentry 错误率 < 1%（部署后 24 小时）

---

## 10. 总结

### 10.1 核心改进

通过本次重构，我们将实现：

1. **清晰的三层架构**: Presentation → API → Core Business Logic
2. **统一的配额系统**: 移除冗余，使用 Credits 模型
3. **完整的 Admin 面板**: 基于 Refine，40-50% 开发时间节省
4. **可测试的代码**: 业务逻辑与框架解耦，单元测试覆盖率 > 70%
5. **统一的错误处理**: 标准化错误格式，改善 API 一致性
6. **完整的文档**: API 文档、架构文档、操作手册

### 10.2 长期收益

- **可维护性**: 代码结构清晰，新人容易上手
- **可扩展性**: 便于未来拆分为微服务
- **可靠性**: 测试覆盖充分,bug 率降低
- **开发效率**: Refine 加速 Admin 功能开发
- **运维效率**: 完善的监控与日志系统

### 10.3 下一步计划

重构完成后，可以考虑：

1. **性能优化**: 引入 Redis 缓存、CDN 加速
2. **功能扩展**:
   - 报告订阅（定期生成）
   - 报告对比（多只股票）
   - AI 问答（基于报告内容）
3. **微服务化**:
   - 报告生成服务独立部署
   - LLM 服务独立扩展
4. **多租户支持**:
   - 企业版功能
   - 白标定制

---

## 附录

### A. 参考资料

- [Refine 官方文档](https://refine.dev/docs/)
- [Next.js App Router 最佳实践](https://nextjs.org/docs/app)
- [Supabase RLS 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### B. 联系方式

如有问题，请联系架构团队：
- Slack: #investor-ai-refactor
- Email: arch-team@investor.ai

---

**文档状态**: ✅ 已批准
**最后更新**: 2025-12-01
**下次审查**: 2025-12-15
