# Architecture Snapshot: 邀请注册流程修复

> **日期**: 2025-12-10
> **作者**: G1-Codex
> **优先级**: P0（阻塞性）
> **状态**: 待实施

---

## 1. 背景与问题

### 用户反馈
生产环境中邀请系统存在以下问题：
1. 用户点击邀请链接 `https://www.qiltrack.com/ref/CB2C22AF` 后未显示欢迎横幅
2. 注册时切换登录/注册页面报错："此处找不到该对象"（截图 q1.png）
3. 新用户注册后，邀请人统计数据不更新（显示 0）

### 根本原因诊断

**问题 #1：邀请关系未建立（P0 阻塞性）**

数据流断点在注册环节：

```
用户点击 /ref/CODE
→ Cookie 设置成功 ✅ (app/ref/[code]/route.ts:36-42)
→ 用户注册
→ handle_new_user() trigger 触发 (20251207000000_clean_schema.sql:943-947)
→ fn_initialize_profile(id, email, name) ❌ 缺少第4个参数 referral_code
→ 邀请关系永远不会被建立
```

**核心问题**：
- `handle_new_user()` trigger 只传递 3 个参数给 `fn_initialize_profile`
- PostgreSQL trigger 无法直接访问 HTTP Cookie
- 客户端注册时未将 Cookie 中的 `referral_code` 传递到 Supabase metadata

**影响范围**：
- 所有通过邀请链接注册的新用户
- 邀请人无法获得奖励
- 被邀请人无法获得邀请积分

---

## 2. 技术方案

### 方案概述：Cookie → Metadata → Trigger 传递链

建立完整的邀请码传递路径：

```
[浏览器 Cookie]
  ↓ 客户端读取
[signUpWithPassword 调用]
  ↓ 存入 raw_user_meta_data
[auth.users 表]
  ↓ trigger 触发
[handle_new_user()]
  ↓ 从 metadata 读取
[fn_initialize_profile(id, email, name, referral_code)]
  ↓ 调用
[fn_claim_referral_signup()]
  ↓ 创建
[referrals 表 + 双方积分]
```

### 具体修改

#### 修改 #1：客户端读取 Cookie 并传递到 metadata
**文件**: `hooks/useSupabaseAuth.ts:350-386`

在 `signUpWithPassword` 函数中：
1. 读取 Cookie `referral_code`
2. 存储到 `options.data.referral_code`

```typescript
const signUpWithPassword = useCallback(
  async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: "Supabase not configured" };
    const trimmedEmail = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      return { success: false, code: "invalid_email" };
    }

    try {
      // 读取邀请码 Cookie
      const referralCode = document.cookie
        .split('; ')
        .find(row => row.startsWith('referral_code='))
        ?.split('=')[1];

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${getAuthRedirectBase()}${AUTH_CALLBACK_PATH}`,
          ...(captchaToken ? { captchaToken } : {}),
          // 传递邀请码到 metadata
          data: {
            ...(referralCode ? { referral_code: referralCode } : {}),
          },
        },
      });

      // ... 错误处理
    } catch (err) {
      console.error("注册失败:", err);
      return mapAuthError(err);
    }
  },
  [supabase]
);
```

#### 修改 #2：更新数据库 trigger
**迁移文件**: `supabase/migrations/20251210100000_fix_referral_trigger.sql`

更新 `handle_new_user()` 函数，传递第 4 个参数：

```sql
-- 修复 handle_new_user trigger：传递邀请码到 fn_initialize_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.fn_initialize_profile(
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'referral_code'  -- 新增：从 metadata 读取邀请码
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新创建 trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. 验证计划

### 本地开发环境测试
1. 清除浏览器 Cookie
2. 访问邀请链接 `/ref/TEST_CODE`
3. 检查 Cookie 是否设置成功（DevTools）
4. 注册新账号
5. 验证数据库：
   ```sql
   -- 检查邀请关系
   SELECT * FROM referrals WHERE referral_code = 'TEST_CODE' ORDER BY created_at DESC LIMIT 1;

   -- 检查双方积分
   SELECT user_id, credits_available FROM report_credits
   WHERE user_id IN (SELECT referrer_id FROM referrals WHERE referral_code = 'TEST_CODE' UNION SELECT referred_id FROM referrals WHERE referral_code = 'TEST_CODE');

   -- 检查积分事件
   SELECT * FROM report_credit_events WHERE reason LIKE '%referral%' ORDER BY created_at DESC LIMIT 10;
   ```

### 生产环境验证
1. 部署代码到 Vercel
2. 运行迁移：`supabase db push --include-all --linked`
3. 使用真实邀请码测试完整流程
4. 监控 Vercel logs 和 Supabase logs

---

## 4. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Cookie 被第三方脚本清除 | 邀请关系丢失 | 低 | httpOnly + sameSite=lax 保护 |
| 用户禁用 Cookie | 邀请无法追踪 | 中 | URL 参数作为备选（已实现） |
| Migration 失败 | 生产环境中断 | 低 | 先在 staging 测试，使用 `CREATE OR REPLACE` |
| 历史用户数据 | 已注册用户无邀请关系 | 高 | 不影响，仅适用于新注册用户 |

---

## 5. 部署顺序

1. **代码部署**：
   - 合并到 `g1/develop`
   - 提交 PR 到 `develop`
   - 合并到 `main`
   - Vercel 自动部署

2. **数据库迁移**：
   ```bash
   # 生产环境
   supabase db push --linked --include-all

   # 验证迁移
   node scripts/check-remote-db.js
   ```

3. **功能验证**：
   - 使用测试邀请码完整走一遍流程
   - 检查数据库记录
   - 监控日志

---

## 6. 回滚计划

如果出现问题：

1. **代码回滚**：
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **数据库回滚**：
   ```sql
   -- 恢复旧版 trigger（仅在紧急情况使用）
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     PERFORM public.fn_initialize_profile(
       NEW.id,
       NEW.email,
       NEW.raw_user_meta_data->>'display_name'
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

---

## 7. 相关文档

- 邀请系统 Bug 修复（上次）：`docs/decisions/2025-12-10-referral-system-bugfix.md`
- 邀请系统迁移：`supabase/migrations/20251210000000_referral_system.sql`
- CAVR 报告模板：`docs/reports/2025-12-10-gX-<topic>-cavr.md`

---

## 8. 开放问题

- [ ] 问题 #2：欢迎横幅为何不显示？（需生产环境实测）
- [ ] 问题 #3：登录/注册切换报错（待复现具体场景）
- [ ] 性能优化：邀请码查询是否需要 Redis 缓存？
- [ ] 监控告警：邀请转化率低时自动告警

---

## 9. 实施 Checklist

- [ ] 修改 `hooks/useSupabaseAuth.ts` - 客户端读取 Cookie
- [ ] 创建迁移文件 `20251210100000_fix_referral_trigger.sql`
- [ ] 本地测试完整流程
- [ ] 提交 PR 并通过 CI
- [ ] 部署到生产环境
- [ ] 运行数据库迁移
- [ ] 生产环境验证
- [ ] 更新 `docs/plans/workstreams.md`
- [ ] 输出 CAVR 报告
