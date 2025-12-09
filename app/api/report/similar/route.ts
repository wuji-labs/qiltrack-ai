import { NextRequest, NextResponse } from "next/server";

import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { appendCookies } from "@/lib/utils/cookie-helper";

export async function GET(request: NextRequest) {
  const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

  const supabase = createServerClient(
    (name: string) => {
      const cookieValue = request.cookies.get(name)?.value;
      return cookieValue ? { value: cookieValue } : undefined;
    },
    (cookies) => {
      responseCookies.push(...cookies);
    }
  );

  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");
  const limit = Math.max(1, Math.min(10, Number(url.searchParams.get("limit") || "3")));
  const tone = url.searchParams.get("tone");
  const lang = url.searchParams.get("lang");

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
  const tokenFromHeader = request.headers.get("x-test-token");
  const tokenFromQuery = url.searchParams.get("testToken");
  const isTestBypass =
    Boolean(testToken) && (tokenFromHeader === testToken || tokenFromQuery === testToken);

  let userId: string | null = null;

  if (!isTestBypass) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      appendCookies(response, responseCookies);
      return response;
    }
    userId = session.user.id;
  } else {
    userId = "00000000-0000-0000-0000-000000000001";
  }

  const serviceRoleClient = createServiceRoleClient();

  const { data, error } = await serviceRoleClient.rpc(
    "match_reports_embeddings" as never,
    {
      p_user_id: userId,
      p_query_run_id: runId,
      p_lang: lang || null,
      p_tone: tone || null,
      p_match_count: limit,
    } as never
  );

  if (error) {
    console.error("similar reports rpc error:", error);
    const response = NextResponse.json(
      { error: "Failed to fetch similar reports" },
      { status: 500 }
    );
    appendCookies(response, responseCookies);
    return response;
  }

  const response = NextResponse.json({ similar: data ?? [] });
  appendCookies(response, responseCookies);
  return response;
}
