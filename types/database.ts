export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          details: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name?: string | null;
          record_id?: string | null;
          details?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string | null;
          record_id?: string | null;
          details?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          plan: string | null;
          quota_limit: number | null;
          reports_used: number | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          last_report_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          role: "admin" | "editor" | "user" | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: string | null;
          quota_limit?: number | null;
          reports_used?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          last_report_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          role?: "admin" | "editor" | "user" | null;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: string | null;
          quota_limit?: number | null;
          reports_used?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          last_report_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          role?: "admin" | "editor" | "user" | null;
        };
        Relationships: [];
      };
      report_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string | null;
          body: string | null;
          cover: string | null;
          theme: string | null;
          tags: string[] | null;
          lang: string | null;
          status: "draft" | "published";
          version: number | null;
          author_id: string | null;
          user_id: string | null;
          report_run_id: string | null;
          tone: string | null;
          symbol: string | null;
          published_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary?: string | null;
          body?: string | null;
          cover?: string | null;
          theme?: string | null;
          tags?: string[] | null;
          lang?: string | null;
          status?: "draft" | "published";
          version?: number | null;
          author_id?: string | null;
          user_id?: string | null;
          report_run_id?: string | null;
          tone?: string | null;
          symbol?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          slug?: string;
          summary?: string | null;
          body?: string | null;
          cover?: string | null;
          theme?: string | null;
          tags?: string[] | null;
          lang?: string | null;
          status?: "draft" | "published";
          version?: number | null;
          author_id?: string | null;
          user_id?: string | null;
          report_run_id?: string | null;
          tone?: string | null;
          symbol?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_posts_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_report_uploads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          note: string | null;
          file_path: string;
          version: number | null;
          status: "pending" | "approved" | "rejected";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          note?: string | null;
          file_path: string;
          version?: number | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          title?: string;
          note?: string | null;
          file_path?: string;
          version?: number | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_report_uploads_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      report_runs: {
        Row: {
          id: string;
          user_id: string | null;
          template_id: string | null;
          symbol: string | null;
          tone: string | null;
          language: string | null;
          status: string | null;
          model: string | null;
          company_snapshot: Json | null;
          duration_ms: number | null;
          error: string | null;
          markdown_path: string | null;
          docx_path: string | null;
          created_at: string | null;
          updated_at: string | null;
          mode: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          template_id?: string | null;
          symbol?: string | null;
          tone?: string | null;
          language?: string | null;
          status?: string | null;
          model?: string | null;
          company_snapshot?: Json | null;
          duration_ms?: number | null;
          error?: string | null;
          markdown_path?: string | null;
          docx_path?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          mode?: string | null;
        };
        Update: {
          user_id?: string | null;
          template_id?: string | null;
          symbol?: string | null;
          tone?: string | null;
          language?: string | null;
          status?: string | null;
          model?: string | null;
          company_snapshot?: Json | null;
          duration_ms?: number | null;
          error?: string | null;
          markdown_path?: string | null;
          docx_path?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          mode?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_runs_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "report_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_runs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      report_documents: {
        Row: {
          id: string;
          report_run_id: string;
          document_type: string;
          storage_path: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          report_run_id: string;
          document_type?: string;
          storage_path?: string;
          created_at?: string | null;
        };
        Update: {
          report_run_id?: string;
          document_type?: string;
          storage_path?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_documents_report_run_id_fkey";
            columns: ["report_run_id"];
            referencedRelation: "report_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      report_credits: {
        Row: {
          id: string;
          user_id: string;
          credits_available: number | null;
          credits_used: number | null;
          credits_total: number | null;
          last_reset: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          credits_available?: number | null;
          credits_used?: number | null;
          credits_total?: number | null;
          last_reset?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          credits_available?: number | null;
          credits_used?: number | null;
          credits_total?: number | null;
          last_reset?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_credits_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      report_credit_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          credits_amount: number;
          reason: string | null;
          created_at: string | null;
          metadata: Json | null;
          delta: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          credits_amount: number;
          reason?: string | null;
          created_at?: string | null;
          metadata?: Json | null;
          delta?: number | null;
        };
        Update: {
          user_id?: string;
          event_type?: string;
          credits_amount?: number;
          reason?: string | null;
          created_at?: string | null;
          metadata?: Json | null;
          delta?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_credit_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_user_quota: {
        Row: {
          user_id: string | null;
          email: string | null;
          plan: string | null;
          quota_limit: number | null;
          reports_used: number | null;
          remaining_credits: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      fn_consume_report_credit: {
        Args: { p_user_id: string; p_symbol?: string; p_metadata?: Json };
        Returns: { success: boolean; remaining_credits: number }[];
      };
      fn_record_report_run: {
        Args: {
          p_user_id: string;
          p_template_id: string;
          p_report_data: Json;
          p_storage_path: string;
        };
        Returns: string;
      };
      fn_initialize_profile: {
        Args: { p_user_id: string; p_email: string };
        Returns: void;
      };
      fn_user_has_password: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_active_users_count: {
        Args: { days: number };
        Returns: number;
      };
      fn_find_reusable_report: {
        Args: { p_symbol: string; p_lang: string; p_mode: string };
        Returns: Array<{
          id: string;
          report_run_id: string;
          symbol: string;
          lang: string;
          tone: string;
          created_at: string;
        }>;
      };
      fn_claim_daily_reward: {
        Args: { p_user_id: string };
        Returns: { success: boolean; remaining_credits: number }[];
      };
      fn_get_popular_symbols: {
        Args: { p_range_days: number; p_limit: number };
        Returns: Array<{ symbol: string; count: number }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
