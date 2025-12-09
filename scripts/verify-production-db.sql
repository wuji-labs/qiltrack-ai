-- 验证生产数据库关键表和函数

-- 1. 检查关键表
SELECT
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'report_credit_events',
    'daily_rewards',
    'report_runs',
    'report_posts',
    'report_credits',
    'profiles'
  )
ORDER BY table_name;

-- 2. 检查关键函数
SELECT
  routine_name,
  'EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'fn_consume_credit',
    'fn_claim_daily_reward'
  )
ORDER BY routine_name;

-- 3. 检查 fn_consume_credit 函数参数（确认是 p_amount 而不是 p_cost）
SELECT
  parameter_name,
  data_type,
  ordinal_position
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE 'fn_consume_credit%'
  AND parameter_mode = 'IN'
ORDER BY ordinal_position;
