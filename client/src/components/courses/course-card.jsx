import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Book } from "@phosphor-icons/react"
import { displayCourseCode } from "@/helpers/material-input"
import ShareButton from "../share-button"


export default function CourseCard({ course }) {

  const handleViewBooks = () => {
    window.location.href = `/books?courseCode=${course.courseCode}&category=all&page=1`
  }

  const materialsPath = `/books?courseCode=${course.courseCode}&category=all&page=1`

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-md border bg-card shadow-card transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift">
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-mono text-2xl font-medium tracking-tight">
              {displayCourseCode(course)}
            </h3>
            <Badge variant="secondary">{course.level} Level</Badge>
          </div>
          <h4 className="text-lg font-semibold leading-snug tracking-tight">
            {course.title}
          </h4>

          <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.09em] capitalize">
              {course.semester} semester
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleViewBooks}>
            <Book className="h-4 w-4" />
            View Materials
          </Button>
          <ShareButton
            iconOnly
            variant="ghost"
            className="border-0 shadow-none"
            path={materialsPath}
            title={`${displayCourseCode(course)} — ${course.title}: all study materials on Quire`}
            label="Share this course"
          />
        </div>
      </div>
    </div>
  )
}