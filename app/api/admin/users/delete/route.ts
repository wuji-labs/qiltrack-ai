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

    const { userId: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // 删除用户
    await supabaseAdmin.from("audit_logs").insert({
      user_id: adminUserId,
      action: "user_delete",
      table_name: "profiles",
      record_id: targetUserId,
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (error) {
      console.error("Delete user error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除用户失败" },
      { status: 500 }
    );
  }
}
