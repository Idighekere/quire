import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BooksTable, AddBookDialog } from "@/components/"
import Pagination from "@/components/pagination"
import { getBooksByUserQueryOptions, getCoursesByUserQueryOptions, getDepartmentsQueryOptions, BOOK_SORT_OPTIONS } from "@/services"
import { useAuth } from "@/contexts"
import { bookCategories, levels, semesters } from "@/constants"

const PAGE_SIZE = 20

function DashboardBooksPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [department, setDepartment] = useState("")
  const [level, setLevel] = useState("")
  const [semester, setSemester] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)

  // Debounce the search input so we don't query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { user } = useAuth()

  const params = {
    search,
    courseCode,
    department,
    level,
    semester,
    category,
    sort,
    page,
    limit: PAGE_SIZE,
  }

  // Fetch books data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(getBooksByUserQueryOptions(user, params))

  const books = (data && data.data && data.data.books) || []
  const pagination = data && data.data && data.data.pagination

  // Course options for the course filter (own courses)
  const { data: coursesData } = useQuery(getCoursesByUserQueryOptions(user, { limit: 100 }))
  const courseOptions = (coursesData && coursesData.data && coursesData.data.courses) || []

  // Department options for the department filter
  const { data: departmentsData } = useQuery(getDepartmentsQueryOptions())
  const departmentOptions = (departmentsData && departmentsData.data) || []

  const hasActiveFilters = Boolean(search || courseCode || department || level || semester || category)

  const clearFilters = () => {
    setSearchInput("")
    setSearch("")
    setCourseCode("")
    setDepartment("")
    setLevel("")
    setSemester("")
    setCategory("")
    setPage(1)
  }

  const handleSelectChange = (setter) => (value) => {
    setter(value === "all" ? "" : value)
    setPage(1)
  }

  const openAddDialog = () => {
    setEditingBook(null)
    setIsAddDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
            Your contributions
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Books</h2>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Book
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search by title, course title or code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {BOOK_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={courseCode || "all"} onValueChange={handleSelectChange(setCourseCode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseOptions.map((course) => (
                <SelectItem key={course._id || course.id} value={course.courseCode}>
                  {course.courseCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={category || "all"} onValueChange={handleSelectChange(setCategory)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(bookCategories).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
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
        <BooksTableSkeleton />
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-8 text-center">
          <p className="font-medium text-destructive">Failed to load books</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.response?.data?.message || error?.message || "Something went wrong. Please try again."}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : books.length === 0 ? (
        hasActiveFilters ? (
          <div className="rounded-md border p-8 text-center">
            <p className="font-medium">No materials match these filters</p>
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
            <p className="font-medium">You have not added any materials yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first material to start building the library.
            </p>
            <Button onClick={openAddDialog} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add New Book
            </Button>
          </div>
        )
      ) : (
        <>
          <BooksTable books={books} onEdit={(book) => { setEditingBook(book); setIsAddDialogOpen(true) }} />
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <AddBookDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => { if (!open) setEditingBook(null); setIsAddDialogOpen(open) }}
        onSuccess={refetch}
        editingBook={editingBook}
      />
    </div>
  )
}

function BooksTableSkeleton() {
  return (
    <div className="rounded-md border" aria-label="Loading books">
      <div className="hidden md:block">
        <div className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="ml-auto h-8 w-8 shrink-0" />
          </div>
        ))}
      </div>
      <div className="divide-y md:hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardBooksPage
