export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          plan: string
          quota_limit: number
          reports_used: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          last_report_at: string | null
          created_at: string
          updated_at: string
        }
      }
      report_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          slug: string
          summary: string | null
          tags: string[]
          hero_image_url: string | null
          sections: Json | null
          pills: string[]
          published_at: string | null
          language: string
          created_at: string
          updated_at: string
        }
      }
      report_credits: {
        Row: {
          id: string
          user_id: string
          credits_available: number
          credits_used: number
          last_reset: string
          created_at: string
          updated_at: string
        }
      }
      report_runs: {
        Row: {
          id: string
          user_id: string
          template_id: string
          symbol: string | null
          tone: string | null
          language: string
          status: string
          model: string | null
          company_snapshot: Json | null
          duration_ms: number | null
          error: string | null
          markdown_path: string | null
          docx_path: string | null
          created_at: string
          updated_at: string
        }
      }
      report_documents: {
        Row: {
          id: string
          run_id: string
          user_id: string
          markdown_summary: string | null
          docx_summary: string | null
          created_at: string
        }
      }
      publications: {
        Row: {
          id: string
          title: string
          description: string | null
          url: string | null
          published_date: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
      }
      research_topics: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
      }
      faq_entries: {
        Row: {
          id: string
          question: string
          answer: string
          category: string | null
          language: string
          order_index: number
          created_at: string
          updated_at: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: string | null
          currency: string
          quota_limit: number | null
          features: Json | null
          call_to_action: string | null
          language: string
          published: boolean
          created_at: string
          updated_at: string
        }
      }
      copy_modules: {
        Row: {
          id: string
          module_key: string
          module_value: Json | null
          language: string
          created_at: string
          updated_at: string
        }
      }
      billing_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_id: string | null
          status: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json | null
          created_at: string
        }
      }
      report_credit_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          credits_amount: number
          reason: string | null
          created_at: string
        }
      }
    }
    Functions: {
      fn_initialize_profile: {
        Args: { p_user_id: string; p_email: string }
        Returns: void
      }
      fn_consume_report_credit: {
        Args: { p_user_id: string; p_symbol?: string; p_metadata?: Json }
        Returns: Array<{ success: boolean; remaining: number }>
      }
      fn_record_report_run: {
        Args: { p_user_id: string; p_template_id: string; p_report_data: Json; p_storage_path: string }
        Returns: string
      }
    }
    Views: {
      v_user_quota: {
        Row: {
          id: string
          email: string
          plan: string
          quota_limit: number
          reports_used: number
          remaining_quota: number
        }
      }
    }
  }
}
