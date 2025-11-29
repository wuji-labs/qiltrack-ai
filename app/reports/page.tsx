"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useVisibilityStagger } from "./hooks/useVisibilityStagger";
import {
	getSeedReportCards,
	listSeedCategories,
	mapApiPostToCard,
} from "@/lib/content/reportHub";
import { fetchReportPosts } from "@/lib/services/api";
import type { ReportCard } from "@/types/report";

const seedReports = getSeedReportCards();
const defaultCategories = ["All", ...listSeedCategories()];
const PAGE_SIZE = 6;

function applyLocalFilter(
	items: ReportCard[],
	theme: string,
	lang: string,
	query: string
) {
	const normalizedQuery = query.trim().toLowerCase();
	return items.filter((item) => {
		const matchTheme = theme === "All" || item.theme === theme;
		const matchLang = lang === "all" || (item.lang ?? "en") === lang;
		const matchQuery =
			!normalizedQuery ||
			item.title.toLowerCase().includes(normalizedQuery) ||
			item.snippet.toLowerCase().includes(normalizedQuery) ||
			item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
		return matchTheme && matchLang && matchQuery;
	});
}

export default function ReportsPage() {
	const { t, language } = useLanguage();
	const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0]);
	const [selectedLang, setSelectedLang] = useState<"all" | "en" | "zh">("all");
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [pageIndex, setPageIndex] = useState(1);
	const [reports, setReports] = useState<ReportCard[]>(seedReports);
	const [categories, setCategories] = useState<string[]>(defaultCategories);
	const [isApiData, setIsApiData] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: PAGE_SIZE,
		total: seedReports.length,
		pages: Math.max(1, Math.ceil(seedReports.length / PAGE_SIZE)),
	});
	const gridRef = useRef<HTMLDivElement>(null);

	useVisibilityStagger(gridRef, {
		itemSelector: "[data-stagger-item]",
		threshold: 0.1,
		deps: [pageIndex, selectedCategory, reports],
	});

	useEffect(() => {
		if (!gridRef.current) return;
		const items = Array.from(
			gridRef.current.querySelectorAll("[data-stagger-item]")
		) as HTMLElement[];
		items.forEach((item) => {
			item.setAttribute("data-visible", "false");
		});
	}, [pageIndex, reports]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query), 250);
		return () => clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		let cancelled = false;
		const loadReports = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchReportPosts({
					page: pageIndex,
					limit: PAGE_SIZE,
					theme: selectedCategory === "All" ? undefined : selectedCategory,
					lang: selectedLang === "all" ? undefined : selectedLang,
					query: debouncedQuery || undefined,
				});

				if (cancelled) return;
				const mapped = data.posts.map(mapApiPostToCard);
				setReports(mapped);
				setIsApiData(true);
				setPagination(data.pagination);

				const dynamicCategories = new Set<string>(listSeedCategories());
				mapped.forEach((item) => {
					if (item.theme) dynamicCategories.add(item.theme);
				});
				setCategories(["All", ...Array.from(dynamicCategories)]);
			} catch (err) {
				if (cancelled) return;
				console.error("Failed to load report posts", err);
				setIsApiData(false);

				const fallback = applyLocalFilter(
					seedReports,
					selectedCategory,
					selectedLang,
					debouncedQuery
				);
				const total = fallback.length;
				const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
				const normalizedPage = Math.min(pageIndex, pages);

				setReports(fallback);
				setPagination({
					page: normalizedPage,
					pageSize: PAGE_SIZE,
					total,
					pages,
				});
				if (pageIndex !== normalizedPage) {
					setPageIndex(normalizedPage);
				}
				setError("Unable to load latest reports from the API. Showing fallback samples.");
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		loadReports();
		return () => {
			cancelled = true;
		};
	}, [pageIndex, selectedCategory, selectedLang, debouncedQuery]);

	const pageSize = isApiData ? pagination.pageSize : PAGE_SIZE;
	const totalPages = isApiData
		? pagination.pages
		: Math.max(1, Math.ceil(reports.length / pageSize));
	const currentPage = Math.min(pageIndex, totalPages);
	const totalCount = isApiData ? pagination.total : reports.length;

	const pagedReports = useMemo(() => {
		if (isApiData) return reports;
		const start = (currentPage - 1) * pageSize;
		return reports.slice(start, start + pageSize);
	}, [isApiData, reports, currentPage, pageSize]);

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString(
			language === "en" ? "en-US" : "zh-CN",
			{
				year: "numeric",
				month: "short",
				day: "numeric",
			}
		);

	return (
		<main className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
			<div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-10">
				<section className="relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.45)] text-center">
					<div className="pointer-events-none absolute inset-0 hero-mesh" aria-hidden />
					<div className="relative mx-auto max-w-3xl space-y-4">
						<p className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)] animate-fade-in-up" style={{ animationDelay: "0ms" }}>
							{t("reports.page.hero.kicker")}
						</p>
						<h1 className="text-3xl sm:text-4xl font-semibold leading-tight animate-fade-in-up" style={{ animationDelay: "80ms" }}>
							{t("reports.page.hero.title")}
						</h1>
						<p className="text-base text-dim animate-fade-in-up" style={{ animationDelay: "160ms" }}>
							{t("reports.page.hero.description")}
						</p>
						<div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
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

					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
									style={
										selectedCategory === category
											? {
													boxShadow: "0 0 12px rgba(91, 224, 176, 0.4)",
												}
											: {}
									}
								>
									{category}
								</button>
							))}
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									setPageIndex(1);
								}}
								className="flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 px-3 py-1.5"
							>
								<input
									type="search"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder={t("reports.page.searchPlaceholder") ?? "Search reports"}
									className="bg-transparent text-sm focus:outline-none"
								/>
								<button
									type="submit"
									className="rounded-full bg-[var(--accent-emerald)] px-3 py-1 text-xs font-semibold text-slate-950 shadow-[0_10px_20px_rgba(91,224,176,0.25)]"
								>
									{t("reports.page.searchCta") ?? "Search"}
								</button>
							</form>
							<select
								value={selectedLang}
								onChange={(e) => {
									setSelectedLang(e.target.value as typeof selectedLang);
									setPageIndex(1);
								}}
								className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-base)]/80 px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:outline-none"
							>
								<option value="all">{t("reports.page.allLanguages") ?? "All languages"}</option>
								<option value="en">English</option>
								<option value="zh">中文</option>
							</select>
						</div>
					</div>

					{error && <p className="text-xs text-amber-400">{error}</p>}
					{loading && (
						<p className="text-xs text-subtle">
							{t("reports.page.loading") ?? "Loading latest reports..."}
						</p>
					)}

					{pagedReports.length === 0 && !loading ? (
						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 p-6 text-sm text-subtle">
							{t("reports.page.empty") ?? "No reports match the current filters yet."}
						</div>
					) : (
						<>
							<div className="grid gap-5 lg:grid-cols-2">
								{pagedReports.slice(0, 2).map((report) => (
									<Link
										key={`${report.slug}-featured`}
										href={`/reports/${report.slug}`}
										className="group relative overflow-hidden rounded-[32px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-2 group-hover:shadow-elevated"
									>
										<div className="relative mb-5 overflow-hidden rounded-[20px]">
											<div
												className="h-48 bg-[var(--bg-base)] transition-transform duration-300 ease-out group-hover:scale-104 group-hover:-translate-y-6px"
												style={{
													backgroundImage: report.cover,
													backgroundSize: "cover",
													backgroundPosition: "center",
												}}
											/>
										</div>
										<p className="text-xs uppercase tracking-[0.3em] text-dim">
											{formatDate(report.date)}
										</p>
										<h3
											className="mt-2 text-2xl font-semibold leading-tight animate-fade-in-up"
											style={{ animationDelay: "120ms" }}
										>
											{report.title}
										</h3>
										<p className="mt-3 text-sm text-dim leading-relaxed">
											{report.snippet}
										</p>
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
										key={`${report.slug}-tile`}
										data-stagger-item
										href={`/reports/${report.slug}`}
										className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
										style={{
											opacity: "var(--item-opacity, 0)",
											transform: "var(--item-transform, translateY(8px))",
										}}
									>
										<div
											className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--bg-layer)]"
											style={{
												backgroundImage: report.cover,
												backgroundSize: "cover",
												backgroundPosition: "center",
											}}
										>
											<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
										</div>
										<p className="mt-3 text-xs uppercase tracking-[0.3em] text-dim">
											{formatDate(report.date)}
										</p>
										<p className="text-sm font-semibold text-[var(--color-foreground)]">
											{report.title}
										</p>
										<p className="mt-2 text-xs text-subtle">{report.snippet}</p>
										<div className="mt-4 flex items-center justify-between text-[0.75rem] text-[var(--accent-emerald)]">
											<span>{report.author}</span>
											<span>{t("reports.card.readMore")}</span>
										</div>
									</Link>
								))}
							</div>
						</>
					)}

					<div className="flex items-center justify-between text-xs text-subtle">
						<span>
							{t("reports.page.seoNote", { count: String(totalCount) })}
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPageIndex((prev) => Math.max(prev - 1, 1))}
								className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
								disabled={currentPage === 1}
							>
								{t("reports.pagination.prev")}
							</button>
							<button
								type="button"
								onClick={() =>
									setPageIndex((prev) =>
										Math.min(prev + 1, totalPages)
									)
								}
								className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
								disabled={currentPage === totalPages}
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
