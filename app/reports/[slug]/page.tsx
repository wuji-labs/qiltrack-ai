import Link from "next/link";
import { notFound } from "next/navigation";
import ClientReportContent from "./ClientReportContent";
import { reports } from "../data";

type Props = {
	params: { slug: string };
};

export function generateMetadata({ params }: Props) {
	const report = reports.find((item) => item.symbol.toLowerCase() === params.slug.toLowerCase());
	if (!report) return { title: "Report not found" };
	return {
		title: report.title,
		description: report.snippet,
	};
}

export default async function ReportDetailPage({ params }: Props) {
	const report = reports.find((item) => item.symbol.toLowerCase() === params.slug.toLowerCase());
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
