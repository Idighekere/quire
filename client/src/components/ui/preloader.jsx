import { cn } from "@/lib/utils"
import { Books } from "@phosphor-icons/react"

const sizeClasses = {
  sm: { chip: "size-8", icon: "h-4 w-4", padding: "px-4 py-3" },
  md: { chip: "size-9", icon: "h-5 w-5", padding: "px-5 py-4" },
  lg: { chip: "size-11", icon: "h-6 w-6", padding: "px-6 py-5" },
}

function LoadingDots() {
  return (
    <span aria-hidden className="ml-1 inline-flex">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        >
          .
        </span>
      ))}
    </span>
  )
}

/**
 * Preloader component that can be used during page loading and authentication checks.
 * A paper chip with the library mark and a mono label — no spinner.
 *
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the preloader (sm, md, lg)
 * @param {string} props.message - Optional message to display next to the preloader
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullScreen - Whether the preloader should take up the full screen
 */
function Preloader({ size = "md", message = "Loading", className, fullScreen = false, ...props }) {
  const s = sizeClasses[size] || sizeClasses.md

  // Container classes based on fullScreen prop
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-4"

  return (
    <div className={cn(containerClasses, className)} {...props}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-card shadow-card",
          s.padding
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-sm bg-accent-mint text-foreground",
            s.chip
          )}
        >
          <Books weight="bold" className={cn(s.icon, "text-primary")} />
        </div>
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          {message || "Loading"}
          <LoadingDots />
        </p>
      </div>
    </div>
  )
}

export default Preloader