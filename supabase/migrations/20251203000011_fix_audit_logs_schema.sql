-- Migration: Fix audit_logs schema to match code expectations
-- Purpose: Add table_name and record_id columns, rename resource_* columns
-- Safety: Idempotent operations with IF NOT EXISTS guards

-- 1. Rename resource_type to table_name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'resource_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'table_name'
  ) THEN
    ALTER TABLE public.audit_logs
      RENAME COLUMN resource_type TO table_name;
  END IF;
END $$;

-- 2. Rename resource_id to record_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'resource_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'record_id'
  ) THEN
    ALTER TABLE public.audit_logs
      RENAME COLUMN resource_id TO record_id;
  END IF;
END $$;

-- 3. Add columns if they don't exist (fallback if renames didn't happen)
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS table_name TEXT,
  ADD COLUMN IF NOT EXISTS record_id TEXT;

-- 4. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record
  ON public.audit_logs(table_name, record_id)
  WHERE table_name IS NOT NULL AND record_id IS NOT NULL;

-- 5. Add comments for documentation
COMMENT ON COLUMN public.audit_logs.table_name IS
  'Name of the table being audited (e.g., report_posts, user_credits)';

COMMENT ON COLUMN public.audit_logs.record_id IS
  'ID of the specific record being audited';

COMMENT ON COLUMN public.audit_logs.action IS
  'Action performed (e.g., GENERATE_REPORT, UPDATE_CREDITS, DELETE_REPORT)';

COMMENT ON COLUMN public.audit_logs.details IS
  'Additional context and metadata for the audit event';
