-- Migration: Rename annual plan to ultra
-- Version: v4.0 Pricing Strategy
-- Date: 2025-12-07
-- Description:
--   - Rename 'annual' plan to 'ultra' in profiles table
--   - Update CHECK constraint to use 'ultra' instead of 'annual'
--   - Update subscription_plans table if exists
--   - Note: access_level is stored in application code, not in DB

-- 1. Migrate profiles.plan: annual -> ultra (if any exist)
UPDATE profiles
SET plan = 'ultra', updated_at = NOW()
WHERE plan = 'annual';

-- 2. Update CHECK constraint: replace 'annual' with 'ultra'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'ultra', 'enterprise'));

-- 3. Update subscription_plans table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    UPDATE subscription_plans SET slug = 'ultra', name = 'Ultra' WHERE slug = 'annual';
  END IF;
END $$;

-- 4. Log the migration
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, created_at)
VALUES (
  NULL,
  'MIGRATION',
  'system',
  'pricing_v4',
  jsonb_build_object(
    'description', 'Migrate annual plan to ultra (v4.0 pricing)',
    'changes', jsonb_build_array(
      'profiles.plan: annual -> ultra'
    )
  ),
  NOW()
);

-- Done
COMMENT ON TABLE profiles IS 'User profiles - plan values: free, pro, ultra, enterprise';
