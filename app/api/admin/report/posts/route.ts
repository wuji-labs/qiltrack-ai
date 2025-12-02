import { NextRequest, NextResponse } from "next/server";
import { initSupabase, getAuthContext, isAdminOrEditor } from "@/app/api/_utils/supabase";

type PostPayload = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string | null;
  body?: string | null;
  cover?: string | null;
  theme?: string | null;
  tags?: string[];
  lang?: string;
  status?: "draft" | "published";
  version?: number;
  publishedAt?: string | null;
};

function ensureArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  throw new Error("tags must be an array");
}

function validateStatus(status: unknown): "draft" | "published" {
  if (status === "draft" || status === "published" || status === undefined || status === null) {
    return (status as "draft" | "published") ?? "draft";
  }
  throw new Error("status must be draft or published");
}

async function ensureAdmin(context: ReturnType<typeof initSupabase>) {
  const { userId, role } = await getAuthContext(context);
  if (!userId || !isAdminOrEditor(role)) {
    return { allowed: false as const, userId: null as string | null };
  }
  return { allowed: true as const, userId };
}

export async function POST(request: NextRequest) {
  const context = initSupabase(request);

  try {
    const auth = await ensureAdmin(context);
    if (!auth.allowed || !auth.userId) {
      const response = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return context.applyCookies(response);
    }

    const payload = (await request.json()) as PostPayload;
    if (!payload.title || !payload.slug) {
      const response = NextResponse.json({ error: "title and slug are required" }, { status: 400 });
      return context.applyCookies(response);
    }

    let tags: string[];
    let status: "draft" | "published";
    try {
      tags = ensureArray(payload.tags);
      status = validateStatus(payload.status);
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : "Invalid payload";
      const response = NextResponse.json({ error: message }, { status: 400 });
      return context.applyCookies(response);
    }

    const publishedAt =
      status === "published" ? payload.publishedAt || new Date().toISOString() : null;

    const { data, error } = await context.supabase
      .from("report_posts")
      .insert({
        title: payload.title,
        slug: payload.slug,
        summary: payload.summary ?? null,
        body: payload.body ?? null,
        cover: payload.cover ?? null,
        theme: payload.theme ?? null,
        tags: tags.length ? tags : [],
        lang: payload.lang ?? "en",
        status,
        version: payload.version ?? 1,
        author_id: auth.userId,
        published_at: publishedAt,
      } as never)
      .select("*")
      .single();

    if (error) {
      const response = NextResponse.json(
        { error: error.message || "Failed to create report post" },
        { status: 500 }
      );
      return context.applyCookies(response);
    }

    const response = NextResponse.json({ post: data }, { status: 201 });
    return context.applyCookies(response);
  } catch (err) {
    console.error("Error creating report post:", err);
    const response = NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
    return context.applyCookies(response);
  }
}

export async function PATCH(request: NextRequest) {
  const context = initSupabase(request);

  try {
    const auth = await ensureAdmin(context);
    if (!auth.allowed) {
      const response = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return context.applyCookies(response);
    }

    const payload = (await request.json()) as PostPayload;
    const identifier = payload.id
      ? { column: "id" as const, value: payload.id }
      : payload.slug
        ? { column: "slug" as const, value: payload.slug }
        : null;

    if (!identifier) {
      const response = NextResponse.json(
        { error: "id or slug is required to update a post" },
        { status: 400 }
      );
      return context.applyCookies(response);
    }

    const { data: existing, error: fetchError } = await context.supabase
      .from("report_posts")
      .select("*")
      .eq(identifier.column, identifier.value as never)
      .single();

    if (fetchError || !existing) {
      const response = NextResponse.json({ error: "Report post not found" }, { status: 404 });
      return context.applyCookies(response);
    }

    let tags: string[] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let status: "draft" | "published" = (existing as any)?.status ?? "draft";
    try {
      tags = payload.tags ? ensureArray(payload.tags) : undefined;
      status = payload.status ? validateStatus(payload.status) : status;
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : "Invalid payload";
      const response = NextResponse.json({ error: message }, { status: 400 });
      return context.applyCookies(response);
    }
    const nextVersion =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload.version ?? ((existing as any).version ?? 1) + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let publishedAt = (existing as any).published_at;
    if (status === "published" && !publishedAt) {
      publishedAt = payload.publishedAt || new Date().toISOString();
    } else if (status === "draft") {
      publishedAt = null;
    } else if (payload.publishedAt) {
      publishedAt = payload.publishedAt;
    }

    const updatePayload = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      title: payload.title ?? (existing as any).title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slug: payload.slug ?? (existing as any).slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: payload.summary ?? (existing as any).summary,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: payload.body ?? (existing as any).body,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cover: payload.cover ?? (existing as any).cover,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      theme: payload.theme ?? (existing as any).theme,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: tags ?? (existing as any).tags ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lang: payload.lang ?? (existing as any).lang ?? "en",
      status,
      version: nextVersion,
      published_at: publishedAt,
    };

    const { data, error } = await context.supabase
      .from("report_posts")
      .update(updatePayload as never)
      .eq(identifier.column, identifier.value as never)
      .select("*")
      .single();

    if (error) {
      const response = NextResponse.json(
        { error: error.message || "Failed to update report post" },
        { status: 500 }
      );
      return context.applyCookies(response);
    }

    const response = NextResponse.json({ post: data });
    return context.applyCookies(response);
  } catch (err) {
    console.error("Error updating report post:", err);
    const response = NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
    return context.applyCookies(response);
  }
}
