import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  message: string;
}

export async function GET() {
  const checks: HealthCheck[] = [];

  // 检查数据库
  const dbCheck = await checkDatabase();
  checks.push(dbCheck);

  // 检查存储
  const storageCheck = await checkStorage();
  checks.push(storageCheck);

  // 总体状态
  const overallStatus = checks.every(c => c.status === "healthy")
    ? "healthy"
    : checks.some(c => c.status === "down")
      ? "down"
      : "degraded";

  return NextResponse.json({
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
  });
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        service: "database",
        status: "down",
        latency: Date.now() - start,
        message: "配置缺失",
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const latency = Date.now() - start;

    if (error) {
      return {
        service: "database",
        status: "down",
        latency,
        message: error.message,
      };
    }

    return {
      service: "database",
      status: latency < 500 ? "healthy" : "degraded",
      latency,
      message: `响应时间 ${latency}ms`,
    };
  } catch (error) {
    return {
      service: "database",
      status: "down",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "连接失败",
    };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        service: "storage",
        status: "down",
        latency: Date.now() - start,
        message: "配置缺失",
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.storage.listBuckets();

    const latency = Date.now() - start;

    if (error) {
      return {
        service: "storage",
        status: "down",
        latency,
        message: error.message,
      };
    }

    return {
      service: "storage",
      status: latency < 1000 ? "healthy" : "degraded",
      latency,
      message: `${data?.length || 0} 个存储桶`,
    };
  } catch (error) {
    return {
      service: "storage",
      status: "down",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "连接失败",
    };
  }
}
