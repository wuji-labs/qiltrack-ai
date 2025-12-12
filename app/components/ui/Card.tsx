import * as React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant style
   * @default "default"
   */
  variant?: "default" | "elevated" | "interactive" | "orange" | "yellow" | "blue";
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
      // Base styles - Neo-Brutalism
      "border-2 border-black",
      "transition-all duration-200",

      // Variant styles
      {
        // Default - White card with retro shadow
        "bg-white shadow-[var(--shadow-retro)]": variant === "default",

        // Elevated - Larger shadow
        "bg-white shadow-[var(--shadow-retro-lg)]": variant === "elevated",

        // Interactive - Hover effects (shadow shrink + translate)
        "bg-white shadow-[var(--shadow-retro)] hover:shadow-[var(--shadow-retro-hover)] hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer":
          variant === "interactive",

        // Colored backgrounds - Neo-Brutalism style
        "bg-[var(--accent-primary)] shadow-[var(--shadow-retro)]": variant === "orange",
        "bg-[var(--accent-secondary)] shadow-[var(--shadow-retro)]": variant === "yellow",
        "bg-[var(--accent-tertiary)] shadow-[var(--shadow-retro)]": variant === "blue",
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
      "border-b-2 border-black",
      className
    );

    return <div ref={ref} className={headerStyles} {...props} />;
  }
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    const titleStyles = clsx(
      "text-xl font-bold",
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
      "border-t-2 border-black",
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
