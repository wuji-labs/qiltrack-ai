"use client";

/**
 * Qiltrack AI Logo Component
 * 高级感设计 - 几何抽象 Q + 数据脉冲
 */

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizeConfig = {
  sm: { icon: 28, text: "text-sm", gap: "gap-2" },
  md: { icon: 36, text: "text-base", gap: "gap-2.5" },
  lg: { icon: 44, text: "text-lg", gap: "gap-3" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <LogoIcon size={config.icon} />
      {showText && (
        <span className={`font-semibold tracking-tight text-[var(--color-foreground)] ${config.text}`}>
          Qiltrack<span className="text-[var(--accent-emerald)] ml-1">AI</span>
        </span>
      )}
    </div>
  );
}

/**
 * Logo Icon - 高级几何 Q
 * 六边形底座 + 抽象Q字母 + 数据脉冲点
 */
export function LogoIcon({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 六边形底座 - 科技感 */}
        <path
          d="M20 2L36.5 11.5V28.5L20 38L3.5 28.5V11.5L20 2Z"
          stroke="url(#logo-hex-gradient)"
          strokeWidth="1.5"
          fill="url(#logo-fill-gradient)"
          fillOpacity="0.08"
        />

        {/* 内圆环 - Q的主体，带缺口 */}
        <circle
          cx="20"
          cy="18"
          r="9"
          stroke="url(#logo-main-gradient)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="50 6"
        />

        {/* Q的尾巴 - 斜向延伸，带箭头感 */}
        <path
          d="M26 24L32 30"
          stroke="url(#logo-main-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 数据脉冲点 - 3个点表示AI分析 */}
        <circle cx="13" cy="18" r="1.8" fill="#34d399" />
        <circle cx="20" cy="14" r="1.8" fill="#22d3ee" />
        <circle cx="27" cy="18" r="1.8" fill="#34d399" />

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="logo-hex-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="logo-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="logo-main-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default Logo;
