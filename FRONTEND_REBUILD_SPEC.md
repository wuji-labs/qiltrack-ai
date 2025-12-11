# Qiltrack AI - 前端重构完整需求文档

> **生成时间**: 2025-12-11
> **项目名称**: Qiltrack AI
> **当前版本**: 0.1.0
> **用途**: 本文档为外部AI重构前端提供完整、准确的需求和技术规格

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈与架构](#技术栈与架构)
3. [品牌与配置](#品牌与配置)
4. [页面路由结构](#页面路由结构)
5. [定价方案与积分体系](#定价方案与积分体系)
6. [核心功能模块](#核心功能模块)
7. [API接口清单](#api接口清单)
8. [数据库表结构](#数据库表结构)
9. [国际化文案](#国际化文案)
10. [设计系统与UI组件](#设计系统与ui组件)
11. [环境变量配置](#环境变量配置)
12. [关键业务流程](#关键业务流程)

---

## 项目概述

### 产品定位
**Qiltrack AI** 是一款AI驱动的美股投研报告生成工具，帮助用户在3分钟内理解一家上市公司。

### 核心价值主张
- **快速理解**: 3分钟生成结构化投研报告
- **多维分析**: 提供商业模式、财务、竞争优势、风险分析
- **个性化风格**: 支持4种分析风格（基准、巴菲特、马斯克、浑水）
- **可导出**: 支持DOCX/PDF导出，富文本复制
- **多语言**: 支持中英日韩多语言

### 目标用户
- 个人投资者快速了解陌生公司
- 研究员建立判断框架
- 创业者/产品经理研究竞品
- 培养长期投资思维的学习者

---

## 技术栈与架构

### 前端技术栈
```json
{
  "框架": "Next.js 16.0.7 (App Router)",
  "UI库": "React 19.2.0",
  "样式": "Tailwind CSS 4",
  "语言": "TypeScript 5.9.3",
  "状态管理": "React Context + Hooks",
  "图表": "recharts 3.5.1",
  "表单验证": "自定义hooks",
  "PDF生成": "@react-pdf/renderer 4.3.1",
  "文档导出": "docx 9.5.1",
  "国际化": "自定义i18n系统"
}
```

### 后端服务
```json
{
  "认证": "Supabase Auth",
  "数据库": "Supabase PostgreSQL",
  "存储": "Supabase Storage",
  "支付": "Stripe",
  "限流": "Upstash Redis",
  "LLM": "OpenRouter / Helicone (OpenAI兼容)",
  "监控": "Sentry",
  "任务队列": "Inngest"
}
```

### 项目结构
```
qiltrack-ai/
├── app/                          # Next.js App Router 页面
│   ├── (auth)/                   # 认证相关页面（登录）
│   ├── account/                  # 用户账户管理
│   ├── admin/                    # 管理后台
│   ├── api/                      # API路由（48个端点）
│   ├── components/               # 页面级组件
│   ├── legal/                    # 法律文档页面
│   ├── pricing/                  # 定价页面
│   ├── reports/                  # 报告中心/模板页面
│   ├── sections/                 # 首页section组件
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── components/                   # 共享UI组件
├── hooks/                        # 自定义React Hooks
├── lib/                          # 核心业务逻辑库
│   ├── config/                   # 配置（品牌、常量）
│   ├── constants/                # 常量定义
│   ├── core/                     # 核心业务逻辑
│   ├── services/                 # 外部服务集成
│   ├── supabase/                 # Supabase客户端
│   └── i18n.tsx                  # 国际化配置（260KB）
├── types/                        # TypeScript类型定义
├── public/                       # 静态资源
└── prisma/                       # Prisma ORM（仅用于测试）
```

---

## 品牌与配置

### 品牌信息
```typescript
{
  name: "Qiltrack AI",           // 完整品牌名
  short: "Qiltrack",            // 简称
  domain: "qiltrack.com",       // 主域名
  contactEmail: "legal@qiltrack.com",
  noReplyEmail: "no-reply@qiltrack.com",
  adminEmailDomain: "qiltrack.com"
}
```

### 核心文案（中英文）
#### 标语与定位
- **英文**: "Understand a company in 3 minutes"
- **简体中文**: "3分钟，搞懂一家美股上市公司。"
- **繁体中文**: "3 分鐘讀懂一家美股公司。"

#### 价值主张
- **英文**: "Understanding is the foundation of investing."
- **中文**: "理解，是投资的起点。"

#### 产品描述
- **英文**: "Transforms complex data, reports, and jargon into clear company analysis."
- **简体中文**: "将纷繁复杂的资讯、财报与专业术语，整理成一份人人能懂的公司分析。"

---

## 页面路由结构

### 公开页面
| 路径 | 说明 | 主要组件 |
|------|------|---------|
| `/` | 首页 | HeroSection, ModesSection, ReportGeneratorSection, WhySection, FooterSection |
| `/login` | 登录页 | 支持Google One-Tap, Magic Link |
| `/pricing` | 定价页 | PricingCards, 功能对比表 |
| `/reports` | 报告中心 | 精选报告展示 |
| `/reports/[slug]` | 单个报告详情 | - |
| `/legal` | 法律文档导航 | - |
| `/legal/terms` | 服务条款 | - |
| `/legal/privacy` | 隐私政策 | - |
| `/legal/refund` | 退款政策 | - |
| `/legal/acceptable-use` | 可接受使用政策 | - |

### 需登录页面
| 路径 | 说明 |
|------|------|
| `/account` | 账户管理（Profile, Membership, Security, Data, Preferences） |
| `/account/history` | 报告生成历史 |
| `/account/reset-password` | 密码重置 |
| `/account/change-password` | 修改密码 |

### 管理后台（需admin权限）
| 路径 | 说明 |
|------|------|
| `/admin` | 仪表盘 |
| `/admin/users` | 用户管理 |
| `/admin/users/[id]` | 单个用户详情 |
| `/admin/subscriptions` | 订阅管理 |
| `/admin/credits` | 积分管理 |
| `/admin/reports` | 报告管理 |
| `/admin/runs` | 运行记录管理 |
| `/admin/runs/[id]` | 单个运行详情 |
| `/admin/analytics` | 数据分析 |
| `/admin/plans` | 套餐计划管理 |
| `/admin/permissions` | 权限管理 |
| `/admin/system/health` | 系统健康检查 |
| `/admin/system/config` | 系统配置 |
| `/admin/system/cache` | 缓存管理 |
| `/admin/system/audit-logs` | 审计日志 |
| `/admin/tools/batch` | 批量操作工具 |
| `/admin/tools/export` | 数据导出 |

### 主导航菜单（顶部导航栏）
```typescript
const navItems = [
  { labelKey: "nav.product", href: "#overview" },      // Solution / 解决方案
  { labelKey: "nav.generator", href: "#generator" },   // Build report / 生成报告
  { labelKey: "nav.templates", href: "/reports" },     // Report Hub / 报告中心
  { labelKey: "nav.pricing", href: "/pricing" },       // Pricing / 定价
  { labelKey: "nav.faq", href: "#faq" }               // Help / 帮助
]
```

---

## 定价方案与积分体系

### 三档套餐对比

| 项目 | Free | Pro | Ultra |
|------|------|-----|-------|
| **月费（月付）** | $0 | $14.99 | $44.99 |
| **月费（年付）** | $0 | $9.99（省33%） | $29.99（省33%） |
| **初始积分** | 30 | 30 | 30 |
| **每月赠送积分** | 0 | 300 | 1,500 |
| **每日签到积分** | 10 | 30 | 60 |
| **单次报告消耗** | 30 | 30 | 25 |
| **积分滚存** | - | 1个月 | 3个月 |
| **报告生成** | ✓ | ✓ | ✓ |
| **生成速度** | 标准 | 优先 | 极速 |
| **DOCX导出** | ✗ | ✓ | ✓ |
| **PDF导出** | ✗ | ✗ | ✓ |
| **批量生成** | 1份/次 | 3份/次 | 10份/次 |
| **报告保留** | 7天 | 90天 | 永久 |
| **自定义模板** | ✗ | ✗ | ✓ |
| **API访问** | ✗ | ✗ | ✓ |
| **Webhook** | ✗ | ✗ | ✓ |
| **响应时间** | 48小时 | 24小时 | 4小时 |
| **支持渠道** | 社区 | 邮件 | 专属 |
| **会员徽章** | ✗ | ✓ | ✓ |

### 积分系统配置
```typescript
export const CREDITS = {
  INITIAL_FREE: 30,        // 新用户初始积分
  DAILY_REWARD: 10,        // 每日签到（Free）
  REPORT_COST: 30,         // 单次报告消耗（Free/Pro）
  PRO_MONTHLY: 300,        // Pro月度赠送
  ULTRA_MONTHLY: 1500,     // Ultra月度赠送
  LOW_CREDIT_THRESHOLD: 5  // 低积分预警
}
```

### 报告风格与积分消耗
```typescript
const toneOptions = [
  {
    id: "baseline",
    emoji: "🧭",
    title: "基准分析",
    description: "标准化、结构化的企业分析框架",
    credits: 30
  },
  {
    id: "buffett",
    emoji: "🏰",
    title: "巴菲特风格",
    description: "关注护城河、现金流覆盖、品牌溢价",
    credits: 40
  },
  {
    id: "musk",
    emoji: "🚀",
    title: "马斯克视角",
    description: "颠覆性技术、市场潜力、第一性原理",
    credits: 40
  },
  {
    id: "muddy",
    emoji: "🛡️",
    title: "浑水模式",
    description: "风险挖掘、财务异常、治理结构问题",
    credits: 50
  }
]
```

### Stripe价格ID配置
```env
# 需在Stripe Dashboard创建对应的Price对象
STRIPE_PRICE_PRO_MONTHLY=price_xxx    # $14.99/月
STRIPE_PRICE_PRO_ANNUAL=price_xxx     # $9.99/月（年付$119.88）
STRIPE_PRICE_ULTRA_MONTHLY=price_xxx  # $44.99/月
STRIPE_PRICE_ULTRA_ANNUAL=price_xxx   # $29.99/月（年付$359.88）
```

---

## 核心功能模块

### 1. 报告生成器（Report Generator）

#### 输入
- **公司识别符**: 股票代码（如AAPL）或公司名称（支持模糊搜索）
- **分析风格**: baseline / buffett / musk / muddy
- **语言**: en / zh-Hans / zh-Hant / ja / ko

#### 输出结构
```typescript
{
  title: "公司名称 - 分析报告",
  summary: "一句话总结",
  sections: [
    {
      heading: "公司概况",
      content: "业务描述、行业定位"
    },
    {
      heading: "商业模式",
      content: "收入来源、客户群体、价值主张"
    },
    {
      heading: "竞争优势",
      content: "护城河分析、差异化优势"
    },
    {
      heading: "财务健康度",
      content: "关键财务指标、现金流状况"
    },
    {
      heading: "风险与挑战",
      content: "行业风险、政策风险、竞争威胁"
    },
    {
      heading: "投资视角",
      content: "类型判断（成长型/价值型/周期型）、适合人群"
    }
  ],
  charts: [
    { type: "revenue", data: [...] },
    { type: "profit_margin", data: [...] }
  ],
  metadata: {
    generated_at: "ISO timestamp",
    tone: "baseline",
    language: "zh-Hans",
    credits_used: 30
  }
}
```

#### 工作流程（4步骤）
```typescript
const workflowSteps = [
  {
    badge: "STEP 1",
    title: "数据采集",
    detail: "从Finnhub API获取财报、市场数据"
  },
  {
    badge: "STEP 2",
    title: "结构化分析",
    detail: "运用知识框架提取关键信息"
  },
  {
    badge: "STEP 3",
    title: "风格化撰写",
    detail: "根据选定风格生成报告文本"
  },
  {
    badge: "STEP 4",
    title: "渲染与交付",
    detail: "生成富文本、图表、导出选项"
  }
]
```

### 2. 每日签到系统

#### 功能
- 登录用户每日可签到一次获得积分
- Free: 10积分/天
- Pro: 30积分/天（特定计划可配置）
- Ultra: 60积分/天

#### API
- `POST /api/report/daily-reward` - 领取每日奖励
- `GET /api/report/daily-reward/status` - 查询签到状态

### 3. 推荐系统（Referral Program）

#### 机制
- 每位用户获得唯一推荐码
- 新用户通过推荐链接注册，双方获得奖励
- 里程碑奖励：邀请3人、10人、50人分别解锁额外积分

#### API
- `POST /api/referrals/generate` - 生成推荐链接
- `GET /api/referrals/stats` - 查询推荐统计
- `POST /api/referrals/claim-milestone` - 领取里程碑奖励

### 4. 用户认证

#### 支持方式
- **Google OAuth**: 通过Supabase Auth + Google One-Tap
- **Magic Link**: 无密码邮箱登录
- **Email + Password**: 传统账密登录

#### 会话管理
- Supabase Auth Session
- 刷新token自动续期
- 多设备同时登录支持

### 5. 报告中心（Report Hub）

#### 功能
- 精选报告展示（Featured Reports）
- 行业分类浏览
- 搜索与筛选
- 收藏与分享

#### 精选报告示例
```typescript
const featuredReports = [
  {
    symbol: "NVDA",
    title: "英伟达：AI芯片帝国的护城河与挑战",
    snippet: "从GPU到AI加速器的转型...",
    date: "2025-12-01",
    theme: "科技",
    tags: ["AI", "半导体", "高增长"],
    cover: "linear-gradient(...)",
    readTime: "8 min",
    url: "/reports/nvda-ai-chip-analysis"
  },
  // ... 更多报告
]
```

---

## API接口清单

### 报告相关（Report）
| Method | 端点 | 说明 | 认证 |
|--------|------|------|------|
| POST | `/api/report` | 生成报告 | 必需 |
| GET | `/api/report/availability` | 检查服务可用性 | - |
| GET | `/api/report/credits` | 查询剩余积分 | 必需 |
| POST | `/api/report/daily-reward` | 领取每日签到 | 必需 |
| GET | `/api/report/daily-reward/status` | 签到状态查询 | 必需 |
| GET | `/api/report/history` | 报告历史 | 必需 |
| GET | `/api/report/popular` | 热门报告 | - |
| GET | `/api/report/posts` | 报告列表 | - |
| GET | `/api/report/posts/[slug]` | 单个报告详情 | - |
| GET | `/api/report/similar` | 相似报告推荐 | - |
| POST | `/api/report/upload` | 上传自定义数据 | 必需 |
| GET | `/api/report/export/pdf` | 导出PDF | 必需 |

### 认证相关（Auth）
| Method | 端点 | 说明 |
|--------|------|------|
| POST | `/api/auth/change-password` | 修改密码 |
| GET | `/api/auth/callback` | OAuth回调处理 |

### 支付相关（Stripe）
| Method | 端点 | 说明 |
|--------|------|------|
| POST | `/api/stripe/checkout` | 创建支付会话 |
| POST | `/api/stripe/webhook` | Stripe Webhook |

### 推荐系统（Referrals）
| Method | 端点 | 说明 |
|--------|------|------|
| POST | `/api/referrals/generate` | 生成推荐链接 |
| GET | `/api/referrals/stats` | 推荐统计 |
| POST | `/api/referrals/claim-milestone` | 领取里程碑 |

### 管理后台（Admin）
| Method | 端点 | 说明 |
|--------|------|------|
| GET | `/api/admin/analytics` | 数据分析 |
| GET | `/api/admin/audit-logs` | 审计日志 |
| POST | `/api/admin/batch` | 批量操作 |
| GET/POST | `/api/admin/cache` | 缓存管理 |
| POST | `/api/admin/cache/invalidate` | 清除缓存 |
| GET | `/api/admin/cache/stats` | 缓存统计 |
| GET | `/api/admin/metrics` | 系统指标 |
| GET | `/api/admin/queue/stats` | 队列状态 |
| GET | `/api/admin/runs` | 运行记录 |
| POST | `/api/admin/runs/[id]/feature` | 加精报告 |
| POST | `/api/admin/runs/[id]/unfeature` | 取消加精 |
| POST | `/api/admin/runs/unfeature-bulk` | 批量取消加精 |
| GET | `/api/admin/subscriptions` | 订阅管理 |
| GET/POST | `/api/admin/system/config` | 系统配置 |
| GET | `/api/admin/system/health` | 健康检查 |
| POST | `/api/admin/users/create` | 创建用户 |
| POST | `/api/admin/users/delete` | 删除用户 |
| POST | `/api/admin/users/update` | 更新用户 |
| POST | `/api/admin/users/change-plan` | 修改套餐 |
| POST | `/api/admin/users/grant-credits` | 赠送积分 |
| POST | `/api/admin/users/reset-password` | 重置密码 |
| POST | `/api/admin/users/send-reset-email` | 发送重置邮件 |

### 其他
| Method | 端点 | 说明 |
|--------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/quote` | 获取股票报价 |
| GET | `/api/search` | 搜索公司 |
| POST | `/api/inngest` | Inngest事件处理 |

---

## 数据库表结构

### 核心表（Supabase PostgreSQL）

#### profiles（用户档案）
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR,
  avatar_url VARCHAR,
  plan VARCHAR DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ultra')),
  role VARCHAR DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'developer', 'editor', 'user', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_credits（用户积分）
```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  remaining_credits INT DEFAULT 30,
  total_earned INT DEFAULT 30,
  total_consumed INT DEFAULT 0,
  last_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### credit_transactions（积分交易记录）
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  event_type VARCHAR NOT NULL CHECK (event_type IN ('consumed', 'granted', 'daily_reward', 'subscription_reset', 'refund', 'admin_adjustment')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### billing_subscriptions（订阅记录）
```sql
CREATE TABLE billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id VARCHAR NOT NULL,
  stripe_subscription_id VARCHAR,
  stripe_price_id VARCHAR,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### report_runs（报告生成记录）
```sql
CREATE TABLE report_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  symbol VARCHAR NOT NULL,
  company_name VARCHAR,
  tone VARCHAR DEFAULT 'baseline',
  language VARCHAR DEFAULT 'en',
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  credits_used INT DEFAULT 30,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_rewards（每日签到记录）
```sql
CREATE TABLE daily_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  credits_awarded INT DEFAULT 10,
  UNIQUE(user_id, claimed_at::DATE)
);
```

#### referrals（推荐记录）
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### audit_logs（审计日志）
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  details JSONB,
  ip_address INET,
  user_agent VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 国际化文案

### 支持语言
- **en**: English
- **zh-Hans**: 简体中文
- **zh-Hant**: 繁体中文
- **ja**: 日本語
- **ko**: 한국어

### 核心翻译键值（部分示例）

#### 导航栏
```typescript
{
  "nav.product": { en: "Solution", "zh-Hans": "解决方案", "zh-Hant": "解決方案" },
  "nav.generator": { en: "Build report", "zh-Hans": "生成报告", "zh-Hant": "生成報告" },
  "nav.templates": { en: "Report Hub", "zh-Hans": "报告中心", "zh-Hant": "報告中心" },
  "nav.pricing": { en: "Pricing", "zh-Hans": "定价", "zh-Hant": "定價" },
  "nav.faq": { en: "Help", "zh-Hans": "帮助", "zh-Hant": "幫助" }
}
```

#### Hero区域
```typescript
{
  "hero.title": {
    en: "Understand a company in 3 minutes",
    "zh-Hans": "3分钟，搞懂一家美股上市公司。",
    "zh-Hant": "3 分鐘讀懂一家美股公司。"
  },
  "hero.description": {
    en: "Transforms complex data, reports, and jargon into clear company analysis.",
    "zh-Hans": "将纷繁复杂的资讯、财报与专业术语，整理成一份人人能懂的公司分析。",
    "zh-Hant": "把分散的資訊、專業術語與複雜結構，整理成一份普通人也能看懂的公司分析。"
  },
  "hero.brandline": {
    en: "Understanding is the foundation of investing.",
    "zh-Hans": "理解，是投资的起点。",
    "zh-Hant": "理解，是投資的起點。"
  }
}
```

#### 定价页
```typescript
{
  "pricing.plan.free.caption": {
    en: "Perfect for trying out the product",
    "zh-Hans": "适合体验产品功能",
    "zh-Hant": "適合體驗產品功能"
  },
  "pricing.plan.pro.caption": {
    en: "For serious individual investors",
    "zh-Hans": "适合认真的个人投资者",
    "zh-Hant": "適合認真的個人投資者"
  },
  "pricing.plan.ultra.caption": {
    en: "For professional teams and power users",
    "zh-Hans": "适合专业团队和高频用户",
    "zh-Hant": "適合專業團隊和高頻用戶"
  }
}
```

**注意**: 完整的翻译文件位于 `lib/i18n.tsx`（260KB），包含所有页面、组件、错误提示的多语言版本。

---

## 设计系统与UI组件

### CSS变量（Design Tokens）
```css
:root {
  /* Colors */
  --bg-base: #04110c;
  --bg-layer: rgba(16, 23, 20, 0.85);
  --bg-frosted: rgba(16, 23, 20, 0.75);

  --color-foreground: #f0fff8;
  --text-dim: #94a79f;
  --text-subtle: #6b7c74;

  --accent-emerald: #5be0b0;
  --accent-blue: #5bb0e0;

  --stroke-soft: rgba(91, 224, 176, 0.15);
  --stroke-glow: rgba(91, 224, 176, 0.35);

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}
```

### 通用组件类
```css
.btn-gradient {
  background: linear-gradient(135deg, var(--accent-emerald) 0%, #4bc89a 100%);
  color: #04110c;
  font-weight: 600;
  border-radius: 9999px;
  transition: all 0.2s ease-out;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--stroke-soft);
  color: var(--color-foreground);
  border-radius: 9999px;
  transition: all 0.2s ease-out;
}

.glass-card {
  background: var(--bg-layer);
  border: 1px solid var(--stroke-soft);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
}
```

### 核心组件清单

#### 布局组件
- `HeroSection.tsx` - 首页头部+导航
- `FooterSection.tsx` - 页脚
- `ModesSection.tsx` - 报告风格选择
- `WhySection.tsx` - 价值主张展示

#### 报告生成器
- `ReportGeneratorSection.tsx` - 报告生成主容器
- `ReportForm.tsx` - 输入表单
- `ReportResult.tsx` - 结果展示
- `CreditsDisplay.tsx` - 积分显示
- `ExportButtons.tsx` - 导出按钮（DOCX/PDF）
- `SimilarReports.tsx` - 相似报告推荐
- `ProductHighlights.tsx` - 报告亮点展示
- `ReuseDialog.tsx` - 复用已有报告提示

#### 用户相关
- `GoogleOneTap.tsx` - Google一键登录
- `GoogleSignInButton.tsx` - Google登录按钮
- `DailyRewardButton.tsx` - 每日签到按钮
- `ReferralWelcomeBanner.tsx` - 推荐欢迎横幅
- `ReferralPanel.tsx` - 推荐面板

#### 定价与支付
- `PricingCards.tsx` - 定价卡片
- `BillingToggle.tsx` - 月付/年付切换
- `Paywall.tsx` - 付费墙

#### 管理后台
- `MetricsDashboard.tsx` - 指标仪表盘
- `CacheMonitor.tsx` - 缓存监控
- `QueueMonitoring.tsx` - 队列监控

#### 通用UI
- `Logo.tsx` - Logo组件
- `KpiCard.tsx` - KPI卡片
- `ReportCharts.tsx` - 报告图表
- `ProgressBar.tsx` - 进度条
- `ErrorBoundary.tsx` - 错误边界
- `LanguageSwitchPrompt.tsx` - 语言切换提示
- `Turnstile.tsx` - Cloudflare人机验证

---

## 环境变量配置

### 必需变量
```env
# 品牌配置
NEXT_PUBLIC_BRAND_NAME="Qiltrack AI"
NEXT_PUBLIC_BRAND_SHORT="Qiltrack"
NEXT_PUBLIC_DOMAIN="qiltrack.com"
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase（托管数据库）
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_REPORT_BUCKET=report-assets

# 数据源（Finnhub股票API）
FINNHUB_API_KEY=your_finnhub_key

# LLM供应商（至少配置一个）
HELICONE_API_KEY=sk-helicone-your-key
HELICONE_MODEL=gpt-4o-mini

# 或使用OpenRouter
OPENROUTER_API_KEY=sk-or-your-key
OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet

# Stripe支付（可选）
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ULTRA=price_xxx

# Upstash Redis限流（可选）
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Cloudflare Turnstile（可选）
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

### 可选变量
```env
# Langfuse监控
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=
LANGFUSE_SAMPLING_RATE=1.0

# 邮件服务
EMAIL_SERVER=smtp://user:pass@mailtrap.io:2525
EMAIL_FROM="Qiltrack AI <no-reply@qiltrack.com>"

# 功能开关
NEXT_PUBLIC_FEATURE_PAYWALL=false
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-random-string-32-chars
```

---

## 关键业务流程

### 1. 新用户注册流程
```mermaid
graph TD
    A[用户访问 /login] --> B{选择登录方式}
    B -->|Google| C[Google OAuth]
    B -->|Email| D[Magic Link / Password]
    C --> E[Supabase Auth验证]
    D --> E
    E --> F[创建 profiles 记录]
    F --> G[初始化 user_credits 30积分]
    G --> H[检查推荐码]
    H -->|有推荐码| I[创建 referrals 记录]
    H -->|无| J[跳转到首页]
    I --> K[推荐人+被推荐人各获奖励]
    K --> J
```

### 2. 报告生成流程
```mermaid
graph TD
    A[用户输入股票代码+选择风格] --> B{检查积分}
    B -->|不足| C[显示充值提示]
    B -->|充足| D[扣除积分]
    D --> E[调用 POST /api/report]
    E --> F[后台Inngest Job]
    F --> G[Finnhub获取财报数据]
    G --> H[LLM生成分析]
    H --> I[格式化输出JSON]
    I --> J[存储到 report_runs]
    J --> K[前端轮询或WebSocket]
    K --> L[显示报告结果]
    L --> M{用户操作}
    M -->|导出DOCX| N[生成.docx文件]
    M -->|导出PDF| O[生成.pdf文件]
    M -->|复制| P[复制富文本]
```

### 3. 订阅升级流程
```mermaid
graph TD
    A[用户选择Pro/Ultra套餐] --> B[点击订阅按钮]
    B --> C[POST /api/stripe/checkout]
    C --> D[创建Stripe Checkout Session]
    D --> E[跳转到Stripe托管页面]
    E --> F[用户完成支付]
    F --> G[Stripe Webhook回调]
    G --> H[更新 billing_subscriptions]
    H --> I[更新 profiles.plan]
    I --> J[重置月度积分]
    J --> K[发送确认邮件]
    K --> L[用户返回/account页面]
```

### 4. 每日签到流程
```mermaid
graph TD
    A[用户点击签到按钮] --> B[POST /api/report/daily-reward]
    B --> C{检查今日是否已签到}
    C -->|已签| D[返回错误提示]
    C -->|未签| E{检查用户套餐}
    E -->|Free| F[奖励10积分]
    E -->|Pro| G[奖励30积分]
    E -->|Ultra| H[奖励60积分]
    F --> I[更新 user_credits]
    G --> I
    H --> I
    I --> J[记录到 daily_rewards]
    J --> K[记录到 credit_transactions]
    K --> L[返回新积分余额]
```

---

## 附录

### A. 关键文件路径速查

| 功能 | 文件路径 |
|------|---------|
| 品牌配置 | `lib/config/brand.ts` |
| 积分常量 | `lib/constants/credits.ts` |
| 定价配置 | `app/components/PricingCards.tsx` |
| 国际化主文件 | `lib/i18n.tsx` (260KB) |
| 数据库类型 | `types/database.ts` |
| 首页 | `app/page.tsx` |
| 报告生成API | `app/api/report/route.ts` |
| 用户Profile Hook | `hooks/useSupabaseAuth.ts` |
| Stripe支付API | `app/api/stripe/checkout/route.ts` |
| 环境变量示例 | `.env.local.example` |

### B. 依赖包版本锁定
```json
{
  "next": "^16.0.7",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "tailwindcss": "^4",
  "typescript": "5.9.3",
  "@supabase/supabase-js": "^2.46.0",
  "@react-pdf/renderer": "^4.3.1",
  "recharts": "^3.5.1",
  "stripe": "^20.0.0",
  "docx": "^9.5.1",
  "openai": "^6.9.0"
}
```

### C. 前端UI风格指南

#### 配色方案
- **主色调**: 深绿黑 (`#04110c`) + 翠绿 (`#5be0b0`)
- **辅助色**: 蓝绿 (`#5bb0e0`)
- **中性色**: 灰白渐变 (`#f0fff8` → `#6b7c74`)

#### 字体
- **系统字体栈**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **标题**: 600-700 font-weight
- **正文**: 400 font-weight
- **小字**: 12-14px, 0.24em letter-spacing

#### 动效
- **过渡时长**: 200ms
- **缓动函数**: `ease-out`
- **hover效果**: `-translate-y-1px` + `shadow增强`

#### 响应式断点
```css
sm: 640px   /* 手机横屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 笔记本 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

---

## 总结与注意事项

### 前端重构要求

1. **完全保留后端API接口**
   - 所有48个API端点不可改动
   - 请求/响应格式必须保持一致
   - 认证机制（Supabase Auth）保持不变

2. **数据库对接零改动**
   - 使用现有Supabase实例
   - 表结构不可更改
   - 继续使用 `types/database.ts` 类型定义

3. **核心功能逻辑保持**
   - 积分系统计算规则不变
   - 报告生成流程不变（4步workflow）
   - 订阅与支付流程不变

4. **国际化必须支持**
   - 5种语言（en/zh-Hans/zh-Hant/ja/ko）
   - 继续使用 `lib/i18n.tsx` 翻译键值
   - 语言切换功能保留

5. **可以自由发挥的部分**
   - **UI设计**: 完全重新设计，不受现有样式限制
   - **组件库**: 可选用任何UI框架（Chakra/MUI/Ant Design/shadcn等）
   - **动画**: 可添加更丰富的交互动效
   - **布局**: 可重新设计页面布局和信息架构
   - **配色**: 可完全更换配色方案
   - **字体**: 可选用其他字体

### 必须保留的功能点
- [x] 首页Hero区+报告生成器
- [x] 定价页（3档套餐对比）
- [x] 报告中心/模板展示
- [x] 用户账户管理（Profile/Membership/Security）
- [x] 每日签到按钮
- [x] 推荐系统（邀请链接+里程碑）
- [x] Google OAuth登录
- [x] Magic Link登录
- [x] 报告导出（DOCX/PDF）
- [x] 积分显示与扣除
- [x] 管理后台（仅UI可改，功能保留）
- [x] 多语言切换
- [x] 响应式设计（移动端+桌面端）

### 可选移除的功能
- Cloudflare Turnstile（若有更好的人机验证方案）
- Google One-Tap（可替换为其他快速登录）
- 某些管理后台的高级功能（如不需要）

---

## 联系与支持

如有疑问，请通过以下方式联系：
- **技术问题**: developer@qiltrack.com
- **业务咨询**: legal@qiltrack.com
- **GitHub**: 项目仓库Issues

---

**文档版本**: v1.0
**最后更新**: 2025-12-11
**维护者**: Qiltrack AI Team
