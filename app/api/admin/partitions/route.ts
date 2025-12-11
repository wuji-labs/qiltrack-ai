import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, successResponse } from "@/lib/api/error-handler";
import { UnauthorizedError, ForbiddenError } from "@/lib/core/errors";

/**
 * GET /api/admin/partitions
 * List all partitions for a table
 */
export async function GET(request: NextRequest) {
  const responseCookies: Array<{
    name: string;
    value: string;
    options?: unknown;
  }> = [];

  try {
    // 1. Authentication
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      throw new UnauthorizedError("Session not found or expired");
    }

    // 2. Authorization - check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !profile.role || !["super_admin", "admin"].includes(profile.role)) {
      throw new ForbiddenError("Only administrators can view partition information");
    }

    // 3. Get table name from query
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table") || "audit_logs";

    // 4. Call partition listing function
    // @ts-ignore - fn_list_partitions not in generated types yet
    const { data, error } = await supabase.rpc("fn_list_partitions", {
      p_table_name: tableName,
    });

    if (error) {
      throw new Error(`Failed to list partitions: ${error.message}`);
    }

    return successResponse({
      table: tableName,
      partitions: data || [],
    });
  } catch (error) {
    console.error("[ADMIN_PARTITIONS_ERROR]", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/partitions/create
 * Create next partition
 */
export async function POST(request: NextRequest) {
  const responseCookies: Array<{
    name: string;
    value: string;
    options?: unknown;
  }> = [];

  try {
    // 1. Authentication
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      throw new UnauthorizedError("Session not found or expired");
    }

    // 2. Authorization
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !profile.role || !["super_admin", "admin"].includes(profile.role)) {
      throw new ForbiddenError("Only administrators can create partitions");
    }

    // 3. Parse request body
    const body = await request.json();
    const { table, monthsAhead = 1 } = body;

    if (!table) {
      throw new Error("Table name is required");
    }

    // 4. Call partition creation function
    // @ts-ignore - fn_create_next_partition not in generated types yet
    const { data, error } = await supabase.rpc("fn_create_next_partition", {
      p_table_name: table,
      p_months_ahead: monthsAhead,
    });

    if (error) {
      throw new Error(`Failed to create partition: ${error.message}`);
    }

    return successResponse({
      message: data,
      table,
      monthsAhead,
    });
  } catch (error) {
    console.error("[ADMIN_PARTITION_CREATE_ERROR]", error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/partitions
 * Drop old partitions
 */
export async function DELETE(request: NextRequest) {
  const responseCookies: Array<{
    name: string;
    value: string;
    options?: unknown;
  }> = [];

  try {
    // 1. Authentication
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      throw new UnauthorizedError("Session not found or expired");
    }

    // 2. Authorization
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      throw new ForbiddenError("Only super administrators can drop partitions");
    }

    // 3. Parse request body
    const body = await request.json();
    const { table, retentionMonths = 12 } = body;

    if (!table) {
      throw new Error("Table name is required");
    }

    // 4. Call partition drop function
    // @ts-ignore - fn_drop_old_partitions not in generated types yet
    const { data, error } = await supabase.rpc("fn_drop_old_partitions", {
      p_table_name: table,
      p_retention_months: retentionMonths,
    });

    if (error) {
      throw new Error(`Failed to drop old partitions: ${error.message}`);
    }

    return successResponse({
      message: data,
      table,
      retentionMonths,
    });
  } catch (error) {
    console.error("[ADMIN_PARTITION_DROP_ERROR]", error);
    return handleApiError(error);
  }
}
