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

  // Default to port 3001 for local development
  return "http://localhost:3001";
}

async function fetchReportFromApi(slug: string): Promise<ReportCard | null> {
  try {
    const apiUrl = `${await getBaseUrl()}/api/report/posts/${encodeURIComponent(slug)}`;
    console.log("[SSR] Fetching report from:", apiUrl);
    const res = await fetch(apiUrl, { cache: "no-store" });

    if (res.status === 404) {
      console.log("[SSR] Report not found (404):", slug);
      return null;
    }
    if (!res.ok) {
      console.error("[SSR] Failed to fetch report post", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { post?: ReportPost };
    if (!data?.post) {
      console.warn("[SSR] No post data in response for:", slug);
      return null;
    }
    console.log("[SSR] Successfully fetched report:", slug);
    return mapApiPostToCard(data.post);
  } catch (err) {
    console.error("[SSR] Error fetching report post detail for", slug, ":", err);
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

  if (!report) {
    return {
      title: "Report not found",
      robots: {
        index: false,
        follow: false,
      }
    };
  }

  const baseUrl = await getBaseUrl();
  const reportUrl = `${baseUrl}/reports/${slug}`;

  // Use SEO-optimized meta fields if available, fallback to regular fields
  const metaTitle = (report as any).metaTitle || (report as any).meta_title || report.title;
  const metaDescription = (report as any).metaDescription || (report as any).meta_description || report.snippet;
  const keywords = (report as any).metaKeywords || (report as any).meta_keywords || report.tags;
  const coverImage = report.cover.startsWith('url(')
    ? report.cover.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1] || `${baseUrl}/og-default.png`
    : `${baseUrl}${report.cover}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,

    // Open Graph metadata for social sharing
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: reportUrl,
      siteName: 'Qiltrack AI',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: report.title,
        }
      ],
      locale: report.language === 'zh-Hans' ? 'zh_CN'
        : report.language === 'zh-Hant' ? 'zh_TW'
        : report.language === 'ja' ? 'ja_JP'
        : report.language === 'ko' ? 'ko_KR'
        : 'en_US',
      type: 'article',
      publishedTime: report.date,
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [coverImage],
      creator: '@QiltrackAI',
    },

    // Canonical URL to avoid duplicate content issues
    alternates: {
      canonical: reportUrl,
    },

    // Robots meta tag - allow indexing for timed-free content
    robots: {
      index: (report as any).accessLevel === 'timed-free' || !(report as any).accessLevel,
      follow: true,
      googleBot: {
        index: (report as any).accessLevel === 'timed-free' || !(report as any).accessLevel,
        follow: true,
      },
    },

    // Additional metadata
    authors: [{ name: report.author }],
    category: report.theme,
  };
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params;
  const report = await resolveReportFromSlug(slug);
  if (!report) return notFound();

  const baseUrl = await getBaseUrl();
  const reportUrl = `${baseUrl}/reports/${slug}`;
  const coverImage = report.cover.startsWith('url(')
    ? report.cover.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1] || `${baseUrl}/og-default.png`
    : `${baseUrl}${report.cover}`;

  // JSON-LD structured data for rich search results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: report.title,
    description: report.snippet,
    image: coverImage,
    datePublished: report.date,
    dateModified: report.date,
    author: {
      '@type': 'Organization',
      name: 'Qiltrack AI',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Qiltrack AI',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': reportUrl,
    },
    articleSection: report.theme,
    keywords: report.tags.join(', '),
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
    </>
  );
}
