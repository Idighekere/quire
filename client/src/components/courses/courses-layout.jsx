import React from 'react'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Funnel as Filter } from '@phosphor-icons/react'
import { CourseFilters, SearchBar } from '@/components/'
import { getDepartmentsFullName } from '@/helpers'
import { ScrollArea } from '../ui/scroll-area'

export default function CoursesLayout ({
  children,
  courseParams,
  updateCourseParams
}) {
  const [open, setOpen] = useState(false)

  const [filters, setFilters] = useState({
    department: courseParams?.department || '',
    level: courseParams?.level || '',
    semester: courseParams?.semester || ''
  })

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  // Apply filters and update URL
  const applyFilters = () => {
    if (filters) {
      updateCourseParams({
        department: filters.department,
        level: filters.level,
        semester: filters.semester
      })
    }
    setOpen(false)
  }

  const handleSearch = () => {
    // search handled via SearchBar context
  }

  const handleGoBack = () => {
    window.navigation.back()
  }

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-14'>
      <div className='flex w-full flex-col gap-8 md:flex-row'>
        {/* Desktop Sidebar Filters */}
        <div className='hidden w-64 shrink-0 md:block'>
          <div className='sticky top-20 rounded-md border bg-card p-5 shadow-card'>
            <h2 className='mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
              Filter Courses
            </h2>

            <CourseFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <Button className='mt-5 w-full' onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex w-full flex-col'>
          <div className='mb-8 flex w-full flex-col gap-5'>
            {typeof window !== 'undefined' && window.navigation?.canGoBack && (
              <div>
                <Button variant='ghost' size='sm' onClick={handleGoBack}>
                  <ArrowLeft className='h-4 w-4' />
                  Back
                </Button>
              </div>
            )}
            <div className='flex items-center justify-between gap-4'>
              <div>
                <span className='font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
                  Course catalogue
                </span>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl'>
                  Available Courses
                </h1>
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant='outline' className='md:hidden'>
                    <Filter className='h-4 w-4' />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side='bottom' className='h-[72vh]'>
                  <div className='p-5'>
                    <h2 className='mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
                      Filter Courses
                    </h2>
                    <ScrollArea className='h-full'>
                      <CourseFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                      />
                      <Button className='mt-4 w-full' onClick={applyFilters}>
                        Apply Filters
                      </Button>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Search Bar */}
            <SearchBar
              defaultValue={''}
              onSearch={handleSearch}
            />

            {/* Filter Summary */}
            {(courseParams.department ||
              courseParams.level ||
              courseParams.semester) && (
              <p className='text-sm text-muted-foreground'>
                Showing results for{' '}
                {courseParams.department && (
                  <span className='font-medium text-foreground'>
                    {getDepartmentsFullName(courseParams.department)}
                  </span>
                )}
                {courseParams.department && courseParams.level && ', '}
                {courseParams.level && (
                  <span className='font-medium text-foreground'>
                    {courseParams.level} Level
                  </span>
                )}
                {(courseParams.department || courseParams.level) &&
                  courseParams.semester &&
                  ', '}
                {courseParams.semester && (
                  <span className='font-medium text-foreground'>
                    {courseParams.semester} Semester
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Course Results */}
          {children}
        </div>
      </div>
    </div>
  )
}