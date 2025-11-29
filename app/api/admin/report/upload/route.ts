import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, uploadToStorage } from "@/lib/supabase/server";
import { getAuthContext, initSupabase, isAdminOrEditor } from "@/app/api/_utils/supabase";

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB for admin assets
const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

export async function POST(request: NextRequest) {
  const context = initSupabase(request);

  try {
    const { userId, role } = await getAuthContext(context);
    if (!userId || !isAdminOrEditor(role)) {
      const response = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return context.applyCookies(response);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      const response = NextResponse.json({ error: "file is required" }, { status: 400 });
      return context.applyCookies(response);
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      const response = NextResponse.json(
        { error: "File too large (max 20MB)" },
        { status: 400 }
      );
      return context.applyCookies(response);
    }

    const targetUserId = (formData.get("userId") as string) || userId;
    const title = (formData.get("title") as string) || file.name || "Admin upload";
    const note = (formData.get("note") as string) || null;
    const parsedVersion = Number.parseInt(
      (formData.get("version") as string) || "",
      10
    );
    const version = Number.isFinite(parsedVersion) ? parsedVersion : 1;
    const statusValue = (formData.get("status") as string) || "approved";
    const status = VALID_STATUSES.includes(statusValue as (typeof VALID_STATUSES)[number])
      ? (statusValue as (typeof VALID_STATUSES)[number])
      : "approved";

    const sanitizedName = file.name.replace(/[^\w.\-]+/g, "-");
    const storagePath = `admin-uploads/${targetUserId}/${Date.now()}-${sanitizedName}`;

    const serviceClient = createServiceRoleClient();
    const signedUrl = await uploadToStorage(
      serviceClient,
      "report-assets",
      storagePath,
      file
    );

    const { data, error } = await serviceClient
      .from("user_report_uploads")
      .insert({
        user_id: targetUserId,
        title,
        note,
        file_path: storagePath,
        version,
        status,
      })
      .select("*")
      .single();

    if (error) {
      const response = NextResponse.json(
        { error: error.message || "Failed to record admin upload" },
        { status: 500 }
      );
      return context.applyCookies(response);
    }

    const response = NextResponse.json(
      { upload: data, signedUrl, path: storagePath },
      { status: 201 }
    );
    return context.applyCookies(response);
  } catch (err) {
    console.error("Error in admin upload:", err);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return context.applyCookies(response);
  }
}
