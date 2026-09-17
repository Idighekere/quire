import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services"
import { ENVIRONMENT } from "@/config"
import { getPendingBooksQueryOptions } from "@/services/queries"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { bookCategories } from "@/constants"
import { displayCourseCode } from "@/helpers/material-input"
import Preloader from "@/components/ui/preloader"

function PendingBooksQueue() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery(getPendingBooksQueryOptions({ page, limit: 20 }))

  const { mutate: moderate, isPending: isModerating } = useMutation({
    mutationFn: ({ bookId, status }) => api.moderateBook(bookId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingBooks"] })
      queryClient.invalidateQueries({ queryKey: ["allBooks"] })
      toast.success("Material reviewed")
    },
    onError: (err) =>
      toast.error(
        (err && err.response && err.response.data && err.response.data.message) ||
          "Failed to review material"
      ),
  })

  const queue = (data && data.data && data.data.books) || []
  const pagination = data && data.data && data.data.pagination

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Preloader message="Loading queue" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        Failed to load pending materials:{" "}
        {error?.response?.data?.message || "Unknown error"}
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center shadow-card">
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          Queue is clear
        </p>
        <p className="mt-2 text-muted-foreground">
          Nothing is waiting for review. New uploads will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {queue.map((book) => {
          const courseCode = displayCourseCode(book.course) || "—"
          return (
            <Card key={book._id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">
                      {courseCode}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {bookCategories[book.category] || book.category}
                    </Badge>
                    {book.academicSession && (
                      <Badge variant="outline" className="text-xs">
                        {book.academicSession}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium truncate mt-1">{book.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploaded on{" "}
                    {new Date(book.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isModerating}
                    onClick={() =>
                      moderate({ bookId: book._id, status: "rejected" })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={isModerating}
                    onClick={() =>
                      moderate({ bookId: book._id, status: "approved" })
                    }
                  >
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function DriveSyncPanel() {
  const [category, setCategory] = useState("textBook")
  const [result, setResult] = useState(null)
  const queryClient = useQueryClient()

  const { data: driveStatus } = useQuery({
    queryKey: ["googleDriveStatus"],
    queryFn: () => api.getGoogleDriveStatus(),
    refetchOnMount: true,
    retry: false,
  })
  const isDriveConnected = driveStatus?.data?.connected === true

  const { mutate: disconnectDrive, isPending: isDisconnecting } = useMutation({
    mutationFn: () => api.disconnectGoogleDrive(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["googleDriveStatus"] })
      toast.success(data?.message || "Google Drive disconnected")
    },
    onError: (err) =>
      toast.error(
        (err && err.response && err.response.data && err.response.data.message) ||
          "Failed to disconnect Google Drive"
      ),
  })

  const handleDisconnect = () => {
    if (!window.confirm("Disconnect Google Drive? Uploads will stop working until an admin reconnects.")) {
      return
    }
    disconnectDrive()
  }

  const { mutate: runSync, isPending } = useMutation({
    mutationFn: () => api.syncDrive(category),
    onSuccess: (data) => {
      setResult(data && data.data)
      const summary = data && data.data && data.data.summary
      toast.success(
        `Sync complete: ${summary ? summary.added : 0} added, ${summary ? summary.skipped : 0} skipped${summary && summary.coursesCreated ? `, ${summary.coursesCreated} courses created` : ""}`
      )
    },
    onError: (err) => {
      setResult(null)
      toast.error(
        (err && err.response && err.response.data && err.response.data.message) ||
          "Drive sync failed"
      )
    },
  })

  const skipped = (result && result.skipped) || []
  const added = (result && result.added) || []
  const summary = (result && result.summary) || { added: 0, skipped: 0, coursesCreated: 0 }
  const visited = (result && result.visited) ?? summary.visited ?? 0
  const folders = (result && result.folders) || summary.folders || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Drive Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Each file must live directly inside a folder named like{" "}
          <span className="font-mono">GET211 - Strength of Materials</span>{" "}
          (a <span className="font-mono">UUY-</span> prefix is also accepted) —
          the course is created automatically if it doesn't exist yet.
        </p>

        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          {isDriveConnected ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                Drive connected
              </span>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `${ENVIRONMENT.APP.BASE_URL}/auth/google?drive=1&redirect=${encodeURIComponent(window.location.origin)}`
                }}
              >
                Connect Google Drive
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Only an admin needs this, once — it lets uploads run as the
            library account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="space-y-1.5 w-full sm:w-64">
            <Label htmlFor="sync-category">Default category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="sync-category" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bookCategories).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => runSync()} disabled={isPending}>
            {isPending ? "Syncing…" : "Run Sync"}
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-2xl font-bold">{summary.added}</p>
                <p className="text-muted-foreground">Added</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.skipped}</p>
                <p className="text-muted-foreground">Skipped</p>
              </div>
              {summary.coursesCreated > 0 && (
                <div>
                  <p className="text-2xl font-bold">{summary.coursesCreated}</p>
                  <p className="text-muted-foreground">Courses created</p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Visited {visited} Drive items
            </p>

            {folders.length > 0 && (
              <details className="space-y-1">
                <summary className="text-sm font-medium cursor-pointer">
                  Folders walked ({folders.length})
                </summary>
                <ul className="text-sm text-muted-foreground list-disc pl-5 max-h-40 overflow-y-auto">
                  {folders.map((folder, index) => (
                    <li key={index}>{folder}</li>
                  ))}
                </ul>
              </details>
            )}

            {added.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Added files</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 max-h-40 overflow-y-auto">
                  {added.map((item) => (
                    <li key={item.fileId}>
                      <span className="font-mono">{item.courseCode}</span> —{" "}
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {skipped.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Skipped</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 max-h-40 overflow-y-auto">
                  {skipped.map((item, index) => (
                    <li key={index}>
                      {item.name} — {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardModerationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          Admin tools
        </span>
        <h2 className="text-2xl font-bold tracking-tight">Moderation</h2>
        <p className="text-muted-foreground">
          Review community uploads and keep the library in sync with Google
          Drive.
        </p>
      </div>

      <PendingBooksQueue />
      <DriveSyncPanel />
    </div>
  )
}

export default DashboardModerationPage