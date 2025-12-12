import * as React from "react";
import clsx from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant style
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /**
   * Button size
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show loading spinner
   * @default false
   */
  loading?: boolean;
  /**
   * Icon to display before children
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after children
   */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {

    const baseStyles = clsx(
      // Base styles - Neo-Brutalism
      "relative inline-flex items-center justify-center gap-2",
      "border-2 border-black font-bold uppercase tracking-wider",
      "transition-all duration-200 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",

      // Variant styles
      {
        // Primary - Orange filled with retro shadow
        "bg-[var(--accent-primary)] text-black shadow-[var(--shadow-retro)] hover:shadow-[var(--shadow-retro-hover)] hover:translate-x-[2px] hover:translate-y-[2px]":
          variant === "primary",

        // Secondary - White with retro shadow
        "bg-white text-black shadow-[var(--shadow-retro)] hover:shadow-[var(--shadow-retro-hover)] hover:translate-x-[2px] hover:translate-y-[2px]":
          variant === "secondary",

        // Ghost - Transparent
        "bg-transparent border-transparent hover:bg-black/5":
          variant === "ghost",

        // Danger - Red with retro shadow
        "bg-[var(--semantic-error)] text-black shadow-[var(--shadow-retro)] hover:shadow-[var(--shadow-retro-hover)] hover:translate-x-[2px] hover:translate-y-[2px]":
          variant === "danger",
      },

      // Size styles (no border-radius)
      {
        "h-8 px-4 py-2 text-xs": size === "sm",
        "h-10 px-6 py-3 text-sm": size === "md",
        "h-12 px-8 py-4 text-base": size === "lg",
      },

      className
    );

    return (
      <button ref={ref} className={baseStyles} disabled={disabled || loading} {...props}>
        {loading && (
          <svg
            className="animate-spinner h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
