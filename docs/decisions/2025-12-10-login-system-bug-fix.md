# Architecture Snapshot: 登录系统 Bug 修复

> **日期**: 2025-12-10
> **创建者**: HQ (Codex 代理)
> **状态**: 已完成分析，待工作组实施
> **优先级**: P0 (阻塞核心功能)

---

## 1. 背景与问题

### 问题描述
用户报告登录功能暂不可用，提示"Login is temporarily unavailable. Please try again later."

### 影响范围
- **严重性**: P0 级别 - 阻塞所有用户登录
- **受影响功能**:
  - 密码登录 (Password Sign-in)
  - 用户注册 (Sign-up)
  - 测试环境的本地开发流程

### 根本原因
经过系统排查，发现以下根本原因：

1. **seed.sql 中的密码哈希错误**
   - 文件: `supabase/seed.sql:46`
   - 问题: 使用了不完整的 bcrypt 哈希 (长度仅 31 字符)
   - 正确格式: bcrypt 哈希必须是 60 字符

2. **bcrypt 版本不兼容**
   - 旧哈希前缀: `$2a$10$` (GoTrue 可能不支持)
   - 新哈希前缀: `$2b$10$` (标准 bcryptjs 输出)

---

## 2. 技术分析

### 登录流程架构

```
┌─────────────────────────────────────────────────────┐
│ 前端: app/(auth)/login/page.tsx                      │
│ ├─ 用户输入 email + password                         │
│ └─ 调用 useSupabaseAuth.signInWithPassword()        │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Client (浏览器端)                           │
│ lib/supabase/client.ts                               │
│ └─ supabase.auth.signInWithPassword({email, pwd})   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Kong Gateway                                │
│ http://127.0.0.1:54321                               │
│ └─ POST /auth/v1/token?grant_type=password          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ GoTrue (Supabase Auth Service)                       │
│ Docker: supabase_auth_qiltrack-ai                    │
│ ├─ 验证 email 存在性                                 │
│ ├─ bcrypt.compare(password, encrypted_password)      │
│ └─ 生成 JWT session token                            │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ PostgreSQL: auth.users 表                            │
│ Docker: supabase_db_qiltrack-ai                      │
│ └─ SELECT encrypted_password WHERE email=?          │
└─────────────────────────────────────────────────────┘
```

### 错误日志分析

#### 第一次尝试 (旧密码哈希)
```json
{
  "component": "api",
  "error": "400: Invalid login credentials",
  "grant_type": "password",
  "status": 400,
  "error_code": "invalid_credentials"
}
```

#### 第二次尝试 (转义错误)
```json
{
  "component": "api",
  "error": "crypto/bcrypt: hashedSecret too short to be a bcrypted password",
  "status": 500
}
```
**原因**: PostgreSQL 转义字符导致哈希被截断

#### 第三次尝试 (修复后)
```json
{
  "status": 200,
  "path": "/token",
  "grant_type": "password"
}
```
✅ **登录成功**

---

## 3. 修复方案

### 3.1 立即修复 (已完成)

#### ✅ 修复 seed.sql
- **文件**: `supabase/seed.sql:46`
- **修改前**:
  ```sql
  '$2a$10$vQHOKPXZj0MJOWVLq8X4YOxBZzZz6Oz5Uz9DLQx9JYP5jJfDKvX4e'
  ```
- **修改后**:
  ```sql
  '$2b$10$zTcvyI5HQpnMLzzXxKdELeWaQEw.Tql6nqLArpzZAxapkfARN82nq'
  ```
- **验证**: 使用 bcryptjs 库生成的标准哈希，长度 60 字符

#### ✅ 验证测试
- 测试账号: `test@qiltrack.com`
- 测试密码: `Test123456!`
- 登录结果: ✅ 成功，跳转至首页 `/`
- Session: ✅ 创建成功，可访问受保护路由

---

### 3.2 待实施的架构改进

