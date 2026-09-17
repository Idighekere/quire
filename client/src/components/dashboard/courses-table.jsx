import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Book, DotsThree as MoreHorizontal, PencilSimple as Pencil, TrashSimple as Trash } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TableLegend } from "@/components"
import {departments} from "@/constants"
import { displayCourseCode } from "@/helpers/material-input"

import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useNavigate } from "react-router-dom"
import { api } from "@/services/api"

function CourseRowActions({ courseCode, onViewBooks, onEdit, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewBooks(courseCode)}>
          <Book className="mr-2 h-4 w-4" />
          View Books
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CoursesTable({ courses, onEdit }) {
  const [courseToDelete, setCourseToDelete] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteCourse(id),
    onSuccess: (data) => {
      toast.success(data?.message || "Course deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      setCourseToDelete(null)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete course")
    },
  })

  const handleDelete = () => {
    const id = courseToDelete?._id || courseToDelete?.id
    if (id) {
      deleteMutation.mutate(id)
    }
  }

  const items = Array.isArray(courses) ? courses : []
  const viewBooks = (courseCode) => navigate(`/books?courseCode=${courseCode}`)

  return (
    <>
      {/* Desktop: real table on md screens and up */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Departments Offering</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Books</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No courses found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((course) => (
                <TableRow key={course._id || course.id}>
                  <TableCell className="font-medium">{displayCourseCode(course)}</TableCell>
                  <TableCell className="max-w-[240px]">
                    <span className="block truncate">{course.title}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(course.departments || []).map((dept, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {dept.shortName}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{course.level}</TableCell>
                  <TableCell className="capitalize">{course.semester}</TableCell>
                  <TableCell>{course.booksCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <CourseRowActions
                      courseCode={course.courseCode}
                      onViewBooks={viewBooks}
                      onEdit={() => onEdit?.(course)}
                      onDelete={() => setCourseToDelete(course)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked full-width rows, no horizontal scrolling */}
      <div className="divide-y rounded-md border md:hidden">
        {items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No courses found.</p>
        ) : (
          items.map((course) => (
            <div key={course._id || course.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{displayCourseCode(course)}</p>
                  <p className="truncate text-sm text-muted-foreground">{course.title}</p>
                </div>
                <CourseRowActions
                  courseCode={course.courseCode}
                  onViewBooks={viewBooks}
                  onEdit={() => onEdit?.(course)}
                  onDelete={() => setCourseToDelete(course)}
                />
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Departments</dt>
                  <dd className="flex min-w-0 flex-wrap justify-end gap-1">
                    {(course.departments || []).map((dept, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {dept.shortName}
                      </Badge>
                    ))}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Level</dt>
                  <dd>{course.level}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Semester</dt>
                  <dd className="capitalize">{course.semester}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Books</dt>
                  <dd>{course.booksCount || 0}</dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>


<TableLegend items={departments} title='Department Codes' className="mt-10"/>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course "{courseToDelete?.courseCode}: {courseToDelete?.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CoursesTable
