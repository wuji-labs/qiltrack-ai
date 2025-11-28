"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

interface FooterLink {
	label: string;
	href: string;
	badge?: string;
}

interface LinkGroup {
	title: string;
	items: FooterLink[];
}

interface SocialLink {
	platform: "instagram" | "youtube" | "twitter" | "linkedin";
	href: string;
	label: string;
}

interface LegalLink {
	label: string;
	href: string;
}

type FooterSectionProps = {
	disclaimer: string;
	dataSource: string;
	showBrand?: boolean;
	showLinks?: boolean;
	showMeta?: boolean;
	brandTitle?: string;
	brandCaption?: string;
};

function FooterBrand({
	title,
	caption,
	ctaLabel,
	ctaHref,
}: {
	title: string;
	caption: string;
	ctaLabel: string;
	ctaHref?: string;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h3 className="text-lg font-semibold text-[var(--color-foreground)]">
					{title}
				</h3>
				<p className="text-sm text-[var(--text-dim)] mt-2">{caption}</p>
			</div>
			<Link
				href={ctaHref || "#generator"}
				className="btn-gradient px-4 py-2 rounded-md text-sm font-medium w-fit hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]"
				aria-label={ctaLabel}
			>
				{ctaLabel}
			</Link>
		</div>
	);
}

function FooterLinks({ linkGroups }: { linkGroups: Record<string, LinkGroup> }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
			{Object.entries(linkGroups).map(([key, group]) => (
				<div key={key} className="flex flex-col gap-3 min-w-0">
					<h4 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
						{group.title}
					</h4>
					<ul className="flex flex-col gap-2">
						{group.items.map((item) => (
							<li key={item.href} className="break-words">
								<Link
									href={item.href}
									className="text-sm text-[var(--text-dim)] hover:text-[var(--accent-emerald)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]"
									aria-label={`${group.title}: ${item.label}`}
								>
									{item.label}
									{item.badge && (
										<span className="ml-2 inline-block text-xs px-2 py-1 rounded-full bg-[var(--accent-emerald)] text-[var(--bg-base)] font-medium">
											{item.badge}
										</span>
									)}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}

function FooterMeta({
	disclaimer,
	dataSource,
	legal,
	social,
}: {
	disclaimer: string;
	dataSource: string;
	legal: LegalLink[];
	social: SocialLink[];
}) {
	return (
		<div className="border-t border-[var(--stroke-soft)] pt-4 sm:pt-6 mt-6 sm:mt-8">
			{/* Disclaimer + Data Source */}
			<div className="text-xs text-[var(--text-subtle)] space-y-2 mb-4">
				{disclaimer && <p>{disclaimer}</p>}
				{dataSource && <p>{dataSource}</p>}
			</div>

			{/* Legal Links + Social Icons + Copyright */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				{/* Legal Links */}
				<nav className="flex flex-wrap gap-3 sm:gap-4 text-xs">
					{legal.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="text-[var(--text-subtle)] hover:text-[var(--accent-emerald)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-emerald)]"
							aria-label={item.label}
						>
							{item.label}
						</Link>
					))}
				</nav>

				{/* Social Icons */}
				<div className="flex gap-3 items-center">
					{social.map((platform) => (
						<a
							key={platform.platform}
							href={platform.href}
							className="w-8 h-8 rounded-full bg-[var(--bg-layer)] border border-[var(--stroke-soft)] flex items-center justify-center text-xs font-bold text-[var(--text-dim)] hover:bg-[var(--bg-frosted)] hover:text-[var(--accent-emerald)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]"
							aria-label={platform.label}
							target="_blank"
							rel="noopener noreferrer"
						>
							{platform.platform.charAt(0).toUpperCase()}
						</a>
					))}
				</div>

				{/* Copyright */}
				<p className="text-xs text-[var(--text-subtle)] sm:ml-auto">
					© {new Date().getFullYear()} Investor AI. All rights reserved.
				</p>
			</div>
		</div>
	);
}

export function FooterSection({
	disclaimer,
	dataSource,
	showBrand = true,
	showLinks = true,
	showMeta = true,
}: FooterSectionProps) {
	const { t } = useLanguage();

	// Parse link items from JSON
	const parseItems = (jsonStr: string): FooterLink[] => {
		try {
			return JSON.parse(jsonStr);
		} catch {
			return [];
		}
	};

	const linkGroups: Record<string, LinkGroup> = {
		product: {
			title: t("footer.links.product.title"),
			items: parseItems(t("footer.links.product.items")),
		},
		solutions: {
			title: t("footer.links.solutions.title"),
			items: parseItems(t("footer.links.solutions.items")),
		},
		company: {
			title: t("footer.links.company.title"),
			items: parseItems(t("footer.links.company.items")),
		},
		resources: {
			title: t("footer.links.resources.title"),
			items: parseItems(t("footer.links.resources.items")),
		},
		compare: {
			title: t("footer.links.compare.title"),
			items: parseItems(t("footer.links.compare.items")),
		},
	};

	const legalLinks: LegalLink[] = [
		{ label: t("footer.meta.legal.terms"), href: "/legal/terms" },
		{ label: t("footer.meta.legal.privacy"), href: "/legal/privacy" },
		{ label: t("footer.meta.legal.acceptable-use"), href: "/legal/acceptable-use" },
		{ label: t("footer.meta.legal.legal"), href: "/legal" },
	];

	const socialLinks: SocialLink[] = [
		{
			platform: "instagram",
			href: "https://instagram.com/investorai",
			label: t("footer.social.instagram"),
		},
		{
			platform: "youtube",
			href: "https://youtube.com/@investorai",
			label: t("footer.social.youtube"),
		},
		{
			platform: "twitter",
			href: "https://twitter.com/investorai",
			label: t("footer.social.twitter"),
		},
		{
			platform: "linkedin",
			href: "https://linkedin.com/company/investor-ai",
			label: t("footer.social.linkedin"),
		},
	];

	return (
		<footer className="bg-[var(--bg-base)] border-t border-[var(--stroke-soft)] py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
			{/* Gradient top accent line */}
			<div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-emerald)] to-transparent opacity-50"></div>

			{/* Main content grid */}
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8">
					{showBrand && (
						<div className="lg:col-span-1">
							<FooterBrand
								title={t("footer.brand.title")}
								caption={t("footer.brand.caption")}
								ctaLabel={t("footer.brand.cta.label")}
								ctaHref="#generator"
							/>
						</div>
					)}

					{showLinks && (
						<div className={showBrand ? "sm:col-span-2 lg:col-span-3" : "lg:col-span-4"}>
							<FooterLinks linkGroups={linkGroups} />
						</div>
					)}
				</div>

				{/* Meta section */}
				{showMeta && (
					<FooterMeta
						disclaimer={disclaimer}
						dataSource={dataSource}
						legal={legalLinks}
						social={socialLinks}
					/>
				)}
			</div>
		</footer>
	);
}
