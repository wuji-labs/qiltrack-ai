-- Migration: Add xiuluart@foxmail.com as admin
-- Date: 2025-12-02
-- Purpose: Add additional admin user

-- Set xiuluart@foxmail.com as admin if the user exists
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'xiuluart@foxmail.com';

-- Set xiuluart@icloud.com as admin if the user exists (for future)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'xiuluart@icloud.com';

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control. Admin users: xiuluart@icloud.com, xiuluart@foxmail.com';
