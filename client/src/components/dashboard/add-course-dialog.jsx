import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/services'
import { getDepartmentsQueryOptions } from '@/services/queries'
import toast from 'react-hot-toast'
import { ScrollArea } from '../ui/scroll-area'

function AddCourseDialog ({ open, onOpenChange, onSuccess, editingCourse }) {
  const isEditMode = Boolean(editingCourse)
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      courseCode: '',
      title: '',
      departments: [],
    }
  })

  useEffect(() => {
    if (editingCourse && open) {
      setValue('courseCode', editingCourse.courseCode || '')
      setValue('title', editingCourse.title || '')
      const deptShortNames = (editingCourse.departments || []).map(d =>
        typeof d === 'string' ? d : d.shortName
      )
      setValue('departments', deptShortNames)
    } else if (!editingCourse && open) {
      reset()
    }
  }, [editingCourse, open, setValue, reset])

  const courseCodeValue = watch('courseCode')
  // The field keeps the raw text (prefix intact); the stripped value is
  // derived locally for lookups, length gates, and level/semester display.
  const normalizedCourseCode = (courseCodeValue || '').replace(/\s+/g, '').toUpperCase().replace(/^UUY-/, '')

  // Validate course code format (strict pattern on the stripped value)
  const isValidCode = /^[A-Z]{3}[1-5][12][0-9]$/.test(normalizedCourseCode)

  // Derive level/semester locally for display
  const derivedLevel = normalizedCourseCode.length === 6 ? parseInt(normalizedCourseCode[3], 10) * 100 : null
  const derivedSemester = normalizedCourseCode.length === 6 ? (normalizedCourseCode[4] === '1' ? '1st' : '2nd') : null

  const { mutate: addCourseMutation, isPending: isSubmitting } = useMutation({
    mutationFn: formData => api.addCourse(formData),
    onSuccess: () => {
      reset()
      onOpenChange(false)
      onSuccess()
      toast.success('Course created successfully')
    },
    onError: error => {
      console.error('Error adding course:', error)
      toast.error(`Error adding course: ${error.response?.data?.message || 'Unknown error'}`)
    }
  })

  const { mutate: updateCourseMutation, isPending: isUpdating } = useMutation({
    mutationFn: formData => api.updateCourse(editingCourse._id || editingCourse.id, formData),
    onSuccess: () => {
      reset()
      onOpenChange(false)
      onSuccess()
      toast.success('Course updated successfully')
    },
    onError: error => {
      console.error('Error updating course:', error)
      toast.error(`Error updating course: ${error.response?.data?.message || 'Unknown error'}`)
    }
  })

  // Departments are API-driven so the selector never goes stale.
  const { data: departmentsData } = useQuery(getDepartmentsQueryOptions())
  const deptOptions = (departmentsData?.data || []).map(dept => ({
    shortName: dept.shortName,
    name: dept.name,
  }))

  const onSubmit = data => {
    if (isEditMode) {
      updateCourseMutation({
        title: data.title,
        departmentShortNames: data.departments,
      })
      return
    }
    const courseData = {
      courseCode: data.courseCode,
      title: data.title,
      departmentShortNames: data.departments,
      // level and semester are derived server-side from courseCode
    }
    addCourseMutation(courseData)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={newOpen => {
        if (!newOpen) {
          reset()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className='sm:max-w-[600px] h-[80vh] md:h-auto overflow-y-scroll md:overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the course title or departments. The course code cannot be changed.'
              : 'Add a new course to the library. Level and semester are auto-derived from the course code.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-full'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='courseCode'>Course Code</Label>
                <Input
                  id='courseCode'
                  {...register('courseCode', {
                    required: 'Course code is required',
                    pattern: {
                      value: /^(?:UUY-)?[A-Z]{3}[1-5][12][0-9]$/,
                      message: 'Format: ABC123 (e.g. GET211: 3 letters + level 1-5 + semester 1-2 + digit)'
                    }
                  })}
                  placeholder='e.g. GET211'
                  value={courseCodeValue}
                  disabled={isEditMode}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\s+/g, '').toUpperCase()
                    setValue('courseCode', raw, { shouldValidate: true })
                  }}
                />
                {errors.courseCode && (
                  <p className='text-sm text-destructive'>{errors.courseCode.message}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='title'>Course Title</Label>
                <Input
                  id='title'
                  {...register('title', { required: 'Course title is required' })}
                  placeholder='e.g. Strength of Materials'
                />
                {errors.title && <p className='text-sm text-destructive'>{errors.title.message}</p>}
              </div>
            </div>

            {/* Auto-derived Level/Semester display */}
            {isValidCode && derivedLevel && derivedSemester && (
              <div className='bg-muted/50 rounded-lg p-3 text-sm'>
                <p className='font-medium'>Auto-detected from course code:</p>
                <p className='flex gap-4 text-muted-foreground mt-1'>
                  <span>Level: {derivedLevel}</span>
                  <span>Semester: {derivedSemester}</span>
                </p>
              </div>
            )}

            <div className='space-y-2'>
              <Label>Departments</Label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3'>
                <Controller
                  control={control}
                  name='departments'
                  rules={{ required: 'Select at least one department' }}
                  render={({ field }) => {
                    if (deptOptions.length === 0) {
                      return (
                        <p className='text-sm text-muted-foreground col-span-2'>
                          Departments are loading…
                        </p>
                      )
                    }
                    const allSelected = field.value.length === deptOptions.length && field.value.length > 0

                    const handleSelectAll = () => {
                      if (allSelected) {
                        field.onChange([])
                      } else {
                        field.onChange(deptOptions.map(d => d.shortName))
                      }
                    }

                    return (
                      <>
                        <div className='flex items-center space-x-2 mb-2 pb-2 border-b w-full col-span-2'>
                          <Checkbox
                            id='select-all-departments'
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                          />
                          <Label htmlFor='select-all-departments' className='cursor-pointer font-medium'>
                            Select All
                          </Label>
                        </div>
                        {deptOptions.map(department => (
                          <div key={department.shortName} className='flex items-center space-x-2'>
                            <Checkbox
                              id={`department-${department.shortName}`}
                              checked={field.value.includes(department.shortName)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...field.value, department.shortName])
                                } else {
                                  field.onChange(field.value.filter(v => v !== department.shortName))
                                }
                              }}
                            />
                            <Label htmlFor={`department-${department.shortName}`} className='cursor-pointer'>
                              {department.shortName} - {department.name}
                            </Label>
                          </div>
                        ))}
                      </>
                    )
                  }}
                />
                {errors.departments && <p className='text-sm text-destructive col-span-2'>{errors.departments.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting || isUpdating || !isValid || (!isEditMode && !isValidCode)}>
                {isEditMode ? (isUpdating ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Adding...' : 'Add Course')}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default AddCourseDialog