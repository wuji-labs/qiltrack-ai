import * as React from "react";
import clsx from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant style
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "ghost";
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
      // Base styles
      "inline-flex items-center justify-center gap-2",
      "font-medium",
      "transition-all duration-150 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",

      // Variant styles
      {
        // Primary - blue filled
        "bg-[var(--accent-primary)] text-white border border-transparent hover:bg-[var(--accent-primary-hover)] focus-visible:ring-[var(--accent-primary)]":
          variant === "primary",

        // Secondary - white with border
        "bg-white text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] focus-visible:ring-[var(--accent-primary)]":
          variant === "secondary",

        // Ghost - transparent
        "bg-transparent text-[var(--text-secondary)] border-none hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--accent-primary)]":
          variant === "ghost",
      },

      // Size styles
      {
        "h-8 px-3 text-sm rounded-[var(--radius-sm)]": size === "sm",
        "h-10 px-4 text-base rounded-[var(--radius-md)]": size === "md",
        "h-12 px-6 text-lg rounded-[var(--radius-md)]": size === "lg",
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
