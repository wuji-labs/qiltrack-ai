import { NextRequest, NextResponse } from "next/server";
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { createReportBlueprint } from "@/lib/report/blueprint";
import { buildPerformanceChart, buildValuationChart, renderChartPng } from "@/lib/report/charts";
import { writeReportAudit } from "@/lib/services/quota";
import { createServerClient, createServiceRoleClient, uploadToStorage } from "@/lib/supabase/server";
import type { CompanyData, ReportResponse, ReportTone } from "@/types/report";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    backgroundColor: "#0a0a0c",
    color: "#e6f4ff",
    fontSize: 10,
  },
  header: {
    borderBottom: "1 solid #1c1c22",
    paddingBottom: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
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
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#132018",
    color: "#c5f3de",
    fontSize: 9,
  },
  section: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    border: "1 solid #1c1c22",
    backgroundColor: "#0f1218",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    color: "#dce7ff",
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    width: "48%",
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#0c1016",
    border: "1 solid #161a22",
  },
  metricLabel: {
    fontSize: 9,
    color: "#9fb1c5",
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#e6f4ff",
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#cdd8ea",
    marginBottom: 6,
  },
  insightList: {
    marginTop: 6,
    paddingLeft: 12,
  },
  insightItem: {
    fontSize: 10,
    marginBottom: 4,
  },
  chartImage: {
    marginTop: 8,
    borderRadius: 12,
  },
  disclaimer: {
    fontSize: 9,
    color: "#8ea0b5",
    lineHeight: 1.4,
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
    responseCookies.forEach(({ name, value }) => response.headers.append("Set-Cookie", `${name}=${value}`));
    return response;
  };

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    return respond({ error: "Unauthorized" }, 401);
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
    const { data: profile } = await supabase.from("profiles").select("plan, subscription_type").eq("id", userId).single();
    profilePlan = (profile?.subscription_type || profile?.plan || "").toLowerCase();
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
        .eq("id", reportRunId)
        .single();
      if (runData?.company_snapshot) {
        resolvedCompany = (runData.company_snapshot as CompanyData) || undefined;
      } else if (runData?.symbol) {
        resolvedCompany = {
          symbol: runData.symbol,
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
    renderChartPng(perfChart).catch(() => null),
    renderChartPng(valChart).catch(() => null),
  ]);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Investor AI Premium Report - {blueprint.companyName} ({blueprint.symbol})
          </Text>
          <Text style={styles.subtitle}>Generated at {new Date(blueprint.generatedAt).toUTCString()}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>Annual only</Text>
            <Text style={styles.badge}>{blueprint.industry || "Sector"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key insights</Text>
          <View style={styles.insightList}>
            {blueprint.keyInsights.map((insight, idx) => (
              <Text key={insight + idx} style={styles.insightItem}>
                - {insight}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snapshot</Text>
          <View style={styles.grid}>{buildMetricCards(blueprint.profile)}</View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valuation & profitability</Text>
          <View style={styles.grid}>{buildMetricCards(blueprint.valuation)}</View>
          {valImage ? (
            <Image src={toDataUri(valImage)} style={[styles.chartImage, { height: 180 }]} alt="Valuation chart" />
          ) : (
            <Text style={styles.bodyText}>Charts unavailable due to limited valuation data.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liquidity & quality</Text>
          <View style={styles.grid}>{buildMetricCards([...blueprint.liquidity, ...blueprint.quality])}</View>
          {perfImage ? (
            <Image src={toDataUri(perfImage)} style={[styles.chartImage, { height: 180 }]} alt="Performance chart" />
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
    pdfBuffer = await pdf(doc).toBuffer();
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
    await writeReportAudit(userId, blueprint.symbol, "production", signedUrl ? "success" : "failed");
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

  responseCookies.forEach(({ name, value }) => response.headers.append("Set-Cookie", `${name}=${value}`));
  return response;
}
