import { CourseCard } from "@/components"
import { useCourseParams } from "@/contexts"



export default function CourseResults({ courseParams, coursesData, error }) {

  const { courseSearchText } = useCourseParams()

  // Filter courses based on search params
  const filteredCourses = coursesData?.filter((course) => {
    // Filter by search query
    if (courseSearchText) {
      const query = courseSearchText.toLowerCase()
      return course?.courseCode.toLowerCase().includes(query) || course?.title.toLowerCase().includes(query)
    }

    return true
  })

  if (filteredCourses?.length === 0) {
    return (
      <div className="rounded-md border bg-card px-6 py-16 text-center shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">No courses found</h2>
        <p className="mt-2 text-muted-foreground">
          Try adjusting your filters or search query to find courses.
        </p>
      </div>
    )
  }

  if (!courseParams || !filteredCourses) {
    return (
      <div className="rounded-md border bg-card px-6 py-16 text-center shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">No courses to display</h2>
        <p className="mt-2 text-muted-foreground">
          Please filter the courses by department, level and semester to view courses.
        </p>
      </div>
    )
  }


  if (error != null) {
    return (
      <div className="rounded-md border bg-card px-6 py-16 text-center shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">An error occurred</h2>
        <p className="mt-2 text-muted-foreground">
          {error.response?.data?.message || "An unexpected error occurred."}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses
          ?.map((course) => (
            <CourseCard key={course.courseCode} course={course} />
          ))}
      </div>
    </div>
  )
}