import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, uploadToStorage } from "@/lib/supabase/server";
import { getAuthContext, initSupabase } from "@/app/api/_utils/supabase";
import { validateFile, sanitizeFilename } from "@/lib/api/file-validator";
import { checkRateLimit, fileUploadRateLimit } from "@/lib/api/rate-limit";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const context = initSupabase(request);

  try {
    const { userId } = await getAuthContext(context);
    if (!userId) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return context.applyCookies(response);
    }

    // Rate limit check for file uploads
    const { success, headers } = await checkRateLimit(
      userId,
      fileUploadRateLimit
    );

    if (!success) {
      const response = NextResponse.json(
        { error: "Too many upload attempts. Please try again later." },
        { status: 429, headers }
      );
      return context.applyCookies(response);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      const response = NextResponse.json({ error: "file is required" }, { status: 400 });
      return context.applyCookies(response);
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_SIZE) {
      const response = NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
      return context.applyCookies(response);
    }

    // Validate file type, extension, and signature
    const validationResult = await validateFile(file);
    if (!validationResult.valid) {
      const response = NextResponse.json(
        { error: validationResult.error || "Invalid file" },
        { status: 400 }
      );
      return context.applyCookies(response);
    }

    const title = (formData.get("title") as string) || file.name || "User upload";
    const note = (formData.get("note") as string) || null;
    const parsedVersion = Number.parseInt((formData.get("version") as string) || "", 10);
    const version = Number.isFinite(parsedVersion) ? parsedVersion : 1;

    const sanitizedName = sanitizeFilename(file.name);
    const storagePath = `uploads/${userId}/${Date.now()}-${sanitizedName}`;

    const serviceClient = createServiceRoleClient();
    const signedUrl = await uploadToStorage(serviceClient, "report-assets", storagePath, file);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (serviceClient as any)
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

    const response = NextResponse.json({ upload: data, signedUrl }, { status: 201 });
    return context.applyCookies(response);
  } catch (err) {
    console.error("Error uploading user report:", err);
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return context.applyCookies(response);
  }
}
