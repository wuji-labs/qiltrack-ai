-- ============================================================================
-- Table Partitioning Strategy for Large Tables
-- Created: 2024-12-10
-- Description: Partition large tables by time for better query performance
-- ============================================================================

-- Partitioning Benefits:
-- 1. Faster queries - PostgreSQL only scans relevant partitions
-- 2. Easier maintenance - Drop old partitions instead of DELETE
-- 3. Better vacuum performance - Smaller tables = faster VACUUM
-- 4. Improved backup/restore - Partition-level backup/restore

-- ============================================================================
-- PART 1: Partition audit_logs by month
-- ============================================================================

-- Rename existing table to _old
ALTER TABLE IF EXISTS public.audit_logs RENAME TO audit_logs_old;

-- Create new partitioned table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, created_at) -- Must include partition key
) PARTITION BY RANGE (created_at);

-- Create indexes on partitioned table
CREATE INDEX idx_audit_logs_user_partitioned ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action_partitioned ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource_partitioned ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_partitioned ON audit_logs(created_at DESC);

-- Create partitions for current year (2024-2025)
CREATE TABLE audit_logs_2024_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE audit_logs_2024_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE audit_logs_2025_04 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE audit_logs_2025_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE audit_logs_2025_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE audit_logs_2025_07 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE audit_logs_2025_08 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE audit_logs_2025_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create default partition for future dates
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- Migrate old data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs_old') THEN
    INSERT INTO public.audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
    SELECT
      id,
      user_id,
      action,
      resource_type,
      CASE
        WHEN resource_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        THEN resource_id::UUID
        ELSE NULL
      END as resource_id,
      details,
      ip_address,
      user_agent,
      created_at
    FROM public.audit_logs_old;

    DROP TABLE public.audit_logs_old;
  END IF;
END $$;

-- Enable RLS on partitioned table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- PART 2: Partition report_credit_events by month
-- ============================================================================

ALTER TABLE IF EXISTS public.report_credit_events RENAME TO report_credit_events_old;

CREATE TABLE public.report_credit_events (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('consumed', 'granted', 'daily_reward', 'subscription_reset', 'refund', 'admin_adjustment', 'admin_grant', 'admin_deduct', 'admin_revoke', 'admin_reset')),
  delta INT NOT NULL,
  balance_after INT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_credit_events_user_partitioned ON report_credit_events(user_id, created_at DESC);
CREATE INDEX idx_credit_events_type_partitioned ON report_credit_events(event_type, created_at DESC);

-- Create partitions for 2024-2025
CREATE TABLE report_credit_events_2024_11 PARTITION OF report_credit_events
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE report_credit_events_2024_12 PARTITION OF report_credit_events
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE report_credit_events_2025_01 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE report_credit_events_2025_02 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE report_credit_events_2025_03 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE report_credit_events_2025_04 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE report_credit_events_2025_05 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE report_credit_events_2025_06 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE report_credit_events_2025_07 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE report_credit_events_2025_08 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE report_credit_events_2025_09 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE report_credit_events_2025_10 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE report_credit_events_2025_11 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE report_credit_events_2025_12 PARTITION OF report_credit_events
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE report_credit_events_default PARTITION OF report_credit_events DEFAULT;

-- Migrate old data
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'report_credit_events_old') THEN
    INSERT INTO public.report_credit_events
    SELECT * FROM public.report_credit_events_old;

    DROP TABLE public.report_credit_events_old;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.report_credit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit events"
  ON public.report_credit_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit events"
  ON public.report_credit_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all credit events"
  ON public.report_credit_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- Partition Management Functions
-- ============================================================================

-- Function to create next month's partition
CREATE OR REPLACE FUNCTION public.fn_create_next_partition(
  p_table_name TEXT,
  p_months_ahead INT DEFAULT 1
)
RETURNS TEXT AS $$
DECLARE
  v_next_month DATE;
  v_partition_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
BEGIN
  -- Calculate next month
  v_next_month := date_trunc('month', NOW() + (p_months_ahead || ' months')::INTERVAL)::DATE;

  -- Generate partition name
  v_partition_name := p_table_name || '_' || to_char(v_next_month, 'YYYY_MM');

  -- Check if partition already exists
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = v_partition_name
      AND n.nspname = 'public'
  ) THEN
    RETURN 'Partition ' || v_partition_name || ' already exists';
  END IF;

  -- Create partition
  v_start_date := to_char(v_next_month, 'YYYY-MM-DD');
  v_end_date := to_char(v_next_month + INTERVAL '1 month', 'YYYY-MM-DD');

  EXECUTE format(
    'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    v_partition_name,
    p_table_name,
    v_start_date,
    v_end_date
  );

  RETURN 'Created partition: ' || v_partition_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to drop old partitions (data retention)