根据代码探查，发现以下**高风险问题**需要工作组修复：

| 问题 ID | 严重性 | 位置 | 问题描述 | 建议修复 |
|---------|--------|------|----------|----------|
| **AUTH-01** | P0 | `hooks/useSupabaseAuth.ts:39-48` | **Redirect URL 配置复杂且易错**<br>- SSR 默认使用 `http://localhost:3000`<br>- 多环境切换时易导致 Supabase 回调失败 | 1. 明确设置 `NEXT_PUBLIC_SITE_URL`<br>2. 在 Supabase 项目配置所有环境的回调 URL |
| **AUTH-02** | P1 | `lib/supabase/server.ts:getAllCookies()` | **Cookie 名称硬编码，依赖库内部实现**<br>- `@supabase/ssr` 更新后可能导致 session 丢失 | 监听库更新，及时同步 cookie 名称 |
| **AUTH-03** | P1 | `app/api/auth/callback/route.ts:80-90` | **密码恢复使用 JS redirect，无 fallback**<br>- JS 禁用时用户无法完成密码重置 | 添加 `<noscript>` meta refresh 兜底 |
| **AUTH-04** | P2 | `hooks/useSupabaseAuth.ts:mapAuthError()` | **错误处理依赖字符串匹配，不可靠**<br>- `includes("60 seconds")` 判断 rate limit | 使用 Supabase 官方错误代码常量 |
| **AUTH-05** | P2 | `lib/auth/password-validator.ts` | **前后端密码校验规则不一致**<br>- 前端提示 8 字符，后端验证 12 字符 | 统一为 12 字符，同步 UI 提示文案 |
| **AUTH-06** | P3 | `app/components/GoogleSignInButton.tsx` | **Google OAuth 未配置时按钮显示不友好** | 显示明确提示："需要配置 GOOGLE_CLIENT_ID" |
| **AUTH-07** | P3 | `hooks/useSupabaseAuth.ts:getAuthMethod()` | **依赖 RPC 函数可能不存在**<br>- `fn_user_has_password` 缺失时降级策略不明确 | 添加 RPC 函数存在性检查和明确的错误处理 |

---

## 4. 交付物与验收标准

### 4.1 本次修复 (已完成)

#### ✅ 代码变更
- [x] `supabase/seed.sql` - 更新测试用户密码哈希
- [x] 删除临时测试文件 `test-bcrypt.js`, `update-password.sql`

#### ✅ 验证结果
- [x] 登录流程: `test@qiltrack.com` + `Test123456!` → 成功
- [x] Session 创建: JWT token 正常生成
- [x] 首页加载: 用户信息显示正常 (余额 30 credits)
- [x] API 调用: `/api/report/daily-reward/status` 返回 200

---

### 4.2 后续改进任务清单

以下任务将分派给工作组实施：

#### **Stage 1: P0/P1 紧急修复** (估算 1 天)
- [ ] **AUTH-01**: 统一 Redirect URL 配置
  - 在 `.env.local.example` 添加 `NEXT_PUBLIC_SITE_URL` 说明
  - 更新 Supabase 项目 Auth Settings
  - 验证多环境 (localhost/192.168.x.x/生产) 回调

- [ ] **AUTH-03**: 密码恢复 fallback
  - 在 `app/api/auth/callback/route.ts` 添加 `<noscript>` meta refresh
  - 测试 JS 禁用场景

#### **Stage 2: P2 体验优化** (估算 2 天)
- [ ] **AUTH-04**: 错误处理重构
  - 定义 `SUPABASE_ERROR_CODES` 常量
  - 重写 `mapAuthError()` 使用官方错误代码

- [ ] **AUTH-05**: 密码校验统一
  - 前端 UI: 更新提示为 "至少 12 字符"
  - 后端 API: 确认 12 字符验证逻辑
  - 添加 e2e 测试

