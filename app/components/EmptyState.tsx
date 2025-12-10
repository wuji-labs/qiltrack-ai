"use client";

import { LucideIcon, FileQuestion, Inbox, Search, AlertCircle, Clock } from "lucide-react";
import { ReactNode } from "react";

export interface EmptyStateProps {
  /** Icon to display (defaults to FileQuestion) */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button or element */
  action?: ReactNode;
  /** Optional secondary action */
  secondaryAction?: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Empty state component for displaying when no data is available
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileQuestion}
 *   title="暂无报告"
 *   description="您还没有生成任何报告"
 *   action={
 *     <button className="btn-primary">
 *       生成报告
 *     </button>
 *   }
 * />
 * ```
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8 px-4",
      icon: "w-12 h-12",
      iconWrapper: "w-20 h-20 mb-3",
      title: "text-base",
      description: "text-xs",
      spacing: "space-y-3",
    },
    md: {
      container: "py-16 px-4",
      icon: "w-16 h-16",
      iconWrapper: "w-24 h-24 mb-4",
      title: "text-lg",
      description: "text-sm",
      spacing: "space-y-4",
    },
    lg: {
      container: "py-24 px-6",
      icon: "w-20 h-20",
      iconWrapper: "w-32 h-32 mb-6",
      title: "text-xl",
      description: "text-base",
      spacing: "space-y-6",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${classes.container}`}
    >
      {/* Icon */}
      <div
        className={`${classes.iconWrapper} rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center backdrop-blur-sm`}
      >
        <Icon className={`${classes.icon} text-slate-400`} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className={`max-w-md ${classes.spacing}`}>
        <h3 className={`${classes.title} font-semibold text-slate-200`}>{title}</h3>
        {description && (
          <p className={`${classes.description} text-slate-400 leading-relaxed`}>
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Preset empty states for common scenarios
 */
export const EmptyStates = {
  /**
   * No reports generated yet
   */
  NoReports: (props: Omit<EmptyStateProps, "icon" | "title">) => (
    <EmptyState
      icon={FileQuestion}
      title="暂无报告"
      description="您还没有生成任何投资研究报告"
      {...props}
    />
  ),

  /**
   * No search results found
   */
  NoSearchResults: (props: Omit<EmptyStateProps, "icon" | "title">) => (
    <EmptyState
      icon={Search}
      title="未找到结果"
      description="尝试使用不同的关键词或筛选条件"
      {...props}
    />
  ),

  /**
   * No data available
   */
  NoData: (props: Omit<EmptyStateProps, "icon" | "title">) => (
    <EmptyState
      icon={Inbox}
      title="暂无数据"
      description="这里还没有任何内容"
      {...props}
    />
  ),

  /**
   * Error state
   */
  Error: (props: Omit<EmptyStateProps, "icon" | "title">) => (
    <EmptyState
      icon={AlertCircle}
      title="加载失败"
      description="无法加载数据，请稍后重试"
      {...props}
    />
  ),

  /**
   * No subscription/billing history
   */
  NoHistory: (props: Omit<EmptyStateProps, "icon" | "title">) => (
    <EmptyState
      icon={Clock}
      title="暂无历史记录"
      description="您的历史记录将在这里显示"
      {...props}
    />
  ),

  /**
   * Empty inbox
   */
  EmptyInbox: (props: Omit<EmptyStateProps, "icon" | "title">) => (
    <EmptyState
      icon={Inbox}
      title="收件箱为空"
      description="太好了！您已查看所有内容"
      {...props}
    />
  ),
};

/**
 * Empty state with illustration (future enhancement)
 * Can be used to add custom SVG illustrations
 */
export function EmptyStateWithIllustration({
  illustration,
  title,
  description,
  action,
}: {
  illustration: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      <div className="w-64 h-64 mb-6 flex items-center justify-center">
        {illustration}
      </div>

      {/* Content */}
      <div className="max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
