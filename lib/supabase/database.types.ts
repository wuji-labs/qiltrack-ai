export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_2024_11: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2024_12: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_01: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_02: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_03: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_04: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_05: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_06: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_07: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_08: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_09: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_10: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_11: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_12: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_default: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
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
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_plan: string | null
          type: string
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_plan?: string | null
          type: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_plan?: string | null
          type?: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string | null
          id: string
          last_claimed_at: string | null
          streak_count: number | null
          total_claimed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_claimed_at?: string | null
          streak_count?: number | null
          total_claimed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_claimed_at?: string | null
          streak_count?: number | null
          total_claimed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      mfa_devices: {
        Row: {
          backup_codes_encrypted: string[] | null
          backup_codes_used: number | null
          created_at: string | null
          device_name: string
          device_type: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          secret_encrypted: string
          updated_at: string | null
          use_count: number | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes_encrypted?: string[] | null
          backup_codes_used?: number | null
          created_at?: string | null
          device_name: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          secret_encrypted: string
          updated_at?: string | null
          use_count?: number | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes_encrypted?: string[] | null
          backup_codes_used?: number | null
          created_at?: string | null
          device_name?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          secret_encrypted?: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_login_attempts: {
        Row: {
          created_at: string | null
          device_id: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          method: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          method?: string | null
          success: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          method?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_login_attempts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "mfa_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mfa_login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          last_login_at: string | null
          last_report_at: string | null
          mfa_enabled: boolean | null
          mfa_enforced: boolean | null
          plan: string | null
          referral_code: string | null
          referral_completed_at: string | null
          referred_by: string | null
          role: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          last_login_at?: string | null
          last_report_at?: string | null
          mfa_enabled?: boolean | null
          mfa_enforced?: boolean | null
          plan?: string | null
          referral_code?: string | null
          referral_completed_at?: string | null
          referred_by?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          last_login_at?: string | null
          last_report_at?: string | null
          mfa_enabled?: boolean | null
          mfa_enforced?: boolean | null
          plan?: string | null
          referral_code?: string | null
          referral_completed_at?: string | null
          referred_by?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      referral_events: {
        Row: {
          created_at: string | null
          credits_rewarded: number | null
          duration_rewarded: number | null
          event_type: string
          id: string
          metadata: Json | null
          plan_rewarded: string | null
          referral_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_rewarded?: number | null
          duration_rewarded?: number | null
          event_type: string
          id?: string
          metadata?: Json | null
          plan_rewarded?: string | null
          referral_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_rewarded?: number | null
          duration_rewarded?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          plan_rewarded?: string | null
          referral_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_milestones: {
        Row: {
          achieved: boolean | null
          achieved_at: string | null
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string
          milestone_type: string
          reward_credits: number | null
          reward_duration: number | null
          reward_plan: string | null
          user_id: string
        }
        Insert: {
          achieved?: boolean | null
          achieved_at?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type: string
          reward_credits?: number | null
          reward_duration?: number | null
          reward_plan?: string | null
          user_id: string
        }
        Update: {
          achieved?: boolean | null
          achieved_at?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type?: string
          reward_credits?: number | null
          reward_duration?: number | null
          reward_plan?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          credits_awarded: number | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          credits_awarded?: number | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          credits_awarded?: number | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_credit_events: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_credit_events_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_credit_events_2024_11: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2024_12: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_01: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_02: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_03: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_04: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_05: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_06: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_07: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_08: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_09: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_10: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_11: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_2025_12: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credit_events_default: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          event_type: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          event_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_credits: {
        Row: {
          created_at: string | null
          credits_available: number
          credits_used: number
          id: string
          last_reset_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_available?: number
          credits_used?: number
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_available?: number
          credits_used?: number
          id?: string
          last_reset_at?: string | null
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
      report_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string | null
          id: string
          rating: number | null
          report_run_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          rating?: number | null
          report_run_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          rating?: number | null
          report_run_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_feedback_report_run_id_fkey"
            columns: ["report_run_id"]
            isOneToOne: false
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_posts: {
        Row: {
          body: string | null
          cover: string | null
          created_at: string | null
          id: string
          language: string
          published_at: string | null
          report_run_id: string | null
          slug: string
          status: string | null
          summary: string | null
          symbol: string | null
          tags: string[] | null
          theme: string | null
          title: string
          tone: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          body?: string | null
          cover?: string | null
          created_at?: string | null
          id?: string
          language?: string
          published_at?: string | null
          report_run_id?: string | null
          slug: string
          status?: string | null
          summary?: string | null
          symbol?: string | null
          tags?: string[] | null
          theme?: string | null
          title: string
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          body?: string | null
          cover?: string | null
          created_at?: string | null
          id?: string
          language?: string
          published_at?: string | null
          report_run_id?: string | null
          slug?: string
          status?: string | null
          summary?: string | null
          symbol?: string | null
          tags?: string[] | null
          theme?: string | null
          title?: string
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_posts_report_run_id_fkey"
            columns: ["report_run_id"]
            isOneToOne: true
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          language: string
          markdown_path: string | null
          meta: Json | null
          mode: string | null
          model: string | null
          pdf_path: string | null
          reused_from_run_id: string | null
          status: string | null
          symbol: string
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
          language?: string
          markdown_path?: string | null
          meta?: Json | null
          mode?: string | null
          model?: string | null
          pdf_path?: string | null
          reused_from_run_id?: string | null
          status?: string | null
          symbol: string
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
          language?: string
          markdown_path?: string | null
          meta?: Json | null
          mode?: string | null
          model?: string | null
          pdf_path?: string | null
          reused_from_run_id?: string | null
          status?: string | null
          symbol?: string
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
          language: string | null
          report_run_id: string
          tone: string | null
        }
        Insert: {
          chunk_index: number
          created_at?: string | null
          embedding: string
          id?: string
          language?: string | null
          report_run_id: string
          tone?: string | null
        }
        Update: {
          chunk_index?: number
          created_at?: string | null
          embedding?: string
          id?: string
          language?: string | null
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
      user_report_uploads: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          note: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          note?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          note?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_report_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          ip_address: unknown
          payload: Json
          processed_at: string | null
          provider: string | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          ip_address?: unknown
          payload: Json
          processed_at?: string | null
          provider?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          payload?: Json
          processed_at?: string | null
          provider?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_admin_disable_user_mfa: {
        Args: { p_admin_id: string; p_reason: string; p_target_user_id: string }
        Returns: boolean
      }
      fn_analyze_vector_search_performance: {
        Args: { p_limit?: number; p_test_embedding: string }
        Returns: {
          execution_time_ms: number
          results_count: number
          search_method: string
        }[]
      }
      fn_cancel_membership: {
        Args: { p_immediate?: boolean; p_user_id: string }
        Returns: Json
      }
      fn_check_milestones: { Args: { p_user_id: string }; Returns: undefined }
      fn_claim_daily_reward: {
        Args: { p_user_id: string }
        Returns: {
          message: string
          remaining_credits: number
          streak_count: number
          success: boolean
        }[]
      }
      fn_claim_milestone_reward: {
        Args: { p_milestone_type: string; p_user_id: string }
        Returns: {
          credits_rewarded: number
          duration_rewarded: number
          message: string
          plan_rewarded: string
          success: boolean
        }[]
      }
      fn_claim_referral_signup: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: {
          credits_given: number
          message: string
          referrer_id: string
          success: boolean
        }[]
      }
      fn_cleanup_old_webhook_events: { Args: never; Returns: number }
      fn_compute_report_hash: {
        Args: { p_language: string; p_symbol: string; p_tone: string }
        Returns: string
      }
      fn_consume_credit: {
        Args: {
          p_amount?: number
          p_metadata?: Json
          p_symbol?: string
          p_user_id: string
        }
        Returns: {
          message: string
          remaining_credits: number
          success: boolean
        }[]
      }
      fn_create_next_partition: {
        Args: { p_months_ahead?: number; p_table_name: string }
        Returns: string
      }
      fn_drop_old_partitions: {
        Args: { p_retention_months?: number; p_table_name: string }
        Returns: string
      }
      fn_find_reusable_report: {
        Args: {
          p_language: string
          p_symbol: string
          p_tone: string
          p_user_id?: string
        }
        Returns: {
          content_md: string
          created_at: string
          id: string
          language: string
          symbol: string
          tone: string
          user_id: string
        }[]
      }
      fn_generate_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      fn_get_hnsw_stats: {
        Args: never
        Returns: {
          avg_query_time_ms: number
          index_name: string
          index_size: string
          table_name: string
          times_used: number
          total_rows: number
        }[]
      }
      fn_get_popular_symbols: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          count: number
          symbol: string
        }[]
      }
      fn_get_user_identities: {
        Args: never
        Returns: {
          created_at: string
          provider: string
        }[]
      }
      fn_grant_conversion_reward: {
        Args: { p_plan: string; p_user_id: string }
        Returns: boolean
      }
      fn_grant_credits: {
        Args: { p_amount: number; p_reason?: string; p_target_user_id: string }
        Returns: Json
      }
      fn_initialize_profile: {
        Args: {
          p_display_name?: string
          p_email: string
          p_referral_code?: string
          p_user_id: string
        }
        Returns: undefined
      }
      fn_is_webhook_processed: {
        Args: { p_event_id: string; p_provider: string }
        Returns: boolean
      }
      fn_list_partitions: {
        Args: { p_table_name: string }
        Returns: {
          partition_end: string
          partition_name: string
          partition_size: string
          partition_start: string
          row_count: number
        }[]
      }
      fn_mark_webhook_completed: {
        Args: { p_webhook_id: string }
        Returns: undefined
      }
      fn_mark_webhook_failed: {
        Args: { p_error_message: string; p_webhook_id: string }
        Returns: undefined
      }
      fn_mark_webhook_processing: {
        Args: { p_webhook_id: string }
        Returns: boolean
      }
      fn_rebuild_hnsw_index: {
        Args: { p_ef_construction?: number; p_m?: number }
        Returns: string
      }
      fn_record_mfa_attempt: {
        Args: {
          p_device_id: string
          p_failure_reason?: string
          p_ip_address?: unknown
          p_method: string
          p_success: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      fn_record_webhook_event: {
        Args: {
          p_event_id: string
          p_event_type: string
          p_ip_address?: unknown
          p_payload: Json
          p_provider: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      fn_upgrade_membership: {
        Args: {
          p_plan: string
          p_stripe_customer_id: string
          p_stripe_subscription_id: string
          p_user_id: string
        }
        Returns: Json
      }
      fn_user_has_active_mfa: { Args: { p_user_id: string }; Returns: boolean }
      fn_user_has_password: { Args: never; Returns: boolean }
      get_active_users_count: { Args: { days?: number }; Returns: number }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      match_reports_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          report_run_id: string
          similarity: number
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

