# Stripe Phase 5 Snapshot (2025-12-02)

## 背景 / 问题
- Phase 5 需要落地订阅付费闭环：后端创建 Stripe Checkout Session、Webhook 同步 Supabase 会员状态；前端提供 Pricing UI 调起。
- 现有配置校验仅将 Stripe 视为可选，Webhook 端尚无服务端凭证写入逻辑；缺少成功/失败跳转与 plan 映射约束。

## 设计目标
1. 提供 Basic/Pro 两档订阅 checkout，成功跳转账户页，取消跳回定价页。
2. Webhook 可靠更新 Supabase `profiles.plan/stripe_customer_id`，避免 RLS 阻塞。
3. 环境变量、价格 ID 可配置且可被 lint/校验捕捉；错误时返回明确 4xx/5xx。

## 技术约束
- Next.js App Router API Route；Webhook 需原始 body `req.text()` + `stripe-signature` 校验。
- Supabase Webhook 写入必须使用 service role client（无用户会话）。
- Stripe 版本锁定 `apiVersion: "2024-11-20.acacia"`；计划 ID 通过 env 注入（`STRIPE_PRICE_BASIC/PRO`）。
- 跳转 URL 依赖 `NEXTAUTH_URL`；保持 `dynamic = "force-dynamic"` 避免缓存。

## 文案 / 常量
- Plan key：`basic` / `pro`
- 环境变量：
  - `STRIPE_SECRET_KEY`（必填）
  - `STRIPE_WEBHOOK_SECRET`（必填）
  - `STRIPE_PRICE_BASIC` / `STRIPE_PRICE_PRO`（必填）
  - `NEXTAUTH_URL` 用作 success/cancel 基础 URL

## 测试要求
- 单测/集成：暂无；保留 `npm run lint`、`npm test` 覆盖回归。
- 手测：Webhook 使用 Stripe CLI 触发 `checkout.session.completed`，确认 Supabase `profiles` 对应 email 更新 `plan=pro` 且 `stripe_customer_id` 写入。
- 配置：`npm run env:check` 应报错缺失 Stripe 相关 env（若未设置）；`.env.local.example` 同步新增变量。
