# WT1 报告：Stage 2 Supabase 上线计划评估
**日期**：2025-11-26 | **评估人**：Claude | **来源**：`docs/decisions/2025-11-26-launch-plan.md`

---

## 现状快照

### 已完成
- ✅ Stage 2 Supabase 报告链路完成，测试/文档齐备
- ✅ Hosted 部署分支 `feat/supabase-deployment` 代码就绪
- ✅ UI 框架完整（Hero/生成器/定价/FAQ）
- ✅ NextAuth + 配额校验已接入 Supabase
- ✅ RLS 与存储桶安全策略已配置

### 缺口
- ✅ `report-assets` 私有存储桶已创建 + RLS 校验完成
- ⏳ `feat/supabase-deployment` 待合并至 main（`feat/t0-storage` 完成后推进）
- ❌ Stripe 订阅逻辑为占位状态
- ❌ 额度真实读取与 UI 提示未接入（前端硬编码 quota=1）
- ❌ 未登录/额度不足的 UX fallback 缺失

---

## 设计约束与目标

| 维度 | 约束/目标 |
|------|---------|
| **框架** | Next.js App Router + TypeScript + React 19 + Tailwind v4 `@theme inline` |
| **数据源** | Finnhub 行情 + OpenRouter/Helicone LLM + Supabase Hosted (`inmtounwqcjwsxkfnsfd`) |
| **鉴权** | NextAuth（Email/SSO）；`/api/report` 依赖 session |
| **存储** | 私有桶 `report-assets` + RLS（Service Role 上传，客户端签名 URL 读取） |
| **代码质量** | ESLint 9 + Vitest；`npm run lint && npm test` 必须通过 |
| **支付** | Stripe 未接通；`handleSubscribe*` 需安全 fallback |
| **核心文案** | `3 分钟获得机构级美股报告，首份免费` |

---

## T+1 推进要点（当前优先）

### 1. PR 合并与环境配置（**T0 - 完成中**）
```
状态：report-assets 私有桶已创建 + RLS 校验完成
任务：feat/t0-storage 分支完成后，合并 feat/supabase-deployment → main
验证：git status 干净，.env.local 凭证已更新
```

### 2. 额度真实读取与 UI 集成（**T+1 - Claude 主责**）
- **后端**：`/api/report/credits` 接口返回登录用户实际配额
- **前端**：
  - 移除硬编码 `quota=1`
  - 成功生成后强制刷新 session（同步配额扣减）
  - 显示剩余额度（e.g., `已用 1/1`）
- **UX fallback**：
  - 未登录 → 提示 `注册后领取首份免费额度`
  - 额度耗尽 → 显示 `额度已用尽，升级解锁`（链接至定价页或登录窗）

### 3. 支付 CTA 安全化（**T+1**）
- **Stripe 未接通时**：
  - 定价页按钮改为 `联系开通` 或弹出登录窗
  - `handleSubscribe*` 添加 fallback（避免空点击或 404）
- **预留接口**：保留 Stripe Checkout 占位，便于后续接通

---

## T+2 可选项（若时间允许）

| 任务 | 优先级 | 说明 |
|------|--------|------|
| Stripe Checkout 接通 | Medium | 仅月/年套餐，计入 `plan/quota` |
| 预约开通表单 | Medium | 支付未就绪时的数据收集 |
| 手动验收报告 | High | 录入 `docs/reports/<date>-launch-verification.md` |

---

## 发布检查清单

- [ ] `npm run lint` 通过（ESLint 9）
- [ ] `npm test` 通过（Vitest）
- [ ] `bash scripts/verify-hosted-deployment.sh` 通过（若存在）
- [ ] 手动流程验证通过：
  - [ ] 登录/注册 → 生成首份报告 → 配额扣减 → 刷新保留剩余
  - [ ] 未登录直接生成 → 登录提示正确
  - [ ] 额度耗尽 → 429 提示文案正确
  - [ ] `/api/report/history` 与 `/api/report/credits` 响应符合契约
  - [ ] DOCX 导出 & 复制报告正常，Storage 上传至私有桶
  - [ ] 多语言切换后 CTA/提示无缺失
- [ ] 安全验证：Storage 桶为 Private，RLS 策略存在
- [ ] `.env.local` 未入库，git status 干净

---

## 风险与缓解

| 风险 | 缓解方案 |
|------|---------|
| 支付 CTA 误导 | 接通前使用登录/联系表单 fallback，避免空点击 |
| LLM 成本与速率 | 默认走 Helicone/OpenRouter；可配 `OPENROUTER_MODEL`/`HELICONE_MODEL` |
| 配额同步延迟 | 成功生成后强制刷新 session；后端以事务扣减 |
| 多语言漏文案 | 统一检查 `lib/i18n` 字典；新增 key 需双语同步 |

---

## 下一步行动

1. **T0（进行中）**：等待 `feat/t0-storage` 完成后，合并 `feat/supabase-deployment` → main
2. **T+1（后续）**：
   - Claude 接入额度真实读取与 UI 提示
   - 补全 UX fallback（未登录/额度不足）
   - 为 `handleSubscribe*` 添加安全 fallback
3. **T+2**：手动验收 + 文档输出 + PR 评审
4. **发布**：合并 main + tag `v0.1.0-launch`

---

**评估结论**：存储桶已就绪，主要阻塞已排除。后续按 T+1 计划推进额度逻辑与 UX，预期 48h 内完成可演示的闭环体验。
