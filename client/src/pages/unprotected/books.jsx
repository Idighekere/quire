import { useState } from 'react'
import { BooksLayout, BookResults } from '@/components'
import { useBookParams } from '@/contexts'
import { getBooksByCoursesQueryOptions } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

function BooksPage () {
  const [currentPage, setCurrentPage] = useState(1)

  const {
    bookParams,
    updateBookParams,
    isLoading: paramsLoading
  } = useBookParams()

  const {
    data: booksData = [],
    isPending: booksLoading,
    error,
  } = useQuery(getBooksByCoursesQueryOptions(bookParams, paramsLoading))

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
          <BookResults
            currentPage={currentPage}
            booksData={booksData.data}
            error={error}
            bookParams={bookParams}
          />
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