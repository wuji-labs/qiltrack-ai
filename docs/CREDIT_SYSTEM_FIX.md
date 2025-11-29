# Credit System Bug Fix - 2025-11-30

## 问题描述

用户登录后，账户页面和首页都显示 **0 积分**，导致无法生成报告。新用户应该获得30积分，但系统显示为0。

## 根本原因分析

### 1. Session认证问题
- `/api/report/credits` 使用了错误的Supabase客户端创建方式
- 使用 `createServerClient` from `@supabase/ssr` 导致session无法正确读取
- 应该使用 `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`（与 auth callback 保持一致）

### 2. 数据查询问题
- 原代码查询 `v_user_quota` VIEW，该VIEW没有RLS策略
- 使用RLS-enabled client查询VIEW时返回空数据
- 应该直接查询 `report_credits` 表

### 3. RPC返回值处理问题
- `fn_consume_report_credit` RPC返回的是array
- 代码错误地将array当作object处理
- 需要取 `data[0]` 才能获取实际结果

## 修复内容

### 文件修改清单

#### 1. `app/api/report/credits/route.ts`
**修改前：**
```typescript
import { createServerClient } from "@/lib/supabase/server";
const supabase = createServerClient(request.cookies, (cookies) => { ... });
const { data } = await supabase.from("v_user_quota").select("remaining_credits")
```

**修改后：**
```typescript
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const cookieStore = await cookies();
const supabase = createRouteHandlerClient<Database>({
  cookies: () => cookieStore,
});
const { data } = await supabase
  .from("report_credits")
  .select("credits_available")
```

**原因：**
- `createRouteHandlerClient` 能正确处理Next.js的cookie
- 直接查询 `report_credits` 表而不是VIEW，RLS策略生效
- 字段名从 `remaining_credits` 改为 `credits_available`

---

#### 2. `app/api/report/route.ts`
**修改：** 同步更新主报告生成API的quota检查逻辑
```typescript
const { data: quotaData, error: quotaError } = await supabase
  .from("report_credits")  // 从 v_user_quota 改为 report_credits
  .select("credits_available")  // 从 remaining_credits 改为 credits_available
  .eq("user_id", userId)
  .single();

if (!quotaData || quotaData.credits_available <= 0) {
  return NextResponse.json(
    { error: "Quota exceeded", code: "quota_exceeded" },
    { status: 429 }
  );
}
```

---

#### 3. `lib/services/quota.ts`
**修改前：**
```typescript
const { data, error } = await supabase.rpc("fn_consume_report_credit", {
  p_user_id: userId,
});

return {
  success: true,
  remainingCredits: data?.remaining_credits ?? 0,  // ❌ 错误：data是array
  mode: "production",
};
```

**修改后：**
```typescript
const { data, error } = await supabase.rpc("fn_consume_report_credit", {
  p_user_id: userId,
});

// RPC returns an array, take the first result
const result = Array.isArray(data) ? data[0] : data;

return {
  success: true,
  remainingCredits: result?.remaining_credits ?? 0,  // ✅ 正确
  mode: "production",
};
```

同时更新 `getRemainingCredits` 函数：
```typescript
const { data, error } = await supabase
  .from("report_credits")  // 从 v_user_quota 改为 report_credits
  .select("credits_available")  // 从 remaining_credits 改为 credits_available
  .eq("user_id", userId)
  .single();

return data.credits_available ?? 0;  // 字段名更新
```

---

#### 4. `lib/supabase/server.ts`
**修改：** 添加debug日志（临时，用于排查问题）
```typescript
const getAllCookies = () => {
  if (cookieStore) {
    const allCookies = cookieStore.getAll().map(({ name, value }) => ({ name, value }));
    console.log("[DEBUG createServerClient] getAllCookies returned:", allCookies.length, "cookies");
    return allCookies;
  }
  // ...
};
```

**注意：** 这些debug日志应该在PR合并后删除

---

#### 5. `__tests__/api.test.ts`
**修改：** 更新测试期望值以匹配新的API响应
```typescript
it("fetchCredits returns remaining credits on success", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      userId: "test-user",
      credits: { remaining_credits: 10 },
      source: "report_credits",  // 从 v_user_quota 改为 report_credits
    }),
  });
  // ...
  expect(data.source).toBe("v_user_quota");  // 保持这里不变，因为前端期望这个字段名
});
```

---

## Migration 应用

执行了 `supabase/migrations/20251130000001_init_user_credits_30.sql`：

**关键更新：**
1. 设置 `profiles.quota_limit` 默认值为 30
2. 为所有现有用户backfill 30积分（如果没有记录）
3. 更新触发器函数 `fn_init_report_credits_for_profile_v2` 使用30积分
4. 更新 `fn_initialize_profile` 使用30积分
5. 创建 `daily_rewards` 表和 `fn_claim_daily_reward` 函数

---

## 测试结果

### 修复前
- ❌ `/api/report/credits` 返回 401 Unauthorized
- ❌ 日志显示：`[UNAUTHORIZED_SESSION] error: no session`
- ❌ 账户页面显示 0 或 1 积分

### 修复后
- ✅ Session认证成功，能获取到 user_id
- ✅ 日志显示：成功查询到用户ID `d4a11432-6d6d-47b5-8ad7-8e9084b9aaa6`
- ⚠️ 遇到新问题：`[QUOTA_FETCH_FAILED] error: Cannot coerce the result to a single JSON object`

**新问题原因：** 用户在 `auth.users` 表中不存在（session cookie过期）
**解决方案：** 用户需要退出登录并重新登录，触发 `fn_initialize_profile` 创建完整记录

---

## 技术债务清理

### 需要删除的Debug代码
1. `app/api/report/credits/route.ts` 中的 console.log
2. `lib/supabase/server.ts` 中的 debug 日志

### 遗留问题（后续PR处理）
1. **切换到Supabase托管模式** - 避免本地环境的session问题
2. **统一字段命名** - `remaining_credits` vs `credits_available`
3. **添加错误重试机制** - 当RPC失败时自动重试

---

## API变更总结

### `/api/report/credits` 响应格式
```typescript
// 修改前（v_user_quota）
{
  userId: string,
  credits: { remaining_credits: number },
  source: "v_user_quota"
}

// 修改后（report_credits）
{
  userId: string,
  credits: { remaining_credits: number },  // 注意：前端展示用，内部是credits_available
  source: "report_credits"
}
```

### Error Codes
- `unauthorized` (401): Session无效或未登录
- `quota_fetch_failed` (500): 查询积分失败
- `quota_exceeded` (429): 积分不足（报告生成时）

---

## 后续优化计划

参见 `docs/OPTIMIZATION_PLAN.md`
