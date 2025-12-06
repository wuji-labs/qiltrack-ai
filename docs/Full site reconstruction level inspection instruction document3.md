# Qiltrack AI 产品重建与优化指导手册

> **Product & Engineering Excellence Framework**
>
> Version: 3.0 | Last Updated: 2025-12-05 | Classification: Internal

---

## Executive Summary

本文档采用 **Google SRE + 顶级产品经理** 双视角，为 Qiltrack AI 提供系统性的产品审计、优化路径和工程卓越框架。

**文档结构**:
- **Part 1-6**: 产品战略与工程卓越（产品经理视角）
- **Part 7-12**: 技术检查清单（SRE/DevOps 视角）

### 核心价值主张

```
Qiltrack AI = 三分钟理解美股上市公司的 AI 投研助手
```

**当前产品定位**: 面向个人投资者的轻量级投研工具
**目标用户画像**: 有美股投资需求但缺乏深度研究时间的中国投资者

---

# PART A: 产品战略与工程卓越

---

## Part 1: 产品健康度诊断 (Product Health Audit)

### 1.1 核心指标仪表盘 (North Star Metrics)

| 指标类型 | 指标名称 | 当前状态 | 健康阈值 | 行动优先级 |
|---------|---------|---------|---------|-----------|
| **激活率** | 新用户首次生成报告率 | 待测量 | > 40% | P0 |
| **留存率** | 7日留存 | 待测量 | > 25% | P0 |
| **转化率** | 免费→付费转化 | 待测量 | > 3% | P1 |
| **NPS** | 净推荐值 | 待测量 | > 30 | P1 |
| **ARPU** | 每用户平均收入 | 待计算 | - | P2 |

**诊断行动**:
- [ ] 接入产品分析工具 (Mixpanel/Amplitude/PostHog)
- [ ] 建立漏斗分析: 访问 → 注册 → 首次报告 → 付费 → 复购
- [ ] 设置自动化周报推送核心指标

### 1.2 用户旅程断点分析 (Journey Friction Analysis)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│   Sign Up   │────▶│ First Report│────▶│   Paywall   │
│    Page     │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
   断点1              断点2               断点3               断点4
  价值不清晰         注册成本高          积分消耗焦虑        价格敏感
```

**断点1: 价值不清晰**
- 问题: 用户不理解"三分钟"能获得什么价值
- 优化: 首页展示真实报告样例，量化价值 (vs 传统研报耗时)

**断点2: 注册成本高**
- 问题: 需要注册才能体验核心功能
- 优化: 提供1次免费体验 (无需注册)，体验后引导注册

**断点3: 积分消耗焦虑**
- 问题: 30积分/报告，用户担心"浪费"
- 优化: 展示报告预览/大纲，让用户确认后再消费积分

**断点4: 价格敏感**
- 问题: $14.99/月对中国用户偏高
- 优化: 考虑区域定价，或推出更轻量的套餐

---

## Part 2: 产品优化路线图 (Product Optimization Roadmap)

### 2.1 Quick Wins (本周可完成)

| 优化项 | 预期影响 | 实施难度 | 负责人 |
|-------|---------|---------|-------|
| 首页添加报告样例展示 | 激活率 +10% | 低 | |
| 搜索框添加热门股票提示 | 首次报告率 +5% | 低 | |
| 报告生成进度优化为阶段性反馈 | 用户满意度提升 | 低 | |
| 每日签到按钮更醒目 | 留存率 +3% | 低 | |

### 2.2 Medium-term Improvements (1-2周)

| 优化项 | 预期影响 | 实施难度 | 技术依赖 |
|-------|---------|---------|---------|
| 无注册体验1次报告 | 激活率 +20% | 中 | Session 管理 |
| 报告预览/大纲功能 | 积分消费转化 +15% | 中 | LLM 两阶段调用 |
| 报告收藏夹功能 | 留存率 +5% | 中 | 数据库表 |
| 多股票对比报告 | 差异化功能 | 中 | LLM 提示工程 |

### 2.3 Strategic Initiatives (1-3月)

| 战略项目 | 商业价值 | 技术复杂度 | ROI |
|---------|---------|-----------|-----|
| **AI 对话追问** | 用户粘性大幅提升 | 高 | ⭐⭐⭐⭐⭐ |
| **实时行情集成** | 专业度提升 | 高 | ⭐⭐⭐⭐ |
| **投资组合分析** | 高端用户价值 | 高 | ⭐⭐⭐⭐ |
| **社区/分享功能** | 病毒传播系数 | 中 | ⭐⭐⭐ |
| **移动端 App** | 用户触达 | 高 | ⭐⭐⭐ |

---

## Part 3: 技术架构优化 (Engineering Excellence)

### 3.1 当前架构评估

```
┌─────────────────────────────────────────────────────────────────┐
│                        Current Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│   │ Vercel  │────▶│ Next.js │────▶│Supabase │────▶│PostgreSQL│ │
│   │  Edge   │     │   App   │     │  Auth   │     │    DB    │ │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│        │               │               │                        │
│        │               ▼               │                        │
│        │         ┌─────────┐          │                        │
│        │         │ LLM API │          │                        │
│        │         │Helicone │          │                        │
│        │         └─────────┘          │                        │
│        │               │               │                        │
│        │               ▼               │                        │
│        │         ┌─────────┐          │                        │
│        │         │ Finnhub │          │                        │
│        │         │   API   │          │                        │
│        │         └─────────┘          │                        │
│        │                              │                        │
│        ▼                              ▼                        │
│   ┌─────────┐                   ┌─────────┐                    │
│   │  Redis  │                   │ Stripe  │                    │
│   │ Upstash │                   │ Payment │                    │
│   └─────────┘                   └─────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 架构成熟度评分

| 维度 | 当前评分 | 目标评分 | 差距分析 |
|------|---------|---------|---------|
| **可用性** (Availability) | 3/5 | 4/5 | 缺少多区域部署、健康检查告警 |
| **可扩展性** (Scalability) | 3/5 | 4/5 | LLM 调用是瓶颈，需要队列化 |
| **可观测性** (Observability) | 2/5 | 4/5 | 缺少完整的 metrics/tracing/logging |
| **安全性** (Security) | 3/5 | 4/5 | RLS 已配置，需要安全审计 |
| **可维护性** (Maintainability) | 3/5 | 4/5 | 测试覆盖率需提升 |

### 3.3 技术债务清单 (Tech Debt Backlog)

| 债务项 | 影响范围 | 风险等级 | 偿还成本 | 优先级 |
|-------|---------|---------|---------|-------|
| 缺少端到端测试 | 全局 | 高 | 3天 | P0 |
| 报告生成无队列 | 性能 | 高 | 2天 | P0 |
| 错误处理不统一 | 用户体验 | 中 | 1天 | P1 |
| API 无版本控制 | 兼容性 | 中 | 1天 | P1 |
| 前端状态管理混乱 | 维护性 | 中 | 2天 | P2 |
| 缺少 API 文档 | 协作 | 低 | 1天 | P2 |

### 3.4 推荐架构演进

```
┌─────────────────────────────────────────────────────────────────┐
│                       Target Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│   │  CDN/   │────▶│ Next.js │────▶│  API    │────▶│PostgreSQL│ │
│   │  Edge   │     │Frontend │     │ Gateway │     │ (Primary) │ │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│                         │               │               │        │
│                         │               ▼               │        │
│                         │         ┌─────────┐          │        │
│                         │         │  Queue  │          ▼        │
│                         │         │(Inngest)│     ┌─────────┐  │
│                         │         └─────────┘     │ Replica │  │
│                         │               │         └─────────┘  │
│                         │               ▼                       │
│                         │         ┌─────────┐                   │
│                         │         │ Workers │                   │
│                         │         │ (LLM)   │                   │
│                         │         └─────────┘                   │
│                         │                                       │
│   ┌─────────────────────┴─────────────────────┐                │
│   │           Observability Platform           │                │
│   │  ┌───────┐  ┌───────┐  ┌───────┐         │                │
│   │  │Metrics│  │Tracing│  │Logging│         │                │
│   │  │(Prom) │  │(Tempo)│  │ (Loki)│         │                │
│   │  └───────┘  └───────┘  └───────┘         │                │
│   └─────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: SRE 运维卓越体系 (Site Reliability Engineering)

### 4.1 服务等级目标 (SLO/SLA)

| 服务 | SLI (指标) | SLO (目标) | Error Budget |
|-----|-----------|-----------|--------------|
| **整体可用性** | 成功请求率 | 99.5% | 3.6小时/月 |
| **报告生成** | P95 延迟 | < 30秒 | - |
| **搜索 API** | P99 延迟 | < 500ms | - |
| **登录认证** | 成功率 | 99.9% | 43分钟/月 |
| **支付处理** | 成功率 | 99.99% | 4分钟/月 |

### 4.2 监控告警体系

#### 核心监控指标 (黄金信号)

```yaml
metrics:
  # 延迟 (Latency)
  - name: http_request_duration_seconds
    type: histogram
    labels: [method, endpoint, status]
    alert_threshold:
      warning: p95 > 1s
      critical: p95 > 5s

  # 流量 (Traffic)
  - name: http_requests_total
    type: counter
    labels: [method, endpoint, status]
    alert_threshold:
      anomaly_detection: true

  # 错误 (Errors)
  - name: http_errors_total
    type: counter
    labels: [method, endpoint, error_type]
    alert_threshold:
      warning: rate > 1%
      critical: rate > 5%

  # 饱和度 (Saturation)
  - name: system_cpu_usage
    alert_threshold:
      warning: > 70%
      critical: > 90%
```

#### 告警分级

| 级别 | 响应时间 | 通知方式 | 示例 |
|-----|---------|---------|------|
| P0 Critical | 5分钟 | 电话 + Slack | 服务完全不可用 |
| P1 High | 15分钟 | Slack + 邮件 | 支付失败率 > 5% |
| P2 Medium | 1小时 | Slack | 报告生成延迟 > 60s |
| P3 Low | 24小时 | 邮件 | 非核心功能异常 |

### 4.3 事故响应流程 (Incident Response)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Incident Response Workflow                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│  │ Detect  │────▶│ Triage  │────▶│ Mitigate│────▶│ Resolve │  │
│  │  告警   │     │  定级   │     │  止血   │     │  修复   │  │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  自动化监控      判断影响范围      回滚/降级       根因分析   │
│  触发告警        通知相关人员      流量切换        永久修复   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Post-Incident                         │   │
│  │  ┌─────────┐     ┌─────────┐     ┌─────────┐           │   │
│  │  │   RCA   │────▶│ Action  │────▶│ Review  │           │   │
│  │  │  复盘   │     │  Items  │     │  改进   │           │   │
│  │  └─────────┘     └─────────┘     └─────────┘           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 灾难恢复计划 (Disaster Recovery)

| 场景 | RTO | RPO | 恢复策略 |
|-----|-----|-----|---------|
| 数据库故障 | 1小时 | 5分钟 | Point-in-time recovery |
| Vercel 故障 | 30分钟 | 0 | 备用部署 (Railway/Render) |
| Supabase 故障 | 2小时 | 1小时 | 备份恢复到备用实例 |
| LLM API 故障 | 即时 | 0 | 自动切换备用提供商 |
| Stripe 故障 | 即时 | 0 | 显示维护页面，延迟处理 |

---

## Part 5: 发布与迭代流程 (Release Engineering)

### 5.1 发布检查清单

#### Pre-Release Checklist

```markdown
## 代码质量
- [ ] 所有测试通过 (`npm run test`)
- [ ] TypeScript 无类型错误 (`npm run typecheck`)
- [ ] ESLint 无错误 (`npm run lint`)
- [ ] 代码已 Review 并 Approve

## 功能验证
- [ ] 冒烟测试通过 (核心用户旅程)
- [ ] 回归测试无新 Bug
- [ ] 性能测试无退化

## 配置检查
- [ ] 环境变量已配置 (`node scripts/check-env.js`)
- [ ] 数据库迁移已就绪
- [ ] Feature Flag 状态正确

## 运维准备
- [ ] 监控仪表盘已更新
- [ ] 告警规则已配置
- [ ] 回滚计划已就绪
- [ ] On-call 人员已通知
```

#### Post-Release Checklist

```markdown
## 即时验证 (发布后 5 分钟)
- [ ] 健康检查端点正常
- [ ] 核心功能冒烟测试通过
- [ ] 无异常错误告警

## 短期监控 (发布后 1 小时)
- [ ] 错误率无明显上升
- [ ] 响应时间无明显退化
- [ ] 用户反馈无异常

## 长期跟踪 (发布后 24 小时)
- [ ] 核心指标无负面影响
- [ ] 无新增技术债务
- [ ] 文档已更新
```

### 5.2 版本策略

```
版本号格式: MAJOR.MINOR.PATCH

MAJOR: 不兼容的 API 变更或重大功能重构
MINOR: 向后兼容的功能新增
PATCH: 向后兼容的 Bug 修复

示例:
1.0.0 → 1.0.1 (Bug 修复)
1.0.1 → 1.1.0 (新增报告收藏功能)
1.1.0 → 2.0.0 (全新 AI 对话模式)
```

### 5.3 灰度发布策略

| 阶段 | 流量占比 | 持续时间 | 回滚条件 |
|-----|---------|---------|---------|
| Canary | 1% | 30分钟 | 错误率 > 1% |
| Early Adopter | 10% | 2小时 | 错误率 > 0.5% |
| Gradual Rollout | 50% | 6小时 | 错误率 > 0.1% |
| Full Release | 100% | - | - |

---

## Part 6: 持续改进机制 (Continuous Improvement)

### 6.1 周期性审计日程

| 审计类型 | 频率 | 负责人 | 输出物 |
|---------|-----|-------|-------|
| 产品指标 Review | 每周 | PM | 周报 + Action Items |
| 技术债务 Review | 每两周 | Tech Lead | 债务清单更新 |
| 安全审计 | 每月 | Security | 安全报告 |
| 架构 Review | 每季度 | Architect | ADR 文档 |
| SLO Review | 每季度 | SRE | SLO 调整建议 |

### 6.2 反馈循环

```
┌─────────────────────────────────────────────────────────────────┐
│                      Feedback Loops                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   用户反馈                                                        │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│   │ NPS 调研 │────▶│ 用户访谈 │────▶│ 需求池  │                   │
│   └─────────┘     └─────────┘     └─────────┘                   │
│                                         │                        │
│   数据驱动                               │                        │
│   ┌─────────┐     ┌─────────┐          │                        │
│   │行为分析 │────▶│ A/B 测试 │──────────┤                        │
│   └─────────┘     └─────────┘          │                        │
│                                         │                        │
│   技术反馈                               ▼                        │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│   │事故复盘 │────▶│ 性能报告 │────▶│ Roadmap │                   │
│   └─────────┘     └─────────┘     └─────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 OKR 模板

```markdown
## Q1 2025 OKR

### Objective 1: 提升用户激活率
- KR1: 新用户首次报告生成率从 X% 提升至 50%
- KR2: 注册转化率从 X% 提升至 30%
- KR3: 首日留存率从 X% 提升至 40%

### Objective 2: 实现商业化突破
- KR1: 月付费用户数达到 100
- KR2: MRR 达到 $1,000
- KR3: 用户 LTV/CAC > 3

### Objective 3: 建立工程卓越
- KR1: 测试覆盖率达到 70%
- KR2: 服务可用性 > 99.5%
- KR3: 平均部署频率 > 5次/周
```

---

# PART B: 技术检查清单

---

## Part 7: 环境配置检查

### 7.1 必需环境变量检查

> 参考文件: `.env.local.example`, `lib/config/validate.ts`

#### Supabase 配置 (必需)

| 检查项 | 变量名 | 验证规则 | 状态 |
|--------|--------|----------|------|
| [ ] Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` | 必须以 `https://` 开头 | |
| [ ] 匿名密钥 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_...` 或长度 > 100 | |
| [ ] 服务角色密钥 | `SUPABASE_SERVICE_ROLE_KEY` | `sb_...` 或长度 > 100 | |
| [ ] 存储桶 | `SUPABASE_STORAGE_REPORT_BUCKET` | 默认 "report-assets" | |

**验证命令**:
```bash
node scripts/check-supabase-keys.js
```

#### LLM 提供商配置 (至少配置其一)

| 检查项 | 变量名 | 说明 | 状态 |
|--------|--------|------|------|
| [ ] Helicone API Key | `HELICONE_API_KEY` | 优先级 1 | |
| [ ] Helicone 模型 | `HELICONE_MODEL` | 默认 gpt-4o-mini | |
| [ ] OpenRouter API Key | `OPENROUTER_API_KEY` | 优先级 2 (备用) | |
| [ ] OpenRouter 模型 | `OPENROUTER_MODEL` | 默认 openai/gpt-5.1 | |
| [ ] 嵌入模型 | `OPENROUTER_EMBEDDING_MODEL` | text-embedding-3-small | |

#### Finnhub 市场数据 (必需)

| 检查项 | 变量名 | 说明 | 状态 |
|--------|--------|------|------|
| [ ] Finnhub API Key | `FINNHUB_API_KEY` | 股票市场数据源 | |

#### 认证配置 (必需)

| 检查项 | 变量名 | 验证规则 | 状态 |
|--------|--------|----------|------|
| [ ] Auth URL | `NEXTAUTH_URL` | 有效 URL | |
| [ ] Auth Secret | `NEXTAUTH_SECRET` | 至少 32 字符 | |

#### Stripe 支付配置 (必需)

| 检查项 | 变量名 | 验证规则 | 状态 |
|--------|--------|----------|------|
| [ ] Stripe 密钥 | `STRIPE_SECRET_KEY` | `sk_...` | |
| [ ] Webhook 密钥 | `STRIPE_WEBHOOK_SECRET` | `whsec_...` | |
| [ ] 基础套餐价格 | `STRIPE_PRICE_BASIC` | `price_...` | |
| [ ] 专业套餐价格 | `STRIPE_PRICE_PRO` | `price_...` | |
| [ ] 年度套餐价格 | `STRIPE_PRICE_ANNUAL` | `price_...` | |
| [ ] 支付墙开关 | `NEXT_PUBLIC_FEATURE_PAYWALL` | true/false | |

### 7.2 可选环境变量检查

#### 可观测性配置

| 检查项 | 变量名 | 说明 | 状态 |
|--------|--------|------|------|
| [ ] Langfuse 公钥 | `LANGFUSE_PUBLIC_KEY` | LLM 追踪 | |
| [ ] Langfuse 私钥 | `LANGFUSE_SECRET_KEY` | LLM 追踪 | |
| [ ] Langfuse 主机 | `LANGFUSE_HOST` | 服务器地址 | |
| [ ] 采样率 | `LANGFUSE_SAMPLING_RATE` | 默认 1.0 | |
| [ ] Sentry DSN | `SENTRY_DSN` | 错误追踪 | |

#### 缓存与限流配置

| 检查项 | 变量名 | 说明 | 状态 |
|--------|--------|------|------|
| [ ] Redis URL | `UPSTASH_REDIS_REST_URL` | Upstash Redis | |
| [ ] Redis Token | `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | |

### 7.3 品牌配置检查

> 参考文件: `lib/config/brand.ts`

| 检查项 | 变量名 | 默认值 | 状态 |
|--------|--------|--------|------|
| [ ] 品牌名称 | `NEXT_PUBLIC_BRAND_NAME` | "Qiltrack AI" | |
| [ ] 短品牌名 | `NEXT_PUBLIC_BRAND_SHORT` | "Qiltrack" | |
| [ ] 域名 | `NEXT_PUBLIC_DOMAIN` | "qiltrack.com" | |
| [ ] 管理员邮箱域名 | `NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN` | "qiltrack.com" | |

### 7.4 验证脚本

```bash
# 完整环境检查
node scripts/check-env.js

# 预期输出: 所有检查项通过，无 MISSING 或 INVALID 标记
```

---

## Part 8: 数据库检查

### 8.1 迁移文件完整性检查

> 参考目录: `supabase/migrations/`

确认以下迁移文件存在:

| 序号 | 迁移文件 | 用途 | 状态 |
|------|----------|------|------|
| [ ] 1 | `20251123000001_init_schema.sql` | 初始化完整数据库架构 | |
| [ ] 2 | `20251124000002_align_hosted_schema.sql` | 对齐托管环境 schema | |
| [ ] 3 | `20251128000003_sync_quota_schema.sql` | 同步配额系统 schema | |
| [ ] 4 | `20251128000004_report_assets_rls.sql` | 报告资产存储 RLS 策略 | |
| [ ] 5 | `20251129000005_report_embeddings_and_template_nullable.sql` | 添加 pgvector 嵌入表 | |
| [ ] 6 | `20251129000006_report_posts_and_uploads.sql` | 报告发布和用户上传功能 | |
| [ ] 7 | `20251130000001_init_user_credits_30.sql` | 初始化用户积分为 30 | |
| [ ] 8 | `20251130000006_match_reports_embeddings.sql` | 相似报告匹配函数 | |
| [ ] 9 | `20251130100000_add_auth_helpers.sql` | 认证辅助函数 | |
| [ ] 10 | `20251201000000_unify_credits_system.sql` | 统一积分系统 | |
| [ ] 11 | `20251201000001_report_hub_refresh.sql` | 报告 Hub 刷新功能 | |
| [ ] 12 | `20251202100000_admin_view_all_users.sql` | 管理员查看所有用户 | |
| [ ] 13 | `20251202100001_fix_security_issues.sql` | 修复安全问题 | |
| [ ] 14 | `20251202120000_add_admin_foxmail.sql` | 添加管理员账户 | |
| [ ] 15 | `20251202130000_fix_rls_recursion.sql` | 修复 RLS 递归问题 | |
| [ ] 16 | `20251203000010_fix_report_posts_schema.sql` | 修复报告发布 schema | |
| [ ] 17 | `20251203000011_fix_audit_logs_schema.sql` | 修复审计日志 schema | |
| [ ] 18 | `20251203000012_add_symbol_to_report_posts.sql` | 添加股票代码字段 | |
| [ ] 19 | `20251204100000_set_super_admin.sql` | 设置超级管理员 | |
| [ ] 20 | `20251205100000_auto_create_profile_on_signup.sql` | 注册时自动创建 profile | |
| [ ] 21 | `20251205200000_update_admin_domain.sql` | 更新管理员域名 | |
| [ ] 22 | `20251205300000_emergency_fix_all.sql` | 紧急修复 | |

**验证命令**:
```bash
node scripts/check-migrations.mjs
```

### 8.2 核心表结构验证

| 检查项 | 表名 | 用途 | 状态 |
|--------|------|------|------|
| [ ] 用户档案 | `profiles` | 关联 auth.users | |
| [ ] 报告积分 | `report_credits` | 用户积分余额 | |
| [ ] 积分事件 | `report_credit_events` | 积分变动记录 | |
| [ ] 报告运行 | `report_runs` | 报告生成记录 | |
| [ ] 报告文档 | `report_documents` | 报告文档存储 | |
| [ ] 报告模板 | `report_templates` | 报告模板 | |
| [ ] 报告嵌入 | `reports_embeddings` | 向量嵌入 (pgvector) | |
| [ ] 报告发布 | `report_posts` | 策划发布的报告 | |
| [ ] 用户上传 | `user_report_uploads` | 用户上传的报告 | |
| [ ] 订阅计费 | `billing_subscriptions` | 订阅信息 | |
| [ ] 每日奖励 | `daily_rewards` | 奖励追踪 | |
| [ ] 审计日志 | `audit_logs` | 审计日志 | |

**验证命令**:
```bash
node scripts/check-schema.mjs
```

### 8.3 RPC 函数验证

| 检查项 | 函数名 | 用途 | 状态 |
|--------|--------|------|------|
| [ ] 初始化档案 | `fn_initialize_profile` | 初始化用户 profile 和积分 | |
| [ ] 消费积分 | `fn_consume_report_credit` | 原子消费积分 | |
| [ ] 授予积分 | `fn_grant_credits` | 管理员授予积分 | |
| [ ] 获取积分 | `fn_get_user_credits` | 获取用户积分 | |
| [ ] 每日奖励 | `fn_claim_daily_reward` | 领取每日奖励 (10积分) | |
| [ ] 检查密码 | `fn_user_has_password` | 检查用户是否有密码 | |
| [ ] 获取身份 | `fn_get_user_identities` | 获取用户身份提供商 | |
| [ ] 查找报告 | `fn_find_reusable_report` | 查找可复用报告 | |
| [ ] 热门股票 | `fn_get_popular_symbols` | 获取热门股票 | |
| [ ] 计算哈希 | `fn_compute_report_hash` | 计算报告哈希 | |
| [ ] 相似匹配 | `match_reports_embeddings` | 相似报告匹配 | |
| [ ] 管理员检查 | `is_admin` | 检查用户是否为管理员 | |
| [ ] 新用户处理 | `handle_new_user` | 新用户注册触发器 | |

**验证方式**: 在 Supabase Dashboard > SQL Editor 执行:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%' OR proname IN ('is_admin', 'handle_new_user', 'match_reports_embeddings');
```

### 8.4 RLS 策略验证

| 检查项 | 表名 | 策略类型 | 状态 |
|--------|------|---------|------|
| [ ] profiles | SELECT: 用户只能查看自己 / 管理员查看全部 | |
| [ ] report_credits | SELECT/UPDATE: 用户只能操作自己 | |
| [ ] report_runs | SELECT: 用户只能查看自己 / 管理员查看全部 | |
| [ ] audit_logs | INSERT: 任何认证用户 / SELECT: 仅管理员 | |

**验证命令**:
```bash
node scripts/inspect-hosted-schema.mjs
```

---

## Part 9: 第三方服务集成检查

### 9.1 Supabase 连接检查

> 参考文件: `lib/supabase/`

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|----------|----------|------|
| [ ] 数据库连接 | 访问任意页面 | 无连接错误 | |
| [ ] Auth 服务 | 登录页面 | 可正常渲染 | |
| [ ] Storage 服务 | 上传报告资产 | 上传成功 | |
| [ ] Realtime | 管理后台 | 实时更新生效 | |

**手动测试**:
```bash
curl http://localhost:3000/api/health
# 预期: {"status":"ok","timestamp":"..."}
```

### 9.2 Stripe 支付集成检查

> 参考文件: `lib/stripe/client.ts`

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|----------|----------|------|
| [ ] API 密钥有效 | Stripe Dashboard | 密钥状态正常 | |
| [ ] Webhook 端点 | Stripe Dashboard > Webhooks | 端点已配置且活跃 | |
| [ ] 价格 ID 有效 | Stripe Dashboard > Products | 价格存在且活跃 | |
| [ ] 测试模式 | 密钥以 `sk_test_` 开头 | 开发环境使用测试密钥 | |

**Webhook 事件检查**:
- [ ] `checkout.session.completed`
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`

### 9.3 Finnhub API 检查

> 参考文件: `lib/services/market-data.ts`

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|----------|----------|------|
| [ ] API 密钥有效 | 调用 /api/search?q=AAPL | 返回搜索结果 | |
| [ ] 配额充足 | Finnhub Dashboard | API 调用配额正常 | |
| [ ] 数据可用 | 调用 /api/quote?symbol=AAPL | 返回报价数据 | |

**手动测试**:
```bash
curl "http://localhost:3000/api/search?q=AAPL"
curl "http://localhost:3000/api/quote?symbol=AAPL"
```

### 9.4 LLM 服务检查

> 参考文件: `lib/services/llm.ts`

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|----------|----------|------|
| [ ] Helicone 连接 | 生成测试报告 | 成功返回或明确错误 | |
| [ ] OpenRouter 备用 | Helicone 失败时 | 自动切换到 OpenRouter | |
| [ ] 嵌入生成 | 报告生成后 | 嵌入向量已保存 | |

**测试脚本**:
```bash
node scripts/test-report-generation.js
```

### 9.5 可观测性服务检查

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|----------|----------|------|
| [ ] Langfuse 连接 | Langfuse Dashboard | 有 trace 数据 | |
| [ ] Sentry 连接 | 触发测试错误 | Sentry 收到错误 | |

### 9.6 缓存服务检查 (Upstash Redis)

> 参考文件: `lib/cache/redis.ts`

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|----------|----------|------|
| [ ] Redis 连接 | Admin > System > Cache | 显示缓存统计 | |
| [ ] 市场数据缓存 | 重复搜索同一股票 | 第二次更快 | |
| [ ] 报告缓存 | 重复生成同一报告 | 命中缓存 | |

---

## Part 10: 认证与核心功能检查

### 10.1 认证系统检查

#### 密码登录流程

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 正常登录 | 输入正确邮箱密码 | 登录成功，跳转首页 | |
| [ ] 错误密码 | 输入错误密码 | 显示错误提示 | |
| [ ] 空字段验证 | 提交空表单 | 显示验证错误 | |
| [ ] Session 持久化 | 刷新页面 | 保持登录状态 | |

#### Magic Link 流程

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 发送链接 | 输入邮箱请求 Magic Link | 邮件发送成功提示 | |
| [ ] 邮件接收 | 检查收件箱 | 收到 Magic Link 邮件 | |
| [ ] 点击登录 | 点击邮件中的链接 | 自动登录成功 | |
| [ ] 链接过期 | 使用过期链接 | 显示错误提示 | |
| [ ] 冷却时间 | 60秒内重复请求 | 显示冷却提示 | |

#### OAuth 流程 (Google)

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 跳转 Google | 点击 Google 登录按钮 | 跳转到 Google 授权页 | |
| [ ] 授权成功 | 在 Google 页面授权 | 回调并登录成功 | |
| [ ] Profile 创建 | 首次 OAuth 登录 | 自动创建用户档案 | |
| [ ] 关联账户 | 已有账户的邮箱 | 正确关联 | |

#### 密码重置流程

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 发送重置邮件 | 点击忘记密码 | 邮件发送成功 | |
| [ ] 邮件链接有效 | 点击邮件链接 | 跳转到重置页面 | |
| [ ] 新密码设置 | 输入新密码 | 密码更新成功 | |
| [ ] 密码强度验证 | 输入弱密码 | 显示强度要求 | |

#### 注册流程

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 正常注册 | 填写有效信息 | 发送确认邮件 | |
| [ ] 确认邮件 | 点击确认链接 | 账户激活成功 | |
| [ ] 重复邮箱 | 使用已存在邮箱 | 显示重复提示 | |
| [ ] 初始积分 | 新用户登录 | 拥有 30 积分 | |

### 10.2 核心功能检查

#### 股票搜索功能

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 代码搜索 | 输入 "AAPL" | 显示 Apple Inc. | |
| [ ] 名称搜索 | 输入 "Tesla" | 显示 TSLA | |
| [ ] 模糊搜索 | 输入 "micros" | 显示 Microsoft | |
| [ ] 空结果处理 | 输入无效字符 | 显示无结果 | |
| [ ] 搜索防抖 | 快速输入 | 不会频繁请求 | |

#### 报告生成功能

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 正常生成 | 选择 AAPL，点击生成 | 报告生成成功 | |
| [ ] 积分扣除 | 生成后检查积分 | 扣除 30 积分 | |
| [ ] 进度显示 | 生成过程中 | 显示进度条 | |
| [ ] 错误处理 | 无效股票代码 | 显示错误提示 | |

#### 报告风格测试 (4种)

| 风格 | 检查项 | 预期结果 | 状态 |
|------|--------|----------|------|
| [ ] baseline | 标准流程 | 证据优先的分析报告 | |
| [ ] buffett | 价值投资 | 巴菲特风格分析 | |
| [ ] musk | 科技乐观 | 马斯克风格分析 | |
| [ ] muddy | 做空视角 | 浑水风格分析 | |

#### 语言测试 (5种)

| 语言 | 检查项 | 预期结果 | 状态 |
|------|--------|----------|------|
| [ ] en | 英文 | 英文报告 | |
| [ ] zh-Hans | 简体中文 | 简体中文报告 | |
| [ ] zh-Hant | 繁体中文 | 繁体中文报告 | |
| [ ] ja | 日语 | 日语报告 | |
| [ ] ko | 韩语 | 韩语报告 | |

### 10.3 积分系统检查

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 初始积分 | 新用户注册 | 拥有 30 积分 | |
| [ ] 每日奖励 | 点击签到按钮 | 获得 10 积分 | |
| [ ] 奖励冷却 | 24小时内重复签到 | 显示已领取 | |
| [ ] 消费记录 | 生成报告后 | 记录在积分事件表 | |
| [ ] 余额不足 | 0积分时生成报告 | 显示积分不足提示 | |

### 10.4 报告复用与导出

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 个人复用 | 7天内生成相同报告 | 免费返回缓存报告 | |
| [ ] 跨用户复用 | 当天生成相同报告 | 返回复用报告(仍扣积分) | |
| [ ] 复制到剪贴板 | 点击复制按钮 | 富文本复制成功 | |
| [ ] DOCX 导出 | 点击 DOCX 按钮 | 下载 DOCX 文件 | |
| [ ] PDF 导出 | 点击 PDF 按钮 | 下载 PDF 文件 | |

---

## Part 11: 支付与管理后台检查

### 11.1 支付订阅检查

#### Checkout 流程

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] Pro 订阅 | 点击 Pro 订阅按钮 | 跳转 Stripe Checkout | |
| [ ] Annual 订阅 | 点击年度订阅按钮 | 跳转 Stripe Checkout | |
| [ ] 测试支付 | 使用测试卡支付 | 支付成功返回 | |
| [ ] 会员升级 | 支付成功后 | 用户 plan 字段更新 | |

**测试卡号**: `4242 4242 4242 4242`

#### Webhook 事件处理

| 检查项 | 事件 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 结账完成 | `checkout.session.completed` | 用户升级为付费会员 | |
| [ ] 支付成功 | `invoice.payment_succeeded` | 订阅状态更新为 active | |
| [ ] 支付失败 | `invoice.payment_failed` | 标记为 past_due | |
| [ ] 订阅更新 | `customer.subscription.updated` | 同步订阅状态 | |
| [ ] 订阅取消 | `customer.subscription.deleted` | 降级为 free 用户 | |

#### 订阅状态检查

| 检查项 | 数据库字段 | 预期值 | 状态 |
|--------|-----------|--------|------|
| [ ] 套餐类型 | `profiles.plan` | free/pro/annual | |
| [ ] 客户 ID | `profiles.stripe_customer_id` | cus_... | |
| [ ] 订阅 ID | `profiles.stripe_subscription_id` | sub_... | |
| [ ] 订阅状态 | `profiles.subscription_status` | active/past_due/canceled | |

### 11.2 Admin 后台检查

#### 仪表盘功能

| 检查项 | 组件 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 核心指标 | 指标卡片 | 显示正确数据 | |
| [ ] 趋势图表 | 14天趋势 | 图表正常渲染 | |
| [ ] 套餐分布 | 饼图 | 显示套餐比例 | |
| [ ] 活跃用户 | TOP 5 列表 | 显示活跃排行 | |
| [ ] 实时活动 | 活动 Feed | 显示最近活动 | |

#### 用户管理

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 用户列表 | 访问 /admin/users | 显示用户列表 | |
| [ ] 搜索过滤 | 输入搜索词 | 过滤结果正确 | |
| [ ] 创建用户 | 点击创建按钮 | 用户创建成功 | |
| [ ] 编辑用户 | 点击编辑按钮 | 信息更新成功 | |
| [ ] 删除用户 | 点击删除按钮 | 用户删除成功 | |
| [ ] 批量操作 | 选择多个用户 | 批量操作成功 | |

#### 积分管理

| 检查项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 积分列表 | 访问 /admin/credits | 显示积分数据 | |
| [ ] 授予积分 | 给用户授予积分 | 积分增加成功 | |
| [ ] 扣除积分 | 给用户扣除积分 | 积分减少成功 | |
| [ ] 积分历史 | 查看用户积分历史 | 显示事件记录 | |

#### 系统监控

| 检查项 | 页面 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 健康检查 | /admin/system/health | 显示服务状态 | |
| [ ] 缓存监控 | /admin/system/cache | 显示缓存统计 | |
| [ ] 审计日志 | /admin/system/audit-logs | 显示操作日志 | |
| [ ] 系统配置 | /admin/system/config | 显示配置信息 | |

---

## Part 12: API、安全与性能检查

### 12.1 API 端点检查

#### 公共 API

| 端点 | 方法 | 预期状态码 | 预期响应 | 状态 |
|------|------|-----------|----------|------|
| [ ] `/api/health` | GET | 200 | `{"status":"ok"}` | |
| [ ] `/api/search?q=AAPL` | GET | 200 | 搜索结果数组 | |
| [ ] `/api/quote?symbol=AAPL` | GET | 200 | 报价数据 | |
| [ ] `/api/report?symbol=AAPL` | GET | 200/401 | 报告内容或认证错误 | |
| [ ] `/api/report/credits` | GET | 200/401 | 积分数据或认证错误 | |
| [ ] `/api/report/posts` | GET | 200 | 报告列表 | |
| [ ] `/api/report/popular` | GET | 200 | 热门报告 | |

#### 管理员 API

| 端点 | 方法 | 认证要求 | 预期状态码 | 状态 |
|------|------|---------|-----------|------|
| [ ] `/api/admin/users/create` | POST | admin | 200/403 | |
| [ ] `/api/admin/users/grant-credits` | POST | admin | 200/403 | |
| [ ] `/api/admin/analytics` | GET | admin | 200/403 | |
| [ ] `/api/admin/audit-logs` | GET | admin | 200/403 | |
| [ ] `/api/admin/cache` | GET | admin | 200/403 | |
| [ ] `/api/admin/metrics` | GET | admin | 200/403 | |

#### 速率限制检查

| 检查项 | 限制 | 验证方法 | 状态 |
|--------|------|---------|------|
| [ ] 报告生成 | 5次/分钟/用户 | 快速连续请求 6 次 | |
| [ ] 全局 API | 20次/秒/IP | 快速连续请求 25 次 | |

### 12.2 安全审计

#### 环境变量安全

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|---------|----------|------|
| [ ] .env 文件不在 git | `git status` | 不显示 .env 文件 | |
| [ ] 客户端变量前缀 | 检查代码 | 仅 `NEXT_PUBLIC_` 前缀暴露客户端 | |
| [ ] 密钥不硬编码 | 代码搜索 | 无硬编码密钥 | |

#### RLS 策略安全

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|---------|----------|------|
| [ ] 用户数据隔离 | 切换用户查询 | 只能看到自己的数据 | |
| [ ] 管理员权限 | 管理员登录 | 可查看所有数据 | |
| [ ] 匿名访问限制 | 未登录访问 | 无法访问敏感数据 | |

#### API 认证安全

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|---------|----------|------|
| [ ] 认证必需接口 | 未登录访问 | 返回 401 | |
| [ ] 管理员接口 | 普通用户访问 | 返回 403 | |
| [ ] Webhook 签名 | 伪造 webhook | 签名验证失败 | |

#### 输入验证

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|---------|----------|------|
| [ ] XSS 防护 | 输入 `<script>` 标签 | 内容被转义 | |
| [ ] SQL 注入 | 输入 SQL 注入字符串 | 无效果 | |
| [ ] 文件上传验证 | 上传恶意文件 | 被拒绝 | |

#### 敏感数据处理

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|---------|----------|------|
| [ ] 密码哈希 | 检查数据库 | 密码已加密存储 | |
| [ ] 日志脱敏 | 检查日志 | 无敏感数据明文 | |
| [ ] 错误消息 | 触发错误 | 不泄露系统信息 | |

### 12.3 性能检查

#### 缓存性能

| 检查项 | 指标 | 预期值 | 状态 |
|--------|------|--------|------|
| [ ] 市场数据缓存命中率 | Admin > Cache | > 70% | |
| [ ] 报告缓存命中率 | Admin > Cache | > 50% | |
| [ ] Redis 响应时间 | Admin > Cache | < 50ms | |

#### API 响应时间

| 端点 | 预期响应时间 | 状态 |
|------|-------------|------|
| [ ] `/api/health` | < 100ms | |
| [ ] `/api/search` | < 500ms | |
| [ ] `/api/quote` | < 1s | |
| [ ] `/api/report` (生成) | < 30s | |

#### 数据库查询性能

| 检查项 | 验证方法 | 预期结果 | 状态 |
|--------|---------|----------|------|
| [ ] 慢查询 | Supabase Dashboard | 无 > 1s 查询 | |
| [ ] 索引使用 | EXPLAIN ANALYZE | 使用索引 | |
| [ ] 连接池 | 监控连接数 | 未达上限 | |

#### 前端性能

| 检查项 | 工具 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] LCP | Lighthouse | < 2.5s | |
| [ ] FID | Lighthouse | < 100ms | |
| [ ] CLS | Lighthouse | < 0.1 | |
| [ ] Bundle Size | build 输出 | 首屏 < 200KB | |

### 12.4 技术债务审计

#### 代码质量检查

```bash
# TypeScript 类型检查
npm run typecheck

# ESLint 检查
npm run lint

# 预期: 无错误
```

| 检查项 | 命令 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] TypeScript 无错误 | `npm run typecheck` | 0 errors | |
| [ ] ESLint 无错误 | `npm run lint` | 0 errors | |
| [ ] 无 any 类型 | 搜索 `: any` | 尽量少 | |

#### 依赖检查

```bash
# 检查过时依赖
npm outdated

# 检查安全漏洞
npm audit
```

| 检查项 | 命令 | 预期结果 | 状态 |
|--------|------|----------|------|
| [ ] 无高危漏洞 | `npm audit` | 0 high/critical | |
| [ ] 主要依赖最新 | `npm outdated` | Next.js, React 最新 | |

#### 测试覆盖率

```bash
npm run test
npm run test:coverage
```

| 检查项 | 预期值 | 状态 |
|--------|--------|------|
| [ ] 单元测试通过率 | 100% | |
| [ ] 代码覆盖率 | > 60% | |
| [ ] 关键路径覆盖 | > 80% | |

---

# PART C: 附录

---

## Appendix A: 操作手册速查

### A.1 常用命令

```bash
# 开发环境
npm run dev                    # 启动开发服务器
npm run test                   # 运行测试
npm run typecheck              # TypeScript 检查
npm run lint                   # ESLint 检查

# 数据库操作
node scripts/check-migrations.mjs      # 检查迁移状态
node scripts/apply-migration.js        # 应用迁移
node scripts/backup-database.ps1       # 备份数据库

# 诊断工具
node scripts/check-env.js              # 环境检查
node scripts/check-supabase-keys.js    # Supabase 密钥检查
node scripts/test-report-generation.js # 报告生成测试
curl http://localhost:3000/api/health  # 健康检查
```

### A.2 关键文件索引

| 类别 | 文件路径 | 说明 |
|-----|---------|------|
| 配置 | `lib/config/validate.ts` | 环境变量验证 |
| 认证 | `hooks/useSupabaseAuth.ts` | 认证 Hook |
| 管理员认证 | `lib/auth/admin.ts` | 管理员权限验证 |
| 积分 | `lib/core/credits/manager.ts` | 积分管理 |
| 报告 | `lib/core/reports/generator.ts` | 报告生成 |
| LLM | `lib/services/llm.ts` | LLM 服务 |
| 支付 | `lib/stripe/client.ts` | Stripe 集成 |
| 数据库 | `supabase/migrations/` | 迁移文件 |

### A.3 联系与支持

| 角色 | 职责 | 联系方式 |
|-----|-----|---------|
| Product Owner | 产品决策 | |
| Tech Lead | 技术决策 | |
| On-Call | 生产问题 | |

---

## Appendix B: 决策记录 (ADR)

### ADR-001: 选择 Supabase 作为 BaaS

**状态**: 已采纳
**日期**: 2025-11
**背景**: 需要快速搭建具备认证、数据库、存储的后端服务
**决策**: 使用 Supabase (PostgreSQL + Auth + Storage)
**原因**: 开发速度快、成本低、生态完善
**后果**: 与 Supabase 形成强依赖，迁移成本较高

### ADR-002: LLM 双提供商策略

**状态**: 已采纳
**日期**: 2025-11
**背景**: 单一 LLM 提供商存在可用性风险
**决策**: Helicone 优先，OpenRouter 作为备用
**原因**: 保证服务可用性，成本优化
**后果**: 需要维护两套配置，增加复杂度

---

## Appendix C: 故障排查指南

### C.1 常见问题

#### 环境变量问题

**症状**: 启动时报错 "Missing required environment variable"

**解决方案**:
1. 复制 `.env.local.example` 为 `.env.local`
2. 填写所有必需变量
3. 运行 `node scripts/check-env.js` 验证

#### 数据库连接问题

**症状**: "Failed to connect to database" 或 "relation does not exist"

**解决方案**:
1. 检查 Supabase URL 和密钥
2. 运行 `node scripts/check-migrations.mjs`
3. 如有缺失迁移，运行 `node scripts/apply-migration.js`

#### LLM 服务问题

**症状**: 报告生成失败，提示 "LLM provider error"

**解决方案**:
1. 检查 Helicone/OpenRouter API 密钥
2. 确认 API 配额充足
3. 检查模型名称配置

#### 支付问题

**症状**: Stripe Checkout 跳转失败

**解决方案**:
1. 验证 Stripe 密钥 (测试/生产环境区分)
2. 检查价格 ID 是否有效
3. 确认 Webhook 端点已配置

### C.2 诊断脚本清单

| 脚本 | 用途 | 命令 |
|------|------|------|
| 环境检查 | 检查环境变量 | `node scripts/check-env.js` |
| 密钥检查 | 检查 Supabase 密钥 | `node scripts/check-supabase-keys.js` |
| 迁移检查 | 检查数据库迁移 | `node scripts/check-migrations.mjs` |
| Schema 检查 | 检查数据库结构 | `node scripts/check-schema.mjs` |
| 报告测试 | 测试报告生成 | `node scripts/test-report-generation.js` |
| 健康报告 | 每日健康报告 | `bash scripts/daily-health-report.sh` |

### C.3 日志位置

| 日志类型 | 位置 |
|---------|------|
| 应用日志 | Vercel Dashboard > Logs |
| 数据库日志 | Supabase Dashboard > Logs |
| LLM 追踪 | Langfuse Dashboard |
| 错误追踪 | Sentry Dashboard |
| 支付日志 | Stripe Dashboard > Logs |

---

## 检查清单汇总

### 快速检查 (部署前必做)

- [ ] 所有必需环境变量已配置
- [ ] 数据库迁移已全部应用
- [ ] 第三方服务连接正常
- [ ] 健康检查端点返回 200
- [ ] 登录功能正常
- [ ] 报告生成功能正常

### 完整检查 (重大更新后)

- [ ] 完成 Part 7-12 所有技术检查项
- [ ] 运行所有诊断脚本
- [ ] 执行完整测试套件
- [ ] 安全审计通过
- [ ] 性能指标达标

---

> **文档所有者**: Product & Engineering Team
> **审核周期**: 每月更新
> **下次审核**: 2026-01-05
