"use client";

/**
 * Base skeleton component with pulse animation
 */
function Skeleton({
  className = "",
  style
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-700/50 rounded ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for a single card/panel
 */
export function SkeletonCard() {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton for multiple cards in a grid
 */
export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a table row
 */
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

/**
 * Skeleton for a table
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for user profile section
 */
export function SkeletonProfile() {
  return (
    <div className="space-y-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      {/* Avatar and name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Profile fields */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Action button */}
      <Skeleton className="h-11 w-32 rounded-xl" />
    </div>
  );
}

/**
 * Skeleton for membership/subscription card
 */
export function SkeletonMembership() {
  return (
    <div className="space-y-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* Plan details */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Usage bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for text content (article, report, etc.)
 */
export function SkeletonText({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${
            i === lines - 1 ? "w-3/4" : i % 3 === 0 ? "w-5/6" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for list items
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for chart/graph placeholder
 */
export function SkeletonChart() {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <Skeleton className="h-5 w-40" />
      <div className="flex items-end justify-between gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for page header
 */
export function SkeletonPageHeader() {
  return (
    <div className="space-y-3 mb-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Skeleton for stats/metrics cards
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full page skeleton (combines multiple components)
 */
export function SkeletonPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <SkeletonPageHeader />
      <SkeletonStats />
      <SkeletonCardGrid />
    </div>
  );
}
