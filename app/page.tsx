"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { HeroSection } from "@/app/sections/HeroSection";
import { ModesSection } from "@/app/sections/ModesSection";
import { ReportGeneratorSection } from "@/app/sections/ReportGeneratorSection";
import { WhySection } from "@/app/sections/WhySection";
import { FooterSection } from "@/app/sections/FooterSection";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";
import { type Language } from "@/lib/i18n-config";
import type { ReportTone } from "@/types/report";

type TranslationKey = string;

const navItems = [
	{ labelKey: "nav.product", href: "#overview" },
	{ labelKey: "nav.generator", href: "#generator" },
	{ labelKey: "nav.templates", href: "/reports" },
	{ labelKey: "nav.pricing", href: "#pricing" },
	{ labelKey: "nav.faq", href: "#faq" },
] as const;

type WorkflowStepKey = {
	badge: TranslationKey;
	title: TranslationKey;
	detail: TranslationKey;
};

const workflowSteps: WorkflowStepKey[] = [
	{ badge: "workflow.step1.badge", title: "workflow.step1.title", detail: "workflow.step1.detail" },
	{ badge: "workflow.step2.badge", title: "workflow.step2.title", detail: "workflow.step2.detail" },
	{ badge: "workflow.step3.badge", title: "workflow.step3.title", detail: "workflow.step3.detail" },
	{ badge: "workflow.step4.badge", title: "workflow.step4.title", detail: "workflow.step4.detail" },
];

const heroHighlightKeys: ReadonlyArray<{ title: TranslationKey; description: TranslationKey }> = [
	{ title: "hero.highlight1.title", description: "hero.highlight1.description" },
	{ title: "hero.highlight2.title", description: "hero.highlight2.description" },
	{ title: "hero.highlight3.title", description: "hero.highlight3.description" },
];

