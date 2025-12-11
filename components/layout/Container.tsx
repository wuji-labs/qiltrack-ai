import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  size?: "default" | "narrow" | "wide"
  className?: string
}

export function Container({
  children,
  size = "default",
  className
}: ContainerProps) {
  return (
    <div className={cn(
      "mx-auto w-full px-4 sm:px-6 lg:px-8",
      size === "default" && "max-w-7xl",
      size === "narrow" && "max-w-4xl",
      size === "wide" && "max-w-[1440px]",
      className
    )}>
      {children}
    </div>
  )
}
