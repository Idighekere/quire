import { BookCard } from "@/components"
import { useBookParams } from "@/contexts"


// Items per page for pagination
const ITEMS_PER_PAGE = 6


function BookResults({ bookParams, currentPage, booksData, error }) {

  const { bookSearchText } = useBookParams()


  // Filter books based on category
  const filteredBooks = booksData?.filter((book) => {

    const filteredCategories = bookParams.category === 'all' ? true : bookParams.category === book.category

    // Filter books based
    const searchedBooks = bookSearchText
      ? book.title.toLowerCase().includes(bookSearchText.toLowerCase()) : true

    return filteredCategories && searchedBooks

  })

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedBooks = filteredBooks?.slice(startIndex, endIndex)

  if (filteredBooks?.length === 0) {
    return (
      <div className="rounded-md border bg-card px-6 py-16 text-center shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">No books found</h2>
        <p className="mt-2 text-muted-foreground">Try adjusting your search or selecting a different category.</p>
      </div>
    )
  }

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

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {paginatedBooks?.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </div>
  )
}

export default BookResults