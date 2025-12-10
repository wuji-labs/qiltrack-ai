-- ============================================================================
-- Supabase 数据库种子文件
-- ============================================================================
-- 用途：在 supabase db reset 后自动创建测试用户和基础数据
-- 使用场景：本地开发、测试环境
-- 注意：生产环境不会执行此文件
-- ============================================================================

-- 测试用户凭证
-- 邮箱: test@qiltrack.com
-- 密码: Test123456!
-- ============================================================================

-- 1. 创建测试用户（使用 Supabase Auth）
-- 注意：需要使用 Supabase Auth API 的 admin 权限创建用户
-- 这里我们插入一个已经 confirmed 的用户
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- 生成固定的 UUID 用于测试用户
  test_user_id := '00000000-0000-0000-0000-000000000001';

  -- 插入到 auth.users 表
  -- 密码哈希对应 "Test123456!" (使用 bcrypt)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'test@qiltrack.com',
    '$2b$10$zTcvyI5HQpnMLzzXxKdELeWaQEw.Tql6nqLArpzZAxapkfARN82nq', -- 对应密码 Test123456!
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"测试用户"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  -- 插入身份记录
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    jsonb_build_object('sub', test_user_id::text, 'email', 'test@qiltrack.com'),
    'email',
    test_user_id::text,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

END $$;

-- 2. 创建用户 Profile（自动触发器会创建，但我们确保一下）
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  plan,
  subscription_status,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@qiltrack.com',
  '测试用户',
  'free',
  'inactive',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

-- 3. 初始化积分
INSERT INTO public.report_credits (
  id,
  user_id,
  credits_available,
  credits_used,
  last_reset_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  30,  -- 新用户初始积分
  0,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  credits_available = EXCLUDED.credits_available,
  credits_used = 0,
  last_reset_at = NOW(),
  updated_at = NOW();

-- 4. 创建开发者测试用户（可选）
DO $$
DECLARE
  dev_user_id uuid;
BEGIN
  dev_user_id := '00000000-0000-0000-0000-000000000002';

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    dev_user_id,
    '00000000-0000-0000-0000-000000000000',
    'dev@qiltrack.com',
    '$2a$10$vQHOKPXZj0MJOWVLq8X4YOxBZzZz6Oz5Uz9DLQx9JYP5jJfDKvX4e',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"开发者"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    dev_user_id,
    jsonb_build_object('sub', dev_user_id::text, 'email', 'dev@qiltrack.com'),
    'email',
    dev_user_id::text,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

END $$;

INSERT INTO public.profiles (
  id,
  email,
  display_name,
  plan,
  subscription_status,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'dev@qiltrack.com',
  '开发者',
  'pro',
  'active',
  'developer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  plan = EXCLUDED.plan,
  subscription_status = EXCLUDED.subscription_status,
  role = EXCLUDED.role,
  updated_at = NOW();

INSERT INTO public.report_credits (
  id,
  user_id,
  credits_available,
  credits_used,
  last_reset_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  100,  -- Pro 用户更多积分
  0,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  credits_available = 100,
  credits_used = 0,
  last_reset_at = NOW(),
  updated_at = NOW();

-- ============================================================================
-- 测试账号总结
-- ============================================================================
-- 账号 1: test@qiltrack.com / Test123456!
--   - 角色: user
--   - 套餐: free
--   - 积分: 30
--
-- 账号 2: dev@qiltrack.com / Test123456!
--   - 角色: developer
--   - 套餐: pro
--   - 积分: 100
-- ============================================================================
