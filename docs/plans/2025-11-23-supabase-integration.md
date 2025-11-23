# Supabase 完整集成（2025-11-23）

## Goal
- 建立全栈 Supabase 后端，支持 Auth、Database、Storage 和 RPC
- 替换现有的身份验证和数据存储层，确保所有 API 端点使用 Supabase
- 保证 CI/CD 通过（lint、test、build）

## Scope
- ✅ Supabase CLI 安装与本地 stack 初始化
- ✅ Schema 设计、migration 和 TypeScript 类型生成
- ✅ Auth 流（用户注册/登录/会话管理）替换
- ✅ Report 生成 API（RPC + Storage 集成）
- ✅ 内容模块数据查询（Publications、Research）
- ✅ Stripe 和审计日志集成
- ❌ 前端 UI 重构（使用现有组件）
- ❌ 性能优化和缓存策略（第二轮）

## Steps（依阶段推进）
- [ ] **Schema 基座**：Supabase CLI 安装、版本记录、`supabase init`、schema/migration/sql、`supabase gen types` 输出 `types/database.ts`
- [ ] **Auth 替换**：`hooks/useAuth`、登录/Account 页面与 `createServerClient` 对接，移除 NextAuth 残留
- [ ] **Report & RPC**：`/api/report`、历史查询与 `fn_consume_report_credit` / `fn_record_report_run`、Storage 写入
- [ ] **内容模块**：`report_templates`、FAQ / Pricing / Hero copy 改为 Supabase 读数，并更新 UI 数据访问
- [ ] **支付 & 审计**：Stripe webhook、`report_credit_events`、`billing_subscriptions`、审计视图/脚本
- [ ] **验证与交付**：每阶段完成后跑 `npm run lint && npm test` 并记录 Supabase CLI 版本 + CAVR，小结合入 PR

## CAVR Checkpoints
- **Schema 阶段**：记录 Supabase CLI 版本、`supabase db push` / types 生成日志，附 lint/test 结果
- **Auth 阶段**：描述会话流更新、登录截图、lint/test
- **Report 阶段**：RPC 调用截图、Storage 上传验证、lint/test
- **内容阶段**：展示从 Supabase 读取的页面/数据截图、lint/test
- **支付/审计阶段**：Stripe webhook/事件示例、视图查询截图、lint/test
- **收尾**：整合 CAVR、Supabase CLI 版本、`npm run lint` / `npm test` 通过记录

## Ideas Parking Lot
- Real-time subscription 支持（后续）
- 多租户支持（评估中）
- Supabase 权限行级别安全（RLS）政策优化

## Links / Snapshot
- 当前分支：`feat/supabase-integration`
- Supabase 官网：https://supabase.com
- Supabase 文档：https://supabase.com/docs

## Notes
- 本地 Supabase stack 需要 Docker 运行
- 所有敏感信息存储在 `.env.local`（不提交 git）
- 保证向后兼容现有测试
