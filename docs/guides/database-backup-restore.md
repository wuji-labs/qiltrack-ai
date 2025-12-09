# 数据库备份与恢复指南

## 概述

由于 Supabase 官方数据备份功能需要付费，本项目实现了自托管的备份恢复方案，通过 API 导出/导入数据。

## 备份内容

| 类型 | 位置 | 说明 |
|------|------|------|
| **数据** | `backups/时间戳/*.json` | 通过脚本导出的 JSON 文件 |
| **结构** | `supabase/migrations/*.sql` | 表结构、函数、RLS 策略等 |

### Schema 包含的内容

`supabase/migrations/20251207000000_clean_schema.sql` 包含：

- 22 个数据表的结构
- 外键关系和约束
- 索引定义
- 15+ 个存储函数 (fn_*)
- RLS 行级安全策略
- 触发器
- Storage Buckets 配置
- 权限设置

## 快速使用

### 执行备份

```powershell
cd D:\Projects\qiltrack-ai
npx tsx scripts/backup-db.ts
```

输出示例：
```
📦 开始备份到: D:\Projects\qiltrack-ai\backups\2025-12-08T15-40-23

✅ profiles: 1 条记录
✅ daily_rewards: 1 条记录
...
✨ 备份完成！共 9 条记录
📁 备份位置: D:\Projects\qiltrack-ai\backups\2025-12-08T15-40-23
```

### 执行恢复

```powershell
npx tsx scripts/restore-db.ts 2025-12-08T15-40-23
```

## 备份文件结构

```
backups/
└── 2025-12-08T15-40-23/
    ├── _metadata.json          # 备份元数据
    ├── profiles.json           # 用户资料
    ├── report_credits.json     # 积分余额
    ├── report_credit_events.json # 积分记录
    ├── daily_rewards.json      # 签到记录
    ├── referrals.json          # 推荐记录
    ├── notifications.json      # 通知
    ├── audit_logs.json         # 审计日志
    └── ... (其他 22 个表)
```

## 灾难恢复流程

当需要迁移到新的 Supabase 项目时：

### 1. 创建新项目

在 Supabase Dashboard 创建新项目，获取：
- Project URL
- Anon Key
- Service Role Key

### 2. 恢复数据库结构

```bash
# 方式一：使用 Supabase CLI
supabase link --project-ref 新项目ID
supabase db push

# 方式二：手动执行 SQL
# 在 Supabase SQL Editor 中执行 supabase/migrations/ 下的所有 SQL 文件
```

### 3. 恢复数据

```powershell
# 更新脚本中的连接信息后执行
npx tsx scripts/restore-db.ts 2025-12-08T15-40-23
```

### 4. 更新环境变量

更新 `.env.vercel` 和 Vercel 环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

## 备份表清单

按依赖顺序排列：

1. `profiles` - 用户资料
2. `pricing_plans` - 定价方案
3. `coupons` - 优惠券
4. `coupon_redemptions` - 优惠券使用记录
5. `billing_subscriptions` - 订阅信息
6. `daily_rewards` - 签到奖励
7. `report_credits` - 积分余额
8. `report_credit_events` - 积分事件
9. `referrals` - 推荐系统
10. `report_runs` - 报告生成记录
11. `report_documents` - 报告文档
12. `report_posts` - 发布的报告
13. `report_feedback` - 报告反馈
14. `report_templates` - 报告模板
15. `reports_embeddings` - 向量嵌入
16. `notifications` - 通知
17. `audit_logs` - 审计日志
18. `faq_entries` - FAQ
19. `copy_modules` - 文案模块
20. `publications` - 出版物
21. `research_topics` - 研究主题
22. `user_report_uploads` - 用户上传

## 定期备份建议

### Windows 任务计划

创建 `backup-scheduled.ps1`:
```powershell
$date = Get-Date -Format "yyyy-MM-dd"
cd D:\Projects\qiltrack-ai
npx tsx scripts/backup-db.ts

# 复制到云盘 (示例)
Copy-Item -Path "backups\*" -Destination "D:\OneDrive\Backups\qiltrack\" -Recurse
```

在任务计划程序中设置每日执行。

### 备份保留策略

建议：
- 本地保留最近 7 天
- 云端保留最近 30 天
- 每月首日备份永久保留

## 脚本文件

| 文件 | 用途 |
|------|------|
| `scripts/backup-db.ts` | 导出所有表数据到 JSON |
| `scripts/restore-db.ts` | 从 JSON 恢复数据 |

## 注意事项

1. **敏感信息**：备份文件包含用户数据，请妥善保管
2. **恢复模式**：恢复使用 UPSERT，已存在的数据会被覆盖
3. **auth.users**：Supabase 的 auth.users 表无法通过 API 备份，用户需要重新注册或使用 Supabase 的导入功能
4. **Storage 文件**：Storage bucket 中的文件需要单独备份

## 相关文件

- Schema: `supabase/migrations/20251207000000_clean_schema.sql`
- 类型定义: `types/database.ts`
- Supabase 配置: `.env.vercel`
