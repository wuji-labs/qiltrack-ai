-- ============================================================================
-- Webhook Idempotency Support
-- Created: 2024-12-10
-- Description: Prevent duplicate webhook processing from Stripe and other services
-- ============================================================================

-- Webhook Events Table
-- Stores processed webhook events to prevent duplicate processing
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_id TEXT UNIQUE NOT NULL, -- Stripe event ID (evt_xxx) or other provider's unique ID
  event_type TEXT NOT NULL, -- e.g., "checkout.session.completed", "invoice.payment_succeeded"
  provider TEXT DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal', 'other')),

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Event payload (for debugging and reprocessing)
  payload JSONB NOT NULL,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,

  -- Associated user (if applicable)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_user ON webhook_events(user_id) WHERE user_id IS NOT NULL;

-- Composite index for idempotency check
CREATE UNIQUE INDEX idx_webhook_events_unique ON webhook_events(provider, event_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view all webhook events"
  ON public.webhook_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- System can insert webhook events (no user restriction for webhooks)
CREATE POLICY "System can insert webhook events"
  ON public.webhook_events
  FOR INSERT
  WITH CHECK (true);

-- System can update webhook events
CREATE POLICY "System can update webhook events"
  ON public.webhook_events
  FOR UPDATE
  USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if webhook event already processed
CREATE OR REPLACE FUNCTION public.fn_is_webhook_processed(
  p_provider TEXT,
  p_event_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.webhook_events
    WHERE provider = p_provider
      AND event_id = p_event_id
      AND status IN ('completed', 'processing')
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record webhook event (idempotent)
-- Returns: webhook record ID if inserted, NULL if already exists
CREATE OR REPLACE FUNCTION public.fn_record_webhook_event(
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  -- Try to insert (will fail if event_id already exists due to unique constraint)
  INSERT INTO public.webhook_events (
    provider,
    event_id,
    event_type,
    payload,
    ip_address,
    user_agent,
    user_id,
    status
  ) VALUES (
    p_provider,
    p_event_id,
    p_event_type,
    p_payload,
    p_ip_address,
    p_user_agent,
    p_user_id,
    'pending'
  )
  ON CONFLICT (provider, event_id) DO NOTHING
  RETURNING id INTO v_webhook_id;

  RETURN v_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark webhook as processing
CREATE OR REPLACE FUNCTION public.fn_mark_webhook_processing(
  p_webhook_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.webhook_events
  SET status = 'processing',
      updated_at = NOW()
  WHERE id = p_webhook_id
    AND status = 'pending' -- Only update if still pending
  RETURNING true INTO v_updated;

  RETURN COALESCE(v_updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark webhook as completed
CREATE OR REPLACE FUNCTION public.fn_mark_webhook_completed(
  p_webhook_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.webhook_events
  SET status = 'completed',
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark webhook as failed
CREATE OR REPLACE FUNCTION public.fn_mark_webhook_failed(
  p_webhook_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.webhook_events
  SET status = 'failed',
      error_message = p_error_message,
      retry_count = retry_count + 1,
      updated_at = NOW()
  WHERE id = p_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old webhook events (90 days retention)
CREATE OR REPLACE FUNCTION public.fn_cleanup_old_webhook_events()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM public.webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('completed', 'failed');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_events_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.webhook_events IS 'Stores webhook events for idempotency and audit trail';
COMMENT ON COLUMN public.webhook_events.event_id IS 'Unique event ID from webhook provider (e.g., Stripe event ID)';
COMMENT ON COLUMN public.webhook_events.status IS 'Processing status: pending -> processing -> completed/failed';
COMMENT ON FUNCTION public.fn_is_webhook_processed IS 'Check if webhook event has already been processed';
COMMENT ON FUNCTION public.fn_record_webhook_event IS 'Idempotent webhook event recording - returns NULL if duplicate';
COMMENT ON FUNCTION public.fn_cleanup_old_webhook_events IS 'Cleanup webhook events older than 90 days';
