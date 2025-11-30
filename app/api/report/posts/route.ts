import { NextRequest, NextResponse } from "next/server";
import { initSupabase, getAuthContext, isAdminOrEditor } from "@/app/api/_utils/supabase";
import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_PAGE_SIZE = 50;
const COVER_SIGN_TTL = 60 * 30; // 30 minutes

export async function GET(request: NextRequest) {
  const context = initSupabase(request);

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const offset = (page - 1) * limit;

    const tag = searchParams.get("tag");
    const theme = searchParams.get("theme");
    const lang = searchParams.get("lang");
    const search = searchParams.get("q");
    const statusFilter = searchParams.get("status");

    const { role } = await getAuthContext(context);
    const isAdmin = isAdminOrEditor(role);

    let query = context.supabase
      .from("report_posts")
      .select(
        "id, title, slug, summary, cover, theme, tags, lang, status, version, author_id, published_at, created_at, updated_at",
        { count: "exact" }
      );

    if (isAdmin && statusFilter) {
      query = query.eq("status" as never, statusFilter);
    } else if (!isAdmin) {
      query = query.eq("status" as never, "published");
    }

    if (lang) {
      query = query.eq("lang" as never, lang);
    }

    if (theme) {
      query = query.eq("theme" as never, theme);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      const response = NextResponse.json(
        { error: "Failed to fetch report posts" },
        { status: 500 }
      );
      return context.applyCookies(response);
    }

    const postsWithCover = await attachSignedCover(data as any ?? []);

    const response = NextResponse.json({
      posts: postsWithCover,
      pagination: {
        page,
        pageSize: limit,
        total: count ?? 0,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    });

    return context.applyCookies(response);
  } catch (err) {
    console.error("Error listing report posts:", err);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return context.applyCookies(response);
  }
}

async function attachSignedCover(
  posts: Array<{
    cover?: string | null;
  }>
) {
  if (!posts.length) return posts;

  try {
    const service = createServiceRoleClient();
    const resolved = await Promise.all(
      posts.map(async (post) => {
        const coverPath = post.cover;
        if (!coverPath || coverPath.startsWith("http") || coverPath.startsWith("url(")) {
          return post;
        }

        const { data, error } = await service.storage
          .from("report-assets")
          .createSignedUrl(coverPath, COVER_SIGN_TTL);

        if (!error && data?.signedUrl) {
          return { ...post, cover: data.signedUrl };
        }
        return post;
      })
    );
    return resolved;
  } catch (err) {
    console.warn("Cover signing skipped:", err);
    return posts;
  }
}
