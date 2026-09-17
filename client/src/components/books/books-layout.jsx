import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, MagnifyingGlass as Search } from '@phosphor-icons/react'
import { BookTabs } from '@/components'
import { useBookParams } from '@/contexts'

const BooksLayout = ({ children, bookParams, updateBookParams }) => {
  const [searchQuery, setSearchQuery] = useState()

  const { setBookSearchText } = useBookParams()

  const handleSearch = e => {
    e.preventDefault()
    setBookSearchText(searchQuery)
  }

  const handleTabChange = category => {
    updateBookParams({ category, page: 1 })
  }

  const handleGoBack = () => {
    window?.navigation?.back()
  }

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-14'>
      <div className='flex flex-col gap-6'>
        {/* Header */}
        <div className='flex flex-col gap-5'>
          {typeof window !== 'undefined' && window.navigation?.canGoBack && (
            <div>
              <Button variant='ghost' size='sm' onClick={handleGoBack}>
                <ArrowLeft className='h-4 w-4' />
                Back
              </Button>
            </div>
          )}
          <span className='font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
            Course materials
          </span>
          <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl'>
            {bookParams.courseCode
              ? `Materials for ${bookParams.courseCode}`
              : 'Library Books'}
          </h1>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className='flex w-full items-center gap-2 md:max-w-xl'
          >
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Search books by title...'
                className='pl-10'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type='submit'>Search</Button>
          </form>

          {/* Tabs */}
          <BookTabs
            activeTab={bookParams.category || 'all'}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Book Results */}
        {children}
      </div>
    </div>
  )
}

export default BooksLayout