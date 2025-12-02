# ⚡ Hosted Supabase 部署 - 快速参考卡

**项目**: investor-ai
**Project ref**: inmtounwqcjwsxkfnsfd
**分支**: feat/supabase-deployment

---

## 🔑 第 1 步：获取凭证（Codex 负责）

```
打开: https://app.supabase.com/project/inmtounwqcjwsxkfnsfd
导航: Settings → API
复制:
  ✓ Anon key (public)       → NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✓ Service role key        → SUPABASE_SERVICE_ROLE_KEY
```

⚠️ **安全**: Service Role Key 勿分享，仅用于本地 `.env.local`

---

## 🔧 第 2 步：配置环境（Claude 负责）

```bash
# 编辑 .env.local
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-from-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<paste-from-dashboard>
```

验证：

```bash
grep "PASTE_" .env.local  # 无输出 = 成功
```

---

## 🚀 第 3 步：Supabase CLI 执行

```bash
# 1. 连接本地仓库到 Hosted 项目
npx supabase link --project-ref inmtounwqcjwsxkfnsfd

# 2. 推送迁移
npx supabase db push

# 3. 生成类型（应无变更）
npx supabase gen types typescript --linked --schema public > types/database.ts
```

预期输出：

```
✓ Linked to remote project: inmtounwqcjwsxkfnsfd
✓ 20251123000001_init_schema.sql
✓ 20251124000002_align_hosted_schema.sql
```

---

## 📦 第 4 步：创建存储桶（Dashboard UI）

```
路径: Dashboard → Storage → Create new bucket
配置:
  Name: report-assets
  Visibility: Private
  RLS: Service Role can read/write/delete
```

---

## ✅ 第 5 步：本地验证

```bash
# 代码质量
npm run lint
npm test

# 自动化验证
bash scripts/verify-hosted-deployment.sh

# 启动开发服务测试 API
npm run dev
```

预期：

```
✓ ESLint: 0 errors
✓ Tests: 34/34 passing
✓ API endpoints: responding correctly
```

---

## 🧪 第 6 步：手动 API 测试

```bash
# 1. 生成报告（需 LLM 配置）
curl "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345"

# 2. 查询额度
curl "http://localhost:3000/api/report/credits?testToken=test-token-12345"
# 预期: { "userId": "...", "credits": { "remaining_credits": 5 } }

# 3. 查询历史
curl "http://localhost:3000/api/report/history?testToken=test-token-12345"
# 预期: { "reports": [], "pagination": { ... } }
```

---

## 📝 第 7 步：更新文档 & PR

```bash
# 1. 更新 CAVR（记录验证结果）
vim docs/reports/2025-11-24-supabase-deployment-cavr.md

# 2. 提交 PR
git push origin feat/supabase-deployment
# 创建 PR: feat/supabase-deployment → main
```

---

## ⚠️ 常见问题速查

| 问题                                 | 解决                               |
| ------------------------------------ | ---------------------------------- |
| `supabase: command not found`        | `npm install -g supabase@latest`   |
| `Link failed: invalid token`         | 检查凭证是否正确复制（无多余空格） |
| `Migration already applied`          | 正常，幂等性保证                   |
| `Type mismatch in types/database.ts` | 比对差异，确认无关键变更           |
| `.env.local` 被 git 追踪             | 运行 `git rm --cached .env.local`  |

---

## 📊 完整状态

```
Code:         ✅ 9 commits
Tests:        ✅ 34/34 passing
Lint:         ✅ 0 errors
Documentation: ✅ 8 guides
Credentials:  ⏸️ Awaiting from Codex
Deployment:   ⏸️ Ready after credentials
```

---

## 📚 详细文档

- **完整指南**: `README.md` (部署章节)
- **技术分析**: `docs/reports/2025-11-24-supabase-deployment-cavr.md`
- **详细步骤**: `docs/reports/2025-11-24-deployment-execution-log.md`
- **凭证指南**: `docs/reports/2025-11-24-credential-retrieval-guide.md`
- **就绪总结**: `docs/reports/2025-11-24-deployment-readiness-summary.md`

---

**⏱️ 预计总耗时**: 30-45 分钟（凭证到位后）
