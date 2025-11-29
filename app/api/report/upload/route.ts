import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, uploadToStorage } from "@/lib/supabase/server";
import { getAuthContext, initSupabase } from "@/app/api/_utils/supabase";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const context = initSupabase(request);

  try {
    const { userId } = await getAuthContext(context);
    if (!userId) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
      return context.applyCookies(response);
    }

    const title = (formData.get("title") as string) || file.name || "User upload";
    const note = (formData.get("note") as string) || null;
    const parsedVersion = Number.parseInt(
      (formData.get("version") as string) || "",
      10
    );
    const version = Number.isFinite(parsedVersion) ? parsedVersion : 1;

    const sanitizedName = file.name.replace(/[^\w.\-]+/g, "-");
    const storagePath = `uploads/${userId}/${Date.now()}-${sanitizedName}`;

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
        user_id: userId,
        title,
        note,
        file_path: storagePath,
        version,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      const response = NextResponse.json(
        { error: error.message || "Failed to record upload" },
        { status: 500 }
      );
      return context.applyCookies(response);
    }

    const response = NextResponse.json(
      { upload: data, signedUrl },
      { status: 201 }
    );
    return context.applyCookies(response);
  } catch (err) {
    console.error("Error uploading user report:", err);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return context.applyCookies(response);
  }
}
