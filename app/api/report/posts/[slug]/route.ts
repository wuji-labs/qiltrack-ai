import { NextRequest, NextResponse } from "next/server";
import { initSupabase, getAuthContext, isAdminOrEditor } from "@/app/api/_utils/supabase";
import { createServiceRoleClient } from "@/lib/supabase/server";

const COVER_SIGN_TTL = 60 * 30; // 30 minutes

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const context = initSupabase(_request);
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  try {
    const { role } = await getAuthContext(context);
    const isAdmin = isAdminOrEditor(role);

    let query = context.supabase
      .from("report_posts")
      .select(
        "id, title, slug, summary, body, cover, theme, tags, language, status, version, user_id, published_at, created_at, updated_at"
      )
      .eq("slug" as never, slug)
      .limit(1);

    if (!isAdmin) {
      query = query.eq("status" as never, "published");
    }

    const { data, error } = await query.single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      const message = status === 404 ? "Report post not found" : "Failed to fetch report post";
      const response = NextResponse.json({ error: message }, { status });
      return context.applyCookies(response);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postWithCover = await signCover(data as any);

    const response = NextResponse.json({ post: postWithCover });
    return context.applyCookies(response);
  } catch (err) {
    console.error("Error fetching report post detail:", err);
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return context.applyCookies(response);
  }
}

async function signCover(post: { cover?: string | null }) {
  if (!post.cover || post.cover.startsWith("http") || post.cover.startsWith("url(")) {
    return post;
  }
  try {
    const service = createServiceRoleClient();
    const { data, error } = await service.storage
      .from("report-assets")
      .createSignedUrl(post.cover, COVER_SIGN_TTL);
    if (!error && data?.signedUrl) {
      return { ...post, cover: data.signedUrl };
    }
    return post;
  } catch (err) {
    console.warn("Cover signing skipped:", err);
    return post;
  }
}
