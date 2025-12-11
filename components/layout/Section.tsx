import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  spacing?: "default" | "tight" | "loose" | "none"
  className?: string
  id?: string
}

export function Section({
  children,
  spacing = "default",
  className,
  id
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        spacing === "default" && "py-16 lg:py-24",
        spacing === "tight" && "py-12 lg:py-16",
        spacing === "loose" && "py-24 lg:py-32",
        spacing === "none" && "py-0",
        className
      )}
    >
      {children}
    </section>
  )
}
