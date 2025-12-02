# Pricing Section Architecture Snapshot (2025-11-23)

## 背景 / 问题

- 现有 `app/page.tsx` 定价区块只是两张对称卡片，缺少消费心理学上的“先试后付+稀缺”叙事，CTA 与权益堆叠也显得廉价。
- 用户在截图中已经提示：免费体验卡与即将推出的专业版需要用信息密度和高端编排建立价差，并提前教育“额度=价值”。

## 目标

1. 传达“首份报告免费，额度续费即将上线”，降低试用门槛同时铺垫未来变现。
2. 清晰对比免费体验 vs 专业版：权益梯度、价格锚点、团队功能，突出升级动机。
3. 维持 Apple × Bloomberg 的审美：极简排版、克制渐变、配合全局 token（`--bg-layer`, `--stroke-soft`, `--accent-emerald`）。

## 心理策略 & 设计要点

- **先验价值**：标题用“注册后首份体验，后续额度即将上线”呼应策略文案；副文案强调“先验证 Investor AI，再逐步放订阅/团队方案”。
- **价差锚定**：免费卡突出 `$0` 与“1 份 AI 报告 + DOCX”，专业卡突出 `$39 / 每席` + 不限量/模板集/团队审批。
- **稀缺性**：专业版 CTA 用“加入候补名单”，同时加上“更多额度、模板与治理控制”提示。
- **社交证明**：在卡片上方添加一句“所有价格均含增值税·正式发布前可免费迁移到新方案”，对应截图右上角说明。

## 版式结构

```
<section id="pricing">
  <header>标签 + 标题 + 副文案 + 税费提示</header>
  <div class="grid md:grid-cols-[1fr_0.95fr] gap-5">
    <article class="free-plan-card">左列，浅绿色描边 + 亮 CTA</article>
    <article class="pro-plan-card">右列，深色描边 + 暗 CTA</article>
  </div>
</section>
```

- 左卡（免费）使用内发光 + 1px 霓虹描边（`border-[var(--accent-emerald)]/60`），强调“立即拥有”。
- 右卡（专业）用更沉稳的描边 + 暗背景 + 角标（“团队方案”），并在卡顶右上角写“更多额度、模板与治理控制”。
- CTA 样式差异：免费卡按钮 `btn-gradient` + “领取免费报告”，专业卡 `btn-ghost` + “加入候补名单”。

## 文案规范（多语言 key）

| Key                          | 中文                                                | 英文（可临时同中文） | 说明                   |
| ---------------------------- | --------------------------------------------------- | -------------------- | ---------------------- |
| `pricing.tag`                | `PRICING`                                           |                      | 顶部 Tag               |
| `pricing.title`              | `注册后首份体验，后续额度即将上线`                  |                      | 主标题（已有，可保持） |
| `pricing.caption`            | `先让用户验证生成质量，再逐步开放订阅 / 团队方案。` |                      | 副标题（已有，可沿用） |
| `pricing.note1`              | `所有价格均含增值税`                                |                      | 右上说明               |
| `pricing.note2`              | `正式发布前可免费迁移到新方案`                      |                      | 右上说明               |
| `pricing.plan.free.badge`    | `注册即用`                                          |                      | 卡角标                 |
| `pricing.plan.free.name`     | `免费体验`                                          |                      | 卡标题                 |
| `pricing.plan.free.price`    | `$0`                                                |                      | 价格                   |
| `pricing.plan.free.tagline`  | `用一份报告验证 Investor AI`                        |                      | 描述                   |
| `pricing.plan.free.feature1` | `1 份 AI 报告 + DOCX 导出`                          |                      | 功能列表               |
| `pricing.plan.free.feature2` | `富文本复制与人格切换`                              |                      |                        |
| `pricing.plan.free.feature3` | `Finnhub 即时行情与基本面`                          |                      |                        |
| `pricing.plan.free.feature4` | `Email 投递与额度同步`                              |                      |                        |
| `pricing.plan.free.cta`      | `领取免费报告`                                      |                      | CTA                    |
| `pricing.plan.pro.badge`     | `团队方案`                                          |                      |                        |
| `pricing.plan.pro.name`      | `专业版（即将推出）`                                |                      |                        |
| `pricing.plan.pro.price`     | `$39 / 每席`                                        |                      |                        |
| `pricing.plan.pro.tagline`   | `更多额度、模板与治理控制`                          |                      |                        |
| `pricing.plan.pro.feature1`  | `不限量 AI 报告`                                    |                      |                        |
| `pricing.plan.pro.feature2`  | `人格与模板市集`                                    |                      |                        |
| `pricing.plan.pro.feature3`  | `团队工作区与审批`                                  |                      |                        |
| `pricing.plan.pro.feature4`  | `优先客服 + API`                                    |                      |                        |
| `pricing.plan.pro.cta`       | `加入候补名单`                                      |                      | CTA                    |

（现有 `lib/i18n.tsx` 中大部分 key 已存在，如有缺失按表补齐。英文、其他语言可暂与中文保持一致。）

## 交互与状态

- 卡片 hover：免费卡轻微 `shadow-[0_12px_32px_rgba(16,185,129,0.35)]`，专业卡 `shadow-[0_12px_32px_rgba(95,143,255,0.2)]`。
- CTA：免费卡点击沿用 `handlePrimaryCta`，专业卡 CTA 暂时 `onClick={handleJoinWaitlist}`（若无函数，可复用 `handlePrimaryCta` + TODO 注释）。
- 响应式：在 `<768px` 时两张卡垂直堆叠，CTA 保持满宽；在桌面端维持 5rem 间距。

## 技术实现建议（供 Claude）

1. **数据结构**：沿用 `pricingPlans` 数组，新增 `accent`（控制描边/背景 class）和 `ctaStyle`（`primary`/`secondary`）可读性更强。若暂不引入新字段，直接在 JSX 中用 `plan.highlight` 决定 class，但要更新 class 字符串以满足新设计。
2. **样式**：避免裸写颜色，统一使用 token 或 `var(--accent-emerald)` 等变量；CTA 复用既有 `btn-gradient` / `btn-ghost` 类。
3. **可访问性**：确保标题层级 `<h3>` 之后的 price `<p>` 有 `aria-label` 或 `sr-only` 说明，例如 `aria-label={t("pricing.plan.pro.priceLabel", { price: "$39" })}`。
4. **语义**：外层 `<section id="pricing">` 保留；两张卡用 `<article>` 包裹，方便屏幕阅读器识别。

## 测试 / 验证

- 手动截图对比：桌面（≥1280px）与移动（375px），确保卡片阴影、描边、CTA 间距符合稿件。
- `npm run lint` & `npm test` 必须通过，重点关注 `lib/i18n.tsx` JSON 格式。
- 若新增 `handleJoinWaitlist`，在 `README` 或 `PLAN` 备注当前为静态按钮。

## 后续扩展

- Stripe 接入后，可在专业卡 CTA 上切换为真实 Checkout；当前布局已预留价格说明和小字提示。
- 同一文案模块可在登录页 / 额度提醒卡中复用，建议将 plan 数据抽出到 `app/constants/pricing.ts`（后续任务）。

> Claude：请按照本 Snapshot 更新 `app/page.tsx` 中的 Pricing 区块与 `lib/i18n.tsx` 文案，同时保留现有逻辑（`handlePrimaryCta` 等）。完成后贴出 CAVR（Context / Actions / Verification / Risks），并附上 lint/test 结果。
