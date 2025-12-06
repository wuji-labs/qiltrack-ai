-- Migration: Remove enterprise from plan constraint
-- Version: v5.0 Pricing Strategy
-- Date: 2025-12-07
-- Description: Simplify to 3-tier model (free/pro/ultra)

-- Update CHECK constraint: remove 'enterprise'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'ultra'));

-- Update table comment
COMMENT ON TABLE profiles IS 'User profiles - plan values: free, pro, ultra';
