import { useForm, Controller } from "react-hook-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services"
import { bookCategories } from "@/constants"
import { getDepartmentsQueryOptions, lookupCourseQueryOptions } from "@/services/queries"
import toast from "react-hot-toast"

function AddBookDialog({ open, onOpenChange, onSuccess, editingBook }) {
  const isEditMode = Boolean(editingBook)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: "",
      courseCode: "",
      category: "",
      driveUrl: "",
      academicSession: "",
      departmentShortNames: [],
    },
  })

  useEffect(() => {
    if (editingBook && open) {
      const courseEntry = Array.isArray(editingBook.course) ? editingBook.course[0] : editingBook.course
      setValue("title", editingBook.title || "")
      setValue("courseCode", courseEntry?.courseCode || editingBook.courseCode || "")
      setValue("category", editingBook.category || "")
      setValue("driveUrl", editingBook.driveUrl || "")
      setValue("academicSession", editingBook.academicSession || "")
    } else if (!editingBook && open) {
      reset()
    }
  }, [editingBook, open, setValue, reset])

  const courseCodeValue = watch("courseCode")
  const categoryValue = watch("category")
  // The field keeps the raw text (prefix intact); the stripped value is
  // derived locally for lookups, length gates, and level/semester display.
  const normalizedCourseCode = (courseCodeValue || "").replace(/\s+/g, "").toUpperCase().replace(/^UUY-/, "")

  const [activeTab, setActiveTab] = useState("link")
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadPercent, setUploadPercent] = useState(0)

  // Lookup course when code changes (debounced via React Query)
  const { data: courseLookup, isLoading: courseLookupLoading, error: courseLookupError } = useQuery(
    lookupCourseQueryOptions(normalizedCourseCode, normalizedCourseCode.length === 6)
  )

  const courseLookupData = courseLookup?.data
  const courseExists = courseLookupData?.exists === true
  const derivedLevel = courseLookupData?.level
  const derivedSemester = courseLookupData?.semester
  const courseDepartments = courseLookupData?.course?.departments || []

  // Fetch departments for new course creation
  const { data: departmentsData } = useQuery(getDepartmentsQueryOptions())

  // Add book mutation
  const { mutate: addBookMutation, isPending: isSubmitting } = useMutation({
    mutationFn: (formData) => api.addBook(formData),
    onSuccess: (data) => {
      reset()
      onOpenChange(false)
      onSuccess()
      if (data?.data?.courseCreated) {
        toast.success("Course created and material added successfully. Pending review.")
      } else {
        toast.success("Material added successfully. Pending review.")
      }
    },
    onError: (error) => {
      console.error("Error adding book:", error)
      const message = error?.response?.data?.message || "Failed to add material"
      toast.error(message)
    },
  })

  // Update book mutation (edit mode)
  const { mutate: updateBookMutation, isPending: isUpdating } = useMutation({
    mutationFn: (formData) => api.updateBook(editingBook._id || editingBook.id, formData),
    onSuccess: (data) => {
      reset()
      onOpenChange(false)
      onSuccess()
      toast.success(data?.message || "Material updated successfully")
    },
    onError: (error) => {
      console.error("Error updating book:", error)
      const message = error?.response?.data?.message || "Failed to update material"
      toast.error(message)
    },
  })

  // Multipart upload to the server, which stores the file on Google Drive.
  const { mutate: uploadFileMutation, isPending: isUploading } = useMutation({
    mutationFn: (formData) => api.uploadBookFile(formData, (percent) => setUploadPercent(percent)),
    onSuccess: (data) => {
      reset()
      setSelectedFile(null)
      setUploadPercent(0)
      setActiveTab("link")
      onOpenChange(false)
      onSuccess()
      toast.success(
        data?.data?.courseCreated
          ? "Course created and material uploaded successfully. Pending review."
          : "Material uploaded successfully. Pending review."
      )
    },
    onError: (error) => {
      console.error("Error uploading material:", error)
      setUploadPercent(0)
      const message = error?.response?.data?.message || "Failed to upload material"
      toast.error(message)
    },
  })

  const submitForm = (data) => {
    if (isEditMode) {
      updateBookMutation({
        title: data.title,
        category: data.category,
        academicSession: data.academicSession || undefined,
        driveUrl: data.driveUrl || undefined,
      })
      return
    }
    if (activeTab === "upload") {
      if (!selectedFile) {
        toast.error("Please choose a file to upload")
        return
      }
      const MAX_UPLOAD_BYTES = 15 * 1024 * 1024 // keep in sync with the server
      if (selectedFile.size > MAX_UPLOAD_BYTES) {
        toast.error("File too large. Maximum size is 15 MB.")
        return
      }
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", data.title)
      formData.append("courseCode", data.courseCode)
      formData.append("category", data.category)
      if (data.academicSession) formData.append("academicSession", String(data.academicSession))
      if (data.newCourseTitle) formData.append("newCourseTitle", data.newCourseTitle)
      if (data.departmentShortNames && data.departmentShortNames.length) {
        formData.append("departmentShortNames", JSON.stringify(data.departmentShortNames))
      }
      uploadFileMutation(formData)
      return
    }
    addBookMutation(data)
  }

  const isPastQuestion = categoryValue === "pastQuestion"
  const titleValue = watch("title")
  const driveUrlValue = watch("driveUrl")
  const academicSessionValue = watch("academicSession")
  const newCourseTitleValue = watch("newCourseTitle")
  const deptShortNamesValue = watch("departmentShortNames")

  const isLinkRequiredMissing = !isEditMode && activeTab === "link" && !driveUrlValue
  const isUploadRequiredMissing = !isEditMode && activeTab === "upload" && !selectedFile
  const isNewCourseMissing = !isEditMode && !courseExists && normalizedCourseCode.length === 6 && (!newCourseTitleValue || !deptShortNamesValue?.length)
  const isPastQuestionMissing = isPastQuestion && !academicSessionValue
  const isSubmitDisabled = !isValid || isLinkRequiredMissing || isUploadRequiredMissing || isNewCourseMissing || isPastQuestionMissing

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          reset()
          setSelectedFile(null)
          setUploadPercent(0)
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Material" : "Add New Material"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the material details. The course cannot be changed."
              : "Upload a file or paste a Google Drive link. The course level and semester are auto-derived from the course code."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4 py-4">
          {/* Course Code - always required */}
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="courseCode"
                {...register("courseCode", { required: "Course code is required" })}
                placeholder="e.g. GET211"
                value={courseCodeValue}
                disabled={isEditMode}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\s+/g, "").toUpperCase()
                  setValue("courseCode", raw, { shouldValidate: true })
                }}
              />
              {courseLookupLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">Loading…</span>}
              {courseLookupError && !courseLookupLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive text-sm">Invalid format</span>
              )}
              {courseExists && !courseLookupLoading && (
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-green-500 text-sm">Found</span>
              )}
            </div>
            {errors.courseCode && <p className="text-sm text-destructive">{errors.courseCode.message}</p>}
          </div>

          {/* Auto-derived Level/Semester display */}
          {derivedLevel && derivedSemester && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">Auto-detected:</p>
              <p className="flex gap-4 text-muted-foreground">
                <span>Level: {derivedLevel}</span>
                <span>Semester: {derivedSemester}</span>
              </p>
              {courseDepartments.length > 0 && (
                <p className="text-muted-foreground mt-1">
                  Departments: {courseDepartments.map((d) => d.shortName).join(", ")}
                </p>
              )}
            </div>
          )}

          {/* If course doesn't exist, show extra fields */}
          {!isEditMode && !courseExists && normalizedCourseCode.length === 6 && !courseLookupLoading && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground">
                This course doesn't exist yet. Please provide the course title and department(s).
              </p>
              <div className="space-y-2">
                <Label htmlFor="newCourseTitle">Course Title <span className="text-destructive">*</span></Label>
                <Input
                  id="newCourseTitle"
                  {...register("newCourseTitle", { required: true })}
                  placeholder="e.g. Strength of Materials"
                />
                {errors.newCourseTitle && <p className="text-sm text-destructive">{errors.newCourseTitle.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Departments offering this course <span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="departmentShortNames"
                  rules={{ required: "Select at least one department" }}
                  render={({ field }) => {
                    const selected = Array.isArray(field.value) ? field.value : []
                    const allShortNames = (departmentsData?.data || []).map((dept) => dept.shortName)
                    const allSelected = allShortNames.length > 0 && allShortNames.every((shortName) => selected.includes(shortName))
                    const someSelected = selected.length > 0 && !allSelected
                    return (
                      <div className="space-y-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked ? allShortNames : [])
                            }}
                          />
                          <span>Select all</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {(departmentsData?.data || []).map((dept) => (
                            <label key={dept.shortName} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selected.includes(dept.shortName)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...selected, dept.shortName])
                                  } else {
                                    field.onChange(selected.filter((v) => v !== dept.shortName))
                                  }
                                }}
                              />
                              <span>{dept.shortName} - {dept.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  }}
                />
                {errors.departmentShortNames && <p className="text-sm text-destructive">{errors.departmentShortNames.message}</p>}
              </div>
            </div>
          )}

          {/* Book Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Material Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              {...register("title", { required: "Material title is required" })}
              placeholder="e.g. Principles of Electrical & Electronics by Mheta"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
            <Select onValueChange={(value) => setValue("category", value, { shouldValidate: true })} value={categoryValue} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bookCategories).map(([key, value]) => (
                  <SelectItem key={key} value={key} className="!w-full">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>

          {/* Academic Session - required for Past Questions */}
          {isPastQuestion && (
            <div className="space-y-2">
              <Label htmlFor="academicSession">Academic Session <span className="text-destructive">*</span></Label>
              <Input
                id="academicSession"
                {...register("academicSession", {
                  required: "Academic session is required for past questions",
                  pattern: {
                    value: /^\d{4}\/\d{4}$/,
                    message: "Format: YYYY/YYYY (e.g. 2023/2024)",
                  },
                })}
                placeholder="e.g. 2023/2024"
              />
              {errors.academicSession && <p className="text-sm text-destructive">{errors.academicSession.message}</p>}
            </div>
          )}

          {/* Upload Method Tabs */}
          {isEditMode ? (
            <div className="space-y-2">
              <Label htmlFor="driveUrl">Google Drive Link <span className="text-destructive">*</span></Label>
              <Input
                id="driveUrl"
                type="url"
                placeholder="https://drive.google.com/file/d/.../view"
                {...register("driveUrl", {
                  required: "Google Drive link is required",
                  pattern: {
                    value: /^https:\/\/drive\.google\.com\/.*/i,
                    message: "Please enter a valid Google Drive link",
                  },
                })}
              />
              {errors.driveUrl && <p className="text-sm text-destructive">{errors.driveUrl.message}</p>}
            </div>
          ) : (
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setUploadPercent(0) }} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Paste Drive Link</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="link">
              <div className="space-y-2">
                <Label htmlFor="driveUrl">Google Drive Link <span className="text-destructive">*</span></Label>
                <Input
                  id="driveUrl"
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view"
                  {...register("driveUrl", {
                    required:
                      activeTab === "link" ? "Google Drive link is required" : false,
                    pattern: {
                      value: /^https:\/\/drive\.google\.com\/.*/i,
                      message: "Please enter a valid Google Drive link",
                    },
                  })}
                />
                {errors.driveUrl && <p className="text-sm text-destructive">{errors.driveUrl.message}</p>}
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <div className="space-y-2">
                <Label>File Upload <span className="text-destructive">*</span></Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => { setSelectedFile(e.target.files && e.target.files[0]); setUploadPercent(0) }}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {selectedFile ? (
                      <>
                        <p className="font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB — click to choose another file
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">Click to choose a file (max 15 MB)</p>
                        <p className="text-sm text-muted-foreground mt-1">PDF, DOC, DOCX, PPT, PPTX</p>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  The file is stored in the library's Google Drive and becomes visible once approved.
                </p>
                {(isUploading || uploadPercent > 0) && (
                  <div className="space-y-1">
                    {isUploading && uploadPercent >= 100 ? (
                      <>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full w-full rounded-full bg-primary animate-pulse" />
                        </div>
                        <p className="text-xs text-muted-foreground">Saving to library Drive…</p>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${uploadPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{uploadPercent}%{isUploading ? " uploading…" : " uploaded"}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading || isUpdating || isSubmitDisabled}>
              {isEditMode
                ? isUpdating
                  ? "Saving..."
                  : "Save Changes"
                : isUploading
                  ? "Uploading..."
                  : activeTab === "upload"
                    ? "Upload Material"
                    : isSubmitting
                      ? "Adding..."
                      : "Add Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddBookDialog