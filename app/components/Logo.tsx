"use client";

import Image from "next/image";

/**
 * Qiltrack AI Logo Component
 * 使用 q10.png 放大镜样式 logo
 */

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizeConfig = {
  sm: { icon: 24, text: "text-[15px]", gap: "gap-2" },
  md: { icon: 28, text: "text-[17px]", gap: "gap-2.5" },
  lg: { icon: 32, text: "text-[20px]", gap: "gap-3" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <LogoIcon size={config.icon} />
      {showText && (
        <span
          className={`font-semibold tracking-[-0.02em] text-[var(--color-foreground)] ${config.text}`}
        >
          Qiltrack
        </span>
      )}
    </div>
  );
}

/**
 * Logo Icon - 放大镜图标
 */
export function LogoIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
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
        {/* 放大镜圆圈 */}
        <circle
          cx="16"
          cy="16"
          r="12"
          stroke="url(#logo-gradient)"
          strokeWidth="4"
          fill="none"
        />
        {/* 放大镜手柄 */}
        <line
          x1="25"
          y1="25"
          x2="36"
          y2="36"
          stroke="url(#logo-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* 渐变定义 */}
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default Logo;
