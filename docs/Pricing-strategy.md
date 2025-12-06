# Qiltrack AI 定价策略 v4.0

> 最后更新: 2025-12-06
> 状态: 待实施

---

## 1. 执行摘要

本文档定义 Qiltrack AI 的完整定价策略，包括套餐结构、积分经济、功能分层、成本核算和实施规范。

### 核心原则

1. **价值清晰** - 用户一眼看懂每档套餐能做什么
2. **升级动机** - 每一档都有明确的升级理由
3. **成本可控** - 确保健康毛利率 (>55%)
4. **简单易懂** - 避免复杂的条件和限制

---

## 2. 套餐架构

### 2.1 三档套餐定义

| 维度 | FREE | PRO | ULTRA |
|------|------|-----|-------|
| **定位** | 体验用户 | 个人投资者 | 专业/高频用户 |
| **月价格** | $0 | $14.99 | $44.99 |
| **年价格** | - | $119.88 ($9.99/mo) | $359.88 ($29.99/mo) |
| **年付折扣** | - | 33% | 33% |
| **主色调** | Gray | Emerald | Purple |

### 2.2 定价心理学

```
FREE       PRO        ULTRA
$0    →   $14.99  →  $44.99
          │           │
          │   3x价格  │
          │   5x价值  │
          └───────────┘
```

- **锚定效应**: PRO 作为"最受欢迎"的视觉锚点
- **价值阶梯**: ULTRA 付 3x 价格，得 5x 积分 + 更低单价
- **年付默认**: 切换器默认选中 Yearly，配合 "33% OFF" 标签

---

## 3. 积分经济系统

### 3.1 积分配额

| 项目 | FREE | PRO | ULTRA |
|------|------|-----|-------|
| **初始积分** | 30 | 30 | 30 |
| **月度配额** | 0 | 300 | 1,500 |
| **每日签到** | 5 | 15 | 30 |
| **签到月上限** | 150 | 450 | 900 |
| **报告成本** | 30 积分 | 30 积分 | 25 积分 ⬇️ |

### 3.2 月度可用积分计算

```
FREE:  0 + 150(签到) = 150 积分/月 → ~5 份报告
PRO:   300 + 450(签到) = 750 积分/月 → ~25 份报告
ULTRA: 1,500 + 900(签到) = 2,400 积分/月 → ~96 份报告
```

### 3.3 单份成本对比 (核心卖点)

| 套餐 | 月费 | 月度积分 | 报告成本 | 可生成 | 单份成本 |
|------|------|---------|---------|--------|---------|
| PRO | $14.99 | 300 | 30 | 10份 | **$1.50** |
| PRO (含签到) | $14.99 | 750 | 30 | 25份 | **$0.60** |
| ULTRA | $44.99 | 1,500 | 25 | 60份 | **$0.75** |
| ULTRA (含签到) | $44.99 | 2,400 | 25 | 96份 | **$0.47** |

**关键卖点**: ULTRA 单份成本比 PRO 低 22% ($0.47 vs $0.60)

### 3.4 积分滚存规则

| 套餐 | 滚存期限 | 说明 |
|------|---------|------|
| FREE | 永不过期 | 初始 30 积分永久有效 |
| PRO | 1 个月 | 当月未用积分下月清零 |
| ULTRA | 3 个月 | 积分可累积 3 个月 |

---

## 4. 生成速度分层

### 4.1 队列优先级

| 套餐 | 队列等级 | 优先级 | 预期耗时 |
|------|---------|--------|---------|
| FREE | Standard | 1x | ~60s |
| PRO | Priority | 2x | ~30s |
| ULTRA | Express | 4x | ~15s |

### 4.2 实现机制

```typescript
// lib/constants/credits.ts
export const SPEED_TIERS = {
  free: { queue: 'standard', priority: 1, label: 'Standard' },
  pro: { queue: 'priority', priority: 2, label: 'Priority 2x' },
  ultra: { queue: 'express', priority: 4, label: 'Express 4x' },
} as const;
```

---

## 5. 功能分层矩阵

### 5.1 完整功能对比

| 功能 | FREE | PRO | ULTRA |
|------|:----:|:---:|:-----:|
| **生成能力** ||||
| AI 报告生成 | ✓ | ✓ | ✓ |
| 生成速度 | Standard | Priority 2x | Express 4x |
| 报告成本 | 30 积分 | 30 积分 | 25 积分 |
| **配额** ||||
| 初始积分 | 30 | 30 | 30 |
| 月度积分 | 0 | 300 | 1,500 |
| 每日签到 | 5 | 15 | 30 |
| 积分滚存 | - | 1 个月 | 3 个月 |
| **导出** ||||
| 在线查看 | ✓ | ✓ | ✓ |
| PDF 导出 | ✗ | ✓ | ✓ |
| DOCX 导出 | ✗ | ✓ | ✓ |
| **批量** ||||
| 单次生成 | 1 份 | 3 份 | 10 份 |
| **历史** ||||
| 报告留存 | 7 天 | 90 天 | 永久 |
| **高级功能** ||||
| 自定义模板 | ✗ | ✗ | ✓ |
| API 访问 | ✗ | ✗ | ✓ |
| Webhook | ✗ | ✗ | ✓ |
| **支持** ||||
| 响应时间 | 48h | 24h | 4h |
| 支持渠道 | 社区 | 邮件 | 专属客服 |
| 会员标识 | - | Pro Badge | Ultra Badge |

### 5.2 功能分层原则

1. **FREE**: 完整体验核心功能，但有配额限制
2. **PRO**: 解锁导出 + 批量 + 更多配额，适合个人用户
3. **ULTRA**: 全部功能 + 最大配额 + API，适合专业/团队

---

## 6. 成本与利润核算

### 6.1 单次生成成本

| 项目 | 成本 |
|------|------|
| OpenAI API (GPT-4) | ~$0.15 |
| Finnhub 数据 | ~$0.02 |
| 服务器/存储 | ~$0.03 |
| **合计** | **~$0.20** |

### 6.2 套餐毛利分析

| 套餐 | 月收入 | 最大报告数 | 成本 | 毛利 | 毛利率 |
|------|--------|-----------|------|------|--------|
| PRO | $14.99 | 25 份 | $5.00 | $9.99 | **67%** |
| ULTRA | $44.99 | 96 份 | $19.20 | $25.79 | **57%** |

### 6.3 风险控制

- **成本上限**: 即使用户用满配额，毛利率仍 >55%
- **签到机制**: 需要每日活跃才能获得签到积分，防止囤积
- **滚存限制**: PRO 仅 1 月，ULTRA 仅 3 月，防止无限累积

---

## 7. UI/UX 规范

### 7.1 定价页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                    Choose Your Plan                         │
│           AI-powered investment research, your way          │
│                                                             │
│              ┌────────────────────────────┐                 │
│              │ Monthly │ Yearly 33% OFF  │                  │
│              └────────────────────────────┘                 │
│                          ↑ 默认选中                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐   ┌──────────────────┐   ┌─────────────┐
│    FREE     │   │   ⭐ POPULAR     │   │   ULTRA     │
│             │   │                  │   │             │
│     $0      │   │      PRO         │   │   $44.99    │
│             │   │    $14.99/mo     │   │     /mo     │
│  体验产品    │   │                  │   │             │
│             │   │   $9.99/mo       │   │  $0.47/份   │
│  ✓ 30积分   │   │   billed yearly  │   │  ⚡ 4x 速度  │
│  ✓ 标准速度  │   │                  │   │             │
│  ✓ 7天历史  │   │  ✓ 300积分/月    │   │  ✓ 1,500/月 │
│             │   │  ✓ ⚡ 2x 速度     │   │  ✓ 25积分/份│
│             │   │  ✓ PDF导出       │   │  ✓ 批量10份 │
│             │   │  ✓ 批量3份       │   │  ✓ API访问  │
│             │   │  ✓ 90天历史      │   │  ✓ 永久历史 │
│             │   │                  │   │             │
│[Get Started]│   │[ Upgrade Now → ]│   │[ Go Ultra ] │
│             │   │                  │   │             │
│             │   │  Save $60/year   │   │Save $180/yr │
└─────────────┘   └──────────────────┘   └─────────────┘
   灰色边框          翠绿发光边框            紫色边框
                   scale(1.05)
