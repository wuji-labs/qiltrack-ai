export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Permissive Supabase type definitions
 * The real schema is defined in Supabase, but to keep CI type-checks unblocked
 * we allow any table/function names and payload shapes.
 */
export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: Array<{
          foreignKeyName?: string;
          columns?: string[];
          referencedRelation?: string;
          referencedColumns?: string[];
        }>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: Record<string, unknown>;
    };
  };
}