CREATE OR REPLACE FUNCTION public.fn_drop_old_partitions(
  p_table_name TEXT,
  p_retention_months INT DEFAULT 12
)
RETURNS TEXT AS $$
DECLARE
  v_cutoff_date DATE;
  v_partition RECORD;
  v_dropped_count INT := 0;
BEGIN
  v_cutoff_date := date_trunc('month', NOW() - (p_retention_months || ' months')::INTERVAL)::DATE;

  FOR v_partition IN
    SELECT c.relname AS partition_name
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = p_table_name
      AND c.relname LIKE p_table_name || '_%'
      AND c.relname != p_table_name || '_default'
  LOOP
    -- Extract date from partition name (assumes format: table_YYYY_MM)
    DECLARE
      v_partition_date TEXT;
      v_partition_year INT;
      v_partition_month INT;
    BEGIN
      v_partition_date := substring(v_partition.partition_name from '[0-9]{4}_[0-9]{2}$');

      IF v_partition_date IS NOT NULL THEN
        v_partition_year := substring(v_partition_date from 1 for 4)::INT;
        v_partition_month := substring(v_partition_date from 6 for 2)::INT;

        IF make_date(v_partition_year, v_partition_month, 1) < v_cutoff_date THEN
          EXECUTE format('DROP TABLE IF EXISTS %I', v_partition.partition_name);
          v_dropped_count := v_dropped_count + 1;
        END IF;
      END IF;
    END;
  END LOOP;

  RETURN 'Dropped ' || v_dropped_count || ' old partitions';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all partitions with sizes
CREATE OR REPLACE FUNCTION public.fn_list_partitions(p_table_name TEXT)
RETURNS TABLE(
  partition_name TEXT,
  partition_size TEXT,
  row_count BIGINT,
  partition_start TEXT,
  partition_end TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT,
    pg_size_pretty(pg_total_relation_size(c.oid))::TEXT,
    c.reltuples::BIGINT,
    pg_get_expr(c.relpartbound, c.oid, true)::TEXT AS partition_range,
    NULL::TEXT
  FROM pg_inherits i
  JOIN pg_class c ON c.oid = i.inhrelid
  JOIN pg_class p ON p.oid = i.inhparent
  WHERE p.relname = p_table_name
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Automated Partition Management (Cron Job)
-- ============================================================================

-- Create pg_cron extension if available (requires superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly partition creation (run on 1st of each month at 2 AM)
-- SELECT cron.schedule(
--   'create-monthly-partitions',
--   '0 2 1 * *',
--   $$
--   SELECT fn_create_next_partition('audit_logs', 2);
--   SELECT fn_create_next_partition('report_credit_events', 2);
--   $$
-- );

-- Schedule old partition cleanup (run quarterly)
-- SELECT cron.schedule(
--   'cleanup-old-partitions',
--   '0 3 1 */3 *',
--   $$
--   SELECT fn_drop_old_partitions('audit_logs', 12);
--   SELECT fn_drop_old_partitions('report_credit_events', 12);
--   $$
-- );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Partitioned audit logs table (by month) for better query performance';
COMMENT ON TABLE public.report_credit_events IS 'Partitioned credit events table (by month) for better query performance';
COMMENT ON FUNCTION public.fn_create_next_partition IS 'Create partition for future month';
COMMENT ON FUNCTION public.fn_drop_old_partitions IS 'Drop partitions older than retention period';
COMMENT ON FUNCTION public.fn_list_partitions IS 'List all partitions with sizes and row counts';

-- ============================================================================
-- Usage Examples
-- ============================================================================

/*
-- Create next 3 months of partitions
SELECT fn_create_next_partition('audit_logs', 1);
SELECT fn_create_next_partition('audit_logs', 2);
SELECT fn_create_next_partition('audit_logs', 3);

-- List all partitions
SELECT * FROM fn_list_partitions('audit_logs');
SELECT * FROM fn_list_partitions('report_credit_events');

-- Drop partitions older than 12 months
SELECT fn_drop_old_partitions('audit_logs', 12);

-- Query performance test (before/after partitioning)
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM audit_logs
WHERE created_at >= '2024-12-01'
  AND created_at < '2025-01-01';
*/
