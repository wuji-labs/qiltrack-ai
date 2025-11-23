export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string } }
      report_templates: { Row: { id: string; name: string; description: string | null; category: string | null; slug: string; content: string | null; created_at: string; updated_at: string } }
      report_credits: { Row: { id: string; user_id: string; credits_available: number; credits_used: number; last_reset: string; created_at: string; updated_at: string } }
      report_runs: { Row: { id: string; user_id: string; template_id: string; report_data: Json | null; storage_path: string | null; status: string; created_at: string } }
      publications: { Row: { id: string; title: string; description: string | null; url: string | null; published_date: string | null; category: string | null; created_at: string; updated_at: string } }
      research_topics: { Row: { id: string; title: string; description: string | null; content: string | null; category: string | null; created_at: string; updated_at: string } }
      billing_subscriptions: { Row: { id: string; user_id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null; plan_id: string | null; status: string | null; current_period_start: string | null; current_period_end: string | null; created_at: string; updated_at: string } }
      audit_logs: { Row: { id: string; user_id: string | null; action: string; resource_type: string | null; resource_id: string | null; details: Json | null; created_at: string } }
      report_credit_events: { Row: { id: string; user_id: string; event_type: string; credits_amount: number; reason: string | null; created_at: string } }
    }
    Functions: {
      fn_consume_report_credit: { Args: { p_user_id: string }; Returns: boolean }
      fn_record_report_run: { Args: { p_user_id: string; p_template_id: string; p_report_data: Json; p_storage_path: string }; Returns: string }
    }
  }
}