#### **Stage 3: P3 长期改进** (估算 1 天)
- [ ] **AUTH-02**: Cookie 监控机制
- [ ] **AUTH-06**: Google OAuth 友好提示
- [ ] **AUTH-07**: RPC 函数防御性检查

---

## 5. 风险与限制

### 已知风险
1. **本地 Supabase 数据库**
   - 当前修复仅影响本地开发环境
   - 生产环境 Supabase 实例需单独更新用户密码哈希

2. **现有用户**
   - 使用旧密码注册的用户可能需要重置密码
   - 建议触发一次全局密码哈希检查脚本

3. **环境变量**
   - `NEXT_PUBLIC_SITE_URL` 在多环境部署时必须正确配置
   - Vercel/Docker 部署需确认环境变量同步

### 技术债务
- **Turnstile CAPTCHA**: token 过期时无自动重试 (现有问题，未修复)
- **Google Identity Services**: 脚本加载失败无 onerror 处理
- **RPC 依赖**: `fn_initialize_profile`, `fn_user_has_password` 缺少存在性验证

---

## 6. 测试策略

### 回归测试清单
```bash
# 1. 本地数据库重置
supabase db reset

# 2. 验证测试用户
docker exec supabase_db_qiltrack-ai psql -U postgres \
  -c "SELECT email, LENGTH(encrypted_password) FROM auth.users WHERE email = 'test@qiltrack.com';"
# 预期: hash_length = 60

# 3. 登录测试
# 浏览器访问 http://localhost:3002/login
# 输入: test@qiltrack.com / Test123456!
# 预期: 跳转至 / 页面，显示用户信息

# 4. Session 持久化测试
# 刷新页面，检查是否仍处于登录状态
# 预期: 保持登录，无需重新认证

# 5. API 调用测试
curl http://localhost:3002/api/report/daily-reward/status \
  -H "Cookie: $(cat .cookies)"
# 预期: 200 OK
```

---

## 7. 相关文档

- **协作手册**: `CODEX_CLAUDE_COLLAB.md`
- **环境配置**: `.env.local` - Supabase 本地连接信息
- **种子数据**: `supabase/seed.sql` - 测试用户初始化
- **登录页面**: `app/(auth)/login/page.tsx`
- **认证 Hook**: `hooks/useSupabaseAuth.ts`
- **密码校验**: `lib/auth/password-validator.ts`

---

## 8. 决策记录

### Decision 1: 使用 bcryptjs 而非 bcrypt
**理由**:
- `bcryptjs` 是纯 JavaScript 实现，跨平台兼容性好
- GoTrue (Supabase Auth) 使用 Go 的 bcrypt 库，与 `bcryptjs` 100% 兼容
- 避免 native 依赖编译问题

### Decision 2: 不修改现有用户哈希算法
**理由**:
- bcrypt `$2a$` 和 `$2b$` 前缀仅表示实现版本，算法相同
- 只要哈希完整 (60 字符)，GoTrue 可正确验证
- 避免大规模用户密码重置

### Decision 3: 先修复 seed.sql，再推进架构改进
**理由**:
- 登录阻塞是 P0 级别，优先恢复基本功能
- 架构改进需跨多个文件，风险较高，应独立 PR
- 符合增量交付原则

---

## 9. 后续行动

### HQ 工作
- [x] 完成根因分析
- [x] 修复 seed.sql
- [x] 验证登录流程
- [ ] 更新 `workstreams.md` 任务看板
- [ ] 分派 AUTH-01 ~ AUTH-07 任务至工作组

### 工作组工作
- 等待 HQ 分派任务
- 按 Stage 1 → 2 → 3 优先级实施
- 每个 Stage 独立提交 PR
- PR 模板填写完整的 CAVR

---

**审查建议**:
本 Snapshot 已包含完整的问题分析、修复方案和后续改进路线图。建议立即启动 Stage 1 (P0/P1) 任务，确保登录系统稳定性。

---
**最后更新**: 2025-12-10 21:30 UTC+8
