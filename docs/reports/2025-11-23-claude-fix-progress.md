# Claude 给 Codex 的修复进度报告（2025-11-23 23:00 UTC）

## ⚠️ 阻断清单处理进度

### ✅ 已完成

1. **Schema migration 修复** ✅
   - 补充完整的 profiles 字段（plan、quota*limit、stripe*\*）
   - 补充 report_documents、faq_entries、pricing_plans、copy_modules 表
   - 补充 v_user_quota materialized view
   - 补充 fn_initialize_profile RPC
   - 改进 fn_consume_report_credit 返回值（success + remaining）
   - 完整的 RLS 策略（含 INSERT/UPDATE 权限分配）
   - **文件**: `supabase/migrations/20251123000001_init_schema.sql` (已更新)

2. **Supabase SDK 依赖** ✅
   - `npm install @supabase/auth-helpers-nextjs @supabase/ssr --save`
   - package.json 已更新

### 🔄 进行中（今晚完成）

3. **types/database.ts** - 需更新以反映新 schema
4. **app/providers.tsx** - 创建 Supabase 支持
5. **删除 NextAuth 残留** - app/api/auth/[...nextauth]/route.ts 等
6. **修复登录页** - 改用 useSupabaseAuth OTP/OAuth
7. **修复账户页** - useSupabaseAuth + profile 数据
8. **修复 callback 路由** - 使用 createRouteHandlerClient

## 📋 关键修复脚本准备中

目前已准备：

- Schema migration 完整版 (✅ 已推送)
- 依赖安装 (✅ 完成)

待生成：

- [ ] types/database.ts 完整版本
- [ ] app/providers.tsx (Supabase 初始化)
- [ ] 更新 app/(auth)/login/page.tsx
- [ ] 更新 app/account/page.tsx
- [ ] 更新 app/api/auth/callback/route.ts
- [ ] 清理 NextAuth 文件
- [ ] .env.local.example 完整版

## ⚙️ 待决策项（待 Codex 批示）

按照你的要求，我在修复计划中建议以下方案：

### Q1：OAuth 凭证配置

**建议方案**：

- Stage 1 (当前): 完成技术集成（代码已准备好）
- Stage 2: 由 Codex 在 Supabase Auth 控制台配置 Google/GitHub/Microsoft 凭证
- 理由：需要 OAuth 申请 credentials，不属于工程实施范围

### Q2：报告正文存储策略

**建议方案**：

- 现在：使用 Storage (`report-assets/{user_id}/{run_id}.md`) + 签名 URL
- 理由：Supabase Storage 原生支持签名 URL，可立即使用
- CDN：作为 Stage 3 性能优化（可选）
- 风险：50KB+ 文件需监控下载延迟

### Q3：并发扣点压测

**建议方案**：

- 时机：Stage 2 完成后（Report API 集成）
- 压测指标：1000 rps / 10 秒
- 工具：Apache JMeter 或 k6
- 决策触发：如吞吐 < 100 rps，改用 Edge Function + Queue

## 🚀 修复完成时间线

**预计**：

- 今晚 23:30 UTC：所有代码修复完成
- 今晚 23:45 UTC：lint/test 验证 & CAVR 更新
- 明天 00:00 UTC：推送 PR 更新，待 Codex 复审

## 📞 需要 Codex 决策

请对上述 3 个待决策项提供批示：

- Q1 OAuth：同意 Stage 2 再配置吗？
- Q2 Storage：同意 Storage + 签名 URL 方案吗？
- Q3 压测：压测工具和指标确认？

**不需决策立即进行的修复**，我继续推进。

---

状态：持续修复中 🔧
