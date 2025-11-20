import Link from "next/link";

type FooterSectionProps = {
	disclaimer: string;
	dataSource: string;
};

export function FooterSection({ disclaimer, dataSource }: FooterSectionProps) {
	return (
		<footer className="bg-[var(--bg-base)] border-t border-[var(--stroke-soft)] px-4 py-6 text-center text-base text-subtle space-y-2">
			<p>{disclaimer}</p>
			<p>{dataSource}</p>
			<p>
				<Link href="/legal" className="text-emerald-300 underline">
					Legal · 使用条款
				</Link>
			</p>
		</footer>
	);
}
