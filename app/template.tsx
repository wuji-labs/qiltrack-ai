"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Template component for page transition animations
 * Wraps all pages with smooth fade + slide transitions
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    // Skip animation on first render (initial page load)
    if (isFirstRender) {
      setIsFirstRender(false);
    }
  }, [isFirstRender]);

  // Check if user prefers reduced motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Disable animations if user prefers reduced motion or first render
  if (prefersReducedMotion || isFirstRender) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Cubic bezier for smooth easing
      }}
    >
      {children}
    </motion.div>
  );
}