type PricingPlanKey = {
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

const pricingPlans: PricingPlanKey[] = [
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

const faqItems: { question: TranslationKey; answer: TranslationKey }[] = [
	{ question: "faq.q1.question", answer: "faq.q1.answer" },
	{ question: "faq.q2.question", answer: "faq.q2.answer" },
	{ question: "faq.q3.question", answer: "faq.q3.answer" },
	{ question: "faq.q4.question", answer: "faq.q4.answer" },
	{ question: "faq.q5.question", answer: "faq.q5.answer" },
	{ question: "faq.q6.question", answer: "faq.q6.answer" },
	{ question: "faq.q7.question", answer: "faq.q7.answer" },
	{ question: "faq.q8.question", answer: "faq.q8.answer" },
];

type ToneOption = {
	id: ReportTone;
	emoji: string;
	titleKey: TranslationKey;
	badgeKey: TranslationKey;
	descriptionKey: TranslationKey;
};

const toneOptions: ToneOption[] = [
	{ id: "baseline", emoji: "🧭", titleKey: "tone.baseline.title", badgeKey: "tone.baseline.badge", descriptionKey: "tone.baseline.description" },
	{ id: "buffett", emoji: "🏰", titleKey: "tone.buffett.title", badgeKey: "tone.buffett.badge", descriptionKey: "tone.buffett.description" },
	{ id: "musk", emoji: "🚀", titleKey: "tone.musk.title", badgeKey: "tone.musk.badge", descriptionKey: "tone.musk.description" },
	{ id: "muddy", emoji: "🛡️", titleKey: "tone.muddy.title", badgeKey: "tone.muddy.badge", descriptionKey: "tone.muddy.description" },
];

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

const highlightFallbackKeys: TranslationKey[] = ["highlight.default.1", "highlight.default.2", "highlight.default.3"];

export default function Home() {
	const { language, setLanguage, t } = useLanguage();
	const { isAuthenticated, user, signOut, refreshSession } = useSupabaseAuth();
	const router = useRouter();
	const [selectedTone, setSelectedTone] = useState<ReportTone>("baseline");

	const isDark = true;
	const mainBg = isDark ? "bg-[var(--bg-base)] text-[var(--color-foreground)] pb-16" : "bg-slate-50 text-slate-900";
	const cardSecondary = isDark ? "bg-[var(--bg-layer)]/85 border-[var(--stroke-soft)]" : "bg-white border-slate-200";
	const subtleText = isDark ? "text-subtle" : "text-slate-500";
	const strongSubtleText = isDark ? "text-dim" : "text-slate-600";

	const navLinks = navItems.map((item) => ({ href: item.href, label: t(item.labelKey) }));
	const heroHighlightList = heroHighlightKeys.map((item) => ({ title: t(item.title), description: t(item.description) }));

	const toneOptionsLabeled = toneOptions.map((option) => ({
		id: option.id,
		emoji: option.emoji,
		title: t(option.titleKey),
		badge: t(option.badgeKey),
		description: t(option.descriptionKey),
	}));
	const toneLabelList = useMemo(() => toneOptionsLabeled.map((option) => option.title).join(" / "), [toneOptionsLabeled]);
	const personaSentence = t("persona.caption", { tones: toneLabelList });

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

	const module6Items = useMemo(() => {
		try {
			return JSON.parse(t("landing.module6.items")) as string[];
		} catch (err) {
			console.warn("Failed to parse module6 items", err);
			return [];
		}
	}, [t]);

	const combinedItems = useMemo(() => {
		try {
			return JSON.parse(t("landing.moduleCombined.items")) as { title: string; body: string }[];
		} catch (err) {
			console.warn("Failed to parse moduleCombined items", err);
			return [];
		}
	}, [t]);

	const caseStudyList = caseStudies.map((study) => ({
		company: study.company,
		industry: t(study.industryKey),
		tonality: t(study.tonalityKey),
		tags: study.tagKeys.map((tagKey) => t(tagKey)),
		snippet: t(study.snippetKey),
		metric: t(study.metricKey),
	}));

	const workflowList = workflowSteps.map((step) => ({ badge: t(step.badge), title: t(step.title), detail: t(step.detail) }));
	const pricingList = pricingPlans.map((plan) => ({
		tier: plan.tier,
		name: t(plan.name),
		badge: t(plan.badge),
		price: t(plan.price),
		tagline: t(plan.tagline),
		features: plan.features.map((key) => t(key)),
		cta: t(plan.cta),
		highlight: plan.highlight,
		secondary: plan.secondary,
	}));
	const faqList = faqItems.map((item) => ({ question: t(item.question), answer: t(item.answer) }));
	const highlightFallback = highlightFallbackKeys.map((key) => t(key));

	const planLabel = user?.user_metadata?.plan && user?.user_metadata?.plan !== "free" ? user?.user_metadata?.plan : t("quota.plan.free");

	const handlePrimaryCta = () => {
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}
		document.querySelector("#generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	// TODO: Implement subscription handlers when checkout functions are ready
	const handleSubscribeMonthly = () => {
		// Placeholder for monthly subscription logic
		console.log("Monthly subscription requested");
		// Fallback to primary CTA for now
		handlePrimaryCta();
	};

	const handleSubscribeAnnual = () => {
		// Placeholder for annual subscription logic
		console.log("Annual subscription requested");
		// Fallback to primary CTA for now
		handlePrimaryCta();
	};

	const quotaHintPrimary = isAuthenticated ? t("quota.banner.hint.refresh") : t("quota.banner.hint.register");
	const quotaHintSecondary = t("quota.banner.description");

	return (
		<>
			<main className={`min-h-screen ${mainBg}`} style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont" }}>
				<div className="grid min-h-screen grid-rows-[auto,1fr]">
					<HeroSection
						navItems={navLinks}
						language={language as Language}
						setLanguage={setLanguage}
						remainingQuota={1}
						planLabel={planLabel}
						userEmail={user?.email}
						userImage={user?.user_metadata?.avatar_url}
						isAuthenticated={isAuthenticated}
						onPrimaryCta={handlePrimaryCta}
						onSignOut={() => signOut()}
						t={t}
					/>
					<div className="flex flex-col flex-1">
						<div className="flex-1 flex justify-center py-10 sm:py-12">
							<div className="w-full max-w-6xl px-4 sm:px-6 lg:px-10 space-y-6 md:space-y-10">
								<section className={`rounded-[32px] border p-4 sm:p-5 md:p-6 space-y-6 md:space-y-8 bg-[var(--bg-layer)]/70 border-[var(--stroke-soft)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]`}>
									<ModesSection
										heading={t("generator.sectionTitle")}
										options={toneOptionsLabeled}
										selected={selectedTone}
										onSelect={setSelectedTone}
										personaSentence={personaSentence}
									/>

									<ReportGeneratorSection
										selectedTone={selectedTone}
										toneOptions={toneOptionsLabeled}
										language={language as Language}
										highlightFallback={highlightFallback}
										heroHighlights={heroHighlightList}
										auth={{
											isAuthenticated: isAuthenticated,
											remainingQuota: 1,
											planLabel,
											userEmail: user?.email,
											refreshSession: refreshSession,
										}}
										onRequireLogin={() => router.push("/login")}
										t={t}
									/>
								</section>

								<section id="workflow" className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 space-y-6 transition-all duration-200 ease-out ${cardSecondary}`}>
									<div className="pointer-events-none absolute inset-0 opacity-80">
										<div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-emerald-400/15 blur-[120px]" aria-hidden />
										<div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden />
										<div className="absolute inset-4 rounded-[28px] border border-white/5" aria-hidden />
									</div>

									<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="space-y-2 max-w-2xl">
											<p className="text-sm uppercase tracking-[0.28em] text-emerald-300">{t("workflow.sectionLabel")}</p>
											<h2 className="text-2xl sm:text-3xl font-semibold">{t("workflow.title")}</h2>
											<p className={`text-base ${subtleText}`}>{t("workflow.caption")}</p>
										</div>
										<div className="relative rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-4 py-3 text-sm text-right text-emerald-100 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
											<p className="font-semibold tracking-[0.16em] uppercase">{t("workflow.status.step", { step: "01" })}</p>
											<p className="text-subtle">{t("workflow.status.idle")}</p>
											<div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
										</div>
									</div>

									<div className="relative rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
										<div className="absolute left-4 top-8 bottom-8 hidden lg:block w-px bg-gradient-to-b from-[var(--accent-emerald)] via-[var(--stroke-soft)] to-transparent" aria-hidden />
										<div className="grid gap-4">
											{workflowList.map((step, index) => (
												<div key={step.title} className="relative pl-12 lg:pl-16">
													<div className="absolute left-0 lg:left-1 top-1">
														<div className="relative h-10 w-10 rounded-2xl bg-[var(--accent-emerald)]/20 border border-[var(--accent-emerald)]/50 flex items-center justify-center text-sm font-semibold text-[var(--accent-emerald)] shadow-[0_10px_30px_rgba(16,185,129,0.25)]">
															{(index + 1).toString().padStart(2, "0")}
															<span className="absolute inset-0 rounded-2xl border border-white/5" aria-hidden />
														</div>
													</div>
													<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 space-y-2 transition hover:border-[var(--stroke-glow)]/70 hover:shadow-[0_16px_46px_rgba(0,0,0,0.35)]">
														<div className="flex items-center justify-between gap-3">
															<span className="text-xs uppercase tracking-[0.22em] text-emerald-200">{step.badge}</span>
															<span className="hidden sm:inline-flex items-center gap-2 text-xs text-subtle">
																<span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)]" />
																{t("workflow.status.step", { step: (index + 1).toString().padStart(2, "0") })}
															</span>
														</div>
														<h3 className="text-lg font-semibold text-[var(--color-foreground)]">{step.title}</h3>
														<p className={`text-base leading-relaxed ${strongSubtleText}`}>{step.detail}</p>
														<div className="flex flex-wrap gap-2 text-xs text-subtle">
															<span className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-3 py-1">
																{t("workflow.status.syncing")}
															</span>
															<span className="rounded-full border border-[var(--accent-emerald)]/50 bg-[var(--accent-emerald)]/10 px-3 py-1 text-[var(--accent-emerald)]">
																{t("workflow.status.ready")}
															</span>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								</section>

								<section id="templates" className={`rounded-3xl border p-5 sm:p-7 space-y-5 transition-all duration-200 ease-out ${cardSecondary}`}>
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.28em] text-emerald-300">{t("nav.templates")}</p>
											<h2 className="text-2xl sm:text-3xl font-semibold">{t("gallery.inspired")}</h2>
											<p className={`text-base mt-1 ${subtleText}`}>{t("persona.galleryCaption", { tones: toneLabelList })}</p>
										</div>
										<div className="text-sm text-right text-subtle">
											<p>{t("gallery.subtitle")}</p>
											<p>{t("gallery.description")}</p>
										</div>
									</div>

									<div className="grid md:grid-cols-3 gap-3">
										{caseStudyList.map((study) => (
											<div key={study.company} className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4 flex flex-col gap-3 transition-all duration-200 ease-out hover:border-[var(--stroke-glow)]/70 hover:shadow-[0_12px_32px_rgba(0,0,0,0.28)] hover:-translate-y-1">
												<div className="flex items-center justify-between">
													<div>
														<p className="text-sm uppercase tracking-[0.3em] text-subtle">{study.industry}</p>
														<h3 className="text-xl font-semibold text-[var(--color-foreground)]">{study.company}</h3>
													</div>
													<span className="text-sm rounded-full border border-emerald-400/50 text-emerald-200 px-2 py-0.5">{study.tonality}</span>
												</div>
												<p className={`text-base leading-relaxed ${strongSubtleText}`}>{study.snippet}</p>
												<div className="flex flex-wrap gap-1 text-sm text-subtle">
													{study.tags.map((tag) => (
														<span key={`${study.company}-${tag}`} className="rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">
															#{tag}
														</span>
													))}
												</div>
												<div className="text-sm text-emerald-300">{study.metric}</div>
											</div>
										))}
									</div>

									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-dashed border-[var(--stroke-soft)] p-4">
										<p className={`text-base ${subtleText}`}>{t("gallery.footer")}</p>
										<Link
											href="/reports"
											className="self-start rounded-full border border-emerald-400 px-4 py-2 text-base text-emerald-300 hover:bg-emerald-400/10"
										>
											{t("gallery.cta")}
										</Link>
									</div>
								</section>

								<section id="pricing" className={`rounded-3xl border p-5 sm:p-7 space-y-6 transition-all duration-200 ease-out ${cardSecondary}`}>
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
										<div className="space-y-1.5">
											<p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Pricing</p>
											<h2 className="text-2xl sm:text-3xl font-semibold">{t("pricing.title")}</h2>
											<p className={`text-base ${subtleText}`}>{t("pricing.caption")}</p>
										</div>
										<div className="flex flex-col gap-1 text-sm text-subtle sm:text-right">
											<p>{t("pricing.note1")}</p>
											<p>{t("pricing.note2")}</p>
										</div>
									</div>

									<div className="grid gap-5 grid-cols-1 lg:grid-cols-3 lg:items-stretch">
										{pricingList.map((plan) => {
											const handleClick = () => {
												if (plan.tier === "free") return handlePrimaryCta();
												if (plan.tier === "monthly") return handleSubscribeMonthly();
												if (plan.tier === "annual") return handleSubscribeAnnual();
												return handlePrimaryCta();
											};

											return (
												<article
													key={plan.name}
													className={`rounded-3xl border p-6 sm:p-7 space-y-5 transition-all duration-200 ease-out flex flex-col h-full ${
														plan.highlight
															? "border-[var(--accent-emerald)]/50 bg-[var(--bg-layer)]/85 bg-gradient-to-br from-emerald-500/8 via-emerald-400/4 to-cyan-400/6 shadow-[0_20px_50px_rgba(16,185,129,0.25)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.32)] hover:-translate-y-1"
															: "border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 hover:border-[var(--stroke-glow)]/50 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
													}`}
												>
													{/* Unified badge style */}
													{(plan.highlight || plan.secondary) && (
														<div>
															<span
																className={`inline-block text-xs uppercase tracking-[0.24em] px-3 py-1 rounded-full ${
																	plan.highlight
																		? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40"
																		: "bg-blue-400/20 text-blue-200 border border-blue-400/40"
																}`}
															>
																{plan.badge}
															</span>
														</div>
													)}

													{/* Free plan badge text-only */}
													{!plan.highlight && !plan.secondary && (
														<p className="text-xs uppercase tracking-[0.24em] text-emerald-200">{plan.badge}</p>
													)}

													<div>
														<h3 className="text-xl sm:text-2xl font-semibold text-[var(--color-foreground)] mb-2">{plan.name}</h3>
														<p className={`text-3xl sm:text-4xl font-bold ${
															plan.highlight
																? "text-[var(--accent-emerald)]"
																: plan.secondary
																	? "text-[var(--accent-blue)]"
																	: "text-emerald-300"
														}`}>
															{plan.price}
														</p>
													</div>

													<p className={`text-sm leading-relaxed ${subtleText}`}>{plan.tagline}</p>

													<ul className="space-y-2 text-base leading-relaxed text-dim flex-1">
														{plan.features.map((feature) => (
															<li key={feature} className="flex items-start gap-2">
																<span className={`flex-shrink-0 mt-0.5 ${
																	plan.highlight
																		? "text-emerald-300"
																		: plan.secondary
																			? "text-[var(--accent-blue)]"
																			: "text-emerald-300"
																}`} style={{ fontSize: "0.6em" }}>●</span>
																<span>{feature}</span>
															</li>
														))}
													</ul>

													<button
														type="button"
														className={`mt-auto w-full rounded-full py-3 text-base font-semibold transition-all duration-200 ease-out ${
															plan.highlight
																? "bg-emerald-400 text-slate-900 hover:bg-emerald-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] active:translate-y-0.5"
																: plan.secondary
																	? "border border-[var(--accent-blue)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] active:translate-y-0.5"
																	: "bg-emerald-400 text-slate-900 hover:bg-emerald-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] active:translate-y-0.5"
														}`}
														onClick={handleClick}
													>
														{plan.cta}
													</button>

													{/* Annual plan note */}
													{plan.tier === "annual" && (
														<p className="text-sm text-center text-subtle">
															{t("pricing.plan.annual.note")}
														</p>
													)}
												</article>
											);
										})}
									</div>
								</section>

								<WhySection
									combinedItems={combinedItems}
									module6Items={module6Items}
									subtleTextClass={subtleText}
									combinedTitle={t("landing.moduleCombined.title")}
									combinedCaption={t("landing.moduleCombined.caption")}
									valueTitle={t("landing.module6.title")}
									valueCaption={t("landing.module6.caption")}
									labels={{
										combined: t("landing.moduleCombined.title"),
										module6: t("landing.module6.title"),
									}}
								/>

								<section id="faq" className={`rounded-3xl border p-5 sm:p-7 space-y-5 transition-all duration-200 ease-out ${cardSecondary}`}>
									<div className="space-y-2">
										<p className="text-sm uppercase tracking-[0.28em] text-emerald-300">FAQ</p>
										<h2 className="text-2xl sm:text-3xl font-semibold">{t("faq.title")}</h2>
										<p className={`text-base ${subtleText}`}>{t("faq.caption")}</p>
									</div>
									<div className="space-y-3">
										{faqList.map((item) => (
											<details key={item.question} className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out group open:border-[var(--stroke-glow)]/50">
												<summary className="cursor-pointer text-base font-semibold text-[var(--color-foreground)] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5">
													{item.question}
												</summary>
												<p className={`mt-2 text-base leading-relaxed ${strongSubtleText} motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:animate-fadeInUp`}>{item.answer}</p>
											</details>
										))}
									</div>
								</section>
							</div>
						</div>
					</div>
				</div>
			</main>
			<FooterSection disclaimer={t("footer.disclaimer")} dataSource={t("footer.dataSource")} />
		</>
	);
}
