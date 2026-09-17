import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Info } from "@phosphor-icons/react"

/**
 * TableLegend component to display explanations for abbreviations or codes
 *
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of legend items with shortName and fullName
 * @param {string} props.title - Optional title for the legend
 * @param {string} props.className - Additional CSS classes
 */
function TableLegend({ items = [], title = "Legend", className, ...props }) {
  if (!items.length) return null

  return (
    <div
      className={cn(
        "mt-4 rounded-md border bg-card p-5 shadow-card",
        className
      )}
      {...props}
    >
      <div className="mb-3 flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
        <Info className="h-4 w-4" />
        {title}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <Badge variant="outline">{item.shortName}</Badge>
            <span className="text-sm text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableLegend