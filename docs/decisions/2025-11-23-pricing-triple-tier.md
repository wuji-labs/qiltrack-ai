# Pricing Section – Triple Tier Architecture Snapshot (2025-11-23)

## 背景
- 之前的定价区块只有“免费 vs 专业版”两张卡，无法体现不同付费周期的价值梯度。
- 用户希望一次性提供“免费 / 月付 / 年付”三档计划，利用常见 SaaS 心智（中间卡高亮、年付强调折扣）驱动转化。

## 目标
1. 让首份免费体验继续保留，但把“额度=价值”讲清楚，明确注册前后的预期。
2. 提供月付和年付两个付费档，并通过视觉与文案突出推荐选项，提高付费转化。
3. 保持高端金融审美：深色底、霓虹描边、克制光效，遵循 Tailwind token。

## 策略要点
- **心理定锚**：中间卡（月付）作为默认/最受欢迎选项，右侧年付标记“省 X%”；通过中间高亮+角标强调推荐。
- **权益一致，周期不同**：月付与年付功能相同，区别在于价格与额外福利（如年付送 2 个月 / 优先客服）。
- **CTA 差异**：免费卡 → “领取免费报告”；月付 → “立即订阅 – 月付”；年付 → “以年付省 2 个月”。
- **说明文案**：顶部保持 “注册后首份体验，后续额度即将上线”，右上角保留税费和迁移声明。

## 数据模型建议
```ts
type PricingPlan = {
  tier: "free" | "monthly" | "annual";
  badgeKey: TranslationKey;
  nameKey: TranslationKey;
  priceKey: TranslationKey;
  captionKey: TranslationKey;
  features: TranslationKey[];
  ctaKey: TranslationKey;
  highlight?: boolean;      // 用于最受欢迎卡
  secondary?: boolean;      // 用于暗色或年付卡
};
```

## 文案 / i18n Key
| Key | 中文 | 说明 |
| --- | --- | --- |
| `pricing.plan.monthly.badge` | `最受欢迎` | 月付卡角标 |
| `pricing.plan.monthly.name` | `专业版 · 月付` | |
| `pricing.plan.monthly.price` | `$39 / 席 / 月` | |
| `pricing.plan.monthly.caption` | `不限量报告 + 模板市集` | |
| `pricing.plan.monthly.feature1` | `实时行情、人格/模板切换` | |
| `pricing.plan.monthly.feature2` | `团队工作区与审批` | |
| `pricing.plan.monthly.feature3` | `优先客服 + API 附加包（即将）` | |
| `pricing.plan.monthly.feature4` | `额度与报告留存同步` | |
| `pricing.plan.monthly.cta` | `立即订阅 · 月付` | |
| `pricing.plan.annual.badge` | `年度最省` | |
| `pricing.plan.annual.name` | `专业版 · 年付` | |
| `pricing.plan.annual.price` | `$390 / 席 / 年` | 约等于 2 个月折扣 |
| `pricing.plan.annual.caption` | `折合 $32.5 / 月 · 赠 2 个月` | |
| `pricing.plan.annual.feature1` | `含月付全部功能` | |
| `pricing.plan.annual.feature2` | `优先客服直连 & API 限额提升` | |
| `pricing.plan.annual.feature3` | `账户额度优先刷新、治理控制` | |
| `pricing.plan.annual.feature4` | `季度对账 + 发票服务` | |
| `pricing.plan.annual.cta` | `以年付省 2 个月` | |

（免费卡沿用 `pricing.plan.free.*`，必要时补充 `feature5: 注册即保留额度`。）

## 布局结构
```
<section id="pricing">
  <header>标签 + 说明 + 税费提示</header>
  <div class="grid gap-4 lg:grid-cols-3">
    <article tier="free">...</article>
    <article tier="monthly" class="highlight">...</article>
    <article tier="annual">...</article>
  </div>
</section>
```
- 卡片统一 `rounded-2xl border bg-[var(--bg-layer)]/85 shadow-[...]`。
- 中间卡增加 `scale-[1.02]` + `shadow-[0_24px_60px_rgba(16,185,129,0.35)]`，顶部插入 `span` 显示“最受欢迎”。
- 右侧年付卡在标题右上角加入 `badge` 显示“省 2 个月”。
- CTA 按钮：免费 `btn-gradient`，月付 `btn-gradient w-full py-3 text-base font-semibold`，年付 `btn-outline`（描边 + hover 亮度）或 `btn-ghost` 结合右下角说明。

## 视觉细节
- 价格字体：`text-3xl sm:text-4xl font-bold text-[var(--accent-emerald)]`（月付、高亮）/ `text-[var(--accent-blue)]`（年付）。
- feature list：带 icon（`•` 或 `span` with var accent）。
- 年付卡底部增加提示 `p`：`{t("pricing.plan.annual.note")}` -> “年付用户享额外额度保障及开票支持”。

## 交互
- CTA onClick：
  - 免费卡：沿用 `handlePrimaryCta`.
  - 月付卡：如果已有 checkout 函数，调用 `handleSubscribeMonthly`; 否则暂时 `handlePrimaryCta` 并注明 TODO。
  - 年付卡：同理 `handleSubscribeAnnual`.
- Response: 在移动端 `grid` 变 `space-y-4` 垂直堆叠，中间卡仍放第二位。

## 测试
- Snapshot diff：确认 `app/page.tsx` 中 Pricing section JSX 调整正确，`lib/i18n.tsx` 文案无 JSON 语法错误。
- `npm run lint` / `npm test` 必须通过。
- 手动检查 `#pricing` anchor 是否仍有效。

## 交付要求
- Claude 按此 Snapshot 更新 `app/page.tsx`（布局、class、CTA、ARIA）及 `lib/i18n.tsx`（文案 key）。如需新增 handler，放在 `app/page.tsx` 内部并以 TODO 注记。
- 完成后输出 CAVR 状态+ lint/test 结果。如遇 scope >20% 变更，走 mini review。
