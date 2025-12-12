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
      // Base styles - Neo-Brutalism (same as Input)
      "appearance-none",
      "px-4 py-3 pr-10",
      "border-2 border-black",
      "bg-white",
      "text-[var(--text-primary)]",
      "font-bold text-sm",
      "transition-all",
      "cursor-pointer",

      // Focus styles - Orange glow (same as Input)
      "focus:outline-none focus:ring-4 focus:ring-[var(--accent-primary)]/20 focus:border-black",

      // Disabled styles
      "disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50",

      // Error styles
      error &&
        "border-[var(--semantic-error)] focus:ring-[var(--semantic-error)]/20",

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
