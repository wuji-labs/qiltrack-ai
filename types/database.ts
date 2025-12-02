export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_modules: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          module_key: string
          module_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          module_key: string
          module_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          module_key?: string
          module_value?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faq_entries: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          language: string | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          order_index?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          call_to_action: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          language: string | null
          name: string
          price: number | null
          published: boolean | null
          quota_limit: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          call_to_action?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          language?: string | null
          name: string
          price?: number | null
          published?: boolean | null
          quota_limit?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          call_to_action?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          language?: string | null
          name?: string
          price?: number | null
          published?: boolean | null
          quota_limit?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          last_report_at: string | null
          name: string | null
          plan: string | null
          role: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          last_report_at?: string | null
          name?: string | null
          plan?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          last_report_at?: string | null
          name?: string | null
          plan?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publications: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          published_date: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          published_date?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          published_date?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      report_credit_events: {
        Row: {
          created_at: string | null
          credits_amount: number
          delta: number | null
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_amount: number
          delta?: number | null
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_amount?: number
          delta?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_credit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_credits: {
        Row: {
          created_at: string | null
          credits_available: number | null
          credits_used: number | null
          id: string
          last_reset: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_available?: number | null
          credits_used?: number | null
          id?: string
          last_reset?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_available?: number | null
          credits_used?: number | null
          id?: string
          last_reset?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_documents: {
        Row: {
          created_at: string | null
          document_type: string
          id: string
          report_run_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          document_type?: string
          id?: string
          report_run_id: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          id?: string
          report_run_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_documents_report_run_id_fkey"
            columns: ["report_run_id"]
            isOneToOne: false
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      report_documents_backup: {
        Row: {
          document_type: string | null
          id: string | null
          report_run_id: string | null
          storage_path: string | null
        }
        Insert: {
          document_type?: string | null
          id?: string | null
          report_run_id?: string | null
          storage_path?: string | null
        }
        Update: {
          document_type?: string | null
          id?: string | null
          report_run_id?: string | null
          storage_path?: string | null
        }
        Relationships: []
      }
      report_runs: {
        Row: {
          company_snapshot: Json | null
          content_html: string | null
          content_md: string | null
          created_at: string | null
          docx_path: string | null
          duration_ms: number | null
          error: string | null
          hash: string | null
          id: string
          is_featured: boolean | null
          lang: string | null
          language: string | null
          markdown_path: string | null
          meta: Json | null
          mode: string | null
          model: string | null
          pdf_path: string | null
          reused_from_run_id: string | null
          status: string | null
          symbol: string | null
          template_id: string | null
          tone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_snapshot?: Json | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string | null
          docx_path?: string | null
          duration_ms?: number | null
          error?: string | null
          hash?: string | null
          id?: string
          is_featured?: boolean | null
          lang?: string | null
          language?: string | null
          markdown_path?: string | null
          meta?: Json | null
          mode?: string | null
          model?: string | null
          pdf_path?: string | null
          reused_from_run_id?: string | null
          status?: string | null
          symbol?: string | null
          template_id?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_snapshot?: Json | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string | null
          docx_path?: string | null
          duration_ms?: number | null
          error?: string | null
          hash?: string | null
          id?: string
          is_featured?: boolean | null
          lang?: string | null
          language?: string | null
          markdown_path?: string | null
          meta?: Json | null
          mode?: string | null
          model?: string | null
          pdf_path?: string | null
          reused_from_run_id?: string | null
          status?: string | null
          symbol?: string | null
          template_id?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_runs_reused_from_run_id_fkey"
            columns: ["reused_from_run_id"]
            isOneToOne: false
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          hero_image_url: string | null
          id: string
          language: string | null
          name: string
          pills: string[] | null
          published_at: string | null
          sections: Json | null
          slug: string
          summary: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          language?: string | null
          name: string
          pills?: string[] | null
          published_at?: string | null
          sections?: Json | null
          slug: string
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          language?: string | null
          name?: string
          pills?: string[] | null
          published_at?: string | null
          sections?: Json | null
          slug?: string
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports_embeddings: {
        Row: {
          chunk_index: number
          created_at: string | null
          embedding: string
          id: string
          lang: string | null
          report_run_id: string
          tone: string | null
        }
        Insert: {
          chunk_index: number
          created_at?: string | null
          embedding: string
          id?: string
          lang?: string | null
          report_run_id: string
          tone?: string | null
        }
        Update: {
          chunk_index?: number
          created_at?: string | null
          embedding?: string
          id?: string
          lang?: string | null
          report_run_id?: string
          tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_embeddings_report_run_id_fkey"
            columns: ["report_run_id"]
            isOneToOne: false
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      research_topics: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_compute_report_hash: {
        Args: { p_lang: string; p_mode: string; p_symbol: string }
        Returns: string
      }
      fn_consume_report_credit:
        | {
            Args: { p_metadata?: Json; p_symbol?: string; p_user_id: string }
            Returns: {
              remaining_credits: number
              success: boolean
            }[]
          }
        | {
            Args: { p_cost: number; p_user_id: string }
            Returns: {
              remaining_credits: number
              success: boolean
            }[]
          }
      fn_find_reusable_report: {
        Args: { p_lang?: string; p_mode?: string; p_symbol: string }
        Returns: {
          created_at: string
          lang: string
          mode: string
          run_id: string
          symbol: string
        }[]
      }
      fn_get_popular_symbols: {
        Args: { p_limit?: number; p_range_days?: number }
        Returns: {
          generation_count: number
          latest_created_at: string
          symbol: string
        }[]
      }
      fn_initialize_profile: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      fn_record_report_run: {
        Args: {
          p_report_data: Json
          p_storage_path: string
          p_template_id: string
          p_user_id: string
        }
        Returns: string
      }
      match_reports_embeddings: {
        Args: {
          p_lang?: string
          p_match_count?: number
          p_query_run_id: string
          p_tone?: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          report_run_id: string
          similarity: number
          symbol: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
