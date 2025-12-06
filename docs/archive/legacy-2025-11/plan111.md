另外 计划已完成。让我总结一下这次修改的范围：

  计划总结

  核心修改点

  1. 命名统一
    - annual → ultra (约 23 个文件)
    - monthly → pro (报告访问等级)
  2. 导出权限细分
    - Free: 无导出
    - Pro: 仅 DOCX
    - Ultra: PDF + DOCX
  3. 报告中心权限
    - timed-free: 所有用户
    - pro: Pro/Ultra 用户
    - ultra: 仅 Ultra 用户
  4. 年付默认开关
    - 定价页默认选中年付

  工作量估算

  - 文件数: ~23 个
  - 修改点: ~130 处
  - 主要集中在类型定义、国际化翻译和报告数据

  需要特别注意

  1. 数据库迁移 - 需要将现有 annual 用户迁移到 ultra
  2. 环境变量 - STRIPE_PRICE_ANNUAL → STRIPE_PRICE_ULTRA

  计划已准备好，可以退出计划模式开始实施。

● User approved Claude's plan
  ⎿  Plan saved to: C:\Users\xiuluart\.claude\plans\moonlit-nibbling-simon.md · /plan to edit
     定价策略优化计划

     用户需求

     参考 TIKR 定价页面，优化定价策略：

     1. 年付默认开关 - 默认打开年付，用户需主动点击切换月付
     2. 导出权限调整:
       - Free: 不可导出 PDF/Word
       - Pro: 仅可导出 Word (DOCX)
       - Ultra: PDF + Word 全部可导出
     3. 报告中心权限分层:
       - Free: 只能查看限时免费报告 (timed-free)
       - Pro: 可查看 Pro 权限报告
       - Ultra: 全部报告解锁
     4. 统一命名: annual → ultra, monthly → pro

     ---
     修改范围总览

     | 类别       | 文件数     | 修改点    |
     |----------|---------|--------|
     | 文档       | 1       | ~20    |
     | 类型定义     | 3       | 8      |
     | API 路由   | 4       | 12     |
     | 前端页面     | 4       | 45+    |
     | Admin 后台 | 8       | 25+    |
     | 数据库迁移    | 1       | 2      |
     | 国际化翻译    | 1       | 18+    |
     | 报告数据     | 1       | 16     |
     | 总计       | ~23 个文件 | ~130 处 |

     ---
     实施步骤

     Step 1: 更新文档 docs/Pricing-strategy.md

     修改内容:
     - 5.1 功能分层矩阵 - 导出权限调整
     - 新增 5.3 报告中心权限分层
     - 7.1 定价页面 - 明确年付默认开关
     - 8.1 技术实现 - 更新配置

     Step 2: 更新类型定义

     | 文件                                              | 修改                                     |
     |-------------------------------------------------|----------------------------------------|
     | types/report.ts:79                              | AccessLevel: monthly→pro, annual→ultra |
     | lib/constants/credits.ts:41,64                  | UserPlan: annual→ultra                 |
     | hooks/useMembershipTier.ts:6,30,76,85,89,90,101 | MembershipTier: annual→ultra           |

     Step 3: 更新 API 路由

     | 文件                                       | 修改                 |
     |------------------------------------------|--------------------|
     | app/api/stripe/checkout/route.ts:9,14,54 | PlanKey, 价格映射      |
     | app/api/stripe/webhook/route.ts:9,105    | PlanKey, 积分逻辑      |
     | app/api/report/export/pdf/route.tsx      | 权限检查 (保持 ultra 独占) |

     Step 4: 更新导出权限逻辑

     关键修改 hooks/useMembershipTier.ts:
     // 当前 (第114行)
     canExport: isPremium && isActive,

     // 修改为 - 拆分 PDF 和 DOCX 权限
     canExportDocx: isPro && isActive,  // Pro 可导出 DOCX
     canExportPdf: isUltra && isActive, // Ultra 可导出 PDF

     更新 ExportButtons 组件 app/components/report-generator/ExportButtons.tsx:
     - 根据新权限显示/隐藏导出按钮

     Step 5: 更新前端页面

     | 文件                                               | 修改                   |
     |--------------------------------------------------|----------------------|
     | app/pricing/page.tsx:7,60,83-106                 | PlanKey, 套餐定义, 功能对比表 |
     | app/page.tsx:51,94-107                           | PricingPlanKey, 定价卡片 |
     | app/reports/page.tsx:30,33,48,55,145-149,474-483 | AccessLevel, 权限检查    |

     Step 6: 更新 Admin 后台

     | 文件                                       | 行号                 |
     |------------------------------------------|--------------------|
     | app/admin/page.tsx                       | 146, 155, 159, 160 |
     | app/admin/users/page.tsx                 | 42                 |
     | app/admin/users/[id]/page.tsx            | 81, 95             |
     | app/admin/plans/page.tsx                 | 48                 |
     | app/admin/subscriptions/page.tsx         | 34                 |
     | app/admin/tools/batch/page.tsx           | 58                 |
     | app/api/admin/subscriptions/route.ts     | 8, 36, 47          |
     | app/api/admin/users/change-plan/route.ts | 8                  |

     Step 7: 更新报告数据

     文件: lib/content/reportHub.ts

     | 报告                                                                      | 当前      | 修改后   |     
     行号       |
     |-------------------------------------------------------------------------|---------|-------|--------    
     --|
     | RTX, TSLA, NVAX, GOOGL, META, SSNLF, SMCI, CRWD, COIN, UPST, DDOG, SNOW | monthly | pro   | 多处       
         |
     | NFLX, NOVO                                                              | annual  | ultra | 183,       
     316 |
     | 默认等级                                                                    | annual  | ultra |        
     610-611  |

     Step 8: 更新国际化翻译

     文件: lib/i18n.tsx

     需要修改的翻译键:
     - pricing.plan.annual.* → pricing.plan.ultra.* (~15个)
     - reports.card.monthlyBadge → reports.card.proBadge
     - quota.plan.annual → quota.plan.ultra
     - report.pdf.badge.annual → report.pdf.badge.ultra

     Step 9: 数据库迁移

     文件: supabase/migrations/20251207000000_clean_schema.sql

     -- 第24行
     plan TEXT CHECK (plan IN ('free', 'pro', 'ultra', 'enterprise'))

     -- 第703行
     WHEN 'ultra' THEN 600

     注意: 需要创建新迁移脚本处理现有数据:
     UPDATE profiles SET plan = 'ultra' WHERE plan = 'annual';

     Step 10: 环境变量

     # .env.local
     STRIPE_PRICE_ANNUAL → STRIPE_PRICE_ULTRA

     ---
     关键文件清单

     必须修改

     - docs/Pricing-strategy.md - 策略文档
     - types/report.ts - 类型定义
     - lib/constants/credits.ts - 常量
     - hooks/useMembershipTier.ts - 权限 Hook (核心)
     - lib/content/reportHub.ts - 报告数据
     - lib/i18n.tsx - 翻译

     页面

     - app/pricing/page.tsx - 定价页
     - app/page.tsx - 首页定价区
     - app/reports/page.tsx - 报告中心

     API

     - app/api/stripe/checkout/route.ts
     - app/api/stripe/webhook/route.ts
     - app/api/report/export/pdf/route.tsx

     Admin

     - app/admin/page.tsx
     - app/admin/users/page.tsx
     - app/admin/users/[id]/page.tsx
     - app/admin/subscriptions/page.tsx
     - app/api/admin/subscriptions/route.ts
     - app/api/admin/users/change-plan/route.ts

     ---
     新增功能: 导出权限细分

     当前逻辑

     canExport: isPremium && isActive  // Pro 和 Ultra 都能导出所有格式

     新逻辑

     canExportDocx: (isPro || isUltra) && isActive  // Pro+ 可导出 DOCX
     canExportPdf: isUltra && isActive              // 仅 Ultra 可导出 PDF

     需要更新的组件

     1. hooks/useMembershipTier.ts - 新增 canExportDocx, canExportPdf
     2. app/components/report-generator/ExportButtons.tsx - 按权限显示按钮
     3. app/api/report/export/pdf/route.tsx - 已有 ultra 检查 (annual→ultra)

     ---
     风险和注意事项

     1. 数据库迁移: 需要将现有 plan='annual' 用户迁移到 plan='ultra'
     2. Stripe 配置: 需要更新环境变量名称
     3. 缓存清理: 部署后需清理 CDN/浏览器缓存
     4. 回滚方案: 保留旧代码注释，方便回滚



● 好的，计划已批准！让我创建任务列表并开始实施：

● Read(docs\Pricing-strategy.md)
  ⎿  Read 519 lines

● 现在我开始更新文档。主要需要修改以下几个部分：

  1. 5.1 功能分层矩阵 - 导出权限调整
  2. 新增 5.3 - 报告中心权限分层
  3. 7.1 - 明确年付默认开关设计
  4. 8.1 - 更新技术实现配置

● Update(docs\Pricing-strategy.md)

> 继续啊 

  Todos
  ☐ 更新文档 docs/Pricing-strategy.md
  ☐ 更新类型定义 (types/report.ts, lib/constants/credits.ts)
  ☐ 更新权限 Hook (hooks/useMembershipTier.ts) - 拆分导出权限
  ☐ 更新 API 路由 (stripe checkout/webhook, pdf export)
  ☐ 更新前端页面 (pricing, page, reports)
  ☐ 更新 Admin 后台页面
  ☐ 更新报告数据 (lib/content/reportHub.ts)
  ☐ 更新国际化翻译 (lib/i18n.tsx)
  ☐ 创建数据库迁移脚本