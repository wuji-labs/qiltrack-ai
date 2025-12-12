import * as React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant style
   * @default "default"
   */
  variant?: "default" | "success" | "warning" | "error" | "info" | "orange" | "blue" | "purple";
  /**
   * Badge size
   * @default "md"
   */
  size?: "sm" | "md";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const badgeStyles = clsx(
      // Base styles - Neo-Brutalism
      "inline-flex items-center justify-center",
      "font-bold uppercase",
      "border-2 border-black",
      "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
      "transition-colors duration-150 ease-out",

      // Variant styles
      {
        // Default - gray
        "bg-gray-200 text-black": variant === "default",

        // Success - green
        "bg-[var(--semantic-success)] text-black": variant === "success",

        // Warning - yellow
        "bg-[var(--accent-secondary)] text-black": variant === "warning",

        // Error - red
        "bg-[var(--semantic-error)] text-black": variant === "error",

        // Info / Blue - blue
        "bg-[var(--accent-tertiary)] text-black": variant === "info" || variant === "blue",

        // Orange
        "bg-[var(--accent-primary)] text-black": variant === "orange",

        // Purple
        "bg-[var(--retro-purple)] text-black": variant === "purple",
      },

      // Size styles
      {
        "px-2 py-0.5 text-[10px]": size === "sm",
        "px-3 py-1 text-xs": size === "md",
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
