"use client";

/**
 * Qiltrack AI Logo Component
 * 小写 q 字母 + 斜线阴影立体效果
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
          Qiltrack AI
        </span>
      )}
    </div>
  );
}

/**
 * Logo Icon - 小写 q + 斜线阴影立体效果
 */
export function LogoIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  const id = `logo-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 48"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 斜线填充图案 */}
          <pattern
            id={`${id}-stripes`}
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
            patternTransform="rotate(-45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="#4b6478" strokeWidth="2" />
          </pattern>
          {/* 阴影用的裁剪路径 */}
          <clipPath id={`${id}-shadow-clip`}>
            {/* 小写 q 的阴影形状（向左下偏移） */}
            <path d="M6 18C6 9.163 13.163 2 22 2C30.837 2 38 9.163 38 18C38 26.837 30.837 34 22 34H26V46H18V34C11.373 34 6 26.837 6 18ZM22 10C17.582 10 14 13.582 14 18C14 22.418 17.582 26 22 26C26.418 26 30 22.418 30 18C30 13.582 26.418 10 22 10Z" />
          </clipPath>
        </defs>

        {/* 斜线阴影层（向左下偏移） */}
        <g transform="translate(-3, 3)">
          <path
            d="M6 18C6 9.163 13.163 2 22 2C30.837 2 38 9.163 38 18C38 26.837 30.837 34 22 34H26V46H18V34C11.373 34 6 26.837 6 18ZM22 10C17.582 10 14 13.582 14 18C14 22.418 17.582 26 22 26C26.418 26 30 22.418 30 18C30 13.582 26.418 10 22 10Z"
            fill={`url(#${id}-stripes)`}
            fillRule="evenodd"
          />
        </g>

        {/* 主体 q 字母 */}
        <path
          d="M6 18C6 9.163 13.163 2 22 2C30.837 2 38 9.163 38 18C38 26.837 30.837 34 22 34H26V46H18V34C11.373 34 6 26.837 6 18ZM22 10C17.582 10 14 13.582 14 18C14 22.418 17.582 26 22 26C26.418 26 30 22.418 30 18C30 13.582 26.418 10 22 10Z"
          fill="#475569"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default Logo;
