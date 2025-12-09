# Supabase CLI 本地开发手册

**Updated:** 2025-11-27  
**Audience:** 任意需要本地跑通 qiltrack-ai 后端的 AI/工程师  
**Scope:** 如何用 Supabase CLI 初始化/运行/同步本地 Postgres + Auth + Storage 栈，并与现有 Next.js API 协作

> 生产运行依旧使用 Hosted Supabase。CLI 方案用于本地开发、测试与 schema 迭代，提交前必须将迁移与类型同步到版本库。

---

## 1. 依赖速查

| 工具                    | 最低版本 | 推荐版本 | 验证命令                 |
| ----------------------- | -------- | -------- | ------------------------ |
| Node.js                 | 18.0.0   | 20.19+   | `node --version`         |
| npm                     | 8.0.0    | 10.8+    | `npm --version`          |
| Docker Desktop / podman | 最新     | 最新     | `docker version`         |
| Supabase CLI            | 2.58+    | 2.62+    | `npx supabase --version` |

若尚未安装 CLI：

```bash
npm install -g supabase         # 或直接使用 npx supabase <cmd>
supabase --version
```

---

## 2. 快速上手（10 分钟）

```bash
cd qiltrack-ai
npx supabase login                      # 首次执行会打开浏览器
npx supabase start                      # 拉起 Docker stack
npx supabase status                     # 记下 API URL / anon / service_role
cp .env.local.example .env.local        # 如已存在仅更新 Supabase 字段
```

将 `npx supabase status` 输出写入 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role>
SUPABASE_STORAGE_REPORT_BUCKET=report-assets
TEST_REPORT_TOKEN=local-test-token
```

随后执行：

```bash
npm install           # 首次克隆需要
npm run lint
npm run test
npm run dev
```

浏览器访问 http://localhost:3000 或直接命令行：

```bash
curl "http://localhost:3000/api/report?symbol=AAPL&testToken=local-test-token"
```

看到 `report` 文本与 `remainingQuota` 数值即表示本地后端连通。

---

## 3. CLI 生命周期

### 3.1 启动/关闭

```bash
npx supabase start        # 首次启动会根据 supabase/config.toml 初始化
npx supabase stop         # 停止 Docker 容器
npx supabase db push      # 应用新迁移（推荐，保留数据）
npx supabase db reset     # 重建数据库（⚠️ 删除所有数据，慎用！）
```

> ⚠️ **重要提示：** 大多数情况下应使用 `db push` 而不是 `db reset`。详见 [数据库管理规范指南](./database-management-guide.md)。

### 3.2 状态 & 日志

```bash
npx supabase status       # 显示 API URL、DB URL、Studio、anon/service keys
npx supabase logs --tail  # 观察 Postgres/Auth/Storage 日志
```

### 3.3 认证

CLI 登录一次即可；如需切换账户：

```bash
supabase auth logout
supabase login
```

---

## 4. Schema 与类型工作流

1. **创建迁移**
   ```bash
   npx supabase migration new add_report_fields
   # 编辑 supabase/migrations/<timestamp>_add_report_fields.sql
   ```
2. **应用到当前 stack**
   ```bash
   npx supabase db push              # 作用于本地 Docker，或 --linked 作用于 Hosted
   ```
3. **生成 TypeScript 类型**
   ```bash
   npx supabase gen types typescript --local --schema public > types/database.ts
   ```
4. **提交前检查**
   - `git status` 应包含迁移 SQL + `types/database.ts`
   - rerun `npm run lint && npm test`

### Hosted 同步

```bash
npx supabase link --project-ref <project-ref>   # 仅需一次
npx supabase db push --linked                   # 把 migrations 应用到云端
npx supabase gen types typescript --linked --schema public > types/database.ts
```

所有远端更改必须经由 PR 提交的 migrations，禁止在 Dashboard 手改 schema。

---

## 5. 环境变量矩阵

| 场景      | `NEXT_PUBLIC_SUPABASE_URL`      | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_SERVICE_ROLE_KEY`      | 备注                             |
| --------- | ------------------------------- | ------------------------------- | -------------------------------- | -------------------------------- |
| Hosted    | `https://<project>.supabase.co` | Dashboard → API → `anon`        | Dashboard → API → `service_role` | 生产/预发布                      |
| Local CLI | `http://127.0.0.1:54321`        | `npx supabase status` 输出      | 同上                             | 默认 `supabase/config.toml` 端口 |

其他变量（Finnhub、Helicone、OpenRouter、`TEST_REPORT_TOKEN` 等）与 Hosted 一致，可放在 `.env.local` 中一并管理。

---

## 6. 验证清单

1. `npm run lint`
2. `npm run test`
3. `curl "http://localhost:3000/api/report?symbol=AAPL&testToken=local-test-token"` → HTTP 200 + JSON payload
4. 登录 Supabase Studio（`npx supabase status` 中的 URL）确认 `profiles`、`report_runs`、`report_credit_events` 等表数据更新
5. 需要真实 Auth 流程时，使用 `/login` 页面，通过邮件 OTP / OAuth 登入后，在 Network 面板确认 `/api/report/history` 返回当前用户数据

---

## 7. 常见问题

| 症状                                          | 可能原因                          | 解决方案                                                   |
| --------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `supabase start` 报 Docker 未运行             | Docker Desktop 未启动             | 打开 Docker Desktop 或 `docker context use default`        |
| `db push` 提示 “diff failed”                  | migrations 与实际 schema 不一致   | `npx supabase db reset` 后重试，或手动清理 shadow DB       |
| `types/database.ts` 缺字段                    | 忘记重新生成                      | 运行 `npx supabase gen types ...`（local/linked 对应）     |
| `/api/report` 返回 500 且日志显示 Storage 404 | Bucket 未创建或非 Private         | Dashboard → Storage 创建 `report-assets` 并设 Private      |
| `curl` 返回 401                               | 缺少登录或 `testToken`            | 使用 `TEST_REPORT_TOKEN`（仅限本地）或先登录 Supabase Auth |
| CLI 一直要求登录                              | `$HOME/.config/supabase` 无写权限 | 以管理员身份运行或更改目录权限                             |

---

## 8. 关机前收尾

1. `Ctrl+C` 结束 `npm run dev`
2. `npx supabase stop`
3. `git status` → 确认 migrations/types/env 已提交或回退
4. 需要释放 Docker 资源时执行 `docker system prune`

---

## 9. 相关文档

- **[数据库管理规范指南](./database-management-guide.md)** - ⭐ 必读！详细说明如何安全地管理数据库，避免数据丢失
- [Supabase Bucket 设置指南](../setup/supabase-bucket-setup-guide.md) - Storage 存储桶配置

---

若流程仍有疑问，请在 PR/Issue 中引用本指南并描述所卡步骤，方便 Codex 评审与追踪。
