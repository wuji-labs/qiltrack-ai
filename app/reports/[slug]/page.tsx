import { headers } from "next/headers";
import { notFound } from "next/navigation";
import LocalizedLink from "./LocalizedLink";
import ClientReportContent from "./ClientReportContent";
import { findSeedReportBySlug, mapApiPostToCard } from "@/lib/content/reportHub";
import type { ReportCard, ReportPost } from "@/types/report";

// Force dynamic rendering so we always resolve the latest slug + SSR data
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  if (host) return `${protocol}://${host}`;

  return "http://localhost:3000";
}

async function fetchReportFromApi(slug: string): Promise<ReportCard | null> {
  try {
    const apiUrl = `${await getBaseUrl()}/api/report/posts/${encodeURIComponent(slug)}`;
    const res = await fetch(apiUrl, { cache: "no-store" });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error("Failed to fetch report post", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { post?: ReportPost };
    if (!data?.post) return null;
    return mapApiPostToCard(data.post);
  } catch (err) {
    console.error("Error fetching report post detail", err);
    return null;
  }
}

async function resolveReportFromSlug(slugRaw: string): Promise<ReportCard | null> {
  const slug = decodeURIComponent(slugRaw);
  const apiReport = await fetchReportFromApi(slug);
  if (apiReport) return apiReport;
  return findSeedReportBySlug(slug) ?? null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const report = await resolveReportFromSlug(slug);
  if (!report) return { title: "Report not found" };
  return {
    title: report.title,
    description: report.snippet,
  };
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params;
  const report = await resolveReportFromSlug(slug);
  if (!report) return notFound();

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <LocalizedLink
          href="/reports"
          textKey="reports.detail.back"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-emerald)] hover:underline"
          prefix="← "
        />
        <ClientReportContent report={report} />
        <div className="text-center">
          <LocalizedLink
            href="/"
            textKey="reports.detail.home"
            className="rounded-full border border-[var(--stroke-soft)] px-5 py-3 text-sm font-semibold text-[var(--accent-emerald)]"
          />
        </div>
      </div>
    </main>
  );
}
