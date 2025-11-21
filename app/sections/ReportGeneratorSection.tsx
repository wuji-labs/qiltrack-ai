"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import * as docx from "docx";
import { saveAs } from "file-saver";

import { ProgressBar } from "@/app/components/ProgressBar";
import { useProgress } from "@/hooks/useProgress";
import { generateReport, searchSymbols } from "@/lib/services/api";
import type { Language } from "@/lib/i18n-config";
import type { ReportResponse, ReportTone, SearchResult } from "@/types/report";

type ToneOption = {
	id: ReportTone;
	emoji: string;
	title: string;
	badge: string;
	description: string;
};

type AuthInfo = {
	isAuthenticated: boolean;
	remainingQuota: number;
	planLabel: string;
	userEmail: string | null;
	refreshSession: () => Promise<void>;
};

type ReportGeneratorSectionProps = {
	selectedTone: ReportTone;
	toneOptions: ToneOption[];
	language: Language;
	highlightFallback: string[];
	heroHighlights: { title: string; description: string }[];
	auth: AuthInfo;
	onRequireLogin: () => void;
	t: (key: string, vars?: Record<string, string>) => string;
};

export function ReportGeneratorSection({
	selectedTone,
	toneOptions,
	language,
	highlightFallback,
	heroHighlights,
	auth,
	onRequireLogin,
	t,
}: ReportGeneratorSectionProps) {
	const [inputValue, setInputValue] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
	const [suppressNextSearch, setSuppressNextSearch] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<ReportResponse | null>(null);
	const [exportingDocx, setExportingDocx] = useState(false);
	const [lastReportTone, setLastReportTone] = useState<ReportTone>("baseline");

	const progress = useProgress();
	const reportContentRef = useRef<HTMLDivElement>(null);
	const testToken = process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN;
	const canBypassAuth = Boolean(testToken);

	const selectedToneInfo =
		toneOptions.find((option) => option.id === selectedTone) || toneOptions[0];
	const lastToneInfo =
		toneOptions.find((option) => option.id === lastReportTone) || toneOptions[0];
	const selectedToneTitle = selectedToneInfo.title;
	const keyInsightsSubtitle = t("report.keyInsights.subtitle");

	const keyInsights = useMemo(() => {
		if (!reportData?.report) return highlightFallback.slice(0, 3);
		const lines = reportData.report
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		const candidates = lines.filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line));
		const normalized = candidates
			.map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
			.filter((line) => line.length > 0);
		if (normalized.length >= 3) return normalized.slice(0, 3);
		return [...normalized, ...highlightFallback].slice(0, 3);
	}, [reportData, highlightFallback]);

	const highlightCards = useMemo(
		() =>
			heroHighlights.length
				? heroHighlights
				: highlightFallback.map((desc, index) => ({
						title: `${t("hero.title")} · ${index + 1}`,
						description: desc,
					})),
		[heroHighlights, highlightFallback, t]
	);

	useEffect(() => {
		if (suppressNextSearch) {
			setSuppressNextSearch(false);
			return;
		}

		const q = inputValue.trim();
		setSelectedSymbol(null);
		if (!q || q.length < 2) {
			setSearchResults([]);
			setSearching(false);
			return;
		}

		let canceled = false;
		const timer = setTimeout(async () => {
			setSearching(true);
			try {
				const results = await searchSymbols(q);
				if (!canceled) setSearchResults(results);
			} catch (err) {
				console.error("search exception:", err);
				if (!canceled) setSearchResults([]);
			} finally {
				if (!canceled) setSearching(false);
			}
		}, 400);

		return () => {
			canceled = true;
			clearTimeout(timer);
			setSearching(false);
		};
	}, [inputValue]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const focusInput = () => {
			const element = document.querySelector<HTMLInputElement>("#report-query-input");
			element?.focus();
		};

		const handleHash = () => {
			if (window.location.hash === "#generator") {
				setTimeout(focusInput, 200);
			}
		};

		window.addEventListener("hashchange", handleHash);
		return () => window.removeEventListener("hashchange", handleHash);
	}, []);

	const markdownComponents: Components = {
		h1: ({ node, ...props }) => {
			void node;
			return (
				<h1
					className="text-2xl font-bold mt-6 mb-3 text-emerald-300 border-b border-[var(--stroke-soft)] pb-2"
					{...props}
				/>
			);
		},
		h2: ({ node, ...props }) => {
			void node;
			return (
				<h2 className="text-xl font-semibold mt-5 mb-2 text-[var(--color-foreground)]" {...props} />
			);
		},
		h3: ({ node, ...props }) => {
			void node;
			return (
				<h3 className="text-lg font-semibold mt-4 mb-2 text-[var(--color-foreground)]" {...props} />
			);
		},
		p: ({ node, ...props }) => {
			void node;
			return <p className="leading-relaxed text-[13px] sm:text-[14px] mb-2" {...props} />;
		},
		li: ({ node, ...props }) => {
			void node;
			return (
				<li className="leading-relaxed text-[13px] sm:text-[14px] mb-1 list-disc ml-5" {...props} />
			);
		},
		strong: ({ node, ...props }) => {
			void node;
			return <strong className="font-semibold text-[var(--color-foreground)]" {...props} />;
		},
		ul: ({ node, ...props }) => {
			void node;
			return <ul className="mb-2" {...props} />;
		},
		ol: ({ node, ...props }) => {
			void node;
			return <ol className="mb-2 list-decimal ml-5" {...props} />;
		},
		code: ({ node, ...props }) => {
			void node;
			return (
				<code
					className="px-1 py-0.5 rounded bg-[var(--bg-layer)]/80 text-[12px] text-emerald-200"
					{...props}
				/>
			);
		},
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const raw = inputValue.trim().toUpperCase();
		if (!raw) {
			setError(t("error.submit.empty"));
			return;
		}
		if (!/^[A-Z]+$/.test(raw)) {
			setError(t("error.submit.format"));
			return;
		}
		const validResults = searchResults.filter(
			(item) => item.type !== "test" && item.type !== "fallback"
		);
		const matchedFromResults = validResults.some((item) => item.symbol.toUpperCase() === raw);
		const matchedFromSelection = selectedSymbol ? selectedSymbol.toUpperCase() === raw : false;
		if (!matchedFromResults && !matchedFromSelection) {
			setError(t("error.submit.notFound"));
			return;
		}
		setSearchResults([]);

		if (!auth.isAuthenticated && !canBypassAuth) {
			setError(t("generator.alert.unregistered"));
			onRequireLogin();
			return;
		}

		if (auth.remainingQuota <= 0) {
			setError(t("generator.alert.quota"));
			return;
		}

		setLastReportTone(selectedTone);
		setLoading(true);
		setError(null);
		setReportData(null);
		progress.start(t("generator.progress.init"));

		try {
			const data = await generateReport({ symbol: raw, lang: language, tone: selectedTone });
			await progress.complete(t("generator.progress.done"));
			setReportData(data);
			await auth.refreshSession();
		} catch (err) {
			console.error("调用接口异常:", err);
			const message = err instanceof Error ? err.message : t("error.submit.generic");
			setError(message);
			progress.fail(message);
			if ((message || "").toLowerCase().includes("unauthorized")) {
				onRequireLogin();
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCopyRichText = async () => {
		if (!reportContentRef.current || !reportData) {
			alert(t("alert.copy.missing"));
			return;
		}

		const contentHtml = reportContentRef.current.innerHTML;
		const textPlain = reportData.report;

		if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
			try {
				const htmlBlob = new Blob([contentHtml], { type: "text/html" });
				const textBlob = new Blob([textPlain], { type: "text/plain" });
				await navigator.clipboard.write([
					new ClipboardItem({
						"text/html": htmlBlob,
						"text/plain": textBlob,
					}),
				]);
				alert(t("alert.copy.success"));
				return;
			} catch (error) {
				console.warn("使用 ClipboardItem API 复制失败，尝试回退:", error);
			}
		}

		try {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(reportContentRef.current);
			selection?.removeAllRanges();
			selection?.addRange(range);
			document.execCommand("copy");
			selection?.removeAllRanges();
			alert(t("alert.copy.fallback"));
		} catch (execError) {
			console.error("富文本复制失败:", execError);
			alert(t("alert.copy.error"));
		}
	};

	const handleExportDocx = async () => {
		if (!reportData) {
			alert(t("alert.export.missing"));
			return;
		}
		setExportingDocx(true);

		const lines = reportData.report.split("\n");
		let titleLine = lines.find((line) => line.trim().startsWith("# "));
		if (!titleLine) {
			const companyName = reportData.companyData.profile?.name || reportData.symbol;
			const symbol = reportData.symbol || "UNKNOWN";
			titleLine = t("report.docx.fallbackTitle", { company: companyName, symbol });
		}

		const fileName = `Investor-AI_Report_${reportData.symbol}_${new Date().toLocaleDateString("en-CA")}.docx`;

		try {
			const markdownLines = reportData.report.split("\n");
			const docxChildren: docx.Paragraph[] = [];
			markdownLines.forEach((line) => {
				const trimmedLine = line.trim();
				if (!trimmedLine) return;

				let paragraph = new docx.Paragraph({});
				if (trimmedLine.startsWith("# ")) {
					paragraph = new docx.Paragraph({
						text: trimmedLine.replace("# ", ""),
						heading: docx.HeadingLevel.HEADING_1,
						spacing: { after: 300 },
						alignment: docx.AlignmentType.CENTER,
					});
				} else if (trimmedLine.startsWith("## ")) {
					paragraph = new docx.Paragraph({
						text: trimmedLine.replace("## ", ""),
						heading: docx.HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 150 },
					});
				} else if (trimmedLine.startsWith("### ")) {
					paragraph = new docx.Paragraph({
						text: trimmedLine.replace("### ", ""),
						heading: docx.HeadingLevel.HEADING_3,
						spacing: { before: 100, after: 50 },
					});
				} else if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
					paragraph = new docx.Paragraph({
						text: trimmedLine.substring(2).trim(),
						bullet: { level: 0 },
						spacing: { before: 50, after: 50 },
					});
				} else {
					const runs: docx.Run[] = [];
					const parts = trimmedLine.split("**");
					parts.forEach((part, index) => {
						const isBold = index % 2 === 1;
						runs.push(
							new docx.Run({
								text: part,
								bold: isBold,
								font: { name: "Microsoft YaHei" },
							})
						);
					});
					paragraph = new docx.Paragraph({ children: runs, spacing: { before: 100, after: 100 } });
				}

				docxChildren.push(paragraph);
			});

			const docFile = new docx.Document({
				styles: {
					default: {
						document: {
							run: {
								font: { name: "Microsoft YaHei" },
							},
						},
					},
				},
				sections: [
					{
						properties: {
							page: {
								margin: {
									top: docx.convertInchesToTwip(1),
									right: docx.convertInchesToTwip(1),
									bottom: docx.convertInchesToTwip(1),
									left: docx.convertInchesToTwip(1),
								},
							},
						},
						children: docxChildren,
					},
				],
			});

			const blob = await docx.Packer.toBlob(docFile);
			saveAs(blob, fileName);
			alert(t("alert.export.success"));
		} catch (err) {
			console.error("DOCX 导出失败:", err);
			alert(t("alert.export.error"));
		} finally {
			setExportingDocx(false);
		}
	};

	const workflowList = [
		{ step: 1, label: t("generator.progress.stage1") },
		{ step: 2, label: t("generator.progress.stage2") },
		{ step: 3, label: t("generator.progress.stage3") },
		{ step: 4, label: t("generator.progress.stage4") },
		{ step: 5, label: t("generator.progress.stage5") },
		{ step: 6, label: t("generator.progress.stage6") },
		{ step: 7, label: t("generator.progress.stage7") },
		{ step: 8, label: t("generator.progress.stage8") },
	];

	const maxVisibleResults = 3;
	const visibleResults = searchResults.slice(0, maxVisibleResults);
	const hasDropdown = visibleResults.length > 0 || searching;

	return (
		<div className="space-y-6 md:space-y-8" id="generator">
		<section className="space-y-5 md:space-y-6">
			{(progress.progress > 0 || loading) && (
				<ProgressBar
					percent={progress.progress}
					label={progress.text ?? t("generator.progress.preparing")}
					steps={workflowList}
					activeStep={progress.currentStep}
				/>
			)}

			<form
				onSubmit={handleSubmit}
				className="relative overflow-visible space-y-5 rounded-[28px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 sm:p-6 shadow-[0_20px_70px_rgba(0,0,0,0.34)]"
			>
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-[var(--accent-emerald)]/12 blur-[110px]" aria-hidden />
					<div className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-[var(--accent-blue)]/10 blur-[140px]" aria-hidden />
				</div>

					<div className="relative flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.2em] text-subtle">
					<div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-1.5 text-[var(--accent-emerald)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
						<span className="rounded-full bg-[var(--accent-emerald)]/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
							Step 2
						</span>
						<span>{t("generator.input.label")}</span>
					</div>
					<span className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)]/70 bg-[var(--bg-layer)]/85 px-3.5 py-1.5 text-sm text-[var(--color-foreground)] whitespace-nowrap">
						<span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" aria-hidden />
						{auth.isAuthenticated
							? t("generator.account.status", { count: auth.remainingQuota.toString() })
							: t("generator.account.cta")}
					</span>
				</div>

				<div className="relative flex flex-col gap-5 sm:gap-6">
					<div className="flex-1">
						<div className="group relative overflow-visible rounded-[24px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/90 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
							<div className="pointer-events-none absolute inset-0">
								<div className="absolute -left-6 top-2 h-24 w-24 rounded-full bg-[var(--accent-emerald)]/20 blur-[90px]" aria-hidden />
								<div className="absolute right-0 bottom-0 h-28 w-28 rounded-full bg-[var(--accent-blue)]/16 blur-[110px]" aria-hidden />
								<div className="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0)),radial-gradient(circle_at_16%_12%,rgba(91,224,176,0.14),transparent_34%)]" aria-hidden />
							</div>

							<div className="relative flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-subtle">
								<div className="flex items-center gap-2">
									<span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 px-2 py-1 text-[var(--accent-emerald)]">
										<span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)] animate-ping" aria-hidden />
										Live
									</span>
									<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-2 py-1">
										US
									</span>
									<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-2 py-1">
										Beta
									</span>
								</div>
								<span className="hidden sm:inline text-[10px] text-dim">三步完成：选模式 → 输入代码 → 生成</span>
							</div>

							<div className="relative px-4 pb-4">
								<div className="relative rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--bg-base)]/65 px-4 py-3 backdrop-blur-xl transition group-focus-within:border-[var(--accent-emerald)]/70 group-focus-within:shadow-[0_0_0_2px_rgba(91,224,176,0.45)]">
									<span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[var(--accent-emerald)]">
										🔎
									</span>
									<input
										id="report-query-input"
										type="text"
										autoFocus
										value={inputValue}
										onChange={(event) => setInputValue(event.target.value)}
										placeholder={t("generator.input.placeholder")}
										autoComplete="off"
										spellCheck={false}
										autoCorrect="off"
										autoCapitalize="none"
										className="w-full bg-transparent pl-10 pr-28 py-2.5 text-base text-[var(--color-foreground)] placeholder:text-subtle focus:outline-none"
										aria-label={t("generator.input.label")}
									/>
									<div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] text-subtle">
										<span className="rounded-full border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 px-2 py-0.5">
											Ticker / Name
										</span>
										<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-2 py-0.5">
											回车生成
										</span>
									</div>
								</div>

								{hasDropdown && (
									<div className="mt-2 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/95 shadow-[0_18px_45px_rgba(0,0,0,0.32)] backdrop-blur">
										{searching && (
											<div className="px-4 py-2 text-sm text-subtle">{t("generator.searching")}</div>
										)}
										{!searching && visibleResults.length === 0 && (
											<div className="px-4 py-2 text-sm text-subtle">{t("generator.search.empty")}</div>
										)}
										{!searching &&
											visibleResults.map((item) => (
												<button
													type="button"
													key={`${item.symbol}-${item.displaySymbol ?? item.description}`}
													onClick={() => {
														setInputValue(item.symbol);
														setSelectedSymbol(item.symbol);
														setSearchResults([]);
														setSuppressNextSearch(true);
													}}
													className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-layer)] focus:outline-none focus-visible:bg-[var(--bg-layer)]"
												>
													<p className="font-semibold text-[var(--color-foreground)]">{item.symbol}</p>
													<p className="text-subtle text-xs">
														{item.description || item.displaySymbol || item.type || ""}
													</p>
												</button>
											))}
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="flex justify-center">
						<button
							type="submit"
							className="relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--accent-emerald)] via-emerald-300 to-cyan-300 px-8 sm:px-12 py-4 text-base sm:text-lg font-semibold text-slate-950 shadow-[0_22px_50px_rgba(91,224,176,0.35)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]/60 disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={loading}
						>
							<span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.35),rgba(255,255,255,0))] opacity-70" aria-hidden />
							<span className="relative inline-flex items-center gap-2">
								{loading ? t("generator.loading") : t("generator.submit")}
								{loading && (
									<span className="inline-block h-4 w-4 align-middle border-2 border-emerald-200/40 border-t-[var(--accent-emerald)] rounded-full animate-spin" />
								)}
							</span>
						</button>
					</div>
				</div>
			</form>

			{error && (
				<div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-base text-amber-100 flex items-center gap-2 shadow-[0_10px_35px_rgba(251,191,36,0.18)]">
					<span>⚠️</span>
					<span>{error}</span>
				</div>
			)}

			{loading && (
				<div className="space-y-3">
					<p className="text-sm text-subtle uppercase tracking-[0.26em]">{t("generator.searching")}</p>
					<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4 space-y-3">
						<div className="flex items-center justify-between text-sm text-subtle">
							<span>{t("generator.progress.fetching")}</span>
							<span className="text-[var(--accent-blue)]">{selectedToneTitle}</span>
						</div>
						<div className="space-y-2">
							<div className="h-3 w-full rounded bg-[var(--bg-base)]/50 animate-pulse" />
							<div className="h-3 w-5/6 rounded bg-[var(--bg-base)]/50 animate-pulse" />
							<div className="h-3 w-4/6 rounded bg-[var(--bg-base)]/50 animate-pulse" />
							<div className="h-3 w-3/5 rounded bg-[var(--bg-base)]/50 animate-pulse" />
						</div>
					</div>
				</div>
			)}

			{reportData ? (
				<div className="space-y-4 rounded-3xl bg-[var(--bg-layer)]/70 p-4 sm:p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
					<p className="text-sm uppercase tracking-[0.28em] text-subtle">
						{t("report.meta", { symbol: reportData.symbol })}
					</p>

					<div className="space-y-3">
						<div className="text-base text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4">
							{t("report.disclaimerNotice")}
						</div>

							<div className="space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/60 p-4 text-dim">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div>
										<p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
											{keyInsightsSubtitle}
										</p>
									</div>
								<div className="text-sm uppercase tracking-[0.26em] text-subtle">
									<span className="inline-flex items-center gap-1">
										<span>{lastToneInfo.emoji}</span>
										<span>{lastToneInfo.title}</span>
									</span>
								</div>
							</div>

							<div className="grid gap-2">
								{keyInsights.map((highlight, index) => (
									<div
										key={`${highlight}-${index}`}
										className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-2 text-base text-dim"
									>
										{highlight}
									</div>
								))}
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<button
									type="button"
									onClick={handleCopyRichText}
									className="inline-flex items-center gap-2 rounded-full bg-emerald-400/90 px-4 py-2 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
								>
									{t("report.action.copy")}
								</button>
								<button
									type="button"
									onClick={handleExportDocx}
									disabled={exportingDocx}
									className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-base text-dim transition hover:border-emerald-300 hover:text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{exportingDocx ? t("report.action.exporting") : t("report.action.export")}
								</button>
							</div>
						</div>
					</div>

					<div ref={reportContentRef} className="text-base sm:text-lg leading-relaxed text-dim">
						<ReactMarkdown components={markdownComponents}>{reportData.report}</ReactMarkdown>
					</div>

					<details className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/50 p-3">
						<summary className="text-sm text-subtle cursor-pointer select-none">{t("report.debug")}</summary>
						<pre className="mt-2 text-xs text-subtle max-h-64 overflow-auto bg-[var(--bg-layer)] rounded-xl p-3 border border-[var(--stroke-soft)]/60">
							{JSON.stringify(reportData.companyData, null, 2)}
						</pre>
					</details>
				</div>
			) : (
				<div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 space-y-4 bg-[var(--bg-layer)]/85 border border-[var(--stroke-soft)] shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
					<div className="pointer-events-none absolute inset-0">
						<div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[var(--accent-emerald)]/14 blur-[100px]" aria-hidden />
						<div className="absolute right-0 bottom-0 h-44 w-44 rounded-full bg-[var(--accent-blue)]/12 blur-[120px]" aria-hidden />
						<div
							className="absolute left-4 bottom-4 h-20 w-28 rounded-2xl border border-[var(--stroke-soft)]/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0)),radial-gradient(circle_at_18%_16%,rgba(91,224,176,0.18),transparent_42%)] shadow-[0_14px_38px_rgba(0,0,0,0.28)]"
							aria-hidden
						/>
					</div>
					<div className="relative flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.22em] text-subtle">
						<div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-1.5 text-sm text-[var(--accent-emerald)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
							<span className="rounded-full bg-[var(--accent-emerald)]/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
								Step 3
							</span>
							<span className="whitespace-nowrap">{t("report.tip.title")}</span>
							<div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--stroke-soft)]/70" aria-hidden />
						</div>
						<span className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)]/70 bg-[var(--bg-layer)]/85 px-3.5 py-1.5 text-sm text-[var(--color-foreground)] whitespace-nowrap">
							<span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" aria-hidden />
							{t("generator.progress.ready")}
						</span>
					</div>
					<div className="relative grid gap-3 md:grid-cols-[1.2fr_0.8fr] items-start">
						<div className="space-y-3">
							<p className="text-base text-dim leading-relaxed">{t("report.tip.body")}</p>
							<p className="text-sm text-subtle">{t("report.tip.action")}</p>
							<div className="flex flex-wrap gap-2 text-xs text-subtle">
								<span className="rounded-full border border-[var(--accent-emerald)]/50 bg-[var(--accent-emerald)]/10 px-3 py-1 text-[var(--accent-emerald)]">
									{t("generator.progress.fetching")}
								</span>
								<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-1">
									{t("generator.progress.shaping")}
								</span>
								<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-1">
									{t("generator.progress.llm")}
								</span>
							</div>
						</div>
						<div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-2">
							<div className="absolute -right-4 -bottom-6 h-20 w-20 rounded-full bg-[var(--accent-emerald)]/12 blur-2xl" aria-hidden />
							<p className="text-xs uppercase tracking-[0.22em] text-emerald-200">{t("workflow.sectionLabel")}</p>
							<p className="text-base font-semibold text-[var(--color-foreground)]">{t("workflow.title")}</p>
							<p className="text-sm text-subtle">{t("workflow.caption")}</p>
						</div>
					</div>
				</div>
			)}
		</section>

		<section className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-5 sm:p-6 space-y-4 shadow-[0_16px_60px_rgba(0,0,0,0.3)]">
			<div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
				<div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/85 p-4 sm:p-5 space-y-3">
					<div className="pointer-events-none absolute inset-0 opacity-70">
						<div className="absolute -left-6 top-2 h-28 w-28 rounded-full bg-[var(--accent-emerald)]/18 blur-[90px]" aria-hidden />
						<div className="absolute right-0 bottom-0 h-36 w-36 rounded-full bg-[var(--accent-blue)]/14 blur-[110px]" aria-hidden />
					</div>
					<div className="relative flex items-center justify-between gap-3">
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-[0.28em] text-emerald-300">{t("hero.quota")}</p>
							<h3 className="text-xl font-semibold text-[var(--color-foreground)]">
								{auth.isAuthenticated
									? t("quota.status.heading", { count: auth.remainingQuota.toString() })
									: t("quota.banner.title")}
							</h3>
							<p className="text-sm text-subtle">
								{auth.isAuthenticated
									? t("quota.status.session", {
											email: auth.userEmail ?? t("auth.session.fallback"),
											plan: auth.planLabel,
										})
									: t("quota.banner.description")}
							</p>
						</div>
						<div className="text-right">
							<span className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--accent-emerald)]">
								<span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" aria-hidden />
								{auth.planLabel}
							</span>
						</div>
					</div>
					<div className="relative flex flex-wrap gap-2 text-xs text-subtle">
						<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-1">
							{auth.isAuthenticated ? t("quota.banner.hint.refresh") : t("quota.banner.hint.register")}
						</span>
						<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-1">
							{t("quota.banner.description")}
						</span>
					</div>
					<div className="relative flex gap-2">
						<button
							type="button"
							onClick={auth.isAuthenticated ? auth.refreshSession : onRequireLogin}
							className="btn-gradient px-4 py-2 text-sm font-semibold shadow-[0_12px_32px_rgba(91,224,176,0.26)]"
						>
							{auth.isAuthenticated ? t("quota.banner.hint.refresh") : t("cta.preview")}
						</button>
						<button
							type="button"
							onClick={() => document.querySelector("#generator")?.scrollIntoView({ behavior: "smooth", block: "start" })}
							className="btn-ghost px-4 py-2 text-sm"
						>
							{t("hero.cta.secondary")}
						</button>
					</div>
				</div>

				<div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 sm:p-5 space-y-3">
					<div className="pointer-events-none absolute inset-0 opacity-70">
						<div className="absolute -right-8 top-4 h-32 w-32 rounded-full bg-[var(--accent-emerald)]/18 blur-[90px]" aria-hidden />
						<div className="absolute left-0 bottom-0 h-28 w-28 rounded-full bg-[var(--accent-blue)]/12 blur-[90px]" aria-hidden />
					</div>
					<div className="relative flex items-center justify-between gap-3">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-emerald-300">{t("nav.product")}</p>
							<h3 className="text-lg sm:text-xl font-semibold text-[var(--color-foreground)]">{t("hero.title")}</h3>
						</div>
						<span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-subtle">
							{t("hero.brandline")}
						</span>
					</div>
					<p className="relative text-sm text-subtle">{t("hero.description")}</p>
					<div className="relative grid gap-3 md:grid-cols-3">
						{highlightCards.map((item, index) => (
							<div
								key={`${item.title}-${index}`}
								className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-3 space-y-1"
							>
								<p className="text-sm font-semibold text-emerald-200">{item.title}</p>
								<p className="text-sm text-subtle leading-relaxed">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
		</div>
	);
}
