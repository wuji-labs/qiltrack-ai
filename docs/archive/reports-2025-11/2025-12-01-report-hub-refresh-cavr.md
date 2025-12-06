# Report Hub Refresh - CAVR Report

**Date**: 2025-12-01  
**Feature**: Report Hub Refresh & Reuse Plan  
**Branch**: feature/report-hub-refresh

## Context

- 按 Snapshot 实现后端基础设施：复用可用性查询、热门排序、管理员 runs 管理、featured 标记/批量下架、历史返回新字段。
- 复用规则：同 symbol/lang/mode 且 7 天内可复用；跨 mode 禁止复用；仍记录历史并保留扣额逻辑（由前端控制）。
- 管理员权限：profiles.plan='admin' 或 @investor.ai 邮箱可查看/更新全部 runs，其余用户仅能访问自己的历史。
- 数据：report_runs 新增 hash、reused_from_run_id、is_featured、lang、mode、pdf_path、content_md/html、meta；默认 mode=production。

## Actions

- 数据库：supabase/migrations/20251201000001_report_hub_refresh.sql（含 backfill mode=production + audit_logs 记录）。
- API：
  - GET /api/report/availability（7 天可复用检测，按 mode 过滤，返回 is_own_report）
  - GET /api/report/popular（30 天热门 symbol 聚合）
  - GET /api/report/history（返回 pdf_signed_url/is_featured/reused_from_run_id/lang/mode）
  - admin：GET /api/admin/runs，POST /api/admin/runs/[id]/feature，.../unfeature，.../unfeature-bulk
- i18n：新增 myReports / paywall / reuse / sort / admin 相关文案 key。
- 文档：Snapshot 与本 CAVR。

## Verification

### Migration 执行

**日期**: 2025-12-01
**方法**: Supabase Dashboard SQL Editor
**结果**: ✅ 成功执行，无错误

验证：

- fn_get_popular_symbols 函数已创建并可调用
- report_runs 表新增字段已添加（hash, mode, lang, is_featured 等）
- RLS 策略已更新（admin 可查看/更新所有 runs）
- mode 字段已回填为 'production'

### 测试数据

使用 `scripts/setup-test-data.js` 创建测试场景：

- User A (tester+pdf@investor.ai): e056e1fe-64ec-4655-8652-e9450393bf3d
- User B (xiuluart@foxmail.com): e609c987-988c-47f4-a828-8096ef610f6a

测试 runs：

- AAPL production (3天前, User A & B) - 测试同/跨用户复用
- AAPL test (3天前, User A) - 测试跨 mode 隔离
- TSLA production (10天前, User A) - 测试 7 天窗口
- GOOGL production (3天前, User A) - 额外复用场景

### 手动验证结果（执行日期：2025-12-01）

#### 🔴 复用逻辑 (HIGH PRIORITY)

测试工具：`scripts/verify-cavr-scenarios.js` + 直接调用 fn_find_reusable_report

| 场景                                  | 预期                             | 实际结果                                                    | 状态 |
| ------------------------------------- | -------------------------------- | ----------------------------------------------------------- | ---- |
| 同用户、同 mode、7 天内               | 返回 reusable_run_id             | ✅ 返回 01f232b2-c926-4cb0-84a4-5a5040dff7e5                | PASS |
| 不同用户、同 mode、7 天内             | 返回 reusable_run_id（用户无关） | ✅ 返回 run_id（fn_find_reusable_report 不含 user_id 过滤） | PASS |
| 同 symbol 不同 mode (AAPL test)       | test mode 独立查询返回 test run  | ✅ 返回 test run c7e9aa8b-4a97-4661-a7b5-a76fc15f4327       | PASS |
| 同 symbol 不同 mode (AAPL production) | production 查询仅返回 production | ✅ 仅返回 production run，无跨 mode 混淆                    | PASS |
| 超过 7 天 (TSLA)                      | 不可复用，返回空                 | ✅ 返回空数组，正确拒绝 10 天前 run                         | PASS |

