import { BookCard } from "@/components"

// Server paginates, filters by category, and searches by title — this
// component only renders the current page plus empty/error states.
function BookResults({ books, error }) {
  if (error) {
    return (
      <div className="rounded-md border bg-card px-6 py-16 text-center shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          {error.response?.data?.message || "An unexpected error occurred."}
        </p>
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <div className="rounded-md border bg-card px-6 py-16 text-center shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">No books found</h2>
        <p className="mt-2 text-muted-foreground">Try adjusting your search or selecting a different category.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </div>
  )
}

export default BookResults
