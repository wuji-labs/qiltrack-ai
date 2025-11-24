import type { ReportTone } from "@/types/report";

export type TranslationKey = string;

export type NavItem = {
	labelKey: TranslationKey;
	href: string;
};

export const navItems: NavItem[] = [
	{ labelKey: "nav.product", href: "#overview" },
	{ labelKey: "nav.generator", href: "#generator" },
	{ labelKey: "nav.templates", href: "/reports" },
	{ labelKey: "nav.pricing", href: "#pricing" },
	{ labelKey: "nav.faq", href: "#faq" },
] as const;

export type WorkflowStepKey = {
	badge: TranslationKey;
	title: TranslationKey;
	detail: TranslationKey;
};

export const workflowSteps: WorkflowStepKey[] = [
	{ badge: "workflow.step1.badge", title: "workflow.step1.title", detail: "workflow.step1.detail" },
	{ badge: "workflow.step2.badge", title: "workflow.step2.title", detail: "workflow.step2.detail" },
	{ badge: "workflow.step3.badge", title: "workflow.step3.title", detail: "workflow.step3.detail" },
	{ badge: "workflow.step4.badge", title: "workflow.step4.title", detail: "workflow.step4.detail" },
];

export type HeroHighlightKey = {
	title: TranslationKey;
	description: TranslationKey;
};

export const heroHighlightKeys: ReadonlyArray<HeroHighlightKey> = [
	{ title: "hero.highlight1.title", description: "hero.highlight1.description" },
	{ title: "hero.highlight2.title", description: "hero.highlight2.description" },
	{ title: "hero.highlight3.title", description: "hero.highlight3.description" },
];

export type PricingPlanKey = {
	tier: "free" | "monthly" | "annual";
	name: TranslationKey;
	badge: TranslationKey;
	price: TranslationKey;
	tagline: TranslationKey;
	features: TranslationKey[];
	cta: TranslationKey;
	highlight?: boolean;
	secondary?: boolean;
};

export const pricingPlans: PricingPlanKey[] = [
	{
		tier: "free",
		name: "pricing.plan.free.name",
		badge: "pricing.plan.free.badge",
		price: "pricing.plan.free.price",
		tagline: "pricing.plan.free.tagline",
		features: [
			"pricing.plan.free.feature1",
			"pricing.plan.free.feature2",
			"pricing.plan.free.feature3",
			"pricing.plan.free.feature4",
			"pricing.plan.free.feature5",
		],
		cta: "pricing.plan.free.cta",
	},
	{
		tier: "monthly",
		name: "pricing.plan.monthly.name",
		badge: "pricing.plan.monthly.badge",
		price: "pricing.plan.monthly.price",
		tagline: "pricing.plan.monthly.caption",
		features: [
			"pricing.plan.monthly.feature1",
			"pricing.plan.monthly.feature2",
			"pricing.plan.monthly.feature3",
			"pricing.plan.monthly.feature4",
		],
		cta: "pricing.plan.monthly.cta",
		highlight: true,
	},
	{
		tier: "annual",
		name: "pricing.plan.annual.name",
		badge: "pricing.plan.annual.badge",
		price: "pricing.plan.annual.price",
		tagline: "pricing.plan.annual.caption",
		features: [
			"pricing.plan.annual.feature1",
			"pricing.plan.annual.feature2",
			"pricing.plan.annual.feature3",
			"pricing.plan.annual.feature4",
		],
		cta: "pricing.plan.annual.cta",
		secondary: true,
	},
];

export type FAQItem = {
	question: TranslationKey;
	answer: TranslationKey;
};

export const faqItems: FAQItem[] = [
	{ question: "faq.q1.question", answer: "faq.q1.answer" },
	{ question: "faq.q2.question", answer: "faq.q2.answer" },
	{ question: "faq.q3.question", answer: "faq.q3.answer" },
	{ question: "faq.q4.question", answer: "faq.q4.answer" },
	{ question: "faq.q5.question", answer: "faq.q5.answer" },
	{ question: "faq.q6.question", answer: "faq.q6.answer" },
	{ question: "faq.q7.question", answer: "faq.q7.answer" },
	{ question: "faq.q8.question", answer: "faq.q8.answer" },
];

export type ToneOption = {
	id: ReportTone;
	emoji: string;
	titleKey: TranslationKey;
	badgeKey: TranslationKey;
	descriptionKey: TranslationKey;
};

export const toneOptions: ToneOption[] = [
	{ id: "baseline", emoji: "🧭", titleKey: "tone.baseline.title", badgeKey: "tone.baseline.badge", descriptionKey: "tone.baseline.description" },
	{ id: "buffett", emoji: "🏰", titleKey: "tone.buffett.title", badgeKey: "tone.buffett.badge", descriptionKey: "tone.buffett.description" },
	{ id: "musk", emoji: "🚀", titleKey: "tone.musk.title", badgeKey: "tone.musk.badge", descriptionKey: "tone.musk.description" },
	{ id: "muddy", emoji: "🛡️", titleKey: "tone.muddy.title", badgeKey: "tone.muddy.badge", descriptionKey: "tone.muddy.description" },
];

export type CaseStudy = {
	company: string;
	industryKey: TranslationKey;
	tonalityKey: TranslationKey;
	tagKeys: TranslationKey[];
	snippetKey: TranslationKey;
	metricKey: TranslationKey;
};

export const caseStudies: CaseStudy[] = [
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

export const highlightFallbackKeys: TranslationKey[] = ["highlight.default.1", "highlight.default.2", "highlight.default.3"];
