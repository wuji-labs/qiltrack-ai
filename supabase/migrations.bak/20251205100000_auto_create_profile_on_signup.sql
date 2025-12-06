-- Migration: Auto-create profile on user signup
-- Purpose: Ensure every new auth.users entry automatically gets a profiles record
-- Date: 2025-12-05

-- Drop existing trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, display_name, plan, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    'free',
    'user',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    updated_at = CURRENT_TIMESTAMP;

  -- Insert report_credits with 60 initial credits
  INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
  VALUES (NEW.id, 60, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log the event
  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason, created_at)
  VALUES (NEW.id, 'granted', 60, 'Initial signup bonus', CURRENT_TIMESTAMP);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-sync any existing auth.users that don't have profiles
-- This handles users who registered before the trigger existed
INSERT INTO public.profiles (id, email, display_name, plan, role, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
  'free',
  'user',
  COALESCE(au.created_at, CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure all profiles have report_credits records
INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
SELECT
  p.id,
  60,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.report_credits rc WHERE rc.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Log completion
DO $$
DECLARE
  total_profiles INT;
  total_credits INT;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO total_credits FROM public.report_credits;
  RAISE NOTICE '[MIGRATION] Total profiles: %, Total credit records: %', total_profiles, total_credits;
END;
$$;
