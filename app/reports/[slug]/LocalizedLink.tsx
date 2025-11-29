"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type Props = {
	href: string;
	textKey: "reports.detail.back" | "reports.detail.home";
	className?: string;
	prefix?: string;
};

export default function LocalizedLink({ href, textKey, className, prefix }: Props) {
	const { t } = useLanguage();
	const label = `${prefix ?? ""}${t(textKey)}`;

	return (
		<Link href={href} className={className}>
			{label}
		</Link>
	);
}
