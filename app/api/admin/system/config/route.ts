import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("system_config")
      .select("*");

    if (error) {
      // 表可能不存在，返回空数组
      console.log("System config table might not exist:", error.message);
      return NextResponse.json({ configs: [] });
    }

    return NextResponse.json({ configs: data || [] });
  } catch (error) {
    console.error("Get system config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key) {
      return NextResponse.json({ error: "缺少配置键" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase
      .from("system_config")
      .upsert({
        key,
        value: { value },
        description,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    if (error) {
      console.error("Save config error:", error);
      return NextResponse.json({ error: "保存配置失败" }, { status: 500 });
    }

    // 记录审计日志
    await supabase.from("audit_logs").insert({
      action: "UPDATE_CONFIG",
      resource_type: "config",
      resource_id: key,
      details: { new_value: value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save system config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (key) {
      // 删除单个配置
      const { error } = await supabase
        .from("system_config")
        .delete()
        .eq("key", key);

      if (error) {
        return NextResponse.json({ error: "删除配置失败" }, { status: 500 });
      }
    } else {
      // 删除所有配置（重置）
      const { error } = await supabase
        .from("system_config")
        .delete()
        .neq("key", "");

      if (error) {
        return NextResponse.json({ error: "重置配置失败" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete system config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
