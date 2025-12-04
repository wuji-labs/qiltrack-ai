import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContextFromRequest, isAdmin } from "@/app/api/_utils/supabase";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId: adminUserId, role } = await getAuthContextFromRequest(request);

    if (!adminUserId || !isAdmin(role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { userId, role: newRole, plan } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        role: newRole || undefined,
        plan: plan || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Update user error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: adminUserId,
      action: "user_update",
      table_name: "profiles",
      record_id: userId,
      details: { role: newRole, plan },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新用户失败" },
      { status: 500 }
    );
  }
}
