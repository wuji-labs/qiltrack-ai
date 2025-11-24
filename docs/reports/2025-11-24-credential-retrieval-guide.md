# Hosted Supabase 凭证获取指南

**目标**: 从 Supabase Dashboard 安全地获取部署所需凭证

---

## 快速查询路径

### 打开 Hosted 项目
```
https://app.supabase.com/project/inmtounwqcjwsxkfnsfd
```

### 导航到 API 凭证位置
```
Settings (左侧菜单) → API
```

---

## 需要获取的三个凭证

### 1️⃣ Project URL
**位置**: Settings → API 页面顶部
**标签**: "Project URL"
**用途**: `NEXT_PUBLIC_SUPABASE_URL`
**格式**: `https://inmtounwqcjwsxkfnsfd.supabase.co`（已知，无需复制）
**安全等级**: ✅ 可公开共享（在 client-side 代码中使用）

---

### 2️⃣ Anon Key (Public)
**位置**: Settings → API → "Anon key (public)"
**标签**: 大的文本框，标记为 "Anon key"
**用途**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**格式**: `eyJ...` (长的 JWT token)
**安全等级**: ✅ 可在 client-side 代码中使用（只读权限）

**获取步骤**:
1. 找到标有 "Anon key" 的框
2. 点击 "Copy" 按钮（或直接选中并复制）
3. 粘贴到 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 行

**验证**:
```bash
# .env.local 应该看起来像:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3️⃣ Service Role Key (Secret)
**位置**: Settings → API → "Service role key (secret)"
**标签**: 大的文本框，标记为 "Service role key"
**用途**: `SUPABASE_SERVICE_ROLE_KEY`
**格式**: `eyJ...` (长的 JWT token)
**安全等级**: ⚠️ **绝不在客户端代码中使用！仅用于服务端和 .env.local**

**获取步骤**:
1. 找到标有 "Service role key" 的框（注意：通常在 Anon key 下方）
2. 点击 "Copy" 按钮（或直接选中并复制）
3. 粘贴到 `.env.local` 中的 `SUPABASE_SERVICE_ROLE_KEY` 行

**验证**:
```bash
# .env.local 应该看起来像:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**安全提示**:
- ❌ 不要在 Git 中提交此密钥（`.env.local` 已在 `.gitignore` 中）
- ❌ 不要在日志中打印此密钥
- ❌ 不要在客户端 JavaScript 中使用此密钥
- ✅ 仅在服务器端代码中使用（Next.js API 路由、RPC 调用等）

---

## 完整配置示例

获取三个凭证后，更新 `.env.local`:

```bash
# ============================================================================
# Supabase Configuration - HOSTED PROJECT (Prod)
# ============================================================================
# Project ref: inmtounwqcjwsxkfnsfd
# Instructions: Get values from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluY...  # 从 Dashboard 复制
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluY...  # 从 Dashboard 复制
SUPABASE_STORAGE_REPORT_BUCKET=report-assets
```

---

## 验证凭证配置

### 检查 1：验证占位符已替换
```bash
grep "PASTE_" .env.local
```
**预期**: 无输出（所有占位符已替换）

### 检查 2：验证格式
```bash
grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local
grep "SUPABASE_SERVICE_ROLE_KEY" .env.local
```
**预期**:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 检查 3：快速连接测试（可选）
```bash
# 使用凭证创建客户端并连接
npx supabase link --project-ref inmtounwqcjwsxkfnsfd
```
**预期**:
```
Linked to remote project: inmtounwqcjwsxkfnsfd
```

---

## 常见问题

### Q1: 我在哪里找到 Anon key？
**A**: 打开 https://app.supabase.com/project/inmtounwqcjwsxkfnsfd → Settings → API，查找标有 "Anon key" 的文本框

### Q2: Service Role key 和 Anon key 有什么区别？
**A**:
- **Anon key**: 公钥，可在客户端使用，权限受限（只读）
- **Service Role key**: 私钥，仅在服务端使用，权限完全（读写删除）

### Q3: 如果我不小心泄露了 Service Role key 怎么办？
**A**: 立即在 Supabase Dashboard → Settings → API 重新生成该密钥，然后更新所有环境配置

### Q4: 为什么 .env.local 不能提交？
**A**: 因为 `.env.local` 包含敏感凭证（Service Role key），提交会危害安全性。使用 `.env.local.example` 作为模板供团队参考

### Q5: 如何验证凭证工作正常？
**A**: 运行验证脚本：
```bash
bash scripts/verify-hosted-deployment.sh
```
或手动测试 API：
```bash
npm run dev
curl "http://localhost:3000/api/report/credits?testToken=test-token-12345"
```

---

## 安全清单

在获取和使用凭证时，遵循以下清单：

- [ ] 仅从官方 Supabase Dashboard 获取凭证（不要相信第三方链接）
- [ ] Anon key 可以分享给团队成员（在 `.env.local.example` 中）
- [ ] Service Role key 仅保存在本地 `.env.local`，勿分享
- [ ] `.env.local` 已在 `.gitignore` 中（验证: `grep .env.local .gitignore`）
- [ ] 提交 PR 前，确认 `.env.local` 未被意外包含（`git status` 应无 `.env.local`）
- [ ] 如果密钥泄露，立即在 Dashboard 重新生成

---

## 后续步骤

1. ✅ 从 Dashboard 获取凭证（本指南）
2. ➡️ 配置 `.env.local`
3. ➡️ 执行 Supabase CLI：`npx supabase link ...`
4. ➡️ 推送迁移：`npx supabase db push`
5. ➡️ 运行验证

详见: `docs/reports/2025-11-24-self-execution-guide.md`

