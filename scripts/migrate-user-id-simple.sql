-- 简化版用户ID迁移脚本
-- 只更新确定存在的表

-- 旧ID: e609c987-988c-47f4-a828-8096ef610f6a
-- 新ID: 8fb6f7cc-6b8c-423f-9806-eb63b068fea0

-- 1. 临时禁用外键约束检查
SET session_replication_role = 'replica';

-- 2. 更新 report_credits
UPDATE public.report_credits
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

-- 3. 更新 report_credit_events
UPDATE public.report_credit_events
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

-- 4. 更新 report_runs (如果存在记录)
UPDATE public.report_runs
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

-- 5. 更新 profiles 表的主键
UPDATE public.profiles
SET id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE id = 'e609c987-988c-47f4-a828-8096ef610f6a';

-- 6. 确保角色为 admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';

-- 7. 重新启用外键约束检查
SET session_replication_role = 'origin';

-- 8. 验证结果
SELECT id, email, role, plan FROM public.profiles WHERE email = 'xiuluart@foxmail.com';
