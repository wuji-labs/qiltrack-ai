import * as React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant style
   * @default "default"
   */
  variant?: "default" | "success" | "warning" | "error" | "info";
  /**
   * Badge size
   * @default "md"
   */
  size?: "sm" | "md";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const badgeStyles = clsx(
      // Base styles
      "inline-flex items-center justify-center",
      "font-medium",
      "border",
      "rounded-[var(--radius-full)]",
      "transition-colors duration-150 ease-out",

      // Variant styles
      {
        // Default - gray
        "bg-[var(--bg-layer)] text-[var(--text-secondary)] border-[var(--border-default)]":
          variant === "default",

        // Success - green
        "bg-[rgba(16,185,129,0.1)] text-[var(--semantic-success)] border-[rgba(16,185,129,0.3)]":
          variant === "success",

        // Warning - amber
        "bg-[rgba(245,158,11,0.1)] text-[var(--semantic-warning)] border-[rgba(245,158,11,0.3)]":
          variant === "warning",

        // Error - red
        "bg-[rgba(239,68,68,0.1)] text-[var(--semantic-error)] border-[rgba(239,68,68,0.3)]":
          variant === "error",

        // Info - blue
        "bg-[rgba(59,130,246,0.1)] text-[var(--semantic-info)] border-[rgba(59,130,246,0.3)]":
          variant === "info",
      },

      // Size styles
      {
        "px-2 py-0.5 text-xs": size === "sm",
        "px-2.5 py-1 text-sm": size === "md",
      },

      className
    );

    return (
      <span ref={ref} className={badgeStyles} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
