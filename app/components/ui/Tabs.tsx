"use client";

import * as React from "react";
import clsx from "clsx";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current active tab value
   */
  value: string;
  /**
   * Callback when tab changes
   */
  onValueChange: (value: string) => void;
  /**
   * Default value for uncontrolled usage
   */
  defaultValue?: string;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Unique value for this tab
   */
  value: string;
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value that matches this content to a trigger
   */
  value: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { className, value, onValueChange, defaultValue, children, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      defaultValue || value
    );

    const currentValue = value !== undefined ? value : internalValue;
    const handleValueChange =
      onValueChange !== undefined ? onValueChange : setInternalValue;

    const tabsStyles = clsx("flex flex-col gap-4", className);

    return (
      <TabsContext.Provider
        value={{ value: currentValue, onValueChange: handleValueChange }}
      >
        <div ref={ref} className={tabsStyles} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const listStyles = clsx(
      "inline-flex items-center gap-1",
      "p-1",
      "rounded-[var(--radius-md)]",
      "bg-[var(--bg-subtle)]",
      "border border-[var(--border-subtle)]",
      className
    );

    return (
      <div ref={ref} className={listStyles} {...props}>
        {children}
      </div>
    );
  }
);

TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isActive = selectedValue === value;

    const triggerStyles = clsx(
      // Base styles
      "relative inline-flex items-center justify-center",
      "px-4 py-2",
      "text-sm font-medium",
      "rounded-[var(--radius-sm)]",
      "transition-all duration-150 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",

      // State styles
      {
        "bg-white text-[var(--text-primary)] shadow-[var(--shadow-xs)]":
          isActive,
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]":
          !isActive,
      },

      className
    );

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={triggerStyles}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isActive = selectedValue === value;

    if (!isActive) return null;

    const contentStyles = clsx(
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",
      "rounded-[var(--radius-md)]",
      className
    );

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={contentStyles}
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
