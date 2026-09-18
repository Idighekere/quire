import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { HandHeart, PaperPlaneTilt as Send } from "@phosphor-icons/react"
import { api } from "@/services"
import { listRequestsQueryOptions } from "@/services/queries"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Preloader from "@/components/ui/preloader"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { bookCategories } from "@/constants"
import { validAcademicSession } from "@/helpers/material-input"
import { cn } from "@/lib/utils"

const statusLabels = {
  open: "Open",
  inProgress: "In Progress",
  fulfilled: "Fulfilled",
  expired: "Expired",
}

const statusWashes = {
  open: "bg-accent-mint text-foreground",
  inProgress: "bg-accent-sand text-foreground",
  fulfilled: "bg-accent-sky text-foreground",
  expired: "bg-muted/60 text-muted-foreground",
}

const categoryLabel = (key) => bookCategories[key] || key

function RequestCard({ request, onFulfill, onUpvote, upvotePending }) {
  const totalUpvotes = Number(request.upvoteCount) || 0
  const hasUpvoted = Boolean(request.hasUpvoted)
  const isFulfilled = request.status === "fulfilled"

  return (
    <Card className="shadow-card transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold text-primary">
                {request.courseCode}
              </span>
              <Badge className={cn("font-mono", statusWashes[request.status] || "bg-muted/60 text-muted-foreground")}>
                {statusLabels[request.status] || request.status}
              </Badge>
            </div>
            {request.academicSession && (
              <Badge variant="secondary" className="text-xs">
                {request.academicSession}
              </Badge>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryLabel(request.category)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFulfill(request)}
              disabled={isFulfilled}
            >
              {isFulfilled ? "Fulfilled" : "I Have This"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote(request._id)}
              disabled={isFulfilled || hasUpvoted || upvotePending}
              title={
                hasUpvoted
                  ? "You already want this material"
                  : "Mark that you want this material"
              }
            >
              {hasUpvoted
                ? `You want this (${totalUpvotes})`
                : `${totalUpvotes} wants`}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>
            Requested by:{" "}
            <span className="font-medium text-foreground">
              {request.requesterName || "Anonymous"}
            </span>
          </span>
          {request.requesterLevel && <span>Level: {request.requesterLevel}</span>}
        </div>
        {isFulfilled && request.fulfilledBook && (
          <div className="rounded-md bg-accent-mint p-3">
            <p className="font-medium">Fulfilled</p>
            <p className="text-muted-foreground">
              Material:{" "}
              <Link
                to={"/books?courseCode=" + request.courseCode + "&category=all&query=" + encodeURIComponent(request.fulfilledBook.title)}
                className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors hover:decoration-primary"
              >
                {request.fulfilledBook.title}
              </Link>
            </p>
          </div>
        )}
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          Requested on {new Date(request.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}

function RequestMaterialDialog({ open, onOpenChange, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      courseCode: "",
      category: "",
      academicSession: "",
      requesterName: "",
      requesterLevel: "",
    },
  })

  const categoryValue = watch("category")
  const courseCodeValue = watch("courseCode")
  const isPastQuestion = categoryValue === "pastQuestion"

  const { mutate: createRequestMutation, isPending: isSubmitting } = useMutation({
    mutationFn: (formData) => api.createRequest(formData),
    onSuccess: () => {
      reset()
      onOpenChange(false)
      if (onSuccess) onSuccess()
      toast.success("Request submitted. Others can now see and fulfill it.")
    },
    onError: (error) => {
      const message =
        (error && error.response && error.response.data && error.response.data.message) ||
        "Failed to submit request"
      toast.error(message)
    },
  })

  const onSubmit = (data) => {
    if (!validAcademicSession(data.academicSession) && isPastQuestion) {
      toast.error("Session format must be YYYY/YYYY with consecutive years")
      return
    }
    createRequestMutation({
      courseCode: data.courseCode,
      category: data.category,
      requesterName: data.requesterName || undefined,
      requesterLevel: data.requesterLevel ? Number(data.requesterLevel) : undefined,
      academicSession: isPastQuestion ? data.academicSession : undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) reset()
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a Material</DialogTitle>
          <DialogDescription>
            Tell others what you need. Anyone with the material can upload it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="courseCode">
              Course Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="courseCode"
              placeholder="e.g. GET211 or UUY-CPE313"
              {...register("courseCode", {
                required: "Course code is required",
                pattern: {
                  value: /^(?:UUY-)?[A-Z]{3}[1-5][12][0-9]$/,
                  message: "Use format ABC123 (e.g. GET211)",
                },
              })}
              value={courseCodeValue}
              onChange={(e) =>
                setValue("courseCode", e.target.value.replace(/\s+/g, "").toUpperCase(), { shouldValidate: true })
              }
            />
            {errors.courseCode && (
              <p className="text-sm text-destructive">{errors.courseCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              What do you need? <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                setValue("category", value, { shouldValidate: true })
              }
              value={categoryValue}
            >
              <SelectTrigger className="w-full">
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
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {isPastQuestion && (
            <div className="space-y-2">
              <Label htmlFor="academicSession">
                Academic Session <span className="text-destructive">*</span>
              </Label>
              <Input
                id="academicSession"
                placeholder="e.g. 2023/2024"
                {...register("academicSession", {
                  required: "Academic session is required for past questions",
                  pattern: {
                    value: /^\d{4}\/\d{4}$/,
                    message: "Format: YYYY/YYYY (e.g. 2023/2024)",
                  },
                })}
              />
              {errors.academicSession && (
                <p className="text-sm text-destructive">
                  {errors.academicSession.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requesterName">Your name (optional)</Label>
              <Input
                id="requesterName"
                placeholder="e.g. Akan"
                {...register("requesterName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterLevel">Your level (optional)</Label>
              <Select
                onValueChange={(value) => setValue("requesterLevel", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {[100, 200, 300, 400, 500].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      {level} Level
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FulfillDialog({ request, onClose, onFulfilled }) {
  const [selectedBookId, setSelectedBookId] = useState("")

  // getBooksByUser requires login — a 401 tells us the visitor is signed out.
  const { data: booksResponse, isLoading, error: booksError } = useQuery({
    queryKey: ["my-books-for-fulfill", request._id],
    queryFn: () => api.getBooksByUser({ limit: 200 }),
    retry: 1,
    staleTime: 60 * 1000,
  })

  const notLoggedIn =
    booksError && booksError.response && booksError.response.status === 401
  const allBooks = (booksResponse && booksResponse.data && booksResponse.data.books) || []
  const candidates = allBooks.filter((book) => {
    if (!book || !book.course) return false
    const bookCourse = Array.isArray(book.course) ? book.course[0] : book.course
    return (
      bookCourse &&
      bookCourse.courseCode === request.courseCode &&
      book.category === request.category &&
      (!book.status || book.status === "approved")
    )
  })

  const { mutate: fulfillMutation, isPending: fulfilling } = useMutation({
    mutationFn: () => api.fulfillRequest(request._id, selectedBookId),
    onSuccess: () => {
      toast.success("Request fulfilled")
      onFulfilled()
    },
    onError: (err) =>
      toast.error(
        (err && err.response && err.response.data && err.response.data.message) ||
          "Failed to fulfill request"
      ),
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Fulfill this request</DialogTitle>
          <DialogDescription>
            Link an approved {categoryLabel(request.category)} for{" "}
            <span className="font-mono font-semibold text-foreground">
              {request.courseCode}
            </span>
            {request.academicSession ? ` (${request.academicSession})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <Preloader message="Loading your materials" />
          ) : notLoggedIn ? (
            <div className="space-y-3 py-2 text-center">
              <p className="text-muted-foreground">
                You need to log in before you can fulfill a request.
              </p>
              <Button asChild>
                <Link to="/auth/login">Log In</Link>
              </Button>
            </div>
          ) : candidates.length === 0 ? (
            <div className="space-y-3 py-2 text-center">
              <p className="text-muted-foreground">
                You don't have an approved {categoryLabel(request.category)} for{" "}
                <span className="font-mono font-semibold text-foreground">
                  {request.courseCode}
                </span>{" "}
                yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Add or upload it from your dashboard — once it's approved you
                can come back here to fulfill this request.
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose one of your approved materials:
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {candidates.map((book) => (
                  <button
                    key={book._id}
                    type="button"
                    onClick={() => setSelectedBookId(book._id)}
                    className={cn(
                      "w-full rounded-md border p-3 text-left transition-colors duration-150 ease-nuesa",
                      selectedBookId === book._id
                        ? "border-foreground/25 bg-accent"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className="block font-medium">{book.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {categoryLabel(book.category)}
                      {book.academicSession ? ` · ${book.academicSession}` : ""}
                      {book.driveFileId ? " · Drive file" : ""}
                    </span>
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => fulfillMutation()}
                  disabled={!selectedBookId || fulfilling}
                >
                  {fulfilling ? "Fulfilling..." : "Confirm Fulfillment"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [fulfillRequest, setFulfillRequest] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  const { data, isLoading, error, refetch } = useQuery(
    listRequestsQueryOptions({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
      page,
      limit: 12,
    })
  )

  const { mutate: upvoteRequest, isPending: upvotePending } = useMutation({
    mutationFn: (requestId) => api.upvoteRequest(requestId),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: ["requests"] })
      const previous = queryClient.getQueriesData({ queryKey: ["requests"] })

      queryClient.setQueriesData({ queryKey: ["requests"] }, (oldData) => {
        if (!oldData || !oldData.data || !Array.isArray(oldData.data.requests)) {
          return oldData
        }
        return {
          ...oldData,
          data: {
            ...oldData.data,
            requests: oldData.data.requests.map((req) =>
              req._id === requestId
                ? {
                    ...req,
                    upvoteCount:
                      (Number(req.upvoteCount) || 0) + (req.hasUpvoted ? 0 : 1),
                    hasUpvoted: true,
                  }
                : req,
            ),
          },
        }
      })

      return { previous }
    },
    onError: (err, _requestId, context) => {
      if (context && Array.isArray(context.previous)) {
        context.previous.forEach(([key, snapshot]) => {
          queryClient.setQueryData(key, snapshot)
        })
      }
      toast.error(
        (err && err.response && err.response.data && err.response.data.message) ||
          "Failed to vote"
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] })
    },
  })

  const requests = (data && data.data && data.data.requests) || []
  const pagination = data && data.data && data.data.pagination

  if (isPageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Preloader message="Loading requests" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 py-14 sm:px-12 md:py-16 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-blush px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
            Community powered
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl">
            Material Requests
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Request materials you need, or fulfill requests from other students.
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by course code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <Tabs
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="h-44 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted/60" />
                  <div className="h-4 w-1/2 rounded bg-muted/60" />
                  <div className="h-4 w-2/3 rounded bg-muted/60" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-destructive">Failed to load requests</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No requests found</p>
            <p className="text-muted-foreground">
              {statusFilter !== "all"
                ? "Try changing the filter"
                : "Be the first to request a material!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onFulfill={setFulfillRequest}
                  onUpvote={upvoteRequest}
                  upvotePending={upvotePending}
                />
              ))}
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
          </>
        )}

        <div className="flex flex-col items-center gap-4 rounded-lg bg-accent-sand p-8 text-center shadow-card">
          <div className="flex size-12 items-center justify-center rounded-md bg-card text-foreground">
            <HandHeart weight="bold" className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Need a material that's not here?
            </h3>
            <p className="text-muted-foreground">
              Submit a request and anyone with it can upload it for everyone.
            </p>
          </div>
          <Button onClick={() => setIsRequestDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Request a Material
          </Button>
        </div>
      </div>

      <RequestMaterialDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["requests"] })}
      />

      {fulfillRequest && (
        <FulfillDialog
          request={fulfillRequest}
          onClose={() => setFulfillRequest(null)}
          onFulfilled={() => {
            setFulfillRequest(null)
            queryClient.invalidateQueries({ queryKey: ["requests"] })
          }}
        />
      )}
    </div>
  )
}

export default RequestsPage