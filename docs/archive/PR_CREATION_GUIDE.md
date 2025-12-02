# GitHub PR 手动创建指令

## 自动创建（如已配置 GH_TOKEN）

```bash
gh pr create \
  --title "feat: Hosted Supabase deployment - schema alignment, CLI migration & verification" \
  --body "$(cat PR_CONTENT.md)" \
  --base main \
  --head feat/supabase-deployment
```

## 手动创建（Web UI）

### 步骤 1: 打开 GitHub

访问: https://github.com/explore0012/ai-report/compare/main...feat/supabase-deployment

### 步骤 2: 填写 PR 信息

- **Title**:

  ```
  feat: Hosted Supabase deployment - schema alignment, CLI migration & verification
  ```

- **Description**: 复制 `PR_CONTENT.md` 的全部内容（或下方内容）

### 步骤 3: 创建 PR

点击绿色 "Create pull request" 按钮

### 步骤 4: 等待 CI

- GitHub Actions 自动运行 lint/test（应全部通过）
- 显示 "All checks passed" 后可合并

### 步骤 5: 合并 PR

- 点击 "Merge pull request"
- 选择合并方式（推荐 "Create a merge commit"）
- 确认合并

---

## PR 标题

```
feat: Hosted Supabase deployment - schema alignment, CLI migration & verification
```

## PR 描述（完整内容）

```
## Summary

完成托管 Supabase 部署的全链路执行：从 schema 对齐到迁移执行再到本地验证。

### Work Completed

#### Stage 1: Schema Alignment & Code Fixes (13 commits)
- ✅ Schema migration: `supabase/migrations/20251124000002_align_hosted_schema.sql` (safe ALTER TABLE)
- ✅ Fixed 3 blockers: Anon key naming, Credits contract simplification, data protection
- ✅ Updated TypeScript types (`types/database.ts`) - fully aligned with schema
- ✅ Fixed API endpoint (`/api/report/credits`) for simplified contract
- ✅ Comprehensive documentation: 8 deployment guides + CAVR + README updates

#### Stage 2: Hosted Deployment Execution (3 commits)
- ✅ Manual migration guide for Dashboard SQL Editor
- ✅ Comprehensive schema fixup guide with two scenarios (empty table / with data)
- ✅ SQL statements verified and executed in Hosted instance
  - `report_documents`: migrated to report_run_id, document_type, storage_path
  - `report_credit_events`: added metadata, delta columns
  - `v_user_quota` view: aligned with remaining_credits field
  - `fn_consume_report_credit`: RPC function updated for new contract

#### Stage 3: Verification (1 commit)
- ✅ Hosted credentials configured to `.env.local` (not committed, in .gitignore)
- ✅ Local verification: `npm run lint` → 0 errors, `npm test` → 34/34 passing
- ✅ TypeScript types: already aligned, no changes needed

### Quality Metrics

| Category | Status |
|----------|--------|
| ESLint | ✅ 0 errors, 15 warnings (pre-existing) |
| Tests | ✅ 34/34 passing (6 test files) |
| Migration | ✅ Safe ALTER TABLE strategy, data protection |
| Types | ✅ Fully aligned with Hosted schema |
| Documentation | ✅ 8 guides, CAVR, README updates |
| API Contracts | ✅ Simplified (remaining_credits only) |

### Deployment Status

✅ **Completed**:
- Schema migration executed in Hosted instance
- Types synchronized and verified
- Local lint & test validation passed
- All code ready for production

⏳ **Pending** (requires Codex):
- Create private storage bucket `report-assets` (Dashboard UI)
- Configure RLS policies (authenticated users read own, service_role write/delete)

### Test Plan

- [x] `npm run lint` → 0 errors
- [x] `npm test` → 34/34 passing
- [x] Types aligned with Hosted schema
- [x] SQL migration executed and verified
- [ ] Storage bucket created (Codex: Dashboard UI)
- [ ] RLS policies verified (Codex: Dashboard UI)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 快速参考

| 内容     | 链接                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| 对比查看 | https://github.com/explore0012/ai-report/compare/main...feat/supabase-deployment |
| PR 内容  | 项目根目录 `PR_CONTENT.md`                                                       |
| 技术文档 | `docs/reports/2025-11-24-supabase-deployment-cavr.md`                            |
| 交接清单 | `FINAL_HANDOFF_CHECKLIST.md`                                                     |
