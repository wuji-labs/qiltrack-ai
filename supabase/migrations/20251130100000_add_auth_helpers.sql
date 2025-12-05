/**
 * Migration: Add authentication helper functions
 * Date: 2025-11-30
 * Purpose: Enable client-side detection of user's authentication method
 *
 * This migration adds RPC functions to help distinguish between:
 * - OAuth users (Google, GitHub, etc.)
 * - Magic Link users (passwordless email)
 * - Password users (traditional email+password)
 */

-- ============================================================================
-- Function: fn_user_has_password
-- ============================================================================
-- Check if the current authenticated user has a password set
-- Returns: BOOLEAN
--   - true: User has password (can use password login)
--   - false: User has no password (OAuth or Magic Link only)
--
-- Security: SECURITY DEFINER allows this function to query auth.users table
--           while still respecting RLS (only returns data for auth.uid())
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_user_has_password()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_pwd BOOLEAN;
BEGIN
  -- Check if current user has encrypted_password set in auth.users
  SELECT (encrypted_password IS NOT NULL)
  INTO has_pwd
  FROM auth.users
  WHERE id = auth.uid();

  -- Return false if user not found or no password
  RETURN COALESCE(has_pwd, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fn_user_has_password() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION fn_user_has_password() IS
'Returns true if the current authenticated user has a password set. Used by client to determine authentication method.';


-- ============================================================================
-- Optional: Function to get user's identity providers
-- ============================================================================
-- Note: This function is optional as Supabase client already provides
-- supabase.auth.getUserIdentities() method. We include it here for
-- potential server-side usage.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_user_identities()
RETURNS TABLE (
  provider TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.provider::TEXT,
    i.created_at
  FROM auth.identities i
  WHERE i.user_id = auth.uid()
  ORDER BY i.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fn_get_user_identities() TO authenticated;

-- Add comment
COMMENT ON FUNCTION fn_get_user_identities() IS
'Returns list of OAuth identity providers connected to the current user.';


-- ============================================================================
-- Verification Queries (for testing after migration)
-- ============================================================================
-- Run these queries in Supabase SQL Editor after migration:
--
-- 1. Test fn_user_has_password() as authenticated user:
--    SELECT fn_user_has_password();
--
-- 2. Test fn_get_user_identities() as authenticated user:
--    SELECT * FROM fn_get_user_identities();
--
-- 3. Verify function permissions:
--    SELECT
--      p.proname AS function_name,
--      pg_get_userbyid(p.proowner) AS owner,
--      p.prosecdef AS security_definer
--    FROM pg_proc p
--    WHERE p.proname IN ('fn_user_has_password', 'fn_get_user_identities');
-- ============================================================================
