"use client";

import { useLanguage } from "@/lib/i18n";
import type { ReportCard } from "@/types/report";

type Props = {
	report: ReportCard;
};

export default function ClientReportContent({ report }: Props) {
	const { t, language } = useLanguage();
	const formattedDate = new Date(report.date).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<section className="space-y-4 rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.4)]">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)]">{report.theme}</p>
				<h1 className="text-[32px] sm:text-[44px] font-semibold leading-tight">{report.title}</h1>
				<div className="flex flex-wrap items-center gap-3 text-xs text-subtle uppercase tracking-[0.3em]">
					<span>{report.author}</span>
					<span>{formattedDate}</span>
					<span>{report.readTime} {t("reports.detail.readTime")}</span>
				</div>
				<div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-dim">
					{report.tags.map((tag) => (
						<span key={tag} className="rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">
							#{tag}
						</span>
					))}
				</div>
			</div>
			<div className="relative h-72 overflow-hidden rounded-[24px]">
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: report.cover }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
			</div>
			<div className="space-y-4 text-sm leading-relaxed sm:text-base">
				{report.body.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</div>
		</section>
	);
}
