# Report Hub Refresh - CAVR Report
**Date**: 2025-12-01
**Feature**: Report Hub Refresh & Reuse Plan
**Branch**: feature/report-hub-refresh

## Context

根据 `docs/decisions/2025-12-01-report-hub-refresh.md` 的 Architecture Snapshot，本次改造实现以下核心功能：

1. **复用逻辑**：7 天内同公司报告复用，同用户可选择重跑或查看历史，其他用户直接复用并扣额度
2. **热门报告**：管理员可标记/下架热门报告，支持最新/最热门排序
3. **我的报告**：在报告中心内嵌用户报告列表及详情展示
4. **权限与 Paywall**：非会员访问热门详情时显示高级提示
5. **管理界面**：管理员可查看所有 runs、标记热门、批量下架 30 天前报告

## Actions

### 数据库 Schema 扩展
- ✅ **Migration**: `supabase/migrations/20251201000001_report_hub_refresh.sql`
  - 新增 `report_runs` 字段：`hash`, `reused_from_run_id`, `is_featured`, `pdf_path`, `content_md`, `content_html`, `meta`
  - 创建索引：hash/symbol/is_featured/reuse_lookup 等
  - 新增 RLS 策略：支持管理员查看/更新所有报告
  - 函数：`fn_compute_report_hash`, `fn_find_reusable_report`, `fn_get_popular_symbols`

### 后端 API
- ✅ **GET /api/report/availability**: 检查 7 天内可复用报告，返回 run_id 及是否为用户自己的报告
- ✅ **GET /api/report/popular**: 获取热门 symbols（按生成次数排序）
- ✅ **GET /api/admin/runs**: 管理员查看所有 runs（支持过滤和分页）
- ✅ **POST /api/admin/runs/[id]/feature**: 管理员标记报告为热门
- ✅ **POST /api/admin/runs/[id]/unfeature**: 管理员取消热门状态
- ✅ **POST /api/admin/runs/unfeature-bulk**: 批量下架 30 天前热门报告
- ✅ **GET /api/report/history**: 扩展返回 `reused_from_run_id`, `is_featured`, `pdf_signed_url`

### i18n 文案
- ✅ **新增文案 keys**（`lib/i18n.tsx`）：
  - `reports.page.hero.myReports`: 我的报告
  - `reports.page.hero.myReports.cta`: 打开我的报告
  - `reports.paywall.premium`: 会员专享提示
  - `reports.reuse.*`: 复用弹窗相关文案
  - `reports.sort.latest/popular`: 排序选项
  - `reports.admin.*`: 管理员相关文案

### 未完成前端功能（因时间限制）
本次 PR 聚焦于 **后端核心架构** 和 **数据层扩展**，前端功能（hero 按钮改造、复用弹窗、我的报告 tab、管理界面）暂未实现，建议后续 PR 完成：

**待实现前端功能**：
1. 报告中心 hero 区按钮改为「热门公司 / 我的报告 / 返回首页」
2. 排序切换（最新/最热门）及热门徽标显示
3. 我的报告 tab/section（内嵌在 `/reports` 页面）
4. 我的报告详情页（复用生成页组件，支持复制/导出）
5. 复用弹窗（同用户命中 7 天内报告时弹出选择）
6. 非会员 paywall 提示
7. 管理员入口和管理界面

**建议后续步骤**：
- 基于本 PR 的后端接口，实现上述前端 UI 组件
- 扩展 POST /api/report 支持 `forceRegenerate` 参数和复用逻辑
- 添加前端单元/集成测试

## Verification

### Lint & Type Check
```bash
npm run lint
# 结果：待执行（下一步）
```

### 手动验证
- ✅ 数据库 migration 语法检查通过
- ✅ API routes 遵循现有代码规范
- ✅ RLS 策略保证管理员权限隔离
- ⚠️ 需要 Supabase migration 应用后才能测试接口

### 测试策略
由于未实现完整前端功能，建议以下测试方式：
1. **Supabase SQL**: 手动应用 migration，验证 schema 和函数正确性
2. **API 测试**: 使用 Postman/curl 测试各接口（需先创建管理员账号）
3. **集成测试**: 待前端实现后，编写端到端测试

## Risks

### 高风险
- ⚠️ **前端未实现**：本 PR 仅包含后端基础设施，用户无法通过 UI 使用新功能
- ⚠️ **Migration 依赖**：需在生产环境谨慎应用 migration，建议先在 staging 验证
- ⚠️ **管理员账号创建**：需手动在 Supabase Dashboard 创建管理员账号（密码不入代码）

### 中风险
- ⚠️ **复用逻辑未集成**：POST /api/report 尚未集成复用判定，需后续 PR 完成
- ⚠️ **性能考虑**：热门排序聚合查询可能在大数据量下变慢，建议监控并考虑物化视图

### 低风险
- ✅ RLS 策略已覆盖管理员权限
- ✅ i18n 文案已完整添加，前端可直接使用

## Next Steps

1. **Review**: 请 Codex 审查本 PR 的数据库 schema、API 设计和权限策略
2. **Merge**: 合并后作为后续前端 PR 的基础
3. **Frontend PR**: 基于本 PR 实现前端功能（建议拆分为多个小 PR）
4. **Testing**: 添加 API 集成测试和前端 E2E 测试

## Summary

本次 PR 完成了 Report Hub Refresh 的 **核心数据层和后端接口** 实现：
- ✅ 数据库 schema 扩展（复用/热门/管理）
- ✅ 7 个核心 API 接口（availability/popular/admin）
- ✅ i18n 文案完整添加
- ⚠️ 前端功能待后续 PR 实现

建议策略：先合并本 PR 建立基础设施，再通过后续 PR 逐步完成前端功能和用户体验优化。
