type Tone = "positive" | "negative" | "warning" | "neutral";

type Trend = "up" | "down" | "flat";

type KpiCardProps = {
	label: string;
	value: string;
	icon?: string;
	helper?: string;
	tone?: Tone;
	trend?: Trend;
};

const toneClasses: Record<Tone, string> = {
	positive: "border-emerald-300/50 bg-emerald-500/5 text-emerald-50",
	negative: "border-rose-300/50 bg-rose-500/5 text-rose-50",
	warning: "border-amber-300/60 bg-amber-500/5 text-amber-50",
	neutral: "border-[var(--stroke-soft)] bg-[var(--bg-layer)] text-[var(--color-foreground)]",
};

const toneAccent: Record<Tone, string> = {
	positive: "text-emerald-300",
	negative: "text-rose-300",
	warning: "text-amber-300",
	neutral: "text-subtle",
};

const trendIcon: Record<Trend, string> = {
	up: "↑",
	down: "↓",
	flat: "→",
};

export default function KpiCard({ label, value, icon, helper, tone = "neutral", trend }: KpiCardProps) {
	const borderClasses = toneClasses[tone] ?? toneClasses.neutral;
	const accentClasses = toneAccent[tone] ?? toneAccent.neutral;
	return (
		<div
			className={`rounded-xl border px-3.5 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)] ${borderClasses}`}
			aria-label={label}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="space-y-1">
					<p className="text-xs uppercase tracking-[0.18em] text-subtle">{label}</p>
					<div className="flex items-baseline gap-2">
						<span className="text-xl font-semibold">{value}</span>
						{trend && <span className={`text-xs font-semibold ${accentClasses}`}>{trendIcon[trend]}</span>}
					</div>
				</div>
				{icon && (
					<span className="text-lg" aria-hidden>
						{icon}
					</span>
				)}
			</div>
			{helper && <p className={`mt-2 text-xs ${accentClasses}`}>{helper}</p>}
		</div>
	);
}
