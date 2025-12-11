import * as React from "react";
import clsx from "clsx";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Full width
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Error state
   */
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fullWidth = false, error = false, children, ...props }, ref) => {
    const containerStyles = clsx(
      "relative inline-flex",
      fullWidth && "w-full"
    );

    const selectStyles = clsx(
      // Base styles
      "appearance-none",
      "px-3 py-2 pr-10",
      "border border-[var(--border-default)]",
      "rounded-[var(--radius-md)]",
      "bg-white",
      "text-[var(--text-primary)]",
      "font-medium text-sm",
      "transition-all duration-150 ease-out",
      "cursor-pointer",

      // Focus styles
      "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]",

      // Disabled styles
      "disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50",

      // Error styles
      error &&
        "border-[var(--semantic-error)] focus:ring-[var(--semantic-error)]",

      // Width
      fullWidth && "w-full",

      className
    );

    const arrowStyles = clsx(
      "absolute right-3 top-1/2 -translate-y-1/2",
      "w-4 h-4",
      "text-[var(--text-tertiary)]",
      "pointer-events-none",
      "transition-colors duration-150",
      props.disabled && "opacity-50"
    );

    return (
      <div className={containerStyles}>
        <select ref={ref} className={selectStyles} {...props}>
          {children}
        </select>

        {/* Custom arrow icon */}
        <svg
          className={arrowStyles}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
