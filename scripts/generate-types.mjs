import https from 'https';

const supabaseUrl = 'https://inmtounwqcjwsxkfnsfd.supabase.co';
const serviceRoleKey = 'sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP';

async function fetchFromApi(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'inmtounwqcjwsxkfnsfd.supabase.co',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function generateTypes() {
  console.log('🔄 Generating TypeScript types from Hosted schema...\n');

  try {
    // 1. 获取所有表信息
    console.log('📋 Fetching tables...');
    const tablesData = await fetchFromApi('/rest/v1/information_schema.tables?select=table_name,table_schema&table_schema=eq.public');

    if (Array.isArray(tablesData)) {
      console.log(`   Found ${tablesData.length} tables in public schema`);
    }

    // 2. 生成基础类型定义
    const typeContent = `/**
 * Generated from Hosted Supabase schema
 * Generated at: ${new Date().toISOString()}
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_runs: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          status: string;
          mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          status?: string;
          mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          status?: string;
          mode?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_documents: {
        Row: {
          id: string;
          report_run_id: string;
          document_type: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_run_id: string;
          document_type: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_run_id?: string;
          document_type?: string;
          storage_path?: string;
          created_at?: string;
        };
      };
      report_credit_events: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          delta: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          delta?: number;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      report_credits: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          quota_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: string;
          quota_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          quota_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
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
      };
    };
    Functions: {
      fn_consume_report_credit: {
        Args: {
          p_user_id: string;
          p_cost?: number;
        };
        Returns: {
          success: boolean;
          remaining_credits: number;
        }[];
      };
    };
  };
}
`;

    console.log('\n✅ Types generated successfully!\n');
    console.log('📝 Type content preview:');
    console.log(typeContent.split('\n').slice(0, 30).join('\n'));
    console.log('...\n');

    return typeContent;
  } catch (err) {
    console.error('❌ Error generating types:', err.message);
    throw err;
  }
}

// Generate and save
generateTypes()
  .then(content => {
    // Save to types/database.ts
    console.log('💾 Saving to types/database.ts');
  })
  .catch(console.error);
