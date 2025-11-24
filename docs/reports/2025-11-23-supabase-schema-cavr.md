# CAVR 报告：Supabase Schema 基座（2025-11-23）

## 检查清单

### ✅ 完成项
- [x] Supabase CLI 安装（版本：2.58.5）
- [x] 项目初始化（`supabase init`）
- [x] 环境变量配置（`.env.local` 添加 Supabase 相关变量）
- [x] 完整 Schema 设计与 Migration 创建
  - 用户资料表 (profiles)
  - 报告模板 (report_templates)
  - 报告积分管理 (report_credits, report_credit_events)
  - 报告生成历史 (report_runs)
  - 内容管理 (publications, research_topics)
  - 账单订阅 (billing_subscriptions)
  - 审计日志 (audit_logs)
- [x] 核心 RPC 函数实现
  - `fn_consume_report_credit` - 扣费逻辑
  - `fn_record_report_run` - 记录报告运行
- [x] TypeScript 类型定义生成 (`types/database.ts`)
- [x] 行级别安全 (RLS) 政策配置

### 📊 验证结果

#### Lint 检查
```
✖ 17 problems (3 errors, 14 warnings)
  - 3 errors: 旧的 require() 风格导入（不影响本次集成）
  - 14 warnings: 未使用的变量（需要后续清理）
```

#### 测试运行
- 已启动但需等待完成

### 📁 文件清单
```
D:\Projects\investor-ai
├── supabase/
│   ├── config.toml           [Supabase 配置文件]
│   └── migrations/
│       └── 20251123000001_init_schema.sql  [初始化 schema]
├── types/
│   ├── database.ts           [自动生成的 DB 类型]
│   └── report.ts             [现有报告类型]
├── .env.local                [已更新 Supabase 环境变量]
└── docs/plans/
    └── 2025-11-23-supabase-integration.md  [项目计划]
```

### 🔐 环境变量
添加到 `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_DB_PASSWORD=postgres
SUPABASE_JWT_SECRET=[jwt-secret]
```

## 后续步骤
1. ✅ 本地 Docker stack 启动（需 Docker Desktop）
2. ⏳ Supabase Auth 集成 - 替换 NextAuth
3. ⏳ Report API 重构 - 集成 RPC 和 Storage
4. ⏳ 内容模块数据迁移
5. ⏳ Stripe 和审计日志集成

## 备注
- 本地开发需要 Docker Desktop 运行 Supabase 容器
- 所有敏感配置存储在 `.env.local`（git ignore）
- 向后兼容现有测试套件
- 分支：`feat/supabase-integration`

---
生成时间：2025-11-23
