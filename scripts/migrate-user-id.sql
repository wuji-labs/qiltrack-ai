-- 完整的用户ID迁移脚本
-- 从旧ID迁移到新ID，处理所有外键关系

-- 旧ID: e609c987-988c-47f4-a828-8096ef610f6a
-- 新ID: 8fb6f7cc-6b8c-423f-9806-eb63b068fea0

-- 1. 临时禁用外键约束检查
SET session_replication_role = 'replica';

-- 2. 更新所有相关表的 user_id
UPDATE public.report_credits
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

UPDATE public.report_credit_events
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

UPDATE public.report_runs
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

UPDATE public.report_documents
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

UPDATE public.audit_logs
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

UPDATE public.billing_subscriptions
SET user_id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE user_id = 'e609c987-988c-47f4-a828-8096ef610f6a';

-- 3. 更新 profiles 表的主键
UPDATE public.profiles
SET id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0'
WHERE id = 'e609c987-988c-47f4-a828-8096ef610f6a';

-- 4. 确保角色为 admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';

-- 5. 重新启用外键约束检查
SET session_replication_role = 'origin';

-- 6. 验证结果
SELECT id, email, role, plan FROM public.profiles WHERE email = 'xiuluart@foxmail.com';
