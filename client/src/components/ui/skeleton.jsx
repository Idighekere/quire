import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-sm", className)}
      {...props} />
  );
}

export { Skeleton }