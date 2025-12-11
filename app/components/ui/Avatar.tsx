import * as React from "react";
import clsx from "clsx";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alt text for image
   */
  alt?: string;
  /**
   * Fallback text (initials)
   */
  fallback?: string;
  /**
   * Avatar size
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    { className, src, alt = "", fallback = "?", size = "md", ...props },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [src]);

    const showImage = src && !imageError;
    const showFallback = !src || imageError || !imageLoaded;

    const avatarStyles = clsx(
      // Base styles
      "relative inline-flex items-center justify-center",
      "rounded-full",
      "overflow-hidden",
      "bg-[var(--accent-primary-light)]",
      "text-[var(--accent-primary)]",
      "font-semibold",
      "select-none",
      "flex-shrink-0",

      // Size styles
      {
        "w-8 h-8 text-xs": size === "sm",
        "w-10 h-10 text-sm": size === "md",
        "w-12 h-12 text-base": size === "lg",
      },

      className
    );

    const getFallbackText = () => {
      if (!fallback) return "?";

      // If fallback is a name like "John Doe", extract initials
      const words = fallback.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      }

      // Otherwise use first character
      return fallback[0].toUpperCase();
    };

    return (
      <div ref={ref} className={avatarStyles} {...props}>
        {showImage && (
          <img
            src={src}
            alt={alt}
            className={clsx(
              "w-full h-full object-cover",
              "transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {showFallback && (
          <span className="relative z-10">{getFallbackText()}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
