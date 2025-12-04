import { NextRequest, NextResponse } from "next/server";
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { createReportBlueprint } from "@/lib/report/blueprint";
import { buildPerformanceChart, buildValuationChart, renderChartPng } from "@/lib/report/charts";
// TODO: Restore quota audit after refactoring
// import { writeReportAudit } from "@/lib/services/quota";
import {
  createServerClient,
  createServiceRoleClient,
  uploadToStorage,
} from "@/lib/supabase/server";
import type { CompanyData, ReportResponse, ReportTone } from "@/types/report";

const styles = StyleSheet.create({
  // Cover page styles
  coverPage: {
    padding: 0,
    backgroundColor: "#0a0a0c",
    color: "#e6f4ff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  coverHero: {
    textAlign: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: "#5be0b0",
    marginBottom: 12,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontSize: 24,
    color: "#dce7ff",
    marginBottom: 8,
  },
  coverSymbol: {
    fontSize: 18,
    color: "#9fb1c5",
    marginBottom: 40,
  },
  coverStats: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginTop: 32,
  },
  statPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#132018",
    border: "1 solid #1c1c22",
  },
  statLabel: {
    fontSize: 9,
    color: "#9fb1c5",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#5be0b0",
    marginTop: 4,
  },
  coverFooter: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280",
  },

  // Content page styles
  page: {
    padding: 32,
    backgroundColor: "#0a0a0c",
    color: "#e6f4ff",
    fontSize: 10,
  },
  header: {
    borderBottom: "2 solid #1c1c22",
    paddingBottom: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#5be0b0",
  },
  subtitle: {
    fontSize: 10,
    color: "#9fb1c5",
    marginTop: 4,
  },
  badgeRow: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#132018",
    color: "#c5f3de",
    fontSize: 9,
    fontWeight: 600,
  },
  section: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    border: "1 solid #1c1c22",
    backgroundColor: "#0f1218",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    color: "#dce7ff",
  },
  twoColumn: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#0c1016",
    border: "1 solid #161a22",
  },
  kpiCard: {
    width: "48%",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#0e1724",
    border: "1 solid #1c2a3b",
  },
  kpiHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 9,
    color: "#9fb1c5",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  kpiIcon: {
    fontSize: 10,
    color: "#5be0b0",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#123026",
    border: "1 solid #1e3a2f",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e6f4ff",
  },
  kpiHelper: {
    fontSize: 9,
    color: "#9fb1c5",
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: "#9fb1c5",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e6f4ff",
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#cdd8ea",
    marginBottom: 6,
  },
  insightList: {
    marginTop: 6,
    paddingLeft: 12,
  },
  insightItem: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  chartImage: {
    marginTop: 12,
    borderRadius: 12,
  },
  disclaimer: {
    fontSize: 9,
    color: "#8ea0b5",
    lineHeight: 1.5,
  },
  newsTimeline: {
    marginTop: 8,
  },
  newsItem: {
    marginBottom: 10,
    padding: 8,
    borderLeft: "2 solid #5be0b0",
    paddingLeft: 12,
    backgroundColor: "#0c1016",
    borderRadius: 8,
  },
  newsDate: {
    fontSize: 8,
    color: "#9fb1c5",
    marginBottom: 4,
  },
  newsHeadline: {
    fontSize: 10,
    color: "#e6f4ff",
    fontWeight: 600,
    marginBottom: 3,
  },
  newsSource: {
    fontSize: 8,
    color: "#6b7280",
  },
});

type ExportPayload = {
  reportRunId?: string;
  report?: string;
  companyData?: CompanyData;
  symbol?: string;
  tone?: ReportTone;
  planLabel?: string;
};

const buildMetricCards = (items: { label: string; value: string; helper?: string }[]) =>
  items.map((item) => (
    <View key={item.label} style={styles.metricCard}>
      <Text style={styles.metricLabel}>{item.label}</Text>
      <Text style={styles.metricValue}>{item.value}</Text>
      {item.helper ? <Text style={styles.subtitle}>{item.helper}</Text> : null}
    </View>
  ));