```

### 7.2 视觉规范

| 元素 | FREE | PRO | ULTRA |
|------|------|-----|-------|
| 边框颜色 | `var(--stroke-soft)` | `var(--accent-emerald)` | `#a78bfa` |
| 价格颜色 | `var(--text-dim)` | `var(--accent-emerald)` | `#a78bfa` |
| 背景 | 透明 | 透明 + 发光 | 透明 |
| 缩放 | 1x | 1.05x | 1x |
| Badge | - | "POPULAR" | "BEST VALUE" |
| CTA 样式 | `btn-ghost` | `btn-gradient` | `btn-outline purple` |

### 7.3 年付价格展示

```
PRO 年付显示:
┌────────────────────┐
│  $9.99/month       │  ← 突出年付月均价
│  ─────────         │
│  $14.99            │  ← 划线原价
│                    │
│  💰 Save $60/year  │  ← 节省金额
└────────────────────┘
```

---

## 8. 技术实现规范

### 8.1 数据结构更新

```typescript
// lib/constants/credits.ts

export type UserPlan = 'free' | 'pro' | 'ultra';
export type BillingCycle = 'monthly' | 'yearly';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: {
      initial: 30,
      monthly: 0,
      dailyReward: 5,
      dailyRewardCap: 150,
      reportCost: 30,
      rolloverMonths: 0,
    },
    speed: {
      queue: 'standard',
      priority: 1,
      label: 'Standard',
      estimatedSeconds: 60,
    },
    features: {
      pdfExport: false,
      docxExport: false,
      batchGeneration: 1,
      historyDays: 7,
      customTemplates: false,
      apiAccess: false,
      webhook: false,
    },
    support: {
      responseHours: 48,
      channel: 'community',
      badge: null,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 14.99,
    yearlyPrice: 119.88, // $9.99/mo
    credits: {
      initial: 30,
      monthly: 300,
      dailyReward: 15,
      dailyRewardCap: 450,
      reportCost: 30,
      rolloverMonths: 1,
    },
    speed: {
      queue: 'priority',
      priority: 2,
      label: 'Priority 2x',
      estimatedSeconds: 30,
    },
    features: {
      pdfExport: true,
      docxExport: true,
      batchGeneration: 3,
      historyDays: 90,
      customTemplates: false,
      apiAccess: false,
      webhook: false,
    },
    support: {
      responseHours: 24,
      channel: 'email',
      badge: 'pro',
    },
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    monthlyPrice: 44.99,
    yearlyPrice: 359.88, // $29.99/mo
    credits: {
      initial: 30,
      monthly: 1500,
      dailyReward: 30,
      dailyRewardCap: 900,
      reportCost: 25,
      rolloverMonths: 3,
    },
    speed: {
      queue: 'express',
      priority: 4,
      label: 'Express 4x',
      estimatedSeconds: 15,
    },
    features: {
      pdfExport: true,
      docxExport: true,
      batchGeneration: 10,
      historyDays: -1, // -1 = 永久
      customTemplates: true,
      apiAccess: true,
      webhook: true,
    },
    support: {
      responseHours: 4,
      channel: 'dedicated',
      badge: 'ultra',
    },
  },
} as const;

export const YEARLY_DISCOUNT = 0.33; // 33% off
```

### 8.2 Stripe 产品配置

| Product | Price ID 格式 | 金额 |
|---------|--------------|------|
| Pro Monthly | `price_pro_monthly` | $14.99/mo |
| Pro Yearly | `price_pro_yearly` | $119.88/yr |
| Ultra Monthly | `price_ultra_monthly` | $44.99/mo |
| Ultra Yearly | `price_ultra_yearly` | $359.88/yr |

### 8.3 数据库 Schema 更新

```sql
-- profiles 表更新
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'ultra'));

-- 添加 billing_cycle 字段
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT
  DEFAULT 'monthly'
  CHECK (billing_cycle IN ('monthly', 'yearly'));
```

---

## 9. 迁移计划

### 9.1 现有用户处理

| 原套餐 | 新套餐 | 处理方式 |
|--------|--------|---------|
| free | free | 无变化 |
| pro | pro | 保持原价至下次续费 |
| annual | pro (yearly) | 自动迁移，保持原到期日 |

### 9.2 实施步骤

1. **Phase 1**: 更新 `lib/constants/credits.ts` 数据结构
2. **Phase 2**: 更新数据库 Schema
3. **Phase 3**: 创建 Stripe 产品/价格
4. **Phase 4**: 更新定价页面 UI
5. **Phase 5**: 更新积分消费逻辑 (ULTRA 25积分/份)
6. **Phase 6**: 实现速度分层队列
7. **Phase 7**: 测试 & 上线

