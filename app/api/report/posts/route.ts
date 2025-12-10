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
    const accessLevelFilter = searchParams.get("accessLevel");

    const { role } = await getAuthContext(context);
    const isAdmin = isAdminOrEditor(role);

    // Admin sees additional fields for SEO management
    // 营销策略：报告列表使用 service role 绕过 RLS，所有人都能看到报告卡片（含 access_level 徽章）
    // 权限检查在详情页的 React 组件中进行
    const selectFields = isAdmin
      ? "id, title, slug, summary, cover, theme, tags, language, status, version, user_id, published_at, created_at, updated_at, access_level, quality_score, organic_visits, conversion_rate, featured, view_count"
      : "id, title, slug, summary, cover, theme, tags, language, status, version, user_id, published_at, created_at, updated_at, access_level";

    // Use service role client to bypass RLS for public listing
    const supabaseServiceRole = createServiceRoleClient();
    let query = supabaseServiceRole
      .from("report_posts")
      .select(selectFields, { count: "exact" });

    // Apply status filter
    if (statusFilter) {
      // Admin with explicit status filter
      query = query.eq("status" as never, statusFilter);
    } else if (!isAdmin) {
      // Non-admin users can only see published reports
      query = query.eq("status" as never, "published");
    } else {
      // Admin without status filter - default to published for report hub
      query = query.eq("status" as never, "published");
    }

    if (lang) {
      query = query.eq("language" as never, lang);
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

    if (accessLevelFilter) {
      query = query.eq("access_level" as never, accessLevelFilter);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postsWithCover = await attachSignedCover((data as any) ?? []);

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
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
