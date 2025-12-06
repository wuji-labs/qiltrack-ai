-- Migration: Update profiles.plan CHECK constraint
-- Version: v4.0 Pricing Strategy (fix)
-- Date: 2025-12-07
-- Description: Add 'ultra' to plan constraint, remove 'annual'

-- Update CHECK constraint: replace 'annual' with 'ultra'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'ultra', 'enterprise'));
