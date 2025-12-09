-- 简单验证生产数据库

-- 1. 检查关键表是否存在
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_credit_events') THEN '✅'
    ELSE '❌'
  END as report_credit_events,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_rewards') THEN '✅'
    ELSE '❌'
  END as daily_rewards,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_credits') THEN '✅'
    ELSE '❌'
  END as report_credits,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_runs') THEN '✅'
    ELSE '❌'
  END as report_runs,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_posts') THEN '✅'
    ELSE '❌'
  END as report_posts;

-- 2. 检查关键函数是否存在
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_consume_credit') THEN '✅'
    ELSE '❌'
  END as fn_consume_credit,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_claim_daily_reward') THEN '✅'
    ELSE '❌'
  END as fn_claim_daily_reward;

-- 3. 检查 report_credit_events 表结构（关键列）
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'report_credit_events'
  AND column_name IN ('id', 'user_id', 'event_type', 'delta', 'balance_after')
ORDER BY column_name;

-- 4. 验证迁移版本
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version >= '20251207000000'
ORDER BY version DESC;
