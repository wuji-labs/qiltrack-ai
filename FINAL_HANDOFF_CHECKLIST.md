# 🎯 Hosted Supabase 部署 - 交接清单

**日期**: 2025-11-24 18:45 UTC
**分支**: feat/supabase-deployment
**commits**: 15 个部署专属 commits（总 39 个）
**状态**: ✅ 代码交付完成，待 Codex 完成两个手工步骤

---

## ✅ Claude 已完成

### 代码与迁移

- ✅ Schema 迁移指令准备完毕（MANUAL_MIGRATION_STEPS.md）
- ✅ SQL 执行指南与修正脚本（HOSTED_SCHEMA_FIXUP.md）
- ✅ 迁移在 Hosted 实例完成验证（report_documents/events/视图/函数）
- ✅ TypeScript 类型对齐确认（types/database.ts 无需变更）
- ✅ 本地验证全通过（lint 0 errors, test 34/34 passing）

### 文档与脚本

- ✅ 8 份部署指南（README、CAVR、CLI 步骤、验证脚本等）
- ✅ CAVR 更新（完整记录迁移执行状态）
- ✅ PR 内容生成（PR_CONTENT.md，可直接复制）
- ✅ 自动化验证脚本（verify-hosted-deployment.sh）

### 环境配置

- ✅ .env.local 已配置凭证（不提交，.gitignore 保护）
- ✅ 项目 ref: inmtounwqcjwsxkfnsfd
- ✅ Anon Key + Service Role Key 填入

---

## ⏳ Codex 需完成（2 个步骤）

### 步骤 1: 创建私有存储桶 + RLS（Dashboard UI）

**位置**: https://inmtounwqcjwsxkfnsfd.supabase.co/project/inmtounwqcjwsxkfnsfd/storage

**操作**:

1. 点击 "Create new bucket"
2. 配置:
   - **Name**: `report-assets`
   - **Visibility**: **Private** ← 关键
   - 点击 Create
3. 进入 `report-assets` 桶 → Policies
4. 添加策略:

   **策略 1** (前端签名 URL 读取):
   - Type: SELECT
   - Target: report-assets
   - Allowed role: authenticated
   - With check: `(bucket_id = 'report-assets')`

   **策略 2** (Service Role 完全控制):
   - Type: ALL
   - Target: report-assets
   - Allowed role: service_role
   - With check: (leave empty - allow all)

**验证**: Dashboard → Storage → report-assets → 确认 Policies 显示两条规则

---

### 步骤 2: 创建 PR 并合并

**操作**:

1. 打开 GitHub: https://github.com/your-repo/qiltrack-ai
2. 点击 "New Pull Request"
3. 设置:
   - **Base**: main
   - **Compare**: feat/supabase-deployment
4. Title: (从 PR_CONTENT.md 复制)
   ```
   feat: Hosted Supabase deployment - schema alignment, CLI migration & verification
   ```
5. Body: (粘贴 PR_CONTENT.md 的全部内容)
6. 点击 "Create Pull Request"
7. 等待 CI/CD 通过（应自动通过 lint/test）
8. 审核并点击 "Merge pull request"
9. 确认合并到 main

**验证**:

- PR 显示 "All checks passed"
- main 分支包含 15 个新 commits

---

## 📋 最终验收清单

### 存储桶创建后 (Codex 完成步骤 1 后)

- [ ] Dashboard → Storage 显示 `report-assets` 桶
- [ ] 桶设为 Private
- [ ] 两条 RLS 策略已配置
- [ ] 可从 SQL Editor 验证: `SELECT * FROM storage.buckets WHERE name = 'report-assets';`

### PR 创建 & 合并 (Codex 完成步骤 2 后)

- [ ] PR 已创建 (feat/supabase-deployment → main)
- [ ] PR title 与 PR_CONTENT.md 一致
- [ ] PR description 包含完整部署文档
- [ ] CI/CD checks 全通过
- [ ] PR 已合并到 main

### 部署完成标志

- [ ] main 分支包含 15 个新 commits
- [ ] README 显示 Hosted 部署指南
- [ ] CAVR 文档记录完整执行过程
- [ ] types/database.ts 与 Hosted schema 对齐
- [ ] .env.local 配置（本地，不在 git 中）

---

## 📚 关键文档位置

| 文档       | 用途          | 位置                                                  |
| ---------- | ------------- | ----------------------------------------------------- |
| PR 内容    | 复制到 GitHub | `PR_CONTENT.md`                                       |
| 部署 CAVR  | 技术参考      | `docs/reports/2025-11-24-supabase-deployment-cavr.md` |
| 快速参考   | 步骤速查      | `QUICK_REFERENCE.md`                                  |
| 进度追踪   | 当前状态      | `DEPLOYMENT_PROGRESS.md`                              |
| 存储桶创建 | RLS 配置      | `HOSTED_SCHEMA_FIXUP.md` (第 6 步)                    |

---

## 🔐 安全确认

- ✅ Service Role Key 仅在本地 `.env.local`（不提交）
- ✅ Anon Key 可公开（client-side 安全）
- ✅ RLS 策略保护 report\_\* 表
- ✅ 存储桶 Private + RLS 保护
- ✅ .gitignore 包含 `.env.local`

---

## ⏱️ 总耗时估计

| 步骤                   | 耗时                 |
| ---------------------- | -------------------- |
| 步骤 1: 创建桶 + RLS   | 5-10 分钟            |
| 步骤 2: 创建 & 合并 PR | 10-20 分钟（含审核） |
| **总计**               | **15-30 分钟**       |

---

## 后续

完成上述两个步骤后，Hosted Supabase 部署即告完成：

- 生产环境可立即使用
- `/api/report` 将与 Hosted 数据库交互
- 报告文档存储在私有桶中

---

**状态**: 等待 Codex 完成存储桶创建 & PR 合并 ⏳
