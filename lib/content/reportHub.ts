import type { AccessLevel, ReportCard, ReportPost, ReportSummary } from "@/types/report";
import { getIndustryCover, getIndustryFromSymbol } from "./industryCoverGradients";

/**
 * 权限检查上下文
 */
export type UserPermissionContext = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userPlan: string | null; // "ultra", "pro", "free", etc.
};

/**
 * 检查用户是否有权访问报告
 */
export function canAccessReport(
  report: ReportCard,
  context: UserPermissionContext
): boolean {
  const accessLevel = (report.accessLevel || "timed-free") as AccessLevel;

  // 管理员拥有所有权限
  if (context.isAdmin) return true;

  switch (accessLevel) {
    case "timed-free":
      // 任何人都能访问（用于 SEO）
      return true;
    case "pro":
      // Pro 和 Ultra 用户可访问
      return context.userPlan === "pro" || context.userPlan === "ultra";
    case "ultra":
      // 仅 Ultra 用户可访问
      return context.userPlan === "ultra";
    default:
      return false;
  }
}

/**
 * 获取报告的拒绝原因（用于显示提示信息）
 */
export function getAccessDenialReason(
  report: ReportCard,
  context: UserPermissionContext
): string | null {
  if (canAccessReport(report, context)) return null;

  const accessLevel = (report.accessLevel || "timed-free") as AccessLevel;

  if (!context.isAuthenticated && accessLevel !== "timed-free") {
    return "login_required";
  }

  if (accessLevel === "pro" && context.userPlan !== "pro" && context.userPlan !== "ultra") {
    return "pro_required";
  }

  if (accessLevel === "ultra" && context.userPlan !== "ultra") {
    return "ultra_required";
  }

  return null;
}

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
    author: "Qiltrack Team",
    theme: "Cloud + AI",
    url: "/reports/msft",
    tags: ["效率", "云", "Copilot"],
    cover:
      "linear-gradient(135deg, rgba(20,100,150,0.85), rgba(50,140,200,0.75)), url('/reports/covers/msft.webp')",
    readTime: "6 min",
    body: [
      "当我们把办公的入口和决策链条搬到云端，AI 便不再是点缀，而是背景操作系统。Azure 的统计数据显示，Copilot 每天被激活的次数翻了三倍：它担任助理、审稿、Summarize、模拟电话会议，所有流程都围绕着一句话——让人专注于更高的判断。",
      "本文用季度财报的增长线、云端毛利的上升曲线，指出微软正在把『生产力』变成了可重复的订阅化服务。我们还分别对 Office、Teams、Dynamics 里的 Copilot 使用频次拆解，发现在企业用户入手不久后，跨产品的留存率提升了 12 个点。",
      "最后，为了说明这不是营销故事，我们把 LinkedIn 上三组潜在客户的互动率与 NPS 字段对照，得出结论：AI 助手越深度集成，反馈的满意度相比半年前至少高出 18%。",
    ],
    accessLevel: "timed-free",
  },
  {
    symbol: "NVDA",
    title: "NVIDIA：AI 标配与自研芯片的赛道",
    snippet: "解析 Hopper、Blackwell 以及算力需求对收入的放大效应。",
    date: "2025-11-15",
    author: "Qiltrack Research",
    theme: "Semiconductor",
    url: "/reports/nvda",
    tags: ["GPU", "数据中心", "AI Infra"],
    cover:
      "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(100,180,50,0.75)), url('/reports/covers/nvda.webp')",
    readTime: "5 min",
    body: [
      "NVIDIA 不再只是 GPU 设计公司，而是以 Hopper 架构为核心的『AI 中枢城市』。我们统计了 14 家云端超级计算中心的 chip deployment 节奏，发现 Hopper 系列在 2025 年的 Q1-Q3 中站稳了 42% 的市场份额。",
      "更有趣的是，Blackwell 的矩阵计算引擎允许模型在一次迭代内完成三段训练，使得自动驾驶和多模态视觉的开发效率提升了 27%。这也使得半导体利润率反向恢复，不再过度依赖矿工类的需求。",
      "报告最后的模型输出用 8 个客户案例展示了 Hopper 如何缩短模型训练时间，并给出 2~3 倍的推理吞吐能力。我们认为弹性扩容的节奏才是 NVDA 下一个赛道，而不仅仅是芯片自身。",
    ],
    accessLevel: "timed-free",
  },
  {
    symbol: "RTX",
    title: "雷神：航空国防的升级周期",
    snippet: "结合国防预算、订单节奏与民用飞行后置补给作为衡量。",
    date: "2025-11-10",
    author: "Qiltrack Strategist",
    theme: "Defense & Aerospace",
    url: "/reports/rtx",
    tags: ["预算", "订单", "供应链"],
    cover:
      "linear-gradient(135deg, rgba(180,60,20,0.85), rgba(220,120,60,0.75)), url('/reports/covers/rtx.webp')",
    readTime: "4 min",
    body: [
      "雷神的订单在 2025 年加速恢复，国防预算转向高空气战的硬件，订单增长了 9%。本篇报告把预算表、军工承包周期与民用侧的零部件整合在一起，以说明供应链弹性是当前估值的关键。",
      "结合 SDB、GPS 精度与航电系统的素材开销，我们还探讨了 RTX 如何用模块化的飞行管道降低交付风险，并附带 3 个版本迭代的验收案例。",
      "结论提示：下一轮的估值提升要靠超声速与自主系统，而不是传统的隐身能力；我们建议关注雷神的 AI 战闸项目，因为它的利润率已经超过 18%。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "TSLA",
    title: "Tesla 车载 AI 与能源站的双引擎",
    snippet: "关注 FSD、Megapack 以及研发管线的协同效应。",
    date: "2025-11-08",
    author: "Qiltrack Team",
    theme: "Mobility",
    url: "/reports/tsla",
    tags: ["FSD", "储能", "产品节奏"],
    cover:
      "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(180,100,200,0.75)), url('/reports/covers/tsla.webp')",
    readTime: "7 min",
    body: [
      "Tesla 的能量站正在变成 AI 驱动的预测系统，充电桩实时调整功率以应对突发交通潮。这一模式在本季度的 X 次出行中提高了 14% 的资源利用率。",
      "与 FSD 相关的软硬件绑定也在变得透明。我们分析了 120 份 OTA 更新的日志，发现 Teslarsoft 在弹性控制与视觉识别上降低了 31% 的误识别率，也进一步压缩了保险赔付成本。",
      "最后，本报告还整理了能源站与 Powerpack 的整合 blueprint，说明过去 18 个月 Tesla 是如何把『储能 + 车 + AI』打造成一个统一的企业节奏。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "NVAX",
    title: "Next-gen health data intelligence",
    snippet: "用研发管线数据和疫苗产能布局做结构化分析。",
    date: "2025-11-05",
    author: "Qiltrack Biotech",
    theme: "Healthtech",
    url: "/reports/nvax",
    tags: ["疫苗", "研发管线", "数据"],
    cover:
      "linear-gradient(135deg, rgba(20,120,180,0.85), rgba(100,180,255,0.75)), url('/reports/covers/nvax.webp')",
    readTime: "6 min",
    body: [
      "这次我们聚焦一家公司将 AI 用在疫苗产能预测上：通过跨地域的冷链数据整合，发现原料的波动对生产率影响高达 18%。报告列举了 5 个关键指标，让投资者可以及时监测产能恢复。",
      "还记录了研发管线中每个候选疫苗的模拟结果，AI 模拟能把 3 million 次实验降到 80 次，以节约预算与时间。",
      "鉴于未来卫生事件的不确定性，我们建议关注公司在西海岸与欧洲的两座新工厂，它们搭载了自动质控系统，使得每百万剂的出货质量控制在 0.1% 误差以内。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "NFLX",
    title: "Netflix 内容策略与订阅韧性",
    snippet: "把广告创新、国际内容与会员净增长作为评分维度。",
    date: "2025-11-01",
    author: "Qiltrack Media",
    theme: "Media",
    url: "/reports/nflx",
    tags: ["订阅", "广告", "国际化"],
    cover:
      "linear-gradient(135deg, rgba(180,20,20,0.85), rgba(50,50,50,0.75)), url('/reports/covers/nflx.webp')",
    readTime: "5 min",
    body: [
      "Netflix 这次的报告揭示了广告收入在 2025 年的回暖路径，其中互动式广告带来的时长增加了 8%。我们用了全球 14 个市场的数据，列出不同内容类型的单次点击价值（CPM）与留存拉动。",
      "国际化方面，减少本地化投入的同时，用 AI 生成内容封面、字幕的生产率翻了一番。报告提供了两套策略：一种在欧洲市场用短片迎合纵深传播，另一种在亚太地区强化社区联动。",
      "结语指出：Netflix 要将流量与广告彻底串起，需要把会员体验与 AI 推荐算法同步调校；我们在附录分享了 3 条优化建议。",
    ],
    accessLevel: "ultra",
  },
  {
    symbol: "AAPL",
    title: "Apple Vision Pro 与空间计算生态",
    snippet: "深度分析 AR/VR 硬件与应用生态的商业机遇。",
    date: "2025-10-28",
    author: "Qiltrack Team",
    theme: "Cloud + AI",
    url: "/reports/aapl",
    tags: ["VR", "硬件", "生态"],
    cover:
      "linear-gradient(135deg, rgba(100,100,100,0.85), rgba(150,150,150,0.75)), url('/reports/covers/aapl.webp')",
    readTime: "6 min",
    body: [
      "Apple Vision Pro 的销售数据显示，企业级应用占比达 45%，高于初期预期。我们分析了建筑、医疗、制造三个关键行业的采购周期，预测 2025 年企业用户增长 3.2 倍。",
      "应用生态方面，已有 2800+ 应用适配，其中生产力工具占 62%。AR 界面的交互效率比传统屏幕高 31%，这正在改变办公体验。",
      "报告还评估了竞争格局，分析为何 Meta Quest 在消费市场占优，但 Apple 在企业应用上更具优势。未来的关键是生态闭环的完成度。",
    ],
    accessLevel: "timed-free",
  },
  {
    symbol: "GOOGL",
    title: "Google 广告技术与AI整合的前景",
    snippet: "AI 如何重塑搜索和显示广告的投放效率。",
    date: "2025-10-25",
    author: "Qiltrack Research",
    theme: "Cloud + AI",
    url: "/reports/googl",
    tags: ["广告", "AI", "搜索"],
    cover:
      "linear-gradient(135deg, rgba(66,133,244,0.85), rgba(100,150,250,0.75)), url('/reports/covers/googl.webp')",
    readTime: "5 min",
    body: [
      "Google 的 AI 驱动广告定位系统已覆盖 78% 的展示广告，ROI 对标客户报告提升 22%。我们用了 Q1-Q3 的财报数据，剖析这一转向如何影响广告定价。",
      "搜索体验与生成式 AI 的整合也在进行中，虽然短期内可能影响点击率，但长期用户满意度提升了 19%。",
      "报告提醒投资者留意反垄断风险和隐私监管，这可能限制 Google 的数据优势。同时，我们指出 YouTube 的视频广告转型潜力巨大。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "AMD",
    title: "AMD 数据中心处理器与 MI300 加速器",
    snippet: "竞争力分析与市场份额扩张的驱动力。",
    date: "2025-10-22",
    author: "Qiltrack Semiconductor",
    theme: "Semiconductor",
    url: "/reports/amd",
    tags: ["CPU", "GPU", "数据中心"],
    cover:
      "linear-gradient(135deg, rgba(230,120,30,0.85), rgba(255,150,60,0.75)), url('/reports/covers/amd.webp')",
    readTime: "6 min",
    body: [
      "AMD 的 MI300 加速器在某些深度学习任务上性能可匹敌 H100，价格低 18%。我们统计了 12 个云厂商的采购意向，发现 2025 年 MI300 出货量可能达 180 万片。",
      "与 NVIDIA 的竞争不是全面的，而是在特定应用场景中。我们分类了推理、训练、通用计算三个赛道，指出 AMD 在推理上最具竞争力。",
      "报告还评估了 EPYC 处理器在企业数据中心的市场占有率，预测将进一步突破 15%。",
    ],
    accessLevel: "timed-free",
  },
  {
    symbol: "META",
    title: "Meta Reality Labs 的长期战略与成本压控",
    snippet: "评估 VR/AR 投资的可持续性与收益时间表。",
    date: "2025-10-20",
    author: "Qiltrack Team",
    theme: "Cloud + AI",
    url: "/reports/meta",
    tags: ["VR", "成本", "战略"],
    cover:
      "linear-gradient(135deg, rgba(20,100,240,0.85), rgba(60,150,255,0.75)), url('/reports/covers/meta.webp')",
    readTime: "6 min",
    body: [
      "Meta 在 Reality Labs 上的烧钱速度有所放缓，Q1-Q3 平均月均支出从 $14B 降至 $12.5B。我们从供应链、研发效率两个角度分析成本压控的手段。",
      "Quest 3 的销量超预期，B2B 应用（建筑、教育、物流）正快速增长，年复合增长率达 45%。",
      "报告警示投资者，Meta 的盈利时间表已推迟至 2026 年底，但竞争力正在提升。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "SSNLF",
    title: "Samsung 芯片代工与存储创新",
    snippet: "分析 3 纳米工艺与 HBM 存储的市场前景。",
    date: "2025-10-18",
    author: "Qiltrack Research",
    theme: "Semiconductor",
    url: "/reports/ssnlf",
    tags: ["代工", "工艺", "存储"],
    cover:
      "linear-gradient(135deg, rgba(100,180,200,0.85), rgba(150,210,255,0.75)), url('/reports/covers/ssnlf.webp')",
    readTime: "5 min",
    body: [
      "Samsung 的 3 纳米工艺已向高通、AMD 等客户小规模供应，良率相比初期提升 31%。我们预测全年产能利用率可达 65%，较竞争对手领先 8 个百分点。",
      "HBM3 存储已进入量产，单价相比 HBM2e 降低 12%，有望成为 AI 芯片的标配。",
      "报告指出代工业的复苏驱动力是 AI 芯片的设计多样化，这给 Samsung 等 #2 代工厂更多机会。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "BYDDY",
    title: "BYD 电池与新能源汽车的垂直整合优势",
    snippet: "电池成本、产能与全球扩张的战略分析。",
    date: "2025-10-15",
    author: "Qiltrack Mobility",
    theme: "Mobility",
    url: "/reports/byddy",
    tags: ["电池", "成本", "全球化"],
    cover:
      "linear-gradient(135deg, rgba(200,50,50,0.85), rgba(255,100,100,0.75)), url('/reports/covers/byddy.webp')",
    readTime: "6 min",
    body: [
      "BYD 的电池成本已降至 $85/kWh，全球领先，这直接拉低新能源汽车的定价权。我们统计了全球销售数据，2025 年 BYD 新能源汽车出货量有望突破 400 万辆。",
      "垂直整合（从矿产、电池、汽车到充电网络）给 BYD 30% 的毛利率优势。我们分析了这种模式在欧美的可复制性。",
      "报告还评估了 BYD 在欧洲、东南亚的工厂扩建计划，预测 2026 年国际销量占比将达 35%。",
    ],
    accessLevel: "timed-free",
  },
  {
    symbol: "NOVO",
    title: "Novo 药物管线与减肥药市场饱和风险",
    snippet: "管线价值评估与市场竞争格局深度分析。",
    date: "2025-10-12",
    author: "Qiltrack Biotech",
    theme: "Healthtech",
    url: "/reports/novo",
    tags: ["药品", "减肥", "管线"],
    cover:
      "linear-gradient(135deg, rgba(100,200,100,0.85), rgba(150,230,150,0.75)), url('/reports/covers/novo.webp')",
    readTime: "7 min",
    body: [
      "Novo 的减肥药销售虽然强劲，但竞争对手进入和需求饱和风险正在上升。我们分析了全球处方数据，发现增速已从 2024 年的 82% 放缓至 2025 年的 38%。",
      "药物管线中，下一代产品的作用机制差异化有限，定价权正逐步下降。我们评估了 10+ 个临床阶段项目的风险收益。",
      "报告建议投资者关注 Novo 的长期管线创新和国际扩张，但对减肥药的盈利峰值已接近的判断保持警惕。",
    ],
    accessLevel: "ultra",
  },
  {
    symbol: "SMCI",
    title: "Super Micro Computer AI 服务器需求持续旺盛",
    snippet: "产能扩张与供应链风险的平衡分析。",
    date: "2025-10-10",
    author: "Qiltrack Research",
    theme: "Semiconductor",
    url: "/reports/smci",
    tags: ["服务器", "产能", "供应链"],
    cover:
      "linear-gradient(135deg, rgba(50,100,180,0.85), rgba(100,150,220,0.75)), url('/reports/covers/smci.webp')",
    readTime: "5 min",
    body: [
      "SMCI 的 AI 服务器出货量在 2025 年增长 124%，产能扩张已从台湾和荷兰扩展到东南亚。我们评估了新工厂的资本效率，预测 2026 年产能利用率可达 82%。",
      "供应链风险依然存在，但 SMCI 的多源采购策略有效降低了单点故障风险。",
      "报告指出 SMCI 的增长持续依赖于 AI 芯片市场的扩张，而不仅仅是 NVIDIA 的需求。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "CRWD",
    title: "CrowdStrike 网络安全与 AI 防御创新",
    snippet: "赛道增长与竞争格局的深度分析。",
    date: "2025-10-08",
    author: "Qiltrack Security",
    theme: "Cloud + AI",
    url: "/reports/crwd",
    tags: ["安全", "AI", "端点保护"],
    cover:
      "linear-gradient(135deg, rgba(180,80,80,0.85), rgba(220,120,120,0.75)), url('/reports/covers/crwd.webp')",
    readTime: "6 min",
    body: [
      "CrowdStrike 的端点防护平台已集成 AI 威胁检测，客户保留率高达 98%，月度增长率 12%。我们评估了这一市场的增长空间，认为端点 AI 安全是下一个 $10B+ 赛道。",
      "竞争对手包括 Microsoft、Palo Alto Networks，但 CRWD 在检测精度和响应速度上领先。",
      "报告提示投资者关注网络安全 AI 化的长期趋势，认为安全产品的定价权正在提升。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "SOFI",
    title: "SoFi 金融科技平台与会员增长战略",
    snippet: "用户获取成本、留存与长期盈利能力评估。",
    date: "2025-10-05",
    author: "Qiltrack Fintech",
    theme: "Cloud + AI",
    url: "/reports/sofi",
    tags: ["金融", "科技", "用户增长"],
    cover:
      "linear-gradient(135deg, rgba(100,150,200,0.85), rgba(150,200,255,0.75)), url('/reports/covers/sofi.webp')",
    readTime: "6 min",
    body: [
      "SoFi 的 Q2-Q3 新用户获取成本已降至 $28，而会员留存率达 82%。我们分析了平台交叉销售的提升空间，认为人均收入可再增长 35%。",
      "投资功能（Invest）和储蓄功能（Save）的用户渗透率已达 38%，这推高了 ARPU（每用户平均收入）。",
      "报告评估了 SoFi 的盈利时间表，预测 2026 年达到 EBITDA 正增长，但需关注利率环境变化的风险。",
    ],
    accessLevel: "timed-free",
  },
  {
    symbol: "COIN",
    title: "Coinbase 加密资产市场与监管动态",
    snippet: "用户增长、交易量与合规成本的平衡分析。",
    date: "2025-10-02",
    author: "Qiltrack Crypto",
    theme: "Media",
    url: "/reports/coin",
    tags: ["加密", "交易所", "监管"],
    cover:
      "linear-gradient(135deg, rgba(200,150,50,0.85), rgba(255,200,100,0.75)), url('/reports/covers/coin.webp')",
    readTime: "6 min",
    body: [
      "Coinbase 的活跃用户在加密市场复苏中增长 45%，交易量同比增长 89%。我们评估了机构用户在总流量中的比例已达 28%，高于历史平均 15%。",
      "监管风险依然存在，但美国市场对加密资产的态度正在改善。我们分析了 Coinbase 合规成本的长期趋势。",
      "报告指出 Staking、DeFi 等产品是 Coinbase 未来的高毛利增长点，交易佣金率已逐步下降。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "UPST",
    title: "Upstart AI 驱动的贷款平台创新",
    snippet: "模型精度提升与合作伙伴拓展的前景。",
    date: "2025-09-29",
    author: "Qiltrack Research",
    theme: "Cloud + AI",
    url: "/reports/upst",
    tags: ["AI", "贷款", "金融科技"],
    cover:
      "linear-gradient(135deg, rgba(150,100,200,0.85), rgba(180,150,230,0.75)), url('/reports/covers/upst.webp')",
    readTime: "5 min",
    body: [
      "Upstart 的 AI 模型已帮助合作贷款机构批准贷款数量同比增长 156%，且违约率下降 22%。我们评估了模型精度提升的商业价值，预测 2025 年收入可增长 94%。",
      "合作伙伴拓展正从美国银行扩展到国际金融机构，国际业务占比已达 18%。",
      "报告提示投资者关注 AI 金融模型的监管审查风险，但长期竞争壁垒正在建立。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "DDOG",
    title: "Datadog 可观测性平台与云原生市场",
    snippet: "SaaS 订阅增长与企业客户留存率的深度分析。",
    date: "2025-09-26",
    author: "Qiltrack Research",
    theme: "Cloud + AI",
    url: "/reports/ddog",
    tags: ["可观测性", "云", "监控"],
    cover:
      "linear-gradient(135deg, rgba(80,80,180,0.85), rgba(120,120,220,0.75)), url('/reports/covers/ddog.webp')",
    readTime: "6 min",
    body: [
      "Datadog 的平台整合了日志、指标、追踪功能，客户平均使用产品数量从 3.2 增长到 5.8 个。我们分析了这一趋势对 ARR（年度经常性收入）的正面影响，预测 2025 年增长率达 28%。",
      "企业客户留存率维持在 130% 以上，说明现有客户的扩展销售动力强劲。我们评估了国际市场扩张的机遇。",
      "报告指出可观测性已成为云原生基础设施的标配，这给 Datadog 长期增长提供了坚实基础。",
    ],
    accessLevel: "pro",
  },
  {
    symbol: "SNOW",
    title: "Snowflake 云数据平台与数据共享生态",
    snippet: "产品创新与市场竞争格局的变化分析。",
    date: "2025-09-23",
    author: "Qiltrack Research",
    theme: "Cloud + AI",
    url: "/reports/snow",
    tags: ["数据仓库", "云", "AI"],
    cover:
      "linear-gradient(135deg, rgba(100,150,200,0.85), rgba(150,200,255,0.75)), url('/reports/covers/snow.webp')",
    readTime: "6 min",
    body: [
      "Snowflake 推出了 AI 数据应用功能，用户可直接在平台上构建 AI 应用而无需导出数据。这一创新降低了数据泄露风险，同时提升了用户粘性。",
      "数据共享生态已扩展到 3000+ 企业用户，Snowflake 从中获取佣金收入。我们预测未来两年这块业务可达到 $50M 以上。",
      "与 Databricks、BigQuery 的竞争日趋激烈，但 Snowflake 在易用性和成本控制上仍有优势。报告建议投资者关注产品创新的持续性。",
    ],
    accessLevel: "pro",
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
export async function fetchReportSummaries(options?: {
  limit?: number;
  offset?: number;
}): Promise<ReportSummary[]> {
  // Default behavior: return static data
  // Future: can be replaced with Supabase/API call
  const { limit = 3 } = options || {};
  return getFeaturedReports(limit);
}

function normalizeBody(body: ReportPost["body"] | ReportSummary["body"]): string[] {
  if (Array.isArray(body)) {
    return body.filter(Boolean).map((paragraph) => String(paragraph));
  }
  if (typeof body === "string") {
    return body
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function computeReadTime(body: string[]): string {
  const words = body.join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(2, Math.ceil(words / 180));
  return `${minutes} min`;
}

function fallbackCover(slug: string, theme?: string | null) {
  // Use industry-based gradient for dynamic cover
  return getIndustryCover(theme, slug);
}

function formatCover(cover: string | null | undefined, slug: string, theme?: string | null) {
  if (!cover) return fallbackCover(slug, theme);
  if (cover.startsWith("url(") || cover.startsWith("linear-gradient")) return cover;
  if (/^https?:\/\//.test(cover)) return `url('${cover}')`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `url('${supabaseUrl}/storage/v1/object/public/report-assets/${cover}')`;
  }
  return fallbackCover(slug, theme);
}

function normalizeSlugFromUrl(url?: string) {
  if (!url) return "";
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "report"
  );
}

export function mapSummaryToCard(summary: ReportSummary): ReportCard {
  const slugFromUrl = normalizeSlugFromUrl(summary.url);
  const slug = slugify(slugFromUrl || summary.symbol || summary.title);
  const body = normalizeBody(summary.body);
  const readTime = summary.readTime || computeReadTime(body);

  return {
    id: summary.symbol,
    slug,
    title: summary.title,
    snippet: summary.snippet,
    date: summary.date,
    author: summary.author,
    theme: summary.theme,
    tags: summary.tags || [],
    cover: formatCover(summary.cover, slug, summary.theme),
    readTime,
    body: body.length ? body : [summary.snippet],
    language: "en",
    status: "published",
    version: 1,
    accessLevel: summary.accessLevel || "timed-free",
  };
}

export function mapApiPostToCard(post: ReportPost): ReportCard {
  const slug = slugify(
    post.slug ||
      normalizeSlugFromUrl((post as unknown as { url?: string }).url) ||
      post.title ||
      "report"
  );
  const body = normalizeBody(post.body);
  const summary = (post.summary || body[0] || "").trim();
  const date =
    (post as unknown as { published_at?: string }).published_at ||
    (post.publishedAt as string | undefined) ||
    (post as unknown as { created_at?: string }).created_at ||
    post.createdAt ||
    new Date().toISOString();

  const bodyForReadTime = body.length ? body : summary ? [summary] : [];
  const theme = post.theme || "General";

  return {
    id: post.id,
    slug,
    title: post.title || "Untitled report",
    snippet: summary || "No summary provided yet.",
    date,
    author: post.author || "Qiltrack Team",
    theme,
    tags: post.tags || [],
    cover: formatCover(post.cover, slug, theme),
    readTime: computeReadTime(bodyForReadTime),
    body: body.length
      ? body
      : bodyForReadTime.length
        ? bodyForReadTime
        : ["Report content coming soon."],
    language: post.language ?? null,
    status: post.status ?? null,
    version: post.version ?? null,
    // Read access_level from database (snake_case) or accessLevel (camelCase)
    accessLevel: (post as any)?.access_level || (post as any)?.accessLevel || "timed-free",
  };
}

export function getSeedReportCards(): ReportCard[] {
  return reportData.map(mapSummaryToCard);
}

export function findSeedReportBySlug(slug: string): ReportCard | undefined {
  const normalized = slugify(slug);
  return getSeedReportCards().find((item) => item.slug === normalized || item.id === normalized);
}

export function listSeedCategories(): string[] {
  const themes = new Set<string>();
  getSeedReportCards().forEach((item) => {
    if (item.theme) themes.add(item.theme);
  });
  return Array.from(themes);
}
