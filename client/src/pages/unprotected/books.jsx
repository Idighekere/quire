import { useEffect, useState } from 'react'
import { BooksLayout, BookResults } from '@/components'
import Pagination from '@/components/pagination'
import { useBookParams } from '@/contexts'
import { getBooksByCoursesQueryOptions } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

const ITEMS_PER_PAGE = 12

function BooksPage () {
  const [currentPage, setCurrentPage] = useState(1)

  const {
    bookParams,
    updateBookParams,
    bookSearchText,
    isLoading: paramsLoading
  } = useBookParams()

  // Server-side pagination: page resets whenever the course, category, or
  // search text changes.
  useEffect(() => {
    setCurrentPage(1)
  }, [bookParams.courseCode, bookParams.category, bookSearchText])

  const {
    data: booksData,
    isPending: booksLoading,
    error,
  } = useQuery(getBooksByCoursesQueryOptions(bookParams, paramsLoading, {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: bookSearchText || "",
  }))

  const books = (booksData && booksData.data && booksData.data.books) || []
  const pagination = booksData && booksData.data && booksData.data.pagination

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className='min-h-screen'>
      <BooksLayout
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        bookParams={bookParams}
        updateBookParams={updateBookParams}
      >
        {(paramsLoading || booksLoading) ? (
          <BookResultsSkeleton />
        ) : (
          <>
            <BookResults
              books={books}
              error={error}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className='mt-6'>
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </BooksLayout>
    </div>
  )
}

function BookResultsSkeleton () {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className='h-64 w-full rounded-lg border bg-card p-4 shadow-card'
            >
              <div className='flex gap-4'>
                <Skeleton className='h-40 w-28 rounded-md' />
                <div className='flex-1 space-y-3'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-5 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                </div>
              </div>
              <div className='mt-4 flex gap-2'>
                <Skeleton className='h-9 flex-1' />
                <Skeleton className='h-9 flex-1' />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default BooksPage
