import { CoursesLayout, CourseResults } from '@/components'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourseParams } from '@/contexts'
import { useQuery } from '@tanstack/react-query'
import { getCoursesByFilterQueryOptions } from '@/services'

export default function CoursesPage () {
  const {
    isLoading: paramsLoading,
    courseParams,
    updateCourseParams
  } = useCourseParams()

  const {
    data: coursesData = [],
    isPending: courseLoading,
    error
  } = useQuery(getCoursesByFilterQueryOptions(courseParams, paramsLoading))

  return (
    <div className='min-h-screen w-full'>
      <CoursesLayout
        courseParams={courseParams}
        updateCourseParams={updateCourseParams}
      >
        {paramsLoading || courseLoading ? (
          <CourseResultsSkeleton />
        ) : (
          <CourseResults
            courseParams={courseParams}
            coursesData={coursesData.data}
            error={error}
          />
        )}
      </CoursesLayout>
    </div>
  )
}

function CourseResultsSkeleton () {
  return (
    <div className='w-full space-y-4'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className='rounded-lg border bg-card p-5 shadow-card'
            >
              <Skeleton className='mb-4 h-4 w-20' />
              <Skeleton className='mb-3 h-6 w-full' />
              <Skeleton className='h-4 w-2/3' />
              <div className='mt-5 flex gap-2'>
                <Skeleton className='h-9 flex-1' />
                <Skeleton className='h-9 flex-1' />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}