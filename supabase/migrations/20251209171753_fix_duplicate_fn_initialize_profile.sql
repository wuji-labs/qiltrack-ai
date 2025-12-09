-- Fix duplicate fn_initialize_profile function issue
-- Problem: Multiple worktrees created different versions of fn_initialize_profile
-- Solution: Drop old 3-parameter version, keep only 4-parameter version with referral_code

-- Drop the old 3-parameter version if it exists
DROP FUNCTION IF EXISTS public.fn_initialize_profile(uuid, text, text);

-- Ensure only the 4-parameter version exists
-- Note: The 4-parameter version should already exist from previous migrations
-- This migration just ensures we don't have duplicate function definitions
