import * as React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant style
   * @default "default"
   */
  variant?: "default" | "elevated" | "interactive";
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const cardStyles = clsx(
      // Base styles
      "rounded-[var(--radius-lg)]",
      "border",
      "transition-all duration-200 ease-out",

      // Variant styles
      {
        // Default - simple flat card
        "bg-white border-[var(--border-subtle)] shadow-[var(--shadow-xs)]":
          variant === "default",

        // Elevated - more prominent shadow
        "bg-white border-[var(--border-default)] shadow-[var(--shadow-md)]":
          variant === "elevated",

        // Interactive - hover effects
        "bg-white border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)] cursor-pointer":
          variant === "interactive",
      },

      className
    );

    return (
      <div ref={ref} className={cardStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    const headerStyles = clsx(
      "flex flex-col gap-1.5",
      "p-6",
      "border-b border-[var(--border-subtle)]",
      className
    );

    return <div ref={ref} className={headerStyles} {...props} />;
  }
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    const titleStyles = clsx(
      "text-xl font-semibold",
      "text-[var(--text-primary)]",
      "leading-tight tracking-tight",
      className
    );

    return <h3 ref={ref} className={titleStyles} {...props} />;
  }
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  const descriptionStyles = clsx(
    "text-sm",
    "text-[var(--text-secondary)]",
    "leading-relaxed",
    className
  );

  return <p ref={ref} className={descriptionStyles} {...props} />;
});

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    const contentStyles = clsx("p-6", className);

    return <div ref={ref} className={contentStyles} {...props} />;
  }
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    const footerStyles = clsx(
      "flex items-center gap-3",
      "p-6",
      "border-t border-[var(--border-subtle)]",
      className
    );

    return <div ref={ref} className={footerStyles} {...props} />;
  }
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
