-- ============================================================
-- 修复脚本: 恢复 xiuluart@foxmail.com 超级管理员权限
--
-- 使用方法:
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制粘贴此脚本并执行
-- ============================================================

-- 1. 先查看当前状态
SELECT id, email, role, plan, updated_at
FROM public.profiles
WHERE email IN ('xiuluart@foxmail.com', 'xiuluart@icloud.com');

-- 2. 设置 xiuluart@foxmail.com 为 super_admin
UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'xiuluart@foxmail.com';

-- 3. 也设置 icloud 邮箱（如果存在）
UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'xiuluart@icloud.com';

-- 4. 验证结果
SELECT id, email, role, plan, updated_at
FROM public.profiles
WHERE email IN ('xiuluart@foxmail.com', 'xiuluart@icloud.com');

-- 5. 列出所有管理员
SELECT id, email, role, plan
FROM public.profiles
WHERE role IN ('super_admin', 'admin', 'editor')
ORDER BY role, email;
