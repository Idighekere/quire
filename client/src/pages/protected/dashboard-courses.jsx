import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { CoursesTable, AddCourseDialog } from "@/components"
import Pagination from "@/components/pagination"
import { getCoursesByUserQueryOptions, getDepartmentsQueryOptions } from "@/services"
import { useAuth } from "@/contexts"
import { levels, semesters } from "@/constants"

const PAGE_SIZE = 20

function DashboardCoursesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const { user } = useAuth()

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("")
  const [level, setLevel] = useState("")
  const [semester, setSemester] = useState("")
  const [page, setPage] = useState(1)

  // Debounce the search input so we don't query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const params = {
    search,
    department,
    level,
    semester,
    page,
    limit: PAGE_SIZE,
  }

  // Fetch courses data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(getCoursesByUserQueryOptions(user, params))

  const courses = (data && data.data && data.data.courses) || []
  const pagination = data && data.data && data.data.pagination

  // Department options for the department filter
  const { data: departmentsData } = useQuery(getDepartmentsQueryOptions())
  const departmentOptions = (departmentsData && departmentsData.data) || []

  const hasActiveFilters = Boolean(search || department || level || semester)

  const clearFilters = () => {
    setSearchInput("")
    setSearch("")
    setDepartment("")
    setLevel("")
    setSemester("")
    setPage(1)
  }

  const handleSelectChange = (setter) => (value) => {
    setter(value === "all" ? "" : value)
    setPage(1)
  }

  const openAddDialog = () => {
    setEditingCourse(null)
    setIsAddDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
            Catalogue management
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Course
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Search by course code or title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select value={department || "all"} onValueChange={handleSelectChange(setDepartment)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept.shortName} value={dept.shortName}>
                  {dept.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level || "all"} onValueChange={handleSelectChange(setLevel)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {levels.map((lvl) => (
                <SelectItem key={lvl} value={String(lvl)}>
                  {lvl} Level
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semester || "all"} onValueChange={handleSelectChange(setSemester)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((sem) => (
                <SelectItem key={sem.id} value={sem.id}>
                  {sem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <CoursesTableSkeleton />
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-8 text-center">
          <p className="font-medium text-destructive">Failed to load courses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.response?.data?.message || error?.message || "Something went wrong. Please try again."}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : courses.length === 0 ? (
        hasActiveFilters ? (
          <div className="rounded-md border p-8 text-center">
            <p className="font-medium">No courses match these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or clearing the filters.
            </p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="rounded-md border p-8 text-center">
            <p className="font-medium">You have not added any courses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first course to start building the catalogue.
            </p>
            <Button onClick={openAddDialog} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add New Course
            </Button>
          </div>
        )
      ) : (
        <>
          <CoursesTable courses={courses} onEdit={(course) => { setEditingCourse(course); setIsAddDialogOpen(true) }} />
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <AddCourseDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => { if (!open) setEditingCourse(null); setIsAddDialogOpen(open) }}
        onSuccess={refetch}
        editingCourse={editingCourse}
      />
    </div>
  )
}

function CoursesTableSkeleton() {
  return (
    <div className="rounded-md border" aria-label="Loading courses">
      <div className="hidden md:block">
        <div className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-[2]" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="ml-auto h-8 w-8 shrink-0" />
          </div>
        ))}
      </div>
      <div className="divide-y md:hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2 p-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardCoursesPage
