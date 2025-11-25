import type { ReportSummary } from "@/types/report";

/**
 * Featured reports data source - shared between home page and /reports
 * This is the single source of truth for report hub content
 */
const reportData: ReportSummary[] = [
	{
		symbol: "MSFT",
		title: "Microsoft 云端效率与 AI 投资机会",
		snippet: "剖析 Azure 复合增长与 Copilot 对办公流水线的再造。",
		date: "2025-11-18",
		author: "Investor AI Team",
		theme: "Cloud + AI",
		url: "/reports/msft",
		tags: ["效率", "云", "Copilot"],
		cover: "linear-gradient(135deg, rgba(20,100,150,0.85), rgba(50,140,200,0.75)), url('/reports/covers/msft.webp')",
		readTime: "6 min",
		body: [
			"当我们把办公的入口和决策链条搬到云端，AI 便不再是点缀，而是背景操作系统。Azure 的统计数据显示，Copilot 每天被激活的次数翻了三倍：它担任助理、审稿、Summarize、模拟电话会议，所有流程都围绕着一句话——让人专注于更高的判断。",
			"本文用季度财报的增长线、云端毛利的上升曲线，指出微软正在把『生产力』变成了可重复的订阅化服务。我们还分别对 Office、Teams、Dynamics 里的 Copilot 使用频次拆解，发现在企业用户入手不久后，跨产品的留存率提升了 12 个点。",
			"最后，为了说明这不是营销故事，我们把 LinkedIn 上三组潜在客户的互动率与 NPS 字段对照，得出结论：AI 助手越深度集成，反馈的满意度相比半年前至少高出 18%。"
		],
	},
	{
		symbol: "NVDA",
		title: "NVIDIA：AI 标配与自研芯片的赛道",
		snippet: "解析 Hopper、Blackwell 以及算力需求对收入的放大效应。",
		date: "2025-11-15",
		author: "Investor AI Research",
		theme: "Semiconductor",
		url: "/reports/nvda",
		tags: ["GPU", "数据中心", "AI Infra"],
		cover: "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(100,180,50,0.75)), url('/reports/covers/nvda.webp')",
		readTime: "5 min",
		body: [
			"NVIDIA 不再只是 GPU 设计公司，而是以 Hopper 架构为核心的『AI 中枢城市』。我们统计了 14 家云端超级计算中心的 chip deployment 节奏，发现 Hopper 系列在 2025 年的 Q1-Q3 中站稳了 42% 的市场份额。",
			"更有趣的是，Blackwell 的矩阵计算引擎允许模型在一次迭代内完成三段训练，使得自动驾驶和多模态视觉的开发效率提升了 27%。这也使得半导体利润率反向恢复，不再过度依赖矿工类的需求。",
			"报告最后的模型输出用 8 个客户案例展示了 Hopper 如何缩短模型训练时间，并给出 2~3 倍的推理吞吐能力。我们认为弹性扩容的节奏才是 NVDA 下一个赛道，而不仅仅是芯片自身。"
		],
	},
	{
		symbol: "RTX",
		title: "雷神：航空国防的升级周期",
		snippet: "结合国防预算、订单节奏与民用飞行后置补给作为衡量。",
		date: "2025-11-10",
		author: "Investor AI Strategist",
		theme: "Defense & Aerospace",
		url: "/reports/rtx",
		tags: ["预算", "订单", "供应链"],
		cover: "linear-gradient(135deg, rgba(180,60,20,0.85), rgba(220,120,60,0.75)), url('/reports/covers/rtx.webp')",
		readTime: "4 min",
		body: [
			"雷神的订单在 2025 年加速恢复，国防预算转向高空气战的硬件，订单增长了 9%。本篇报告把预算表、军工承包周期与民用侧的零部件整合在一起，以说明供应链弹性是当前估值的关键。",
			"结合 SDB、GPS 精度与航电系统的素材开销，我们还探讨了 RTX 如何用模块化的飞行管道降低交付风险，并附带 3 个版本迭代的验收案例。",
			"结论提示：下一轮的估值提升要靠超声速与自主系统，而不是传统的隐身能力；我们建议关注雷神的 AI 战闸项目，因为它的利润率已经超过 18%。"
		],
	},
	{
		symbol: "TSLA",
		title: "Tesla 车载 AI 与能源站的双引擎",
		snippet: "关注 FSD、Megapack 以及研发管线的协同效应。",
		date: "2025-11-08",
		author: "Investor AI Team",
		theme: "Mobility",
		url: "/reports/tsla",
		tags: ["FSD", "储能", "产品节奏"],
		cover: "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(180,100,200,0.75)), url('/reports/covers/tsla.webp')",
		readTime: "7 min",
		body: [
			"Tesla 的能量站正在变成 AI 驱动的预测系统，充电桩实时调整功率以应对突发交通潮。这一模式在本季度的 X 次出行中提高了 14% 的资源利用率。",
			"与 FSD 相关的软硬件绑定也在变得透明。我们分析了 120 份 OTA 更新的日志，发现 Teslarsoft 在弹性控制与视觉识别上降低了 31% 的误识别率，也进一步压缩了保险赔付成本。",
			"最后，本报告还整理了能源站与 Powerpack 的整合 blueprint，说明过去 18 个月 Tesla 是如何把『储能 + 车 + AI』打造成一个统一的企业节奏。"
		],
	},
	{
		symbol: "NVAX",
		title: "Next-gen health data intelligence",
		snippet: "用研发管线数据和疫苗产能布局做结构化分析。",
		date: "2025-11-05",
		author: "Investor AI Biotech",
		theme: "Healthtech",
		url: "/reports/nvax",
		tags: ["疫苗", "研发管线", "数据"],
		cover: "linear-gradient(135deg, rgba(20,120,180,0.85), rgba(100,180,255,0.75)), url('/reports/covers/nvax.webp')",
		readTime: "6 min",
		body: [
			"这次我们聚焦一家公司将 AI 用在疫苗产能预测上：通过跨地域的冷链数据整合，发现原料的波动对生产率影响高达 18%。报告列举了 5 个关键指标，让投资者可以及时监测产能恢复。",
			"还记录了研发管线中每个候选疫苗的模拟结果，AI 模拟能把 3 million 次实验降到 80 次，以节约预算与时间。",
			"鉴于未来卫生事件的不确定性，我们建议关注公司在西海岸与欧洲的两座新工厂，它们搭载了自动质控系统，使得每百万剂的出货质量控制在 0.1% 误差以内。"
		],
	},
	{
		symbol: "NFLX",
		title: "Netflix 内容策略与订阅韧性",
		snippet: "把广告创新、国际内容与会员净增长作为评分维度。",
		date: "2025-11-01",
		author: "Investor AI Media",
		theme: "Media",
		url: "/reports/nflx",
		tags: ["订阅", "广告", "国际化"],
		cover: "linear-gradient(135deg, rgba(180,20,20,0.85), rgba(50,50,50,0.75)), url('/reports/covers/nflx.webp')",
		readTime: "5 min",
		body: [
			"Netflix 这次的报告揭示了广告收入在 2025 年的回暖路径，其中互动式广告带来的时长增加了 8%。我们用了全球 14 个市场的数据，列出不同内容类型的单次点击价值（CPM）与留存拉动。",
			"国际化方面，减少本地化投入的同时，用 AI 生成内容封面、字幕的生产率翻了一番。报告提供了两套策略：一种在欧洲市场用短片迎合纵深传播，另一种在亚太地区强化社区联动。",
			"结语指出：Netflix 要将流量与广告彻底串起，需要把会员体验与 AI 推荐算法同步调校；我们在附录分享了 3 条优化建议。"
		],
	},
];

/**
 * Get featured reports (e.g., latest N reports for home page)
 * @param limit - Number of reports to return (default: 3)
 * @returns Array of featured report summaries, sorted by date (newest first)
 */
export function getFeaturedReports(limit = 3): ReportSummary[] {
	return [...reportData]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, limit);
}

/**
 * Get all reports
 * @returns Array of all report summaries
 */
export function getAllReports(): ReportSummary[] {
	return reportData;
}

/**
 * Get unique categories from all reports
 * @returns Array of unique theme categories
 */
export function listCategories(): string[] {
	const categories = new Set(reportData.map((item) => item.theme));
	return Array.from(categories);
}

/**
 * Fetch report summaries (placeholder for future API/DB integration)
 * @param options - Optional parameters (e.g., limit, offset)
 * @returns Promise resolving to featured reports
 */
export async function fetchReportSummaries(options?: { limit?: number; offset?: number }): Promise<ReportSummary[]> {
	// Default behavior: return static data
	// Future: can be replaced with Supabase/API call
	const { limit = 3 } = options || {};
	return getFeaturedReports(limit);
}
