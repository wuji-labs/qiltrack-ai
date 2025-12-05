import { NextRequest, NextResponse } from "next/server";
import { initSupabase, getAuthContext, isAdminOrEditor } from "@/app/api/_utils/supabase";

/**
 * 一键上架: 将report_run转换为report_post
 * POST /api/admin/report/runs/publish
 * Body: { runId: string, title?: string, summary?: string, theme?: string, tags?: string[] }
 */
export async function POST(request: NextRequest) {
  const context = initSupabase(request);

  try {
    // 权限检查
    const { role, userId } = await getAuthContext(context);
    if (!isAdminOrEditor(role)) {
      return context.applyCookies(
        NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
      );
    }

    // 解析请求体
    const body = await request.json();
    const { runId, title, summary, theme, tags, lang } = body;

    if (!runId) {
      return context.applyCookies(
        NextResponse.json({ error: "runId is required" }, { status: 400 })
      );
    }

    // 1. 获取report_run信息
    const { data: run, error: runError } = await context.supabase
      .from("report_runs")
      .select("id, symbol, language, tone, markdown_path, docx_path, company_snapshot, created_at, user_id")
      .eq("id", runId)
      .eq("status", "completed")
      .maybeSingle();

    if (runError || !run) {
      return context.applyCookies(
        NextResponse.json(
          { error: "Report run not found or not completed" },
          { status: 404 }
        )
      );
    }

    // 2. 生成slug (使用symbol + timestamp)
    const timestamp = Date.now();
    const symbolStr = run.symbol || 'unknown';
    const slug = `${symbolStr.toLowerCase()}-${timestamp}`;

    // 3. 准备封面 (可以使用默认封面或者从storage获取)
    const cover = ""; // 可以后续添加封面上传功能

    // 4. 生成报告正文 (从markdown_path读取)
    let body_content = "";
    if (run.markdown_path) {
      // 这里简化处理,实际可能需要从storage读取
      body_content = `# ${symbolStr} 投资报告\n\n生成时间: ${run.created_at}\n\n详情请查看附件文档。`;
    }

    // 5. 创建report_post
    const { data: post, error: postError } = await context.supabase
      .from("report_posts")
      .insert({
        title: title || `${symbolStr} 投资研究报告`,
        slug: slug,
        summary: summary || `${symbolStr} 的深度投资分析报告,基于最新数据生成`,
        body: body_content,
        cover: cover,
        theme: theme || "investment",
        tags: tags || [run.symbol, "investment", "research"],
        lang: lang || run.language || "zh",
        status: "draft", // 默认为草稿,管理员可以后续发布
        version: 1,
        author_id: userId,
        symbol: run.symbol,
        markdown_signed_url: run.markdown_path,
        docx_signed_url: run.docx_path,
      })
      .select()
      .single();

    if (postError) {
      console.error("Failed to create report post:", postError);
      return context.applyCookies(
        NextResponse.json(
          { error: "Failed to create report post", details: postError.message },
          { status: 500 }
        )
      );
    }

    return context.applyCookies(
      NextResponse.json({
        success: true,
        post: post,
        message: "报告已上架到报告中心,当前状态为草稿",
      })
    );
  } catch (err) {
    console.error("Publish report error:", err);
    return context.applyCookies(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
}
