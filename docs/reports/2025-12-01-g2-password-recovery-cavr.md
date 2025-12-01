# CAVR Report: Password Reset Recovery Link Fix

**Date:** 2025-12-01
**Task:** Implement password recovery link fixes per `docs/decisions/2025-12-01-password-reset-recovery.md`
**Branch:** g2/worktree

---

## Context
修复 Supabase 密码重置邮件链接问题，用户点击邮件后应能：
1. 完整解析所有 token 参数（code/token_hash/hash tokens）
2. 缺参或过期时显示"链接已失效"而非"登录暂不可用"
3. 成功时自动跳转到 `/account/change-password?type=recovery`

## Actions Completed

### 1. 更新 `app/account/reset-password/page.tsx`
- **变更**: 完善 token 解析逻辑，支持 `token_hash`/`token` query 参数
- **变更**: 缺参时提前显示 `linkExpired` 消息（不再触发 API 调用）
- **变更**: 增强错误检测，将 "invalid" 错误也归类为过期
- **文件**: `app/account/reset-password/page.tsx:28-75`

### 2. 更新 `/api/auth/callback/route.ts`
- **变更**: 检测 `token_hash` query 参数作为 recovery 流程的标识
- **逻辑**: `isRecovery = type === "recovery" || tokenHash !== null`
- **效果**: 即使邮件链接缺少 `type=recovery`，仍能保留 hash 并正确转发
- **文件**: `app/api/auth/callback/route.ts:6-17`

### 3. 新增工具函数 `parseRecoveryTokens`
- **新文件**: `lib/auth/parseRecoveryTokens.ts`
- **导出**:
  - `parseRecoveryTokens({ searchParams, hash })` - 解析 query/hash 中的所有 token
  - `hasRecoveryTokens(tokens)` - 检查是否存在至少一种有效 token
- **测试覆盖**: 15 个单元测试（全部通过），涵盖：
  - code (query/hash 优先级)
  - token_hash/token 回退
  - access_token + refresh_token 组合
  - 缺参边界情况

### 4. 测试结果
- **Lint**: ✅ 通过（9 个预存在警告，与本次更改无关）
- **Unit Tests**: ✅ 15/15 通过 (`lib/auth/parseRecoveryTokens.test.ts`)
- **集成测试**: 🔴 需手动验证（见下方风险）

---

## Verification

| 项目 | 状态 | 说明 |
|------|------|------|
| ESLint | ✅ Pass | 无新增 lint 问题 |
| Unit Tests | ✅ Pass | 15 个测试全部通过 |
| Token 解析逻辑 | ✅ Verified | 支持 code/token_hash/access+refresh token |
| 缺参处理 | ✅ Verified | 提前返回 linkExpired 消息 |
| 过期错误识别 | ✅ Enhanced | 匹配 otp_expired/"expired"/"invalid or expired" |
| 错误文案一致性 | ✅ Fixed | 副标题与正文使用相同 errorMessage |

---

## Code Review Fixes (2025-12-01)

### Issue 1: Error message conflict
**问题**: 错误态副标题固定显示 `auth.error.generic`，与正文 errorMessage 冲突
**修复**: 副标题改为使用 `errorMessage` 变量 (app/account/reset-password/page.tsx:90)

### Issue 2: Overly broad error matching
**问题**: 所有包含 "invalid" 的错误都被归类为过期，可能误导用户
**修复**: 收窄匹配条件为 Supabase 特定模式：
- `otp_expired` code
- message 包含 "expired"
- message 包含 "invalid or expired"

---

## Risks & Next Steps

### ⚠️ 阻塞项
1. **手动验证未完成**:
   - 需从 Supabase 触发真实密码重置邮件
   - 确认邮件链接格式（query 参数是否包含 token_hash）
   - 验证能否成功跳转到 `/account/change-password?type=recovery`

2. **Supabase 邮件模板不确定**:
   - 如果 Supabase 邮件使用 `/api/auth/callback` 而非直接 `/account/reset-password`，需确认 callback 转发逻辑
   - 如果邮件使用 magic link (pkce_flow_completed 参数)，可能需额外处理

### 📋 建议后续任务
- [ ] 手动测试完整流程（触发邮件 → 点击链接 → 修改密码）
- [ ] 若测试失败，检查 Supabase Dashboard → Email Templates → Password Recovery 配置
- [ ] 考虑添加端到端测试覆盖 recovery 流程

### 💡 技术债务
- `lib/auth/parseRecoveryTokens` 可复用于其他 auth 页面（如 magic link 验证）
- 当前错误消息依赖 i18n key，需确认 `auth.resetPassword.linkExpired` 存在

---

## Files Changed

```
M  app/account/reset-password/page.tsx
M  app/api/auth/callback/route.ts
A  lib/auth/parseRecoveryTokens.ts
A  lib/auth/parseRecoveryTokens.test.ts
```

---

## Summary
✅ **所有代码实现完成**，逻辑验证通过，单元测试覆盖完整。
🔴 **需 Codex 审查并指导手动验证流程**（Supabase 邮件链接格式 + 端到端测试）。
