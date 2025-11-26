import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ClientReportContent from "./ClientReportContent";
import { getAllReports } from "@/lib/content/reportHub";

// Force dynamic rendering so slug is read from the incoming request (SSG was producing empty params).
export const dynamic = "force-dynamic";

type Props = {
	params: { slug: string };
};

const matchReport = async (slugRaw: string | string[] | undefined) => {
	let raw = Array.isArray(slugRaw) ? slugRaw.join("/") : slugRaw || "";

	if (!raw) {
		const h = await headers();
		raw =
			h.get("x-pathname")?.split("/").filter(Boolean).pop() ||
			h.get("x-matched-path")?.split("/").filter(Boolean).pop() ||
			h.get("x-invoke-path")?.split("/").filter(Boolean).pop() ||
			h.get("x-request-path")?.split("/").filter(Boolean).pop() ||
			"";
	}

	const slug = decodeURIComponent(raw).trim().toLowerCase();
	const reports = getAllReports();
	const match = reports.find((item) => {
		const symbolMatch = (item.symbol || "").toLowerCase() === slug;
		const urlSlug = (item.url || "").split("/").filter(Boolean).pop();
		const urlMatch = (urlSlug || "").toLowerCase() === slug;
		return symbolMatch || urlMatch;
	});

	if (process.env.DEBUG_REPORTS === "true") {
		// Log helpful diagnostics in dev/ops without exposing in UI
		 
		const h = await headers();
		console.log("[reports][slug]", {
			slugRaw,
			extracted: raw,
			slug,
			match: match?.symbol,
			symbols: reports.map((r) => r.symbol),
			headers: {
				"x-pathname": h.get("x-pathname"),
				"x-matched-path": h.get("x-matched-path"),
				"x-invoke-path": h.get("x-invoke-path"),
				"x-request-path": h.get("x-request-path"),
				host: h.get("host"),
				all: Object.fromEntries((await headers()).entries()),
			},
		});
	}

	return match;
};

export async function generateMetadata({ params }: Props) {
	const report = await matchReport(params.slug);
	if (!report) return { title: "Report not found" };
	return {
		title: report.title,
		description: report.snippet,
	};
}

export default async function ReportDetailPage({ params }: Props) {
	const report = await matchReport(params.slug);
	if (!report) return notFound();

	return (
		<main className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
			<div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
				<Link
					href="/reports"
					className="inline-flex items-center gap-2 text-sm text-[var(--accent-emerald)] hover:underline"
				>
					← 返回报告
				</Link>
				<ClientReportContent report={report} />
				<div className="text-center">
					<Link href="/" className="rounded-full border border-[var(--stroke-soft)] px-5 py-3 text-sm font-semibold text-[var(--accent-emerald)]">
						返回首页
					</Link>
				</div>
			</div>
		</main>
	);
}
