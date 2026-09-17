"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { DownloadSimple as Download, DotsThree as MoreHorizontal, Eye, PencilSimple as Pencil, TrashSimple as Trash } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { displayCourseCode, driveDownloadUrl, drivePreviewUrl } from "@/helpers/material-input"
import { extractDriveFileId } from "@/helpers"
import { api } from "@/services/api"
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

const categoryLabel = (category) => {
  switch (category) {
    case "pastQuestion":
      return "Past Question"
    case "lectureNote":
      return "Lecture Note"
    default:
      return "Textbook"
  }
}

// Get badge color based on book type
const getTypeColor = (type) => {
  switch (type) {
    case "textBook":
      return "bg-accent-sand text-foreground"
    case "pastQuestion":
      return "bg-accent-blush text-foreground"
    case "lectureNote":
      return "bg-accent-mint text-foreground"
    default:
      return "bg-muted text-foreground"
  }
}

function BookRowActions({ preview, download, hasFile, onEdit, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!hasFile} onClick={() => { if (preview) window.open(preview, "_blank") }}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasFile} onClick={() => { if (download) window.open(download, "_blank") }}>
          <Download className="mr-2 h-4 w-4" />
          Download
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

function BooksTable({ books, onEdit }) {
  const [bookToDelete, setBookToDelete] = useState(null)
  const queryClient = useQueryClient()

  // Delete book mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteBook(id),
    onSuccess: (data) => {
      toast.success(data?.message || "Book deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["books"] })
      setBookToDelete(null)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete book")
    },
  })

  const handleDelete = () => {
    const id = bookToDelete?._id || bookToDelete?.id
    if (id) {
      deleteMutation.mutate(id)
    }
  }

  const items = Array.isArray(books) ? books : []

  return (
    <>
      {/* Desktop: real table on md screens and up */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course Code</TableHead>
              <TableHead>Category</TableHead>
              {/* <TableHead>Size</TableHead> */}
              {/* <TableHead>Added By</TableHead> */}
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No books found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((book) => {
                const fileId = book.driveFileId || extractDriveFileId(book.driveUrl || "")
                const preview = book.previewUrl || drivePreviewUrl(fileId)
                const download = book.downloadUrl || driveDownloadUrl(fileId)
                const hasFile = Boolean(fileId || preview || download)
                return (
                <TableRow key={book._id}>
                  <TableCell className="max-w-[240px]">
                    <span className="block truncate font-medium">{book.title}</span>
                  </TableCell>
                  <TableCell>{displayCourseCode(book.course)}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(book.category)}>
                      {categoryLabel(book.category)}
                    </Badge>
                  </TableCell>
                  {/* <TableCell>{book.size}</TableCell> */}
                  {/* <TableCell>{book.addedBy}</TableCell> */}
                  <TableCell>{new Date(book.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <BookRowActions
                      preview={preview}
                      download={download}
                      hasFile={hasFile}
                      onEdit={() => onEdit?.(book)}
                      onDelete={() => setBookToDelete(book)}
                    />
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked full-width rows, no horizontal scrolling */}
      <div className="divide-y rounded-md border md:hidden">
        {items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No books found.</p>
        ) : (
          items.map((book) => {
            const fileId = book.driveFileId || extractDriveFileId(book.driveUrl || "")
            const preview = book.previewUrl || drivePreviewUrl(fileId)
            const download = book.downloadUrl || driveDownloadUrl(fileId)
            const hasFile = Boolean(fileId || preview || download)
            return (
              <div key={book._id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-medium">{book.title}</p>
                  <BookRowActions
                    preview={preview}
                    download={download}
                    hasFile={hasFile}
                    onEdit={() => onEdit?.(book)}
                    onDelete={() => setBookToDelete(book)}
                  />
                </div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">Course Code</dt>
                    <dd className="truncate font-medium">{displayCourseCode(book.course)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">Category</dt>
                    <dd>
                      <Badge className={getTypeColor(book.category)}>
                        {categoryLabel(book.category)}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">Date Added</dt>
                    <dd>{new Date(book.createdAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the book "{bookToDelete?.title}". This action cannot be undone.
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

export default BooksTable
