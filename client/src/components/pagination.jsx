import { Button } from "@/components/ui/button"
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from "@phosphor-icons/react"

const Pagination = ({ currentPage = 1, totalPages = 5, onPageChange }) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []

    // Always show first page
    pages.push(1)

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    // Add ellipsis if needed before range
    if (rangeStart > 2) {
      pages.push("...")
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    // Add ellipsis if needed after range
    if (rangeEnd < totalPages - 1) {
      pages.push("...")
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {pageNumbers.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "secondary" : "ghost"}
            size="icon"
            className={currentPage === page ? "font-semibold" : ""}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}

export default Pagination