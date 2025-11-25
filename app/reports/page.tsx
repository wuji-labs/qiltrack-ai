"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useVisibilityStagger } from "./hooks/useVisibilityStagger";
import { getAllReports, listCategories } from "@/lib/content/reportHub";

const reports = getAllReports();
const categories = ["All", ...listCategories()];

export default function ReportsPage() {
	const { t, language } = useLanguage();
	const [selectedCategory, setSelectedCategory] = useState(categories[0]);
	const [pageIndex, setPageIndex] = useState(1);
	const gridRef = useRef<HTMLDivElement>(null);

	useVisibilityStagger(gridRef, {
		itemSelector: '[data-stagger-item]',
		threshold: 0.1,
		deps: [pageIndex, selectedCategory],
	});

	// 分页翻页时，重置卡片的 data-visible 状态以触发动画重绑
	useEffect(() => {
		if (!gridRef.current) return;
		const items = Array.from(gridRef.current.querySelectorAll('[data-stagger-item]')) as HTMLElement[];
		items.forEach((item) => {
			item.setAttribute('data-visible', 'false');
		});
	}, [pageIndex]);

	const filteredReports = useMemo(() => {
		return selectedCategory === "All"
			? reports
			: reports.filter((item) => item.theme === selectedCategory);
	}, [selectedCategory]);

	const pageSize = 4;
	const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));

	const pagedReports = useMemo(() => {
		const start = (pageIndex - 1) * pageSize;
		return filteredReports.slice(start, start + pageSize);
	}, [filteredReports, pageIndex]);

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	return (
		<main className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
			<div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-10">
				<section className="relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.45)] text-center">
					<div className="pointer-events-none absolute inset-0 hero-mesh" aria-hidden />
					<div className="relative mx-auto max-w-3xl space-y-4">
						<p className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)] animate-fade-in-up" style={{ animationDelay: '0ms' }}>
							{t("reports.page.hero.kicker")}
						</p>
						<h1 className="text-3xl sm:text-4xl font-semibold leading-tight animate-fade-in-up" style={{ animationDelay: '80ms' }}>
							{t("reports.page.hero.title")}
						</h1>
						<p className="text-base text-dim animate-fade-in-up" style={{ animationDelay: '160ms' }}>
							{t("reports.page.hero.description")}
						</p>
						<div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
							<Link href="#archive" className="btn-gradient px-5 py-2 text-sm font-semibold motion-safe:hover:glow-pulse motion-safe:transition-transform motion-safe:hover:-translate-y-0.5">
								{t("reports.page.hero.cta")}
							</Link>
							<Link
								href="mailto:contact@investor.ai"
								className="inline-flex items-center gap-1 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)] transition-colors motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:glow-pulse"
							>
								{t("reports.page.hero.contact")}
							</Link>
							<Link href="/" className="inline-flex items-center gap-1 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)] transition-colors motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:glow-pulse">
								{t("reports.page.hero.backHome")}
							</Link>
						</div>
					</div>
				</section>

				<section id="archive" className="space-y-8 scroll-mt-28 md:scroll-mt-32">
					<div className="space-y-2">
						<p className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)]">
							{t("reports.page.archiveTag")}
						</p>
						<h2 className="text-2xl font-semibold">{t("reports.page.archiveTitle")}</h2>
						<p className="text-sm text-dim">{t("reports.page.archiveDescription")}</p>
					</div>

					<div className="flex flex-wrap gap-2">
						{categories.map((category) => (
							<button
								key={category}
								type="button"
								onClick={() => {
									setSelectedCategory(category);
									setPageIndex(1);
								}}
								className={`relative rounded-full border px-4 py-1 text-sm transition-all duration-200 ease-out ${
									selectedCategory === category
										? "border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] motion-safe:hover:glow-pulse scale-100"
										: "border-[var(--stroke-soft)] text-dim hover:border-[var(--accent-emerald)]/50 hover:scale-102"
								}`}
								data-selected={selectedCategory === category ? "true" : "false"}
								style={selectedCategory === category ? {
									boxShadow: '0 0 12px rgba(91, 224, 176, 0.4)'
								} : {}}
							>
								{category}
							</button>
						))}
					</div>

					<div className="grid gap-5 lg:grid-cols-2">
						{pagedReports.slice(0, 2).map((report) => (
							<Link
								key={`${report.symbol}-featured`}
								href={report.url}
								className="group relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-2 group-hover:shadow-elevated"
							>
								<div className="relative mb-5 overflow-hidden rounded-[20px]">
									<div
										className="h-48 bg-[var(--bg-base)] transition-transform duration-300 ease-out group-hover:scale-104 group-hover:-translate-y-6px"
										style={{ backgroundImage: report.cover, backgroundSize: "cover", backgroundPosition: "center" }}
									/>
								</div>
								<p className="text-xs uppercase tracking-[0.3em] text-dim">{formatDate(report.date)}</p>
								<h3 className="mt-2 text-2xl font-semibold leading-tight animate-fade-in-up" style={{ animationDelay: '120ms' }}>
									{report.title}
								</h3>
								<p className="mt-3 text-sm text-dim leading-relaxed">{report.snippet}</p>
								<div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[var(--accent-emerald)]">
									<span>{report.theme}</span>
									<span>{t("reports.card.readMore")}</span>
								</div>
							</Link>
						))}
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" ref={gridRef}>
						{pagedReports.slice(2).map((report) => (
							<Link
								key={`${report.symbol}-tile`}
								data-stagger-item
								href={report.url}
								className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
								style={{
									opacity: 'var(--item-opacity, 0)',
									transform: 'var(--item-transform, translateY(8px))',
								}}
							>
								<div
									className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--bg-layer)]"
									style={{ backgroundImage: report.cover, backgroundSize: "cover", backgroundPosition: "center" }}
								>
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
								</div>
								<p className="mt-3 text-xs uppercase tracking-[0.3em] text-dim">{formatDate(report.date)}</p>
								<p className="text-sm font-semibold text-[var(--color-foreground)]">{report.title}</p>
								<p className="mt-2 text-xs text-subtle">{report.snippet}</p>
								<div className="mt-4 flex items-center justify-between text-[0.75rem] text-[var(--accent-emerald)]">
									<span>{report.author}</span>
									<span>{t("reports.card.readMore")}</span>
								</div>
							</Link>
						))}
					</div>

					<div className="flex items-center justify-between text-xs text-subtle">
						<span>{t("reports.page.seoNote", { count: String(filteredReports.length) })}</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPageIndex((prev) => Math.max(prev - 1, 1))}
								className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
								disabled={pageIndex === 1}
							>
								{t("reports.pagination.prev")}
							</button>
							<button
								type="button"
								onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages))}
								className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
								disabled={pageIndex === totalPages}
							>
								{t("reports.pagination.next")}
							</button>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
