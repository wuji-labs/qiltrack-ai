# 年费会员快速升级 - xiuluart@foxmail.com
Date: 2025-12-04

## 背景
- 用户要求将账号 `xiuluart@foxmail.com` 快速升级为年费会员。
- 当前数据库状态（Supabase `profiles`）：`plan=free`、`subscription_status=inactive`、`subscription_expires_at=null`，role 为 `super_admin`，id `8fb6f7cc-6b8c-423f-9806-eb63b068fea0`。
- `report_credits` 现有额度：`credits_available=620`，`monthly_quota=0`，`bonus_credits=0`，`rollover_credits=0`，`last_reset_at=2025-12-04T05:41:47Z`。

## 设计目标
- 将该用户套餐切换为 `annual`，并将 `subscription_status` 置为 `active`，补全 `subscription_expires_at`（当前时间起至少 12 个月）。
- 保持现有角色（`super_admin`），不回退权限或修改其他字段。
- 年费额度与现行规则对齐（年包基线 600 点），确保额度记录更新。

## 约束与实现要点
- 只操作指定账号，使用 Supabase service role；禁止触碰其他账户或降级权限。
- 优先调用后端 RPC `fn_upgrade_membership` 以复用既有逻辑；若不可用则手动更新 `profiles` 与 `report_credits`，金额更新需写入 `updated_at`。
- 时间字段使用 UTC ISO 字符串，避免出现空的到期日。

## 文案 key
- 无新增文案（纯后端运维操作）。

## 测试要求
- 查询 `profiles`（按 email）确认 `plan=annual`、`subscription_status=active`、`subscription_expires_at` > 当前时间。
- 查询 `report_credits`（按 user_id）确认额度 ≥ 600，`updated_at` 已刷新，字段未丢失。
