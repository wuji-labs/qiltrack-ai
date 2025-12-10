# Qiltrack AI - 开发规范与最佳实践

> **版本**: 1.0.0
> **生效日期**: 2025-12-10
> **适用范围**: 全栈开发团队
> **维护者**: 技术架构组

---

## 📚 目录

1. [代码质量规范](#代码质量规范)
2. [组件开发规范](#组件开发规范)
3. [API开发规范](#api开发规范)
4. [数据库操作规范](#数据库操作规范)
5. [安全开发规范](#安全开发规范)
6. [测试规范](#测试规范)
7. [Git工作流](#git工作流)
8. [代码审查检查清单](#代码审查检查清单)

---

## 代码质量规范

### 1.1 文件和组件大小限制

```typescript
// ✅ 推荐
- 单文件不超过 400行
- 单组件不超过 200行
- 单函数不超过 50行
- useState数量不超过 5个 (超过使用useReducer)
- useEffect数量不超过 3个 (超过考虑拆分组件)

// ❌ 违规示例
function ReportGenerator() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  // ... 15个useState ❌ 超过限制

  return <div>{/* 600行JSX */}</div>; // ❌ 过大
}
```

### 1.2 命名规范

#### A. TypeScript/JavaScript

```typescript
// 组件: PascalCase
export function ReportGenerator() {}
export const UserProfile: React.FC = () => {}

// Hooks: use前缀 + camelCase
export function useReportData() {}
export function useAuthStatus() {}

// 工具函数: camelCase
export function sanitizeFilename(name: string) {}
export function formatCurrency(amount: number) {}

// 常量: SCREAMING_SNAKE_CASE
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const API_BASE_URL = 'https://api.example.com';

// 类型/接口: PascalCase
export type ReportResponse = {...}
export interface UserProfile {...}

// 枚举: PascalCase (键也使用PascalCase)
export enum UserRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  User = 'user',
}

// 私有变量: _前缀 + camelCase
private _internalCache: Map<string, unknown>;
```

#### B. 文件命名

```bash
# 组件文件: PascalCase.tsx
ReportGenerator.tsx
UserProfile.tsx

# Hook文件: camelCase.ts
useReportData.ts
useAuthStatus.ts

# 工具文件: kebab-case.ts
string-utils.ts
date-helpers.ts

# 类型文件: 一律 types.ts
types.ts          # 组件相关类型
api-types.ts      # API类型
database.types.ts # 数据库类型(自动生成)

# 测试文件: 同名.test.tsx/.test.ts
ReportGenerator.test.tsx
sanitizeFilename.test.ts
```

### 1.3 TypeScript规范

#### A. 类型声明

```typescript
// ✅ 推荐: 使用类型推导
const user = {
  id: '123',
  name: 'John',
  age: 30,
}; // TypeScript自动推导类型

// ✅ 推荐: 明确复杂类型
type UserProfile = {
  id: string;
  name: string;
  age: number;
  roles: UserRole[];
};

const user: UserProfile = {...};

// ❌ 避免: 不必要的显式类型
const count: number = 0; // 冗余
const message: string = "Hello"; // 冗余

// ✅ 推荐: 返回类型声明(公共函数)
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ 避免: any类型
function processData(data: any) {} // ❌
function processData(data: unknown) {} // ✅ 使用unknown

// ✅ 推荐: 类型守卫
function isUserProfile(obj: unknown): obj is UserProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}
```

#### B. 泛型使用

```typescript
// ✅ 推荐: 泛型函数
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// ✅ 推荐: 泛型组件
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  renderOption: (option: T) => React.ReactNode;
}

export function Select<T>({ options, value, onChange, renderOption }: SelectProps<T>) {
  // ...
}
```

### 1.4 代码注释规范

```typescript
/**
 * 生成报告的主要函数
 *
 * @param symbol - 股票代码 (大写,1-10字符)
 * @param language - 语言代码 (en, zh-Hans, zh-Hant, ja, ko)
 * @param tone - 报告语气 (baseline, buffett, musk, muddy)
 * @returns Promise<ReportResponse> 生成的报告数据
 * @throws {InsufficientCreditsError} 当用户积分不足时
 * @throws {ValidationError} 当参数验证失败时
 *
 * @example
 * ```typescript
 * const report = await generateReport('AAPL', 'en', 'baseline');
 * console.log(report.content);
 * ```
 */
export async function generateReport(
  symbol: string,
  language: Language,
  tone: Tone
): Promise<ReportResponse> {
  // 验证参数
  if (!/^[A-Z0-9]{1,10}$/.test(symbol)) {
    throw new ValidationError('Invalid symbol format');
  }

  // TODO: 添加缓存机制
  // FIXME: symbol大小写敏感问题
  // NOTE: 此函数平均耗时85秒

  // ...
}

// ✅ 复杂逻辑需要注释
// 使用跨用户缓存策略: 同一天内同symbol/lang/tone的报告可复用
const cachedReport = await checkSharedReusableReport(symbol, language, tone);

// ❌ 避免无用注释
const count = 0; // 初始化计数器 ❌ 代码已经很清晰
```

---

## 组件开发规范

### 2.1 组件文件结构

```typescript
// ReportGenerator/index.tsx

// 1. 导入顺序
import React, { useState, useCallback } from 'react'; // React核心
import { useRouter } from 'next/navigation'; // Next.js
import { toast } from 'sonner'; // 第三方库

import { Button } from '@/components/ui/Button'; // 本地组件
import { useReportData } from '@/hooks/useReportData'; // 本地hooks
import { generateReport } from '@/lib/services/api'; // 服务

import { ReportFormProps, ReportState } from './types'; // 本地类型
import './styles.css'; // 样式 (如果有)

// 2. 类型定义
interface ReportGeneratorProps {
  initialSymbol?: string;
  onComplete?: (report: Report) => void;
}

// 3. 常量
const MAX_RETRY_COUNT = 3;
const DEFAULT_LANGUAGE = 'en';

// 4. 主组件
export function ReportGenerator({
  initialSymbol,
  onComplete,
}: ReportGeneratorProps) {
  // 4.1 Hooks (顺序: state, router, custom hooks)
  const [symbol, setSymbol] = useState(initialSymbol ?? '');
  const router = useRouter();
  const { data, loading, error } = useReportData(symbol);

  // 4.2 事件处理函数
  const handleSubmit = useCallback(async () => {
    // ...
  }, [symbol]);

  // 4.3 副作用
  useEffect(() => {
    // ...
  }, [symbol]);

  // 4.4 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 5. 子组件 (仅当非常小且仅用于此文件时)
function LoadingSpinner() {
  return <div className="animate-spin">...</div>;
}

// 6. 导出
export default ReportGenerator;
```

### 2.2 组件拆分原则

```typescript
// ❌ 避免: 巨型组件
function ReportPage() {
  return (
    <div>
      {/* 500行JSX */}
      <header>{/* 100行 */}</header>
      <form>{/* 200行 */}</form>
      <div>{/* 200行 */}</div>
    </div>
  );
}

// ✅ 推荐: 拆分成子组件
function ReportPage() {
  return (
    <div>
      <ReportHeader />
      <ReportForm />
      <ReportResult />
    </div>
  );
}
```

### 2.3 状态管理

#### A. useState vs useReducer

```typescript
// ✅ 简单状态: 使用useState
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ✅ 复杂状态: 使用useReducer (6+ 状态变量)
type State = {
  inputValue: string;
  searchResults: SearchResult[];
  searching: boolean;
  selectedSymbol: string | null;
  loading: boolean;
  error: Error | null;
};

type Action =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'START_SEARCH' }
  | { type: 'SEARCH_SUCCESS'; payload: SearchResult[] }
  | { type: 'SEARCH_ERROR'; payload: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, inputValue: action.payload };
    case 'START_SEARCH':
      return { ...state, searching: true, error: null };
    case 'SEARCH_SUCCESS':
      return { ...state, searching: false, searchResults: action.payload };
    case 'SEARCH_ERROR':
      return { ...state, searching: false, error: action.payload };
    default:
      return state;
  }
}

function ReportGenerator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // ...
}
```

#### B. 性能优化

```typescript
// ✅ 使用React.memo避免不必要的重渲染
export const ReportResult = React.memo(function ReportResult({
  reportData,
  onExport,
}: ReportResultProps) {
  // ...
});

// ✅ 使用useMemo缓存计算结果
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.price - b.price);
}, [items]);

// ✅ 使用useCallback缓存回调函数
const handleClick = useCallback(() => {
  console.log('Clicked:', value);
}, [value]);

// ❌ 避免: 内联对象/函数作为props
<Component style={{ color: 'red' }} /> // ❌ 每次渲染创建新对象
<Component onClick={() => doSomething()} /> // ❌ 每次渲染创建新函数

// ✅ 推荐
const style = useMemo(() => ({ color: 'red' }), []);
const onClick = useCallback(() => doSomething(), []);
<Component style={style} onClick={onClick} />
```

### 2.4 样式规范

```tsx
// ✅ 推荐: 使用CSS变量
<div className="bg-[var(--bg-layer)] text-[var(--color-foreground)]">

// ✅ 推荐: 提取长类名为CSS类
// globals.css
@layer components {
  .card-container {
    @apply rounded-[28px] border border-[var(--stroke-soft)]
           bg-[var(--bg-layer)]/85 p-6
           shadow-[0_20px_70px_rgba(0,0,0,0.34)];
  }
}

// 使用
<div className="card-container">

// ✅ 推荐: 响应式设计
<div className="w-full sm:w-1/2 lg:w-1/3">

// ❌ 避免: 硬编码颜色
<div className="bg-[#1a1f2e]"> // ❌ 应使用CSS变量
```

---

## API开发规范

### 3.1 端点设计

```typescript
// ✅ 推荐: RESTful设计
GET    /api/reports           # 获取报告列表
GET    /api/reports/:id       # 获取单个报告
POST   /api/reports           # 创建报告
PATCH  /api/reports/:id       # 部分更新
DELETE /api/reports/:id       # 删除报告

// ✅ 推荐: 资源嵌套
GET    /api/users/:userId/reports
POST   /api/users/:userId/reports

// ❌ 避免: 动词作为路径
GET    /api/getReports        // ❌
POST   /api/createReport      // ❌
POST   /api/deleteReport/:id  // ❌
```

### 3.2 请求验证

```typescript
// app/api/report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse } from '@/lib/api/response';
import { ValidationError } from '@/lib/core/errors';

// 1. 定义验证schema
const querySchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]{1,10}$/),
  lang: z.enum(['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko']).default('en'),
  tone: z.enum(['baseline', 'buffett', 'musk', 'muddy']).default('baseline'),
});

export async function GET(request: NextRequest) {
  try {
    // 2. 提取参数
    const { searchParams } = new URL(request.url);
    const rawParams = {
      symbol: searchParams.get('symbol'),
      lang: searchParams.get('lang'),
      tone: searchParams.get('tone'),
    };

    // 3. 验证参数
    const validatedParams = querySchema.parse(rawParams);

    // 4. 业务逻辑
    const report = await generateReport(validatedParams);

    // 5. 返回响应
    return successResponse(report);

  } catch (error) {
    // 6. 错误处理
    if (error instanceof z.ZodError) {
      return errorResponse(
        'VALIDATION_ERROR',
        '参数验证失败',
        400,
        { errors: error.errors }
      );
    }

    if (error instanceof AppError) {
      return errorResponse(
        error.code,
        error.message,
        error.statusCode,
        error.details
      );
    }

    logger.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      '服务器内部错误',
      500
    );
  }
}
```

### 3.3 响应格式

```typescript
// ✅ 统一使用 successResponse / errorResponse

// 成功响应
return successResponse(
  { reportId: '123', content: '...' },
  200
);

// 输出:
{
  "success": true,
  "data": {
    "reportId": "123",
    "content": "..."
  },
  "meta": {
    "timestamp": "2025-12-10T10:00:00Z",
    "requestId": "uuid"
  }
}

// 错误响应
return errorResponse(
  'INSUFFICIENT_CREDITS',
  '积分不足，无法生成报告',
  403,
  { required: 30, available: 5 }
);

// 输出:
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "积分不足，无法生成报告",
    "details": {
      "required": 30,
      "available": 5
    }
  },
  "meta": {
    "timestamp": "2025-12-10T10:00:00Z",
    "requestId": "uuid"
  }
}
```

### 3.4 认证和授权

```typescript
// lib/auth/middleware.ts

// ✅ 推荐: 统一认证中间件
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User } | NextResponse> {
  const session = await getSession();

  if (!session) {
    return errorResponse(
      'UNAUTHORIZED',
      '请先登录',
      401
    );
  }

  return { user: session.user };
}

// ✅ 推荐: 角色检查
export async function requireAdmin(
  allowedRoles: AdminRole[] = ['super_admin', 'admin']
): Promise<{ user: User } | NextResponse> {
  const auth = await requireAuth(request);

  if (auth instanceof NextResponse) return auth;

  if (!allowedRoles.includes(auth.user.role)) {
    return errorResponse(
      'FORBIDDEN',
      '需要管理员权限',
      403
    );
  }

  return auth;
}

// 使用
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // 已通过认证和授权
  const { user } = auth;
  // ...
}
```

### 3.5 速率限制

```typescript
import { checkRateLimit, reportGenerationRateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  // 1. 速率限制检查
  const userId = await getUserId(request);
  const { success, headers } = await checkRateLimit(
    userId,
    reportGenerationRateLimit
  );

  if (!success) {
    return errorResponse(
      'RATE_LIMIT_EXCEEDED',
      '请求过于频繁，请稍后再试',
      429,
      {},
      headers
    );
  }

  // 2. 业务逻辑
  // ...

  // 3. 返回响应(包含速率限制headers)
  return successResponse(data, 200, headers);
}
```

---

## 数据库操作规范

### 4.1 迁移管理

```sql
-- 命名规范: YYYYMMDDHHMMSS_description.sql
-- 示例: 20251210120000_add_referral_system.sql

-- 每个迁移文件包含:
-- 1. 向上迁移 (实际执行的SQL)
-- 2. 向下迁移 (回滚说明,注释形式)
-- 3. 必要的说明注释

-- ===== 向上迁移 =====

-- 创建referrals表
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'converted_pro', 'converted_ultra')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- 创建索引
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

-- 启用RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "referrals_select_own_or_admin"
  ON public.referrals FOR SELECT
  USING (
    auth.uid() = referrer_id
    OR auth.uid() = referred_id
    OR is_admin()
  );

COMMENT ON TABLE public.referrals IS '用户邀请记录表';
COMMENT ON COLUMN public.referrals.status IS '邀请状态: pending-待确认, completed-已完成, converted_pro/ultra-已转化';

-- ===== 向下迁移(注释说明) =====
-- 回滚步骤:
-- 1. DROP TABLE public.referrals CASCADE;
-- 2. 验证依赖此表的其他对象已被清理
```

### 4.2 查询规范

```typescript
// ✅ 推荐: 使用Supabase客户端(自动防SQL注入)
const { data, error } = await supabase
  .from('profiles')
  .select('id, email, plan')
  .eq('email', userEmail)
  .single();

// ✅ 推荐: 使用RPC调用数据库函数
const { data, error } = await supabase.rpc('fn_consume_credit', {
  p_user_id: userId,
  p_amount: 30,
});

// ❌ 避免: 字符串拼接SQL(SQL注入风险)
const query = `SELECT * FROM profiles WHERE email = '${userEmail}'`; // ❌

// ✅ 推荐: 批量操作使用事务
const { data, error } = await supabase.rpc('fn_batch_update_users', {
  p_user_ids: ['id1', 'id2', 'id3'],
  p_new_plan: 'pro',
});
```

### 4.3 数据库函数开发

```sql
-- ✅ 完整的函数模板

CREATE OR REPLACE FUNCTION public.fn_consume_credit(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_symbol TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- 仅当需要绕过RLS时使用
SET search_path = public, pg_temp  -- 防止搜索路径攻击
AS $function$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 1. 输入验证
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id不能为空';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount必须大于0';
  END IF;

  -- 2. 权限检查(如果SECURITY DEFINER)
  -- (可选)

  -- 3. 行级锁(防止并发)
  SELECT credits_available INTO v_current_balance
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;  -- 锁定行

  -- 4. 业务逻辑
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '积分不足',
      'remaining_credits', v_current_balance
    );
  END IF;

  -- 5. 更新数据
  UPDATE public.report_credits
  SET credits_available = credits_available - p_amount,
      credits_used = credits_used + p_amount
  WHERE user_id = p_user_id
  RETURNING credits_available INTO v_new_balance;

  -- 6. 记录事件
  INSERT INTO public.report_credit_events (
    user_id, event_type, delta, balance_after, metadata
  ) VALUES (
    p_user_id, 'consumed', -p_amount, v_new_balance, p_metadata
  );

  -- 7. 审计日志(如果需要)
  -- INSERT INTO public.audit_logs ...

  -- 8. 返回结果
  RETURN jsonb_build_object(
    'success', true,
    'message', format('成功扣除%s积分', p_amount),
    'remaining_credits', v_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 9. 错误处理
    RAISE LOG 'fn_consume_credit失败: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', '系统错误',
      'error', SQLERRM
    );
END;
$function$;

-- 添加注释
COMMENT ON FUNCTION public.fn_consume_credit IS '
原子化扣除用户积分
参数:
  - p_user_id: 用户ID
  - p_amount: 扣除数量(默认1)
  - p_symbol: 关联股票代码(可选)
  - p_metadata: 附加元数据(可选)
返回: {success, message, remaining_credits}
';
```

### 4.4 RLS策略规范

```sql
-- ✅ 命名规范: {表名}_{操作}_{描述}
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id           -- 用户可查看自己
    OR is_admin()             -- 或管理员
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND referral_code = OLD.referral_code  -- 禁止修改邀请码
  );

-- ✅ 添加注释说明
COMMENT ON POLICY "profiles_select_own_or_admin" ON public.profiles IS
  '用户可查看自己的资料，管理员可查看所有资料';
```

---

## 安全开发规范

### 5.1 环境变量管理

```bash
# .env.local

# ✅ 服务端密钥 (不加NEXT_PUBLIC_前缀)
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 绝对不能暴露
STRIPE_SECRET_KEY=sk_live_...      # 绝对不能暴露
OPENROUTER_API_KEY=sk-or-...       # 绝对不能暴露

# ✅ 客户端公开 (仅非敏感数据)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # 公开密钥,安全
NEXT_PUBLIC_SITE_URL=https://qiltrack.com

# ❌ 错误示例
NEXT_PUBLIC_API_SECRET=xxx  # ❌ 密钥不能公开!
NEXT_PUBLIC_STRIPE_SECRET=xxx  # ❌ 支付密钥不能公开!
```

### 5.2 输入验证和清理

```typescript
// ✅ 前端验证(UX)
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('邮箱格式错误'),
  password: z.string().min(8, '密码至少8位'),
});

// ✅ 后端验证(安全)
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 必须重新验证(不能信任客户端)
  const validated = schema.parse(body);

  // ...
}

// ✅ SQL注入防护: 使用参数化查询
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail);  // Supabase自动转义

// ❌ 避免: 字符串拼接
const query = `SELECT * FROM users WHERE email = '${email}'`; // ❌

// ✅ XSS防护: React自动转义
<div>{userInput}</div>  // React会转义

// ⚠️ 使用dangerouslySetInnerHTML时必须清理
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userHtml)
}} />

// ✅ 路径遍历防护
function sanitizeFilename(filename: string): string {
  // 移除路径分隔符
  const basename = filename.split(/[/\\]/).pop() || 'upload';
  // 限制字符
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
```

### 5.3 认证和会话管理

```typescript
// ✅ 密码存储: 使用bcrypt/argon2
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(inputPassword, hashedPassword);

// ✅ 会话管理: 使用httpOnly Cookie
cookieStore.set('session_token', token, {
  httpOnly: true,           // JavaScript无法访问
  secure: true,             // 仅HTTPS传输
  sameSite: 'strict',       // CSRF防护
  maxAge: 60 * 60 * 24,     // 24小时
});

// ✅ CSRF保护: 恒定时间比较
import crypto from 'crypto';

export async function validateCsrfToken(token: string): Promise<boolean> {
  const storedToken = cookieStore.get('csrf_token')?.value;

  if (!storedToken || !token) return false;

  // 使用恒定时间比较防止时序攻击
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}
```

### 5.4 API安全

```typescript
// ✅ 速率限制
import { checkRateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const { success } = await checkRateLimit(userId, rateLimit);
  if (!success) {
    return errorResponse('RATE_LIMIT_EXCEEDED', '请求过于频繁', 429);
  }
  // ...
}

// ✅ CORS配置
export async function GET(request: NextRequest) {
  const response = successResponse(data);

  // 仅允许特定源
  response.headers.set('Access-Control-Allow-Origin', 'https://qiltrack.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST');

  return response;
}

// ✅ 响应头安全
// next.config.ts
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      { key: 'Content-Security-Policy', value: "default-src 'self'" },
    ],
  },
],
```

---

## 测试规范

### 6.1 测试金字塔

```
        E2E测试 (10%)
       /          \
    集成测试 (30%)
   /              \
单元测试 (60%)
```

### 6.2 单元测试

```typescript
// lib/core/credits/manager.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreditsManager } from './manager';

describe('CreditsManager', () => {
  let manager: CreditsManager;

  beforeEach(() => {
    manager = new CreditsManager();
  });

  describe('consumeCredit', () => {
    it('应该成功扣除积分', async () => {
      // Arrange (准备)
      const userId = 'user-123';
      const amount = 30;

      // Mock Supabase调用
      vi.mock('@/lib/supabase/server', () => ({
        createServiceRoleClient: () => ({
          rpc: vi.fn().mockResolvedValue({
            data: { success: true, remaining_credits: 70 },
            error: null,
          }),
        }),
      }));

      // Act (执行)
      const result = await manager.consumeCredit(userId, amount);

      // Assert (断言)
      expect(result.success).toBe(true);
      expect(result.remaining_credits).toBe(70);
    });

    it('应该在积分不足时返回错误', async () => {
      // ...
    });

    it('应该在并发调用时保持一致性', async () => {
      // 测试行级锁
    });
  });
});
```

### 6.3 集成测试

```typescript
// app/api/report/route.test.ts

import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/report', () => {
  it('应该返回报告数据', async () => {
    // 创建请求
    const request = new Request(
      'http://localhost:3000/api/report?symbol=AAPL&lang=en&tone=baseline'
    );

    // 执行
    const response = await GET(request);
    const data = await response.json();

    // 断言
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.symbol).toBe('AAPL');
  });

  it('应该在symbol无效时返回400', async () => {
    const request = new Request(
      'http://localhost:3000/api/report?symbol=INVALID!!!&lang=en'
    );

    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
```

### 6.4 E2E测试

```typescript
// tests/e2e/report-generation.spec.ts

import { test, expect } from '@playwright/test';

test('完整的报告生成流程', async ({ page }) => {
  // 1. 访问首页
  await page.goto('http://localhost:3000');

  // 2. 输入股票代码
  await page.fill('[data-testid="search-input"]', 'AAPL');

  // 3. 选择语言
  await page.selectOption('[data-testid="language-select"]', 'en');

  // 4. 点击生成
  await page.click('[data-testid="generate-button"]');

  // 5. 等待报告生成
  await page.waitForSelector('[data-testid="report-content"]', {
    timeout: 180000, // 3分钟
  });

  // 6. 验证报告内容
  const content = await page.textContent('[data-testid="report-content"]');
  expect(content).toContain('Apple Inc');

  // 7. 测试导出功能
  await page.click('[data-testid="export-docx"]');
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/AAPL.*\.docx$/);
});
```

### 6.5 测试覆盖率要求

```bash
# 目标覆盖率
- 整体:        80%+
- lib/core:    90%+ (核心业务逻辑)
- lib/api:     85%+ (API工具)
- components:  70%+ (UI组件)

# 运行测试
npm run test              # 单次运行
npm run test:watch        # 监听模式
npm run test:coverage     # 生成覆盖率报告
```

---

## Git工作流

### 7.1 分支策略

```bash
main                    # 生产环境
  ├── develop          # 开发环境
  │   ├── feature/xxx  # 功能分支
  │   ├── bugfix/xxx   # Bug修复
  │   └── hotfix/xxx   # 紧急修复
  └── release/x.x.x    # 发布分支
```

### 7.2 分支命名规范

```bash
# 功能分支
feature/referral-system
feature/report-template-system

# Bug修复
bugfix/credit-calculation-error
bugfix/signup-validation

# 紧急修复
hotfix/security-patch-csrf
hotfix/database-connection-leak

# 发布分支
release/1.2.0
release/2.0.0
```

### 7.3 提交信息规范

```bash
# 格式: <type>(<scope>): <subject>

# Type类型:
feat:     新功能
fix:      Bug修复
docs:     文档更新
style:    代码格式(不影响功能)
refactor: 重构(既不是新功能也不是Bug修复)
perf:     性能优化
test:     测试
chore:    构建/工具链

# 示例:
feat(report): 添加报告模板选择功能
fix(credits): 修复积分扣除并发问题
docs(readme): 更新安装说明
refactor(api): 重构错误处理逻辑
perf(cache): 优化Redis缓存策略
test(report): 添加报告生成集成测试
chore(deps): 升级Next.js到16.0.7
```

### 7.4 Pull Request规范

```markdown
## 📝 变更描述
简要描述本次PR的目的和内容

## 🎯 关联Issue
Closes #123
Fixes #456

## 📸 截图(如果有UI变更)
[添加截图]

## ✅ 检查清单
- [ ] 代码已通过lint检查
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 更新了相关文档
- [ ] 本地验证通过

## 🧪 测试方法
1. 访问 http://localhost:3000/xxx
2. 点击xxx按钮
3. 验证xxx功能正常

## 📌 注意事项
- 需要更新环境变量: XXX
- 需要运行数据库迁移: `npx supabase db reset`
```

---

## 代码审查检查清单

### 8.1 通用检查

- [ ] 代码符合项目风格指南
- [ ] 无console.log/console.error(使用logger)
- [ ] 无硬编码的密钥/URL
- [ ] 无TODO/FIXME未处理
- [ ] 函数/组件大小合理(<50行/<200行)
- [ ] 变量/函数命名清晰有意义
- [ ] 添加了必要的注释(复杂逻辑)

### 8.2 React/Next.js检查

- [ ] 组件使用TypeScript严格类型
- [ ] Props有明确的类型定义
- [ ] 使用React.memo优化大型组件
- [ ] useEffect依赖数组正确
- [ ] 事件处理函数使用useCallback
- [ ] 计算值使用useMemo
- [ ] 图片使用Next.js Image组件
- [ ] 链接使用Next.js Link组件

### 8.3 API检查

- [ ] 输入参数有验证(Zod/Joi)
- [ ] 使用统一的响应格式
- [ ] 错误处理完善
- [ ] 添加了速率限制
- [ ] 认证/授权检查正确
- [ ] 日志记录完整
- [ ] 响应包含必要的CORS头

### 8.4 数据库检查

- [ ] 使用参数化查询(防SQL注入)
- [ ] RLS策略正确配置
- [ ] 数据库函数有注释
- [ ] 迁移文件命名正确
- [ ] 迁移包含回滚说明
- [ ] 索引创建合理

### 8.5 安全检查

- [ ] 无SQL注入风险
- [ ] 无XSS风险
- [ ] 无CSRF风险
- [ ] 无路径遍历风险
- [ ] 敏感数据已加密/hash
- [ ] 环境变量正确使用
- [ ] 文件上传有验证
- [ ] 速率限制已配置

### 8.6 测试检查

- [ ] 添加了单元测试
- [ ] 添加了集成测试(如果需要)
- [ ] 测试覆盖核心逻辑
- [ ] 测试全部通过
- [ ] 无脆弱测试(依赖顺序/随机值)

---

## 附录

### A. 常用工具

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint
npm run lint:fix

# 类型检查
npm run type-check

# 测试
npm run test
npm run test:coverage

# 数据库
npx supabase db reset
npx supabase db push
npx supabase gen types typescript
```

### B. 推荐VS Code扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### C. 参考资料

- [Next.js文档](https://nextjs.org/docs)
- [React文档](https://react.dev)
- [TypeScript文档](https://www.typescriptlang.org/docs)
- [Supabase文档](https://supabase.com/docs)
- [OWASP Top 10](https://owasp.org/Top10/)

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-10
**维护者**: 技术架构组
