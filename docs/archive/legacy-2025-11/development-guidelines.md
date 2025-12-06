# Qiltrack AI 开发规范

> 本文档总结了项目开发过程中遇到的常见问题和最佳实践，供团队成员和 AI 助手参考。

## 目录

1. [TypeScript 规范](#typescript-规范)
2. [Next.js 14+ 规范](#nextjs-14-规范)
3. [Supabase 类型处理](#supabase-类型处理)
4. [组件开发规范](#组件开发规范)
5. [国际化 (i18n) 规范](#国际化-i18n-规范)
6. [Git 提交规范](#git-提交规范)

---

## TypeScript 规范

### 1. 类型定义同步更新

当 API 返回新字段时，必须同步更新 `types/` 目录下的类型定义。

```typescript
// ❌ 错误：直接访问未定义的属性
if (data.reused) { ... }

// ✅ 正确：先在类型中添加属性
// types/report.ts
export type ReportResponse = {
  symbol: string;
  report: string;
  reused?: boolean;  // 新增字段
};
```

### 2. 组件 Props 类型

添加新的 prop 时，必须同时更新组件的 Props 类型定义。

```typescript
// ❌ 错误：传递了未定义的 prop
<ReuseDialog onUseReused={handleUseReused} />

// ✅ 正确：先更新类型定义
type ReuseDialogProps = {
  onViewHistory: () => void;
  onRegenerate: () => void;
  onUseReused: () => void;  // 新增
  onClose: () => void;
};
```

### 3. 避免使用 `any`

尽量使用具体类型或类型断言，而不是 `any`。

```typescript
// ❌ 避免
const data: any = await fetchData();

// ✅ 推荐
type ProfileData = {
  plan?: string;
  subscription_status?: string;
};
const data = await fetchData() as ProfileData | null;
```

---

## Next.js 14+ 规范

### 1. useSearchParams 必须包裹 Suspense

Next.js 14+ 要求使用 `useSearchParams()` 的组件必须在 `<Suspense>` 边界内。

```typescript
// ❌ 错误：直接在页面组件中使用
export default function Page() {
  const searchParams = useSearchParams();  // 构建错误
  return <div>...</div>;
}

// ✅ 正确：分离组件并用 Suspense 包裹
function PageContent() {
  const searchParams = useSearchParams();
  return <div>...</div>;
}

function LoadingFallback() {
  return <div>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageContent />
    </Suspense>
  );
}
```

### 2. 需要 Suspense 的 Hooks

以下 hooks 在静态生成时需要 Suspense 边界：
- `useSearchParams()`
- `usePathname()` (某些情况)
- 其他依赖 URL 参数的 hooks

---

## Supabase 类型处理

### 1. `.single()` 查询的类型问题

Supabase 的 `.single()` 方法常导致 TypeScript 推断为 `never` 类型。

```typescript
// ❌ 错误：类型被推断为 never
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

if (data.plan) { ... }  // Error: Property 'plan' does not exist on type 'never'

// ✅ 正确：使用类型断言
type ProfileData = {
  id: string;
  plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
};

const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

const profile = data as ProfileData | null;
if (profile?.plan) { ... }
```

### 2. 通用的 Supabase 类型模式

```typescript
// 定义表数据类型
type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// 或者手动定义常用类型
type ProfileRow = {
  id: string;
  email?: string;
  plan?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  // ...
};
```

### 3. `.update()` 方法的类型问题

```typescript
// ❌ 可能报错
await supabase
  .from("profiles")
  .update({ subscription_status: "active" })
  .eq("id", userId);

// ✅ 使用类型断言
await supabase
  .from("profiles")
  .update({
    subscription_status: "active",
    updated_at: new Date().toISOString(),
  } as never)
  .eq("id", userId);
```

---

## 组件开发规范

### 1. 文件结构

```
app/components/
├── feature-name/
│   ├── index.tsx        # 主组件
│   ├── types.ts         # 类型定义
│   ├── SubComponent.tsx # 子组件
│   └── utils.ts         # 工具函数
```

### 2. Props 命名约定

- 事件处理器：`onXxx` (如 `onClick`, `onSubmit`, `onClose`)
- 布尔状态：`isXxx` 或 `hasXxx` (如 `isLoading`, `hasError`)
- 回调函数：`onXxx` 或 `handleXxx`

### 3. 导出规范

```typescript
// 组件文件
export function MyComponent() { ... }

// 类型文件
export type { MyComponentProps, MyComponentState };
```

---

## 国际化 (i18n) 规范

### 1. 参数必须为字符串

i18n 的 `t()` 函数参数必须是字符串类型。

```typescript
// ❌ 错误：传递 number 类型
const CREDIT_COST = 30;
t("error.insufficientCredits", {
  required: CREDIT_COST,  // Error: number is not assignable to string
  available: auth.remainingQuota
});

// ✅ 正确：转换为字符串
t("error.insufficientCredits", {
  required: String(CREDIT_COST),
  available: String(auth.remainingQuota)
});
```

### 2. 翻译键命名约定

```
模块.子模块.描述
```

示例：
- `generator.progress.init`
- `auth.confirm.verifying`
- `error.submit.empty`

---

## Git 提交规范

### 1. 提交作者配置

Vercel 自动构建依赖正确的 Git 作者信息：

```bash
git config user.name "explore0012"
git config user.email "explore0012@users.noreply.github.com"
```

### 2. 提交信息格式

```
<type>: <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

类型 (type)：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 3. 提交前检查

```bash
# 本地构建测试
npm run build

# 类型检查
npx tsc --noEmit
```

---

## 常见错误速查表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Property 'X' does not exist on type 'never'` | Supabase 类型推断问题 | 添加类型断言 `as TypeName` |
| `Type 'number' is not assignable to type 'string'` | i18n 参数类型 | 使用 `String()` 转换 |
| `useSearchParams() should be wrapped in a suspense boundary` | Next.js 14+ 要求 | 用 `<Suspense>` 包裹组件 |
| `Property 'X' does not exist on type 'Y'` | Props 类型未更新 | 更新组件 Props 类型定义 |

---

## 更新日志

- **2025-12-05**: 初始版本，基于 Vercel 构建错误总结
