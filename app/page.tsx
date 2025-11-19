"use client";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
// import { jsPDF } from "jspdf"; // <--- 已移除，只使用 DOCX
import * as docx from "docx"; // <--- DOCX 导出
import { saveAs } from "file-saver"; // <--- 文件保存
// import { CopyToClipboard } from "react-copy-to-clipboard"; // 已移除，改为原生复制
import { LANGUAGE_LABEL, LANGUAGE_ORDER } from "@/lib/i18n-config";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CompanyProfile = {
	name?: string;
	ticker?: string;
	exchange?: string;
	finnhubIndustry?: string;
	country?: string;
	currency?: string;
	ipo?: string;
	marketCapitalization?: number;
	weburl?: string;
};

type CompanyQuote = {
	current?: number;
	change?: number;
	changePercent?: number;
	high?: number;
	low?: number;
	open?: number;
	prevClose?: number;
	timestamp?: number;
};

type CompanyMetrics = {
	peTTM?: number;
	psTTM?: number;
	pbAnnual?: number;
	revenueGrowth3Y?: number;
	revenueGrowth5Y?: number;
	epsGrowth3Y?: number;
	epsGrowth5Y?: number;
	currentRatioQuarterly?: number;
	quickRatioAnnual?: number;
	roeTTM?: number;
	roaRfy?: number;
	dividendYieldIndicatedAnnual?: number;
	"52WeekHigh"?: number;
	"52WeekLow"?: number;
};

type CompanyNewsItem = {
	category?: string;
	datetime?: number;
	headline?: string;
	id?: number;
	image?: string;
	related?: string;
	source?: string;
	summary?: string;
	url?: string;
};

type CompanyData = {
	symbol: string;
	profile: CompanyProfile;
	quote: CompanyQuote;
	metrics: CompanyMetrics;
	recentNews: CompanyNewsItem[];
};

type ReportResponse = {
	symbol: string;
	report: string;
	companyData: CompanyData;
	remainingQuota?: number;
};

type SearchResult = {
	symbol: string;
	description: string;
	displaySymbol?: string;
	type?: string;
};

const navItems = [
	{ labelKey: "nav.product", href: "#overview" },
	{ labelKey: "nav.generator", href: "#generator" },
	{ labelKey: "nav.templates", href: "#templates" },
	{ labelKey: "nav.pricing", href: "#pricing" },
	{ labelKey: "nav.faq", href: "#faq" },
] as const;

type WorkflowStepKey = {
	badge: TranslationKey;
	title: TranslationKey;
	detail: TranslationKey;
};

const workflowSteps: WorkflowStepKey[] = [
	{
		badge: "workflow.step1.badge",
		title: "workflow.step1.title",
		detail: "workflow.step1.detail",
	},
	{
		badge: "workflow.step2.badge",
		title: "workflow.step2.title",
		detail: "workflow.step2.detail",
	},
	{
		badge: "workflow.step3.badge",
		title: "workflow.step3.title",
		detail: "workflow.step3.detail",
	},
	{
		badge: "workflow.step4.badge",
		title: "workflow.step4.title",
		detail: "workflow.step4.detail",
	},
];

const heroHighlightKeys: ReadonlyArray<{ title: TranslationKey; description: TranslationKey }> = [
	{ title: "hero.highlight1.title", description: "hero.highlight1.description" },
	{ title: "hero.highlight2.title", description: "hero.highlight2.description" },
	{ title: "hero.highlight3.title", description: "hero.highlight3.description" },
];

type PricingPlanKey = {
	name: TranslationKey;
	badge: TranslationKey;
	price: TranslationKey;
	tagline: TranslationKey;
	features: TranslationKey[];
	cta: TranslationKey;
	highlight?: boolean;
};

const pricingPlans: PricingPlanKey[] = [
	{
		name: "pricing.plan.free.name",
		badge: "pricing.plan.free.badge",
		price: "pricing.plan.free.price",
		tagline: "pricing.plan.free.tagline",
		features: [
			"pricing.plan.free.feature1",
			"pricing.plan.free.feature2",
			"pricing.plan.free.feature3",
			"pricing.plan.free.feature4",
		],
		cta: "pricing.plan.free.cta",
		highlight: true,
	},
	{
		name: "pricing.plan.pro.name",
		badge: "pricing.plan.pro.badge",
		price: "pricing.plan.pro.price",
		tagline: "pricing.plan.pro.tagline",
		features: [
			"pricing.plan.pro.feature1",
			"pricing.plan.pro.feature2",
			"pricing.plan.pro.feature3",
			"pricing.plan.pro.feature4",
		],
		cta: "pricing.plan.pro.cta",
	},
];

const faqItems: { question: TranslationKey; answer: TranslationKey }[] = [
	{ question: "faq.q1.question", answer: "faq.q1.answer" },
	{ question: "faq.q2.question", answer: "faq.q2.answer" },
	{ question: "faq.q3.question", answer: "faq.q3.answer" },
];

type ToneOption = {
	id: "baseline" | "buffett" | "musk" | "muddy";
	emoji: string;
	titleKey: TranslationKey;
	badgeKey: TranslationKey;
	descriptionKey: TranslationKey;
};

const toneOptions: ToneOption[] = [
	{
		id: "baseline",
		emoji: "🧭",
		titleKey: "tone.baseline.title",
		badgeKey: "tone.baseline.badge",
		descriptionKey: "tone.baseline.description",
	},
	{
		id: "buffett",
		emoji: "🏰",
		titleKey: "tone.buffett.title",
		badgeKey: "tone.buffett.badge",
		descriptionKey: "tone.buffett.description",
	},
	{
		id: "musk",
		emoji: "🚀",
		titleKey: "tone.musk.title",
		badgeKey: "tone.musk.badge",
		descriptionKey: "tone.musk.description",
	},
	{
		id: "muddy",
		emoji: "🛡️",
		titleKey: "tone.muddy.title",
		badgeKey: "tone.muddy.badge",
		descriptionKey: "tone.muddy.description",
	},
];

type ReportTone = ToneOption["id"];

type CaseStudy = {
	company: string;
	industryKey: TranslationKey;
	tonalityKey: TranslationKey;
	tagKeys: TranslationKey[];
	snippetKey: TranslationKey;
	metricKey: TranslationKey;
};

const caseStudies: CaseStudy[] = [
	{
		company: "NVIDIA",
		industryKey: "case.nvidia.industry",
		tonalityKey: "case.nvidia.tonality",
		tagKeys: ["case.nvidia.tag1", "case.nvidia.tag2", "case.nvidia.tag3"],
		snippetKey: "case.nvidia.snippet",
		metricKey: "case.nvidia.metric",
	},
	{
		company: "Coca-Cola",
		industryKey: "case.coke.industry",
		tonalityKey: "case.coke.tonality",
		tagKeys: ["case.coke.tag1", "case.coke.tag2"],
		snippetKey: "case.coke.snippet",
		metricKey: "case.coke.metric",
	},
	{
		company: "Coinbase",
		industryKey: "case.coinbase.industry",
		tonalityKey: "case.coinbase.tonality",
		tagKeys: ["case.coinbase.tag1", "case.coinbase.tag2"],
		snippetKey: "case.coinbase.snippet",
		metricKey: "case.coinbase.metric",
	},
];

const highlightFallbackKeys: TranslationKey[] = [
	"highlight.default.1",
	"highlight.default.2",
	"highlight.default.3",
];

const submitErrorKeys = {
	empty: "error.submit.empty",
	format: "error.submit.format",
	notFound: "error.submit.notFound",
	network: "error.submit.network",
} as const satisfies Record<string, TranslationKey>;

// =================================================================
// 核心 Home 组件
// =================================================================

	export default function Home() {
		// 主题：深色 / 浅色
		const [isDark] = useState(true);
	const { language, setLanguage, t } = useLanguage();
	const { data: session, update: refreshSession } = useSession();
	const router = useRouter();
	const sessionUserEmail = session?.user?.email ?? null;
	// 股票相关状态
	const [inputValue, setInputValue] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<ReportResponse | null>(null);
	const [selectedTone, setSelectedTone] = useState<ReportTone>("baseline");
	const [lastReportTone, setLastReportTone] = useState<ReportTone>("baseline");

	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	
	// DOCX 导出状态（重用原 PDF 状态）
	const [exportingDocx, setExportingDocx] = useState(false); // 状态名已修正为 exportingDocx

	// 注册/额度状态
	const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
	const [toneMenuOpen, setToneMenuOpen] = useState(false);

	// 进度条与步骤
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState<string | null>(null);

	// 新增：用于引用报告的 HTML 内容，实现富文本复制
	const reportContentRef = useRef<HTMLDivElement>(null); 
	const languageMenuRef = useRef<HTMLDivElement>(null);
	const sessionPlan = session?.user?.plan ?? null;
	const sessionRemainingQuota =
		typeof session?.user?.remainingQuota === "number"
			? Math.max(session.user.remainingQuota, 0)
			: null;
	const displayRemainingQuota = sessionRemainingQuota ?? 0;
	const remainingFreeQuota = displayRemainingQuota;
	const sessionPlanDisplay = sessionPlan ? sessionPlan : t("quota.plan.free");

	// ========== 1. 模糊搜索 ==========

	useEffect(() => {
		const q = inputValue.trim();
		if (!q) {
			setSearchResults([]);
			return;
		}

		if (q.length < 2) {
			setSearchResults([]);
			return;
		}

		let canceled = false;

		const timer = setTimeout(async () => {
			try {
				setSearchLoading(true);
				const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
				const data = await res.json();

				if (!res.ok) {
					console.error("search error:", data);
					if (!canceled) setSearchResults([]);
					return;
				}

				if (!canceled) {
					setSearchResults(data.results || []);
				}
			} catch (err) {
				console.error("search exception:", err);
				if (!canceled) setSearchResults([]);
			} finally {
				if (!canceled) setSearchLoading(false);
			}
		}, 400);

		return () => {
			canceled = true;
			clearTimeout(timer);
		};
	}, [inputValue]);

useEffect(() => {
	if (!languageMenuOpen) return;
	const handleClick = (event: MouseEvent) => {
			if (!languageMenuRef.current) return;
			if (!languageMenuRef.current.contains(event.target as Node)) {
				setLanguageMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [languageMenuOpen]);

	// ========== 2. 选中搜索结果 ==========

	const handleSelectSearchResult = (item: SearchResult) => {
		const code = item.symbol.toUpperCase();
		setInputValue(code);
		setSearchResults([]);
		setError(null);
	};

	const handlePrimaryCta = () => {
		if (!session) {
			router.push("/login");
			return;
		}
		const generatorSection = document.querySelector("#generator");
		generatorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	// ========== 3. 进度条：loading=true 时慢慢走到 80%，结束时由 finally 收尾 ==========

	useEffect(() => {
		// 检查是否应该运行：如果 loading 结束了 AND 报告数据已经有了，我们就立即进入结束状态。
		if (!loading && reportData) {
			// 数据已来，立即停止所有计时，进入 100% 完成状态
			setProgress(100); 
			setProgressText(t("generator.progress.done"));
			
			// 稍微停一下（0.8秒），给用户一个完成的视觉反馈，然后归零，准备下一次生成。
			const cleanupTimer = setTimeout(() => {
				setProgress(0);
				setProgressText(null);
			}, 800);
			
			return () => clearTimeout(cleanupTimer);
		}
		
		// 只有在 loading=true 且报告数据=null 时才启动计时器
		if (!loading || reportData) return;

		// 每次开始生成，重置起点
		setProgress(5);
		setProgressText(t("generator.progress.init"));

		// --- 阶段 1: 0% 到 80% (90秒完成) ---
		// 90000 毫秒 / 80 步 = 1125 毫秒/步
		const MS_PER_STEP_1 = 1125; 
		
		const id1 = setInterval(() => {
			setProgress((prev) => {
				// 达到 80% 或数据已来（通过 reportData 检查）时停止此计时器
				if (prev >= 80 || reportData) {
					clearInterval(id1);
					return prev;
				}
				
				// 每隔 1.125 秒递增 1%
				return prev + 1; 
			});
		}, MS_PER_STEP_1); 

		// --- 阶段 2: 80% 到 99% (5秒/1%) ---
		// 从 80% 处开始运行，每 5000ms 增加 1%
		const MS_PER_STEP_2 = 5000; // 5秒/1%
		
		const id2 = setInterval(() => {
			setProgress((prev) => {
				// 必须在 80% 之后才开始加速
				if (prev < 80) return prev;
				
				// 达到 99% 时停止此计时器，等待 API 结束
				if (prev >= 99 || reportData) {
					clearInterval(id2);
					return prev;
				}
				
				// 每隔 5 秒递增 1%
				return prev + 1; 
			});
		}, MS_PER_STEP_2); 

		return () => {
			clearInterval(id1);
			clearInterval(id2);
		};
	}, [loading, reportData, t]); // 依赖中加入了 reportData

// 当前处于哪个步骤（用于文案和工作流高亮）
const currentStep = (() => {
	if (reportData && !loading) {
		return 4; // 已完成，可导出
	}
	if (progress >= 60) return 3; // 调用模型
	if (progress >= 30) return 2; // 整理结构
	if (progress > 0) return 1; // 拉取数据
	return 1;
})();
const workflowActiveStep = Math.min(currentStep, workflowSteps.length);
const workflowStepLabel = workflowActiveStep.toString().padStart(2, "0");
const workflowStatusText = loading
	? t("workflow.status.syncing")
	: reportData
		? t("workflow.status.ready")
		: t("workflow.status.idle");

	// ========== 4. 提交：前端校验 + 调 /api/report ==========

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const raw = inputValue.trim().toUpperCase();

		if (!raw) {
			setError(t(submitErrorKeys.empty));
			return;
		}

		if (!/^[A-Z]+$/.test(raw)) {
			setError(t(submitErrorKeys.format));
			return;
		}

		if (searchResults.length > 0) {
			const exists = searchResults.some(
				(item) => item.symbol.toUpperCase() === raw
			);
			if (!exists) {
				setError(t(submitErrorKeys.notFound));
				return;
			}
		}

		const remainingQuotaForCheck = sessionRemainingQuota ?? 0;

		if (!session) {
			setError(t("generator.alert.unregistered"));
			router.push("/login");
			return;
		}

		if (remainingQuotaForCheck <= 0) {
			setError(t("generator.alert.quota"));
			return;
		}

		setLastReportTone(selectedTone);
		setLoading(true);
		setError(null);
		setReportData(null);

			try {
				const query = new URLSearchParams({ symbol: raw, lang: language });
			if (selectedTone) {
				query.set("tone", selectedTone);
			}
			const res = await fetch(`/api/report?${query.toString()}`);
			const data = await res.json();

			if (!res.ok) {
				console.error("API error:", data);
			if (res.status === 401) {
				setError(t("generator.alert.unregistered"));
				router.push("/login");
				return;
			}
			if (res.status === 429) {
				setError(t("generator.alert.quota"));
				return;
			}
			setError(data?.error || t("error.submit.generic"));
				return;
			}

			setReportData(data);
			try {
				await refreshSession?.();
			} catch (refreshError) {
				console.warn("刷新会话失败", refreshError);
			}
	} catch (err) {
		console.error("调用接口异常：", err);
		setError(t(submitErrorKeys.network));
		} finally {
			// 核心修正：只负责将 loading 设为 false。
			// 进度条的 setProgress(100) 和归零逻辑，现在由上方的 useEffect [loading, reportData] 自动处理。
			setLoading(false);
		}
	};


	// ========== 5. 复制富文本（HTML）报告 ==========

	const handleCopyRichText = async () => {
		if (!reportContentRef.current || !reportData) {
			alert(t("alert.copy.missing"));
			return;
		}

		const contentHtml = reportContentRef.current.innerHTML;

		// reportData.report 包含完整的 Markdown 纯文本
		const textPlain = reportData.report;

		// 检查浏览器是否支持现代 ClipboardItem API
		if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
			try {
				const htmlBlob = new Blob([contentHtml], { type: 'text/html' });
				const textBlob = new Blob([textPlain], { type: 'text/plain' });

				await navigator.clipboard.write([
					new ClipboardItem({
						'text/html': htmlBlob,
						'text/plain': textBlob, // 纯文本作为回退
					}),
				]);

				alert(t("alert.copy.success"));
				return;

			} catch (error) {
				console.warn("使用 ClipboardItem API 复制失败，尝试回退:", error);
			}
		}
		
		// 回退方案：使用旧的 execCommand API
		try {
			const selection = window.getSelection();
			const range = document.createRange();
			
			// 选中报告内容的 DOM 节点
			range.selectNodeContents(reportContentRef.current);
			selection?.removeAllRanges();
			selection?.addRange(range);
			
			// 执行复制命令，浏览器会尽可能复制带格式的内容
			document.execCommand('copy');
			selection?.removeAllRanges();
			
			alert(t("alert.copy.fallback"));
		} catch (execError) {
			console.error("富文本复制失败:", execError);
			alert(t("alert.copy.error"));
		}
	};


	// ========= 6. Word (DOCX) 导出功能 =========

	const handleExportDocx = async () => {
		if (!reportData) {
			alert(t("alert.export.missing"));
			return;
		}

		setExportingDocx(true); // 使用正确的状态名
		
		// 报告标题和文件名
		// 报告标题取自 LLM 返回的报告内容的第一行，假设是 # H1 标题
		const lines = reportData.report.split("\n");
		let titleLine = lines.find((line) => line.trim().startsWith("# "));
		if (!titleLine) {
			// LLM 未提供标题时的备用逻辑
			const companyName =
				reportData.companyData.profile?.name || reportData.symbol;
			const symbol = reportData.symbol || "UNKNOWN";

			titleLine = t("report.docx.fallbackTitle", { company: companyName, symbol });
		}

		const fileName = `Investor-AI_Report_${reportData.symbol}_${new Date().toLocaleDateString('en-CA')}.docx`;

		try {
			const markdownLines = reportData.report.split('\n');
			const docxChildren: docx.Paragraph[] = [];
			
			// --- 核心转换逻辑 ---
			markdownLines.forEach(line => {
				const trimmedLine = line.trim();
				if (!trimmedLine) return;

				let paragraph = new docx.Paragraph({});
				
				if (trimmedLine.startsWith('# ')) {
					// H1 标题 - 自动包含在 LLM 输出内容中
					paragraph = new docx.Paragraph({
						text: trimmedLine.replace('# ', ''),
						heading: docx.HeadingLevel.HEADING_1,
						spacing: { after: 300 },
						alignment: docx.AlignmentType.CENTER // H1 居中显示
					});
				} else if (trimmedLine.startsWith('## ')) {
					// H2 标题
					paragraph = new docx.Paragraph({
						text: trimmedLine.replace('## ', ''),
						heading: docx.HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 150 },
					});
				} else if (trimmedLine.startsWith('### ')) {
					// H3 标题
						paragraph = new docx.Paragraph({
						text: trimmedLine.replace('### ', ''),
						heading: docx.HeadingLevel.HEADING_3,
						spacing: { before: 100, after: 50 },
					});
				} else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
					// 列表项
					paragraph = new docx.Paragraph({
						text: trimmedLine.substring(2).trim(),
						bullet: { level: 0 },
						spacing: { before: 50, after: 50 }
					});
				} else {
					// 普通文本及加粗处理 (简易 Markdown)
					const runs: docx.Run[] = [];
					// 尝试用简单的 split("**") 来处理加粗
					const parts = trimmedLine.split('**');
					parts.forEach((part, index) => {
						// index 奇数部分是加粗内容
						const isBold = index % 2 === 1;
						runs.push(new docx.Run({
							text: part,
							bold: isBold,
							font: { name: 'Microsoft YaHei' } // 明确设置中文字体，提高兼容性
						}));
					});
					paragraph = new docx.Paragraph({ children: runs, spacing: { before: 100, after: 100 } });
				}
				
				docxChildren.push(paragraph);
			});

			// 4. 创建文档并设置中文字体
			const doc = new docx.Document({
				styles: {
					default: {
						document: {
							run: {
								font: {
									name: "Microsoft YaHei",
								},
							},
						},
					},
				},
				sections: [{
					properties: {
						page: {
							margin: {
								top: docx.convertInchesToTwip(1),
								right: docx.convertInchesToTwip(1),
								bottom: docx.convertInchesToTwip(1),
								left: docx.convertInchesToTwip(1),
							}
						}
					},
					children: docxChildren,
				}],
			});

			// 5. 打包并下载
			const blob = await docx.Packer.toBlob(doc);
			saveAs(blob, fileName);

			alert(t("alert.export.success"));

		} catch (err) {
			console.error("DOCX 导出失败:", err);
			alert(t("alert.export.error"));
		} finally {
			setExportingDocx(false); // 结束 loading 状态
		}
	};


	// ========= 7. 主题相关 class (略) =========
	const mainBg = isDark
		? "bg-slate-950 text-slate-100"
		: "bg-slate-50 text-slate-900";
	const cardPrimary = isDark
		? "bg-slate-900/85 border-slate-800"
		: "bg-white border-slate-200";
	const cardSecondary = isDark
		? "bg-slate-900/80 border-slate-800"
		: "bg-white border-slate-200";
	const subtleText = isDark ? "text-slate-400" : "text-slate-500";
	const strongSubtleText = isDark ? "text-slate-300" : "text-slate-600";
	const tagBg = isDark
		? "bg-emerald-400/10 border-emerald-500/40 text-emerald-200"
		: "bg-emerald-50 border-emerald-300 text-emerald-700";
	const inputBg = isDark
		? "bg-slate-950 border-slate-700 text-slate-100"
		: "bg-white border-slate-300 text-slate-900";
	const dropdownBg = isDark
		? "bg-slate-950/98 border-slate-800 divide-slate-800"
		: "bg-white border-slate-200 divide-slate-100";
	const skeletonBg = isDark ? "bg-slate-800" : "bg-slate-200";
	const selectedToneInfo =
		toneOptions.find((option) => option.id === selectedTone) || toneOptions[0];
	const lastToneInfo =
		toneOptions.find((option) => option.id === lastReportTone) || toneOptions[0];
	const selectedToneTitle = t(selectedToneInfo.titleKey);
	const selectedToneBadge = t(selectedToneInfo.badgeKey);
	const lastToneTitle = t(lastToneInfo.titleKey);
	const lastToneBadge = t(lastToneInfo.badgeKey);

	const workflowList = workflowSteps.map((step) => ({
		badge: t(step.badge),
		title: t(step.title),
		detail: t(step.detail),
	}));
	const heroHighlightList = heroHighlightKeys.map((item) => ({
		title: t(item.title),
		description: t(item.description),
	}));
	const pricingList = pricingPlans.map((plan) => ({
		name: t(plan.name),
		badge: t(plan.badge),
		price: t(plan.price),
		tagline: t(plan.tagline),
		features: plan.features.map((featureKey) => t(featureKey)),
		cta: t(plan.cta),
		highlight: plan.highlight,
	}));
	const faqList = faqItems.map((item) => ({
		question: t(item.question),
		answer: t(item.answer),
	}));

	const module2Items = useMemo(() => {
		try {
			return JSON.parse(t("landing.module2.items")) as { q: string; a: string }[];
		} catch (err) {
			console.warn("Failed to parse module2 items", err);
			return [];
		}
	}, [t]);

	const module3Items = useMemo(() => {
		try {
			return JSON.parse(t("landing.module3.items")) as { title: string; body: string }[];
		} catch (err) {
			console.warn("Failed to parse module3 items", err);
			return [];
		}
	}, [t]);

	const module4Items = useMemo(() => {
		try {
			return JSON.parse(t("landing.module4.items")) as string[];
		} catch (err) {
			console.warn("Failed to parse module4 items", err);
			return [];
		}
	}, [t]);

	const module5Items = useMemo(() => {
		try {
			return JSON.parse(t("landing.module5.items")) as string[];
		} catch (err) {
			console.warn("Failed to parse module5 items", err);
			return [];
		}
	}, [t]);

	const module6Items = useMemo(() => {
		try {
			return JSON.parse(t("landing.module6.items")) as string[];
		} catch (err) {
			console.warn("Failed to parse module6 items", err);
			return [];
		}
	}, [t]);

	const keyInsights = useMemo(() => {
		if (!reportData?.report) return [] as string[];
		const lines = reportData.report
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		const candidates = lines.filter((line) =>
			/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)
		);
		const normalized = candidates
			.map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
			.filter((line) => line.length > 0);
		if (normalized.length >= 3) return normalized.slice(0, 3);
		const fallbackHighlights = highlightFallbackKeys.map((key) => t(key));
		return [...normalized, ...fallbackHighlights].slice(0, 3);
	}, [reportData, t]);

	const toneLabelList = useMemo(() => {
		return toneOptions.map((option) => t(option.titleKey)).join(" / ");
	}, [t]);

	const personaSentence = t("persona.caption", { tones: toneLabelList });
	const personaGallerySentence = t("persona.galleryCaption", { tones: toneLabelList });


	// ========= 8. 渲染 Markdown 的样式映射 (略) =========
const markdownComponents: Components = {
	h1: ({ node, ...props }) => {
		void node;
		return (
			<h1
				className="text-2xl font-bold mt-6 mb-3 text-emerald-300 border-b border-slate-700 pb-2"
				{...props}
			/>
		);
	},
	h2: ({ node, ...props }) => {
		void node;
		return (
			<h2 className="text-xl font-semibold mt-5 mb-2 text-slate-100" {...props} />
		);
	},
	h3: ({ node, ...props }) => {
		void node;
		return (
			<h3 className="text-lg font-semibold mt-4 mb-2 text-slate-100" {...props} />
		);
	},
	p: ({ node, ...props }) => {
		void node;
		return (
			<p className="leading-relaxed text-[13px] sm:text-[14px] mb-2" {...props} />
		);
	},
	li: ({ node, ...props }) => {
		void node;
		return (
			<li
				className="leading-relaxed text-[13px] sm:text-[14px] mb-1 list-disc ml-5"
				{...props}
			/>
		);
	},
	strong: ({ node, ...props }) => {
		void node;
		return <strong className="font-semibold text-slate-50" {...props} />;
	},
	ul: ({ node, ...props }) => {
		void node;
		return <ul className="mb-2" {...props} />;
	},
	ol: ({ node, ...props }) => {
		void node;
		return (
			<ol className="mb-2 list-decimal ml-5" {...props} />
		);
	},
	code: ({ node, ...props }) => {
		void node;
		return (
			<code
				className="px-1 py-0.5 rounded bg-slate-900/80 text-[12px] text-emerald-200"
				{...props}
			/>
		);
	},
};


	// ========= 9. UI =========
	return (
		<>
			<main
				className={`min-h-screen ${mainBg} flex flex-col`}
				style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont" }}
			>
			<nav className="border-b border-slate-800/60 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur bg-slate-950/80">
				<div className="flex items-center gap-2">
					<div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-300 to-sky-400 shadow-md shadow-emerald-500/40 flex items-center justify-center text-[11px] font-black tracking-[0.2em] text-slate-950">
						IA
					</div>
					<div className="flex flex-col leading-tight">
						<span className="text-sm font-semibold tracking-wide">
							{t("brand.title")}
						</span>
						<span className="text-[11px] text-slate-400">
							{t("brand.subtitle")}
						</span>
					</div>
				</div>

				<div className="hidden md:flex items-center gap-5 text-[12px] text-slate-300">
					{navItems.map((item) => (
						<a
							key={item.href}
							href={item.href}
							className="uppercase tracking-wide hover:text-emerald-300 transition-colors"
						>
							{t(item.labelKey)}
						</a>
					))}
				</div>

				<div className="flex items-center gap-3 flex-wrap justify-end">
					<div
						ref={languageMenuRef}
						className="relative text-[12px]"
					>
				<button
					type="button"
					onClick={() => setLanguageMenuOpen((open) => !open)}
					className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-3 py-1 text-slate-200 hover:border-emerald-400"
					aria-haspopup="listbox"
					aria-expanded={languageMenuOpen}
				>
					<span>{LANGUAGE_LABEL[language]}</span>
					<span className="text-[10px] text-slate-500">▾</span>
				</button>
				{languageMenuOpen && (
					<div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-slate-900/50">
						<ul role="listbox" className="py-1">
							{LANGUAGE_ORDER.map((lang) => (
								<li key={lang}>
									<button
										type="button"
										onClick={() => {
											setLanguage(lang);
											setLanguageMenuOpen(false);
										}}
										className={`w-full text-left px-4 py-2 text-[12px] transition-colors ${
											lang === language
												? "text-emerald-300"
												: "text-slate-300 hover:text-emerald-200"
											}`}
									>
										{LANGUAGE_LABEL[lang]}
									</button>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
			{session ? (
				<>
					<div className="text-xs px-3 py-1.5 rounded-full border border-emerald-400/40 text-slate-200 bg-slate-900/40">
						<span>{sessionUserEmail ?? t("auth.session.fallback")}</span>
						<span className="ml-2 text-emerald-300">
							{t("auth.cta.remaining", { count: remainingFreeQuota.toString() })}
						</span>
					</div>
					<button
						type="button"
						onClick={() => signOut()}
						className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-900 transition-colors"
					>
						{t("auth.account.signout")}
					</button>
				</>
			) : (
				<Link
					href="/login"
					className="text-xs px-4 py-1.5 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-900 transition-colors"
				>
					{t("auth.cta.button")}
				</Link>
			)}
									<button
										type="button"
										onClick={handlePrimaryCta}
										className="inline-flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-full bg-emerald-400 text-slate-900 hover:bg-emerald-300 transition-colors"
									>
										{t("cta.preview")}
					<span className="text-[10px] font-normal text-slate-900/70">
						{t("cta.preview.note")}
					</span>
									</button>
				</div>
			</nav>

			<div className="md:hidden px-4 py-2 border-b border-slate-900/60 bg-slate-950/60 backdrop-blur-sm overflow-x-auto flex gap-4 text-[11px] uppercase tracking-wide text-slate-400">
				{navItems.map((item) => (
					<a key={item.href} href={item.href} className="whitespace-nowrap hover:text-emerald-300">
						{t(item.labelKey)}
					</a>
				))}
			</div>

			{/* 主体区域：单列大布局 */}
			<div className="flex-1 flex justify-center px-4 sm:px-6 lg:px-10 py-8">
				<div className="w-full max-w-5xl space-y-10">
					{/* 标题介绍 */}
					<section id="overview" className="space-y-4">
						<div
							className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs ${tagBg}`}
						>
							<span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
							<span>{t("hero.tagline")}</span>
						</div>

						<h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
							{t("hero.title")}
						</h1>

				<p
					className={`text-sm sm:text-base max-w-3xl leading-relaxed text-slate-200`}
				>
					{t("hero.description")}
				</p>
				<p className={`text-xs sm:text-sm max-w-3xl leading-relaxed text-emerald-200/80`}>
					{t("hero.positioning")}
				</p>
				<p className="text-sm text-emerald-300 mt-4 font-semibold">
					{t("hero.brandline")}
				</p>

						<div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
				<div className="rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-900/40 p-5 space-y-4">
								<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
									{t("nav.product")}
								</p>
					<p className="text-base text-slate-100 leading-relaxed">
						{t("hero.story")}
					</p>
					<div className="flex flex-wrap gap-2">
									<button
										type="button"
										onClick={handlePrimaryCta}
										className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-emerald-300"
									>
										{t("hero.cta.primary")}
									</button>
						<a
							href="#templates"
							className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400"
						>
							{t("hero.cta.secondary")}
						</a>
					</div>
				</div>
				<div className="rounded-3xl border border-emerald-500/40 bg-slate-950/50 p-5 space-y-2">
					<p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
						{t("hero.quota")}
					</p>
					<p className="text-2xl font-semibold text-emerald-300 mt-2">
						{session
							? t("quota.status.heading", { count: displayRemainingQuota.toString() })
							: t("quota.banner.title")}
					</p>
					<p className={`text-sm mt-1 ${strongSubtleText}`}>
						{session && sessionUserEmail
							? t("quota.status.session", {
									email: sessionUserEmail,
									plan: sessionPlanDisplay,
							  })
							: t("quota.banner.description")}
					</p>
								<div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] text-emerald-200">
									<span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
										<span>
											{session
												? t("quota.banner.hint.refresh")
												: t("quota.banner.hint.register")}
										</span>
								</div>
							</div>
						</div>

				<div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
					{heroHighlightList.map((item) => (
						<div
							key={item.title}
							className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 space-y-1.5"
						>
							<p className="text-sm font-semibold text-slate-50">
								{item.title}
							</p>
							<p className="leading-relaxed">{item.description}</p>
						</div>
					))}
			</div>
			</section>

			<section
				id="generator"
				className={`rounded-3xl border shadow-[0_18px_60px_rgba(0,0,0,0.45)] p-5 sm:p-6 space-y-4 ${cardPrimary}`}
			>
				{(progress > 0 || loading) && (
					<div className="space-y-2 mb-1">
						<div className="flex items-center justify-between text-xs text-emerald-200">
							<span>{progressText || t("generator.progress.preparing")}</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<div className="h-2 rounded-full bg-slate-800/70 overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300 transition-all duration-700"
								style={{ width: `${progress}%` }}
							/>
						</div>

						<div className="mt-2 text-[11px] space-y-1.5">
							<div className={`flex items-center gap-2 ${currentStep === 1 ? "text-emerald-300" : subtleText}`}>
								<span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] ${currentStep === 1 ? "border-emerald-400 bg-emerald-400/20" : "border-slate-600"}`}>
									1
								</span>
								<span>{t("generator.progress.fetching")}</span>
							</div>
							<div className={`flex items-center gap-2 ${currentStep === 2 ? "text-emerald-300" : subtleText}`}>
								<span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] ${currentStep === 2 ? "border-emerald-400 bg-emerald-400/20" : "border-slate-600"}`}>
									2
								</span>
								<span>{t("generator.progress.shaping")}</span>
							</div>
							<div className={`flex items-center gap-2 ${currentStep === 3 ? "text-emerald-300" : subtleText}`}>
								<span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] ${currentStep === 3 ? "border-emerald-400 bg-emerald-400/20" : "border-slate-600"}`}>
									3
								</span>
								<span>{t("generator.progress.llm")}</span>
							</div>
							<div className={`flex items-center gap-2 ${currentStep === 4 ? "text-emerald-300" : subtleText}`}>
								<span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] ${currentStep === 4 ? "border-emerald-400 bg-emerald-400/20" : "border-slate-600"}`}>
									4
								</span>
								<span>{t("generator.progress.ready")}</span>
							</div>
						</div>
					</div>
				)}
				<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
					<span>{t("generator.sectionTitle")}</span>
					<span className="text-emerald-300 flex items-center gap-1">
						<span>{selectedToneInfo.emoji}</span>
						<span>
							{selectedToneTitle}
							<span className="ml-1 text-[10px] text-emerald-200">{selectedToneBadge}</span>
						</span>
					</span>
				</div>
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
					{toneOptions.map((option) => {
						const active = option.id === selectedTone;
						const optionTitle = t(option.titleKey);
						const optionBadge = t(option.badgeKey);
						const optionDescription = t(option.descriptionKey);
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => setSelectedTone(option.id)}
								className={`text-left rounded-2xl border px-3 py-3 text-xs transition-all ${
									active
										? "border-emerald-400/70 bg-emerald-400/10 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
										: "border-slate-800/70 bg-slate-950/40 hover:border-slate-600"
								}`}
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-base">{option.emoji}</span>
									{active && (
										<span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">
											{t("persona.selector")}
										</span>
									)}
								</div>
								<p className="text-[11px] font-semibold text-slate-100">
									{optionTitle}
								</p>
								<p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
									{optionBadge}
								</p>
								<p className="mt-1 text-[11px] leading-relaxed text-slate-400">
									{optionDescription}
								</p>
							</button>
						);
					})}
				</div>
				<p className={`text-[11px] ${subtleText}`}>
					{personaSentence}
				</p>

				{/* ====== 输入模块 ====== */}
				<form onSubmit={handleSubmit} className="space-y-3 relative">
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="flex-1">
							<label className="block text-xs text-slate-400 mb-1">
								{t("generator.input.label")}
							</label>
							<div className="relative">
								{/* 搜索图标 */}
								<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
									🔎
								</span>
								<input
									type="text"
									autoFocus
									value={inputValue}
									onChange={(event) => setInputValue(event.target.value)}
									placeholder={t("generator.input.placeholder")}
									className={`w-full rounded-2xl border px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/70 ${inputBg}`}
								/>
							</div>
						</div>
						<div className="sm:w-48 space-y-1 relative">
							<label className="block text-xs text-slate-400">
								{t("generator.style.label")}
							</label>
							<button
								type="button"
								className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-300 hover:border-emerald-400 transition-colors"
								onClick={() => setToneMenuOpen((open) => !open)}
							>
								<div className="flex items-center justify-between">
									<span>
										{selectedToneInfo.emoji} {selectedToneTitle}
									</span>
									<span className="text-[10px] text-slate-500">▾</span>
								</div>
								<p className="text-[10px] text-slate-500">{selectedToneInfo.subtitle}</p>
							</button>
							{toneMenuOpen && (
								<div className="absolute z-20 mt-1 w-60 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-slate-900/60">
									<div className="max-h-64 overflow-auto p-2 text-xs text-slate-200">
										{toneOptions.map((option) => {
											const active = option.id === selectedTone;
											const optionTitle = t(option.titleKey);
											const optionBadge = t(option.badgeKey);
											const optionDescription = t(option.descriptionKey);
											return (
												<button
													key={option.id}
													type="button"
													onClick={() => {
														setSelectedTone(option.id);
														setToneMenuOpen(false);
													}}
													className={`w-full text-left rounded-xl px-3 py-2 mb-1 border ${
														active
															? "border-emerald-400/60 bg-emerald-400/10"
															: "border-transparent hover:border-slate-700 hover:bg-slate-900"
													}`}
												>
													<div className="flex items-center justify-between mb-1">
														<span className="text-base">{option.emoji}</span>
														<span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
															{optionBadge}
														</span>
													</div>
													<p className="text-[11px] font-semibold text-slate-100">
														{optionTitle}
													</p>
													<p className="text-[11px] text-slate-400">{optionDescription}</p>
												</button>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-[11px] text-slate-400">
							{session
								? t("generator.account.status", {
										count: displayRemainingQuota.toString(),
								  })
								: t("generator.account.cta")}
						</div>
						<button
							type="submit"
							className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={loading}
						>
							{loading ? t("generator.loading") : t("generator.submit")}
							{loading && (
								<span className="h-4 w-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
							)}
						</button>
					</div>
				</form>

				{error && (
					<div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-200 flex items-center gap-2">
						<span>⚠️</span>
						<span>{error}</span>
					</div>
				)}

				{loading && (
					<div className="space-y-3">
						<p className="text-xs text-slate-500">{t("generator.searching")}</p>
						<div className="rounded-2xl border border-slate-800/60 bg-slate-950/50 p-4 space-y-3">
							<div className="flex items-center justify-between text-[11px] text-slate-400">
								<span>{t("generator.progress.fetching")}</span>
								<span className="text-emerald-300">{selectedToneTitle}</span>
							</div>
							<div className="space-y-2">
								<div className={`h-3 w-full rounded ${skeletonBg}`} />
								<div className={`h-3 w-5/6 rounded ${skeletonBg}`} />
								<div className={`h-3 w-4/6 rounded ${skeletonBg}`} />
								<div className={`h-3 w-3/5 rounded ${skeletonBg}`} />
							</div>
						</div>
					</div>
				)}

				{reportData && (
					<div className="space-y-3">
						<p className="text-[11px] text-slate-500">
							{t("report.meta", { symbol: reportData.symbol })}
						</p>

						<div
							ref={reportContentRef}
							className="text-sm sm:text-[14px] leading-relaxed"
						>
							<div className="space-y-2">
								<div className="text-[12px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
									{t("report.disclaimerNotice")}
								</div>
								<ReactMarkdown components={markdownComponents}>
									{reportData.report}
								</ReactMarkdown>
							</div>
						</div>

						<details className="mt-4">
							<summary className="text-xs text-slate-500 cursor-pointer select-none">
								{t("report.debug")}
							</summary>
							<pre className="mt-2 text-[10px] text-slate-400 max-h-64 overflow-auto bg-slate-950/60 rounded-xl p-3 border border-slate-800">
								{JSON.stringify(reportData.companyData, null, 2)}
							</pre>
						</details>
					</div>
				)}
			</section>

			<section className={`rounded-3xl border p-5 sm:p-7 space-y-4 ${cardSecondary}`}>
				<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t("landing.module1.title")}</p>
				<p className="text-sm text-slate-200 leading-relaxed">{t("landing.module1.body1")}</p>
				<p className="text-sm text-slate-200 leading-relaxed">{t("landing.module1.body2")}</p>
			</section>

			<section className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${cardSecondary}`}>
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t("landing.module2.title")}</p>
					<h2 className="text-2xl font-semibold text-slate-100 mt-2">{t("landing.module2.title")}</h2>
				</div>
				<div className="grid sm:grid-cols-2 gap-4">
					{module2Items.map((item) => (
						<div key={item.q} className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 space-y-2">
							<p className="text-sm font-semibold text-emerald-200">{item.q}</p>
							<p className="text-sm text-slate-300 leading-relaxed">{item.a}</p>
						</div>
					))}
				</div>
			</section>

			<section className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${cardSecondary}`}>
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t("landing.module3.title")}</p>
					<p className="text-sm text-slate-300 leading-relaxed">{t("landing.module3.description")}</p>
				</div>
				<div className="grid md:grid-cols-3 gap-3">
					{module3Items.map((item) => (
						<div key={item.title} className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 space-y-2">
							<p className="text-sm font-semibold text-emerald-200">{item.title}</p>
							<p className={`text-sm ${subtleText}`}>{item.body}</p>
						</div>
					))}
				</div>
			</section>

			<section className={`rounded-3xl border p-5 sm:p-7 space-y-4 ${cardSecondary}`}>
				<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t("landing.module4.title")}</p>
				<ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
					{module4Items.map((line) => (
						<li key={line}>{line}</li>
					))}
				</ul>
			</section>

			<section className={`rounded-3xl border p-5 sm:p-7 space-y-4 ${cardSecondary}`}>
				<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t("landing.module5.title")}</p>
				<div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
					{module5Items.map((line) => (
						<div key={line} className="rounded-2xl border border-slate-800/60 bg-slate-950/50 p-3">
							{line}
						</div>
					))}
				</div>
			</section>

			<section className={`rounded-3xl border p-5 sm:p-7 space-y-4 ${cardSecondary}`}>
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t("landing.module6.title")}</p>
					<h2 className="text-2xl font-semibold text-slate-100 mt-2">{t("landing.module6.title")}</h2>
				</div>
				<ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
					{module6Items.map((line) => (
						<li key={line}>{line}</li>
					))}
				</ul>
			</section>






					{/* 模板与案例画廊 */}
					<section
						id="templates"
						className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${cardSecondary}`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div>
								<p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">
									{t("nav.templates")}
								</p>
									<h2 className="text-xl sm:text-2xl font-semibold">
										{t("gallery.inspired")}
									</h2>
								<p className={`text-sm mt-1 ${subtleText}`}>
									{personaGallerySentence}
								</p>
							</div>
							<div className="text-xs text-right text-slate-400">
								<p>{t("gallery.subtitle")}</p>
								<p>{t("gallery.description")}</p>
							</div>
						</div>

						<div className="grid md:grid-cols-3 gap-3">
			{caseStudies.map((study) => {
				const tonalityLabel = t(study.tonalityKey);
				const industryLabel = t(study.industryKey);
				const tags = study.tagKeys.map((tagKey) => t(tagKey));
				const metricLabel = t(study.metricKey);
								return (
								<div
									key={study.company}
									className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4 flex flex-col gap-3"
								>
									<div className="flex items-center justify-between">
										<div>
											<p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
												{industryLabel}
											</p>
											<h3 className="text-lg font-semibold text-slate-100">
												{study.company}
											</h3>
										</div>
									<span className="text-[11px] rounded-full border border-emerald-400/50 text-emerald-200 px-2 py-0.5">
										{tonalityLabel}
									</span>
								</div>
				<p className={`text-sm leading-relaxed ${strongSubtleText}`}>
					{t(study.snippetKey)}
				</p>
									<div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
										{tags.map((tag) => (
											<span
												key={`${study.company}-${tag}`}
												className="rounded-full border border-slate-800 px-2 py-0.5"
											>
												#{tag}
											</span>
										))}
									</div>
									<div className="text-xs text-emerald-300">
										{metricLabel}
									</div>
								</div>
							);
							})}
						</div>

					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-dashed border-slate-800/70 p-4">
						<p className={`text-sm ${subtleText}`}>
							{t("gallery.footer")}
						</p>
							<button
								type="button"
								onClick={handlePrimaryCta}
								className="self-start rounded-full border border-emerald-400 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
							>
								{t("gallery.cta")}
							</button>
						</div>
					</section>

					{/* 工作流程介绍 */}
					<section
						id="workflow"
						className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${cardSecondary}`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div>
									<p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">
										{t("workflow.sectionLabel")}
									</p>
								<h2 className="text-xl sm:text-2xl font-semibold">
									{t("workflow.title")}
								</h2>
								<p className={`text-sm mt-1 ${subtleText}`}>
									{t("workflow.caption")}
								</p>
							</div>
			<div className="text-[11px] text-right text-emerald-200">
				<span className="block font-semibold">
					{t("workflow.status.step", { step: workflowStepLabel })}
				</span>
				<span className="text-slate-400">{workflowStatusText}</span>
			</div>
						</div>

					<div className="grid md:grid-cols-2 gap-4">
								{workflowList.map((step, index) => {
									const isActive = workflowActiveStep === index + 1;
									return (
									<div
										key={step.title}
										className={`relative rounded-2xl border p-4 transition-all ${
											isActive
												? "border-emerald-400/80 bg-emerald-400/5 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
												: "border-slate-800/70 bg-slate-950/50"
										}`}
									>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2 text-xs uppercase tracking-wider">
												<span
													className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold ${
														isActive
															? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30"
															: "bg-slate-900 text-slate-200"
													}`}
												>
													{(index + 1).toString().padStart(2, "0")}
												</span>
												<span className="text-emerald-200">{step.badge}</span>
											</div>
											{isActive && (
												<span className="text-[11px] text-emerald-200">
													{loading
														? t("workflow.step.status.running")
														: t("workflow.step.status.done")}
												</span>
											)}
										</div>
										<h3 className="text-lg font-semibold text-slate-100">
											{step.title}
										</h3>
										<p className={`text-sm leading-relaxed mt-1 ${strongSubtleText}`}>
											{step.detail}
										</p>
									</div>
								);
							})}
						</div>
					</section>

					{/* 定价计划 */}
					<section
						id="pricing"
						className={`rounded-3xl border p-5 sm:p-7 space-y-6 ${cardSecondary}`}
					>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">
								Pricing
							</p>
							<h2 className="text-xl sm:text-2xl font-semibold">
								{t("pricing.title")}
							</h2>
							<p className={`text-sm mt-1 ${subtleText}`}>
								{t("pricing.caption")}
							</p>
						</div>
						<div className="text-xs text-right text-slate-400">
							<p>{t("pricing.note1")}</p>
							<p>{t("pricing.note2")}</p>
						</div>
						</div>

						<div className="grid md:grid-cols-2 gap-4">
						{pricingList.map((plan) => (
								<div
									key={plan.name}
									className={`rounded-2xl border p-5 space-y-4 transition-all ${
										plan.highlight
											? "border-emerald-400/80 bg-emerald-400/10 shadow-[0_18px_40px_rgba(16,185,129,0.2)]"
											: "border-slate-800/70 bg-slate-950/50"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-xs uppercase tracking-widest text-emerald-200">
												{plan.badge}
											</p>
											<h3 className="text-2xl font-semibold text-slate-100">
												{plan.name}
											</h3>
											<p className="text-3xl font-bold text-emerald-300 mt-2">
												{plan.price}
											</p>
										</div>
										<p className={`text-sm text-right ${subtleText}`}>
											{plan.tagline}
										</p>
									</div>
									<ul className="space-y-1.5 text-sm text-slate-300">
										{plan.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2">
												<span className="text-emerald-300">•</span>
												<span>{feature}</span>
											</li>
										))}
									</ul>
									<button
										type="button"
										className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
											plan.highlight
												? "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
												: "border border-slate-700 text-slate-200 hover:bg-slate-900"
										}`}
										onClick={handlePrimaryCta}
									>
										{plan.cta}
									</button>
								</div>
							))}
						</div>
					</section>

					{/* FAQ */}
					<section
						id="faq"
						className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${cardSecondary}`}
					>
					<div className="space-y-2">
						<p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">
							FAQ
						</p>
						<h2 className="text-xl sm:text-2xl font-semibold">
							{t("faq.title")}
						</h2>
						<p className={`text-sm ${subtleText}`}>
							{t("faq.caption")}
						</p>
					</div>
					<div className="space-y-3">
						{faqList.map((item) => (
								<details
									key={item.question}
									className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4"
								>
									<summary className="cursor-pointer text-sm font-semibold text-slate-100">
										{item.question}
									</summary>
									<p className={`mt-2 text-sm leading-relaxed ${strongSubtleText}`}>
										{item.answer}
									</p>
								</details>
							))}
						</div>
					</section>
				</div>
			</div>
			</main>
			<footer className="bg-slate-950 border-t border-slate-900 px-4 py-6 text-center text-[11px] text-slate-500 space-y-2">
				<p>{t("footer.disclaimer")}</p>
				<p>{t("footer.dataSource")}</p>
				<p>
					<Link href="/legal" className="text-emerald-300 underline">
						Legal · 使用条款
					</Link>
				</p>
			</footer>
		</>
	);
}