const toDataUri = (buffer: Buffer | null) =>
  buffer ? `data:image/png;base64,${buffer.toString("base64")}` : undefined;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
  const supabase = createServerClient(request.cookies, (cookies) => {
    responseCookies.push(...cookies);
  });

  const respond = (body: Record<string, unknown>, status: number) => {
    const response = NextResponse.json(body, { status });
    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );
    return response;
  };

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[PDF_EXPORT] Session error:", sessionError);
    return respond({ error: "Session error", code: "session_error", details: sessionError.message }, 401);
  }

  if (!session?.user?.id) {
    console.warn("[PDF_EXPORT] No session found - user not authenticated");
    return respond({ error: "Please log in to export PDF", code: "not_authenticated" }, 401);
  }

  const payload = (await request.json().catch(() => null)) as ExportPayload | null;

  if (!payload || !payload.reportRunId) {
    return respond({ error: "Invalid payload", code: "invalid_payload" }, 400);
  }

  const userId = session.user.id;
  const reportRunId = payload.reportRunId;
  const bucket = process.env.SUPABASE_STORAGE_REPORT_BUCKET || "report-assets";
  const clientPlanLabel = (payload.planLabel || "").toLowerCase();
  const clientIsAnnual = clientPlanLabel === "annual";

  let profileIsAnnual = false;
  let profilePlan = "";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_type")
      .eq("id", userId as never)
      .single();
    profilePlan = (
      (profile as { subscription_type?: string; plan?: string })?.subscription_type ||
      (profile as { subscription_type?: string; plan?: string })?.plan ||
      ""
    ).toLowerCase();
    profileIsAnnual = profilePlan === "annual";

    if (clientPlanLabel === "annual" && !profileIsAnnual) {
      console.warn("Plan mismatch: client claims annual but profile is not annual", {
        profilePlan,
        clientPlanLabel,
      });
    }
  } catch (err) {
    console.warn("Profile lookup failed:", err);
  }

  const hasAnnualAccess = profileIsAnnual || clientIsAnnual;

  if (!hasAnnualAccess) {
    return respond(
      {
        error: "Annual plan required",
        code: "plan_required",
        hint: profilePlan ? `profile=${profilePlan}` : "profile_missing",
      },
      403
    );
  }

  let resolvedReport = payload.report;
  let resolvedCompany = payload.companyData;
  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch (err) {
    console.error("Service role client init failed:", err);
    return respond({ error: "Server storage not configured", code: "env_missing" }, 500);
  }

  if (!resolvedReport) {
    const markdownCandidates = [
      `${userId}/${reportRunId}/document.md`,
      `${userId}/${reportRunId}.md`,
    ];

    for (const path of markdownCandidates) {
      try {
        const { data: file, error } = await serviceClient.storage.from(bucket).download(path);
        if (!error && file) {
          resolvedReport = await file.text();
          break;
        }
      } catch (err) {
        console.warn("Failed to fetch markdown from storage:", err);
      }
    }
  }

  if (!resolvedCompany) {
    try {
      const { data: runData } = await supabase
        .from("report_runs")
        .select("company_snapshot, symbol")
        .eq("id", reportRunId as never)
        .single();
      if ((runData as { company_snapshot?: CompanyData; symbol?: string })?.company_snapshot) {
        resolvedCompany =
          ((runData as { company_snapshot?: CompanyData; symbol?: string })
            .company_snapshot as CompanyData) || undefined;
      } else if ((runData as { company_snapshot?: CompanyData; symbol?: string })?.symbol) {
        resolvedCompany = {
          symbol: (runData as { company_snapshot?: CompanyData; symbol?: string }).symbol!,
          profile: {},
          quote: {},
          metrics: {},
          recentNews: [],
        };
      }
    } catch (err) {
      console.warn("Failed to fetch company snapshot:", err);
    }
  }

  if (!resolvedReport || !resolvedCompany) {
    return respond(
      { error: "Missing report content or company data", code: "invalid_payload" },
      400
    );
  }

  const reportPayload: ReportResponse = {
    symbol: payload.symbol || resolvedCompany.symbol,
    report: resolvedReport,
    companyData: resolvedCompany,
    reportRunId,
  };

  const blueprint = createReportBlueprint(reportPayload, payload.tone || "baseline");
  const perfChart = buildPerformanceChart(resolvedCompany);
  const valChart = buildValuationChart(resolvedCompany);

  const [perfImage, valImage] = await Promise.all([
    renderChartPng(perfChart, { width: 800, height: 400 }).catch(() => null),
    renderChartPng(valChart, { width: 800, height: 400 }).catch(() => null),
  ]);

  // Helper to format date for news
  const formatNewsDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Helper to format market cap
  const formatMarketCap = (value: number | undefined) => {
    if (!value) return "N/A";
    return `$${(value / 1000).toFixed(1)}B`;
  };

  const buildKpiMetrics = (company: CompanyData) => {
    const price = company.quote.current;
    const changePct = company.quote.changePercent;
    const roe = company.metrics.roeTTM;
    return [
      {
        label: "Market Cap",
        value: formatMarketCap(company.profile.marketCapitalization),
        icon: "MC",
      },
      {
        label: "P/E (TTM)",
        value:
          company.metrics.peTTM !== undefined && company.metrics.peTTM !== null
            ? `${company.metrics.peTTM.toFixed(2)}x`
            : "N/A",
        icon: "PE",
      },
      {
        label: "Price",
        value: price !== undefined && price !== null ? `$${price.toFixed(2)}` : "N/A",
        helper:
          changePct !== undefined && changePct !== null
            ? `${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}%`
            : undefined,
        icon: changePct !== undefined && changePct !== null ? (changePct >= 0 ? "▲" : "▼") : "$",
      },
      {
        label: "ROE",
        value: roe !== undefined && roe !== null ? `${roe.toFixed(2)}%` : "N/A",
        helper: "Return on Equity",
        icon: "ROE",
      },
    ];
  };

  const doc = (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHero}>
          <Text style={styles.coverTitle}>{blueprint.companyName}</Text>
          <Text style={styles.coverSubtitle}>Investment Analysis Report</Text>
          <Text style={styles.coverSymbol}>{blueprint.symbol}</Text>

          <View style={styles.coverStats}>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Market Cap</Text>
              <Text style={styles.statValue}>
                {formatMarketCap(blueprint.marketCap as number | undefined)}
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Industry</Text>
              <Text style={styles.statValue}>{blueprint.industry || "N/A"}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Analysis Tone</Text>
              <Text style={styles.statValue}>{blueprint.tone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text>Generated by Investor AI</Text>
          <Text>{new Date(blueprint.generatedAt).toLocaleDateString("en-US")}</Text>
          <Text style={{ marginTop: 8 }}>Annual Premium Report</Text>
        </View>
      </Page>

      {/* Content Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {blueprint.companyName} ({blueprint.symbol})
          </Text>
          <Text style={styles.subtitle}>
            Generated at {new Date(blueprint.generatedAt).toUTCString()}
          </Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>Annual Premium</Text>
            {blueprint.industry && <Text style={styles.badge}>{blueprint.industry}</Text>}
            {blueprint.exchange && <Text style={styles.badge}>{blueprint.exchange}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.insightList}>
            {blueprint.keyInsights.map((insight, idx) => (
              <Text key={insight + idx} style={styles.insightItem}>
                • {insight}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Snapshot</Text>
          <View style={styles.grid}>{buildMetricCards(blueprint.profile)}</View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.kpiGrid}>
            {buildKpiMetrics(resolvedCompany).map((kpi) => (
              <View key={kpi.label} style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  {kpi.icon ? <Text style={styles.kpiIcon}>{kpi.icon}</Text> : null}
                </View>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                {kpi.helper ? <Text style={styles.kpiHelper}>{kpi.helper}</Text> : null}
              </View>
            ))}
          </View>
        </View>

        {/* News Timeline */}
        {blueprint.newsHighlights && blueprint.newsHighlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent News</Text>
            <View style={styles.newsTimeline}>
              {blueprint.newsHighlights.slice(0, 5).map((news, idx) => (
                <View key={idx} style={styles.newsItem}>
                  <Text style={styles.newsDate}>
                    {news.datetime ? formatNewsDate(news.datetime) : "Recent"}
                  </Text>
                  <Text style={styles.newsHeadline}>{news.headline}</Text>
                  {news.source && <Text style={styles.newsSource}>{news.source}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valuation & Profitability</Text>
          <View style={styles.grid}>{buildMetricCards(blueprint.valuation)}</View>
          {valImage ? (
            <Image src={toDataUri(valImage)} style={[styles.chartImage, { height: 220 }]} />
          ) : (
            <Text style={styles.bodyText}>Charts unavailable due to limited valuation data.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Analysis</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Liquidity</Text>
              <View style={styles.grid}>{buildMetricCards(blueprint.liquidity)}</View>
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Quality</Text>
              <View style={styles.grid}>{buildMetricCards(blueprint.quality)}</View>
            </View>
          </View>
          {perfImage ? (
            <Image src={toDataUri(perfImage)} style={[styles.chartImage, { height: 220 }]} />
          ) : (
            <Text style={styles.bodyText}>Charts unavailable due to missing price history.</Text>
          )}
        </View>

        {blueprint.sections.slice(0, 4).map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.bodyText}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer</Text>
          <Text style={styles.disclaimer}>{blueprint.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  );

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = (await pdf(doc).toBuffer()) as unknown as Buffer;
  } catch (err) {
    console.error("PDF render failed:", err);
    return respond({ error: "PDF generation failed", fallback: "docx" }, 500);
  }

  const pdfSizeBytes = pdfBuffer.byteLength;
  const pdfPath = `${userId}/${reportRunId}/document.pdf`;

  let signedUrl: string | null = null;
  try {
    signedUrl = await uploadToStorage(serviceClient, bucket, pdfPath, pdfBuffer);
    await serviceClient.from("report_documents").insert({
      report_run_id: reportRunId,
      document_type: "pdf",
      storage_path: pdfPath,
    });
  } catch (err) {
    console.error("PDF storage failed:", err);
  }

  try {
    // TODO: Restore quota audit after refactoring
    // await writeReportAudit(
    //   userId,
    //   blueprint.symbol,
    //   "production",
    //   signedUrl ? "success" : "failed"
    // );
  } catch (err) {
    console.warn("Audit log failed:", err);
  }

  const durationMs = Date.now() - startedAt;
  const chartFailures = [perfImage, valImage].filter((img) => !img).length;

  const response = NextResponse.json({
    ok: true,
    downloadUrl: signedUrl,
    pdfBase64: signedUrl ? undefined : pdfBuffer.toString("base64"),
    duration_ms: durationMs,
    chart_failures: chartFailures,
    pdf_size_bytes: pdfSizeBytes,
    reportRunId,
    storage_path: signedUrl ? pdfPath : null,
  });

  responseCookies.forEach(({ name, value }) =>
    response.headers.append("Set-Cookie", `${name}=${value}`)
  );
  return response;
}
