-- Set xiuluart@foxmail.com as super_admin
-- First ensure the user exists before updating
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = 'xiuluart@foxmail.com') THEN
    UPDATE public.profiles
    SET role = 'super_admin',
        updated_at = NOW()
    WHERE email = 'xiuluart@foxmail.com';
    RAISE NOTICE 'User xiuluart@foxmail.com has been set as super_admin';
  ELSE
    RAISE NOTICE 'User xiuluart@foxmail.com not found - please register first';
  END IF;
END $$;