---

## 10. 关键文案

### 10.1 套餐标语

| 套餐 | 英文 | 中文 |
|------|------|------|
| FREE | Try it out | 免费体验 |
| PRO | For individual investors | 个人投资者首选 |
| ULTRA | For power users & teams | 专业用户 & 团队 |

### 10.2 速度文案

| 等级 | 英文 | 中文 |
|------|------|------|
| Standard | Standard queue | 标准队列 |
| Priority | 2x faster generation | 生成速度 2x |
| Express | 4x express, skip the queue | 极速 4x，免排队 |

### 10.3 升级引导文案

**PRO → ULTRA 升级理由:**
- 每份报告仅需 $0.47，比 Pro 节省 22%
- 1,500 积分/月，满足高频研究需求
- 4x 极速生成，高峰期也无需等待
- API 访问，集成到您的工作流

---

## 11. 附录

### A. 竞品分析 (AI 投资研究工具)

#### A.1 直接竞品定价对比

| 产品 | Free | Mid-tier | Pro/Premium | 定价策略 |
|------|------|----------|-------------|---------|
| **[Fiscal.ai](https://fiscal.ai/pricing/)** (原 FinChat) | $0 (10 AI/月) | $24/mo Plus | $64/mo Pro | AI 请求数分层 |
| **[Simply Wall St](https://simplywall.st/plans)** | $0 (5报告/月) | $10.95/mo Premium | $21.50/mo Unlimited | 报告数量分层 |
| **[TIKR Terminal](https://www.tikr.com/pricing)** | $0 (基础) | - | $39.95/mo Pro | 数据年限分层 |
| **[Morningstar Investor](https://www.morningstar.com/products/investor)** | - | - | $34.95/mo ($249/yr) | 无免费档 |
| **[Danelfin](https://danelfin.com/)** | $0 (Top 10) | $25/mo | - | AI 评分解锁 |
| **[StockAnalysis.com](https://stockanalysis.com/pro/)** | $0 | $79/yr Pro | $199/yr Unlimited | 年付为主 |

#### A.2 竞品定价洞察

**价格带分布:**
- 免费档: 几乎所有竞品都提供
- 中档 ($10-25/mo): 个人投资者主力区间
- 高档 ($30-65/mo): 专业用户/分析师

**常见分层维度:**
1. AI 请求数 / 报告数量
2. 数据历史年限 (5年 → 20年)
3. 导出功能 (PDF/Excel)
4. 高级筛选器

**Qiltrack 定价定位:**
```
竞品价格带:     $0 -------- $25 -------- $40 -------- $65
                │           │            │            │
Qiltrack:      FREE      PRO($15)    ULTRA($45)      │
                │           │            │            │
定位:         体验档     性价比王     专业用户        │
```

**竞争优势:**
- PRO $14.99 < Fiscal Plus $24 (省 38%)
- PRO $14.99 > Simply Wall St $10.95 (但含 AI 生成)
- ULTRA $44.99 < Fiscal Pro $64 (省 30%)

#### A.3 SaaS 行业套餐命名参考

| 命名风格 | 示例产品 | 套餐名称 |
|---------|---------|---------|
| **功能导向** | Slack, Notion | Free / Pro / Business |
| **用户导向** | GitHub | Free / Pro / Team / Enterprise |
| **等级导向** | Spotify, Netflix | Free / Premium / Ultra |
| **价值导向** | Vercel | Hobby / Pro / Enterprise |

**推荐命名:** `FREE / PRO / ULTRA`

理由:
- "Ultra" 比 "Elite" 更直观，暗示"极致/最高级"
- 参考 q3 截图 (Pointer 使用 Ultra)
- 与速度分层 "Express 4x" 的极致感呼应

### B. 定价变更历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2025-11 | 初始定价 (Free/Pro) |
| v2.0 | 2025-11 | 添加 Annual |
| v3.0 | 2025-12 | 草案 (混乱) |
| **v4.0** | **2025-12-06** | **完整重构 (本文档)** |

---

## 12. 审批签字

- [ ] 产品负责人
- [ ] 技术负责人
- [ ] 运营负责人

---

*本文档为 Qiltrack AI 定价策略的权威参考，所有定价相关开发应以此为准。*
