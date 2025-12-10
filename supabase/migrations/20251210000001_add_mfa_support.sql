-- ============================================================================
-- MFA (Multi-Factor Authentication) Support
-- Created: 2024-12-10
-- Description: Add TOTP-based two-factor authentication support
-- ============================================================================

-- Enable pgcrypto for TOTP secret generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- MFA Devices Table
-- Stores user's registered MFA devices (TOTP authenticators)
CREATE TABLE IF NOT EXISTS public.mfa_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Device info
  device_name TEXT NOT NULL, -- e.g., "Google Authenticator on iPhone"
  device_type TEXT DEFAULT 'totp' CHECK (device_type IN ('totp', 'sms', 'email')),

  -- TOTP secret (encrypted at application layer before storage)
  secret_encrypted TEXT NOT NULL,

  -- Backup codes (for account recovery)
  backup_codes_encrypted TEXT[], -- Array of encrypted backup codes
  backup_codes_used INT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMPTZ, -- NULL until first successful verification

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mfa_devices_user ON mfa_devices(user_id);
CREATE INDEX idx_mfa_devices_active ON mfa_devices(user_id, is_active) WHERE is_active = true;

-- MFA Login Attempts Table
-- Track MFA verification attempts for security monitoring
CREATE TABLE IF NOT EXISTS public.mfa_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES mfa_devices(id) ON DELETE SET NULL,

  -- Attempt details
  success BOOLEAN NOT NULL,
  method TEXT CHECK (method IN ('totp', 'backup_code', 'recovery')),
  ip_address INET,
  user_agent TEXT,

  -- Failure reason
  failure_reason TEXT, -- e.g., "invalid_code", "code_expired", "rate_limit"

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mfa_attempts_user ON mfa_login_attempts(user_id, created_at DESC);
CREATE INDEX idx_mfa_attempts_failed ON mfa_login_attempts(user_id, success) WHERE success = false;

-- Add MFA fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_enforced BOOLEAN DEFAULT false; -- Admin can enforce MFA for certain users

-- Index for MFA-enabled users
CREATE INDEX IF NOT EXISTS idx_profiles_mfa ON profiles(mfa_enabled) WHERE mfa_enabled = true;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.mfa_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_login_attempts ENABLE ROW LEVEL SECURITY;

-- MFA Devices Policies
-- Users can only see/manage their own devices
CREATE POLICY "Users can view their own MFA devices"
  ON public.mfa_devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA devices"
  ON public.mfa_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA devices"
  ON public.mfa_devices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MFA devices"
  ON public.mfa_devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all MFA devices
CREATE POLICY "Admins can view all MFA devices"
  ON public.mfa_devices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- MFA Login Attempts Policies
-- Users can only see their own attempts
CREATE POLICY "Users can view their own MFA attempts"
  ON public.mfa_login_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert attempts (no user restriction)
CREATE POLICY "System can insert MFA attempts"
  ON public.mfa_login_attempts
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all attempts
CREATE POLICY "Admins can view all MFA attempts"
  ON public.mfa_login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if user has active MFA
CREATE OR REPLACE FUNCTION public.fn_user_has_active_mfa(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.mfa_devices
    WHERE user_id = p_user_id
      AND is_active = true
      AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record MFA attempt
CREATE OR REPLACE FUNCTION public.fn_record_mfa_attempt(
  p_user_id UUID,
  p_device_id UUID,
  p_success BOOLEAN,
  p_method TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO public.mfa_login_attempts (
    user_id,
    device_id,
    success,
    method,
    ip_address,
    user_agent,
    failure_reason
  ) VALUES (
    p_user_id,
    p_device_id,
    p_success,
    p_method,
    p_ip_address,
    p_user_agent,
    p_failure_reason
  )
  RETURNING id INTO v_attempt_id;

  -- Update device last_used_at if successful
  IF p_success AND p_device_id IS NOT NULL THEN
    UPDATE public.mfa_devices
    SET last_used_at = NOW(),
        use_count = use_count + 1
    WHERE id = p_device_id;
  END IF;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable MFA for user (admin only)
CREATE OR REPLACE FUNCTION public.fn_admin_disable_user_mfa(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if requester is admin
  SELECT role IN ('super_admin', 'admin')
  INTO v_is_admin
  FROM public.profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Disable all MFA devices
  UPDATE public.mfa_devices
  SET is_active = false,
      updated_at = NOW()
  WHERE user_id = p_target_user_id;

  -- Update profile
  UPDATE public.profiles
  SET mfa_enabled = false,
      updated_at = NOW()
  WHERE id = p_target_user_id;

  -- Log action
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_admin_id,
    'MFA_DISABLED_BY_ADMIN',
    'mfa_devices',
    p_target_user_id,
    jsonb_build_object('reason', p_reason, 'target_user_id', p_target_user_id)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mfa_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mfa_devices_updated_at
  BEFORE UPDATE ON public.mfa_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_mfa_devices_updated_at();

-- Auto-enable mfa_enabled flag when first device is verified
CREATE OR REPLACE FUNCTION auto_enable_mfa_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN
    UPDATE public.profiles
    SET mfa_enabled = true,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_enable_mfa
  AFTER UPDATE ON public.mfa_devices
  FOR EACH ROW
  EXECUTE FUNCTION auto_enable_mfa_on_verification();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.mfa_devices IS 'Stores user MFA devices (TOTP authenticators)';
COMMENT ON TABLE public.mfa_login_attempts IS 'Tracks MFA verification attempts for security monitoring';
COMMENT ON COLUMN public.mfa_devices.secret_encrypted IS 'TOTP secret encrypted with application-layer encryption';
COMMENT ON COLUMN public.mfa_devices.backup_codes_encrypted IS 'Encrypted backup codes for account recovery';
COMMENT ON FUNCTION public.fn_user_has_active_mfa IS 'Check if user has any active and verified MFA device';
COMMENT ON FUNCTION public.fn_record_mfa_attempt IS 'Record MFA verification attempt and update device stats';
