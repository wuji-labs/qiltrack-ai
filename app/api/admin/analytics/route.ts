import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const startDate = subDays(new Date(), days);

    // 获取每日用户数
    const { data: users } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    const dailyUsers = aggregateByDate(users || [], days);

    // 获取每日报告数
    const { data: reports } = await supabase
      .from("report_runs")
      .select("created_at, status")
      .gte("created_at", startDate.toISOString());

    const dailyReports = aggregateReportsByDate(reports || [], days);

    // 获取热门股票
    const { data: symbolData } = await supabase
      .from("report_runs")
      .select("symbol")
      .not("symbol", "is", null);

    const symbolCounts: Record<string, number> = {};
    symbolData?.forEach((r: { symbol: string }) => {
      symbolCounts[r.symbol] = (symbolCounts[r.symbol] || 0) + 1;
    });

    const topSymbols = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symbol, count]) => ({ symbol, count }));

    // 汇总数据
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalReports } = await supabase
      .from("report_runs")
      .select("*", { count: "exact", head: true });

    const { count: successReports } = await supabase
      .from("report_runs")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: paidUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("plan", "free");

    const successRate = totalReports && totalReports > 0
      ? ((successReports || 0) / totalReports) * 100
      : 0;

    const conversionRate = totalUsers && totalUsers > 0
      ? ((paidUsers || 0) / totalUsers) * 100
      : 0;

    return NextResponse.json({
      dailyUsers,
      dailyReports,
      topSymbols,
      summary: {
        totalUsers: totalUsers || 0,
        totalReports: totalReports || 0,
        successRate,
        conversionRate,
        avgReportsPerUser: totalUsers && totalUsers > 0
          ? (totalReports || 0) / totalUsers
          : 0,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}

function aggregateByDate(items: { created_at: string }[], days: number) {
  const result: { date: string; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "MM/dd");

    const count = items.filter((item) => {
      const itemDate = format(new Date(item.created_at), "yyyy-MM-dd");
      return itemDate === dateStr;
    }).length;

    result.push({ date: displayDate, count });
  }

  return result;
}

function aggregateReportsByDate(items: { created_at: string; status: string }[], days: number) {
  const result: { date: string; count: number; success: number; failed: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "MM/dd");

    const dayItems = items.filter((item) => {
      const itemDate = format(new Date(item.created_at), "yyyy-MM-dd");
      return itemDate === dateStr;
    });

    result.push({
      date: displayDate,
      count: dayItems.length,
      success: dayItems.filter((i) => i.status === "completed").length,
      failed: dayItems.filter((i) => i.status === "failed").length,
    });
  }

  return result;
}
