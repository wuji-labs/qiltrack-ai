"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Theme toggle component
 * Note: Currently the app is dark-theme only, but this provides
 * the framework for future light mode support
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage or default to dark
    const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    root.setAttribute("data-theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <button
        className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08]
                   transition-all duration-200 opacity-50"
        aria-label="Loading theme toggle"
        disabled
      >
        <Moon className="h-5 w-5 text-slate-400" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12]
                 border border-white/[0.08] hover:border-white/[0.15]
                 transition-all duration-200 group relative overflow-hidden"
      aria-label={`切换到${theme === "dark" ? "浅色" : "深色"}主题`}
      title={`切换到${theme === "dark" ? "浅色" : "深色"}主题`}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon with rotation animation */}
      <div className="relative transform transition-transform duration-300 group-hover:rotate-12">
        {theme === "dark" ? (
          <Moon className="h-5 w-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
        ) : (
          <Sun className="h-5 w-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
        )}
      </div>
    </button>
  );
}

/**
 * Mini theme toggle for compact spaces (like nav bar)
 */
export function MiniThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    root.setAttribute("data-theme", newTheme);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors"
      aria-label={`切换主题`}
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4 text-slate-400" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400" />
      )}
    </button>
  );
}

/**
 * Theme preference detector and applier
 * Respects system preferences if no saved theme exists
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      document.documentElement.classList.add(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const defaultTheme = prefersDark ? "dark" : "dark"; // Force dark for now

      document.documentElement.classList.add(defaultTheme);
      document.documentElement.setAttribute("data-theme", defaultTheme);
      localStorage.setItem("theme", defaultTheme);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply if user hasn't set a preference
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "dark"; // Force dark for now
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return <>{children}</>;
}
