-- Migration: Set xiuluart@foxmail.com as super_admin
-- Date: 2025-12-04
-- Purpose: Upgrade to super_admin for full administrative privileges

-- Set xiuluart@foxmail.com as super_admin
UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'xiuluart@foxmail.com';

-- Also set icloud email as super_admin if it exists
UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'xiuluart@icloud.com';

-- Verify the update
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'xiuluart@foxmail.com' AND role = 'super_admin') THEN
    RAISE NOTICE 'Warning: xiuluart@foxmail.com not found or not updated to super_admin';
  ELSE
    RAISE NOTICE 'Success: xiuluart@foxmail.com is now super_admin';
  END IF;
END $$;
