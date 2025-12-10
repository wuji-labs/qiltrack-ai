import * as React from "react";
import clsx from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Icon to display before input
   */
  prefixIcon?: React.ReactNode;
  /**
   * Icon to display after input
   */
  suffixIcon?: React.ReactNode;
  /**
   * Show character count
   * @default false
   */
  showCount?: boolean;
  /**
   * Full width
   * @default false
   */
  fullWidth?: boolean;
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Show character count
   * @default false
   */
  showCount?: boolean;
  /**
   * Full width
   * @default false
   */
  fullWidth?: boolean;
}

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Required field indicator
   * @default false
   */
  required?: boolean;
}

const baseInputStyles = clsx(
  // Base styles
  "px-3 py-2",
  "border border-[var(--border-default)]",
  "rounded-[var(--radius-md)]",
  "bg-white",
  "text-[var(--text-primary)]",
  "placeholder:text-[var(--text-placeholder)]",
  "font-medium text-sm",
  "transition-all duration-150 ease-out",

  // Focus styles
  "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]",

  // Disabled styles
  "disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      prefixIcon,
      suffixIcon,
      showCount = false,
      fullWidth = false,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const [currentLength, setCurrentLength] = React.useState(0);

    React.useEffect(() => {
      if (showCount && value !== undefined) {
        setCurrentLength(String(value).length);
      }
    }, [value, showCount]);

    const hasIcons = prefixIcon || suffixIcon;

    const containerStyles = clsx(
      "relative inline-flex flex-col gap-1",
      fullWidth && "w-full"
    );

    const wrapperStyles = clsx(
      "relative inline-flex items-center",
      fullWidth && "w-full"
    );

    const inputStyles = clsx(
      baseInputStyles,
      {
        "border-[var(--semantic-error)] focus:ring-[var(--semantic-error)]":
          error,
        "pl-10": prefixIcon,
        "pr-10": suffixIcon,
        "w-full": fullWidth,
      },
      className
    );

    const iconStyles = clsx(
      "absolute top-1/2 -translate-y-1/2",
      "w-4 h-4",
      "text-[var(--text-tertiary)]",
      "pointer-events-none"
    );

    return (
      <div className={containerStyles}>
        <div className={wrapperStyles}>
          {prefixIcon && (
            <span className={clsx(iconStyles, "left-3")}>{prefixIcon}</span>
          )}
          <input
            ref={ref}
            className={inputStyles}
            maxLength={maxLength}
            value={value}
            onChange={(e) => {
              if (showCount) {
                setCurrentLength(e.target.value.length);
              }
              props.onChange?.(e);
            }}
            {...props}
          />
          {suffixIcon && (
            <span className={clsx(iconStyles, "right-3")}>{suffixIcon}</span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <span className="text-xs text-[var(--semantic-error)] font-medium">
            {error}
          </span>
        )}

        {/* Character count */}
        {showCount && maxLength && (
          <span className="text-xs text-[var(--text-tertiary)] text-right">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      showCount = false,
      fullWidth = false,
      maxLength,
      value,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [currentLength, setCurrentLength] = React.useState(0);

    React.useEffect(() => {
      if (showCount && value !== undefined) {
        setCurrentLength(String(value).length);
      }
    }, [value, showCount]);

    const containerStyles = clsx(
      "relative inline-flex flex-col gap-1",
      fullWidth && "w-full"
    );

    const textareaStyles = clsx(
      baseInputStyles,
      "resize-vertical min-h-[80px]",
      {
        "border-[var(--semantic-error)] focus:ring-[var(--semantic-error)]":
          error,
        "w-full": fullWidth,
      },
      className
    );

    return (
      <div className={containerStyles}>
        <textarea
          ref={ref}
          className={textareaStyles}
          maxLength={maxLength}
          value={value}
          rows={rows}
          onChange={(e) => {
            if (showCount) {
              setCurrentLength(e.target.value.length);
            }
            props.onChange?.(e);
          }}
          {...props}
        />

        {/* Error message */}
        {error && (
          <span className="text-xs text-[var(--semantic-error)] font-medium">
            {error}
          </span>
        )}

        {/* Character count */}
        {showCount && maxLength && (
          <span className="text-xs text-[var(--text-tertiary)] text-right">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required = false, children, ...props }, ref) => {
    const labelStyles = clsx(
      "inline-flex items-center gap-1",
      "text-sm font-semibold",
      "text-[var(--text-primary)]",
      "mb-1",
      className
    );

    return (
      <label ref={ref} className={labelStyles} {...props}>
        {children}
        {required && (
          <span className="text-[var(--semantic-error)]" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Input, Textarea, Label };
