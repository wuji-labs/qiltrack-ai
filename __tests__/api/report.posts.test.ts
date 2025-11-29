import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { POST as adminCreatePost } from "@/app/api/admin/report/posts/route";
import { GET as getReportPost } from "@/app/api/report/posts/[slug]/route";
import { POST as userUpload } from "@/app/api/report/upload/route";

const applyCookies = (response: Response) => response;

let currentSupabase: Record<string, unknown> = {};

vi.mock("@/app/api/_utils/supabase", () => {
  return {
    initSupabase: vi.fn(() => ({
      supabase: currentSupabase,
      responseCookies: [],
      applyCookies,
    })),
    getAuthContext: vi.fn(),
    isAdminOrEditor: (role: string | null) => role === "admin" || role === "editor",
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(),
  uploadToStorage: vi.fn(),
}));

const { getAuthContext } = await import("@/app/api/_utils/supabase");
const { uploadToStorage } = await import("@/lib/supabase/server");

describe("Report posts APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSupabase = {};
  });

  it("returns 403 for non-admin post creation", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ userId: "user-1", role: "user" });
    const request = new NextRequest("http://localhost/api/admin/report/posts", {
      method: "POST",
      body: JSON.stringify({ title: "Test", slug: "test" }),
      headers: { "content-type": "application/json" },
    });

    const response = await adminCreatePost(request);
    expect(response.status).toBe(403);
  });

  it("returns 404 when report post is missing", async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      }),
    };
    currentSupabase = {
      from: vi.fn().mockReturnValue(queryChain),
    };
    vi.mocked(getAuthContext).mockResolvedValue({ userId: null, role: null });

    const request = new NextRequest("http://localhost/api/report/posts/missing", {
      method: "GET",
    });
    const response = await getReportPost(request, { params: { slug: "missing" } });

    expect(response.status).toBe(404);
    expect(queryChain.eq).toHaveBeenCalledWith("slug", "missing");
  });

  it("returns 401 when uploading without session", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ userId: null, role: null });
    const form = new FormData();
    form.append("title", "Test Upload");
    const request = new NextRequest("http://localhost/api/report/upload", {
      method: "POST",
      body: form,
    });

    const response = await userUpload(request);
    expect(response.status).toBe(401);
    expect(uploadToStorage).not.toHaveBeenCalled();
  });
});