**阻断条件检查**：

- ✅ 无跨 mode 误复用
- ✅ 7 天外正确拒绝
- ⚠️ is_own_report 区分需在 API 层实现（fn_find_reusable_report 函数本身无 user_id 参数，API 需对比 auth.uid() 与 run.user_id）

#### 🟡 管理员权限 / RLS (MEDIUM PRIORITY)

测试方法：未认证请求 `/api/admin/runs`

| 端点                         | 预期    | 实际结果            | 状态 |
| ---------------------------- | ------- | ------------------- | ---- |
| GET /api/admin/runs (未认证) | 401/403 | ✅ 401 Unauthorized | PASS |

**限制**：

- 未测试管理员账号实际访问（需创建 plan='admin' 或 @investor.ai 邮箱用户并认证）
- RLS 策略已部署（migration 中已创建），但需真实管理员/非管理员会话测试
- history/availability 的 RLS 测试需前端认证流程

**阻断条件检查**：

- ✅ 非管理员被正确拒绝
- ⚠️ 管理员可访问全量 & 普通用户仅见自己数据需上线后或补充 E2E 测试验证

#### 🟢 其他 API (LOW PRIORITY)

| 端点                    | 预期                                 | 实际结果                                                           | 状态 |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------ | ---- |
| GET /api/report/popular | 返回 symbols 数组含 generation_count | ✅ 返回 `{"symbols":[{"symbol":"AAPL","generation_count":3,...}]}` | PASS |
| GET /api/report/history | 返回新字段                           | ⚠️ 未测试（需认证）                                                | SKIP |

### 阻断条件汇总 - 最终评估

| 条件                        | 状态            | 备注                                       |
| --------------------------- | --------------- | ------------------------------------------ |
| migration/backfill 成功     | ✅ PASS         | SQL 执行成功，mode 已回填                  |
| 权限/RLS (管理员可查看全量) | ⚠️ PARTIAL      | 策略已部署，需真实管理员测试               |
| 权限/RLS (非管理员仅见自己) | ⚠️ PARTIAL      | 需认证会话测试                             |
| 复用逻辑 (跨 mode 隔离)     | ✅ PASS         | 无跨 mode 误复用                           |
| 复用逻辑 (7 天窗口)         | ✅ PASS         | 正确拒绝 10 天前 run                       |
| 复用逻辑 (ownership 区分)   | ⚠️ API 层待实现 | fn 函数用户无关，需 API 添加 is_own_report |

**结论**：✅ 核心阻断条件已通过，⚠️ RLS 与 ownership 标记需前端集成后或补充测试完整验证。

## Risks

- 前端未实现：当前仅后端/数据层，无 UI 变更，需后续前端 PR。
- API 无自动化测试：需补 API/集成测试或上线前按上表手动验收。
- 管理员判定依赖 profiles.plan 或邮箱后缀，仍需运营侧创建管理员账号。

## Next Steps

1. 执行 lint；按清单完成手动验证并记录结果。
2. 合并 PR 74 作为前端改版基础。
3. 后续前端 PR：按钮/排序/我的报告内嵌/复用弹窗/付费拦截/管理员下架。
4. 补充 API 测试或 E2E 覆盖复用与权限路径。

## Summary

- ✅ Migration 20251201000001 已成功应用到托管 Supabase（2025-12-01）
- ✅ 核心复用逻辑验证通过：跨 mode 隔离、7 天窗口、同/跨用户复用均符合预期
- ✅ 热门聚合（popular）与管理员端点（admin/runs）正常响应
- ⚠️ RLS 与 is_own_report 需前端认证集成后完整验证，或补充 E2E 测试
- 📋 测试脚本已提交：scripts/setup-test-data.js, scripts/verify-cavr-scenarios.js
- 🎯 后端基础设施已就绪，可作为前端 PR 基础；复用/权限完整验证建议在前端集成或上线前补充
