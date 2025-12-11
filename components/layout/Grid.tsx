import { cn } from "@/lib/utils"

interface GridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function Grid({
  children,
  cols = { default: 1, md: 2, lg: 4 },
  gap = 6,
  className
}: GridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  } as const

  const smGridCols = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
    6: "sm:grid-cols-6",
  } as const

  const mdGridCols = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  } as const

  const lgGridCols = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  } as const

  const xlGridCols = {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
  } as const

  return (
    <div className={cn(
      "grid",
      cols.default && gridCols[cols.default as keyof typeof gridCols],
      cols.sm && smGridCols[cols.sm as keyof typeof smGridCols],
      cols.md && mdGridCols[cols.md as keyof typeof mdGridCols],
      cols.lg && lgGridCols[cols.lg as keyof typeof lgGridCols],
      cols.xl && xlGridCols[cols.xl as keyof typeof xlGridCols],
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}
