import { queryOptions, useQuery } from '@tanstack/react-query';
import { api, authApi } from './api';
import { useBookParams, useCourseParams } from '@/contexts';

// Custom hook to fetch courses with Tanstack Query
export function useCoursesQuery() {
    const { courseParams, isLoading: paramsLoading } = useCourseParams();
    const { department, level, semester } = courseParams;

    return useQuery({
        queryKey: ['courses', department, level, semester],
        queryFn: () => api.getCourses(department, level, semester),
        enabled: !paramsLoading && Boolean(department && level && semester),
        keepPreviousData: true
    });
}

// Custom hook to fetch books by course
export function useBooksQuery() {
    const { bookParams, isLoading: paramsLoading } = useBookParams();
    const { courseCode } = bookParams;

    return useQuery({
        queryKey: ['books', courseCode],
        queryFn: () => api.getBooksByCourse(courseCode),
        enabled: !paramsLoading && Boolean(courseCode),
        keepPreviousData: true
    });
}

export const getCoursesByFilterQueryOptions=(courseParams,paramsLoading)=>{

    const { department, level, semester } = courseParams

    return queryOptions({
        queryKey: ['courses',department,level,semester],
        queryFn: () => api.getCourses(department, level, semester),
        enabled: !paramsLoading && Boolean(department || level || semester),
        keepPreviousData: true
    })
}

export const getBooksByCoursesQueryOptions=(bookParams,paramsLoading)=>{

    const { courseCode } = bookParams
    return queryOptions({
        queryKey: ['books', courseCode],
        queryFn: () => api.getBooksByCourse(courseCode),
        enabled: !paramsLoading && Boolean(courseCode),
        keepPreviousData: true
    })

}

export const getAllBooksQueryOptions = (params = {}) => {
    return queryOptions({
        queryKey: ['allBooks', params.page, params.search, params.category],
        queryFn: () => api.getAllBooks(params),
        keepPreviousData: true
    })
}


export const getBooksByUserQueryOptions=(user, params = {})=>{
    const {_id}=user || {}
    const { search = "", courseCode = "", department = "", level = "", semester = "", category = "", sort = "newest", page = 1, limit = 20 } = params

    return queryOptions({
        queryKey: ['books',_id, search, courseCode, department, level, semester, category, sort, page, limit],
        queryFn: ()=>api.getBooksByUser(params),
    })
}


export const getCoursesByUserQueryOptions=(user, params = {})=>{
    const {_id}=user || {}
    const { search = "", department = "", level = "", semester = "", sort = "newest", page = 1, limit = 20 } = params

    return queryOptions({
        queryKey: ['courses',_id, search, department, level, semester, sort, page, limit],
        queryFn: ()=>api.getCoursesByUser(params),
    })
}

export const getDepartmentsQueryOptions = () => {
  return queryOptions({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  })
}

export const BOOK_SORT_OPTIONS = [
  { value: "newest", label: "Recently added" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-az", label: "Title A–Z" },
  { value: "title-za", label: "Title Z–A" },
]

export const COURSE_SORT_OPTIONS = [
  { value: "newest", label: "Recently added" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-az", label: "Title A–Z" },
  { value: "title-za", label: "Title Z–A" },
  { value: "level", label: "Level order" },
  { value: "most-books", label: "Most materials" },
]

export const lookupCourseQueryOptions = (courseCode, enabled = true) => {
    return queryOptions({
        queryKey: ['course', 'lookup', courseCode],
        queryFn: () => api.lookupCourse(courseCode),
        enabled: enabled && Boolean(courseCode?.trim()),
        staleTime: 5 * 60 * 1000,
    })
}

export const listRequestsQueryOptions = (params = {}) => {
    return queryOptions({
        queryKey: ['requests', params.status, params.search, params.page],
        queryFn: () => api.listRequests(params),
        keepPreviousData: true,
    })
}

export const getPendingBooksQueryOptions = (params = {}) => {
    return queryOptions({
        queryKey: ['pendingBooks', params.page],
        queryFn: () => api.getPendingBooks(params),
        keepPreviousData: true,
    })
}

export const getRequestQueryOptions = (requestId) => {
    return queryOptions({
        queryKey: ['request', requestId],
        queryFn: () => api.listRequests({}),
        enabled: Boolean(requestId),
    })
}

export const getCurrentUserQueryOptions=()=>{

    // const {setUser}=useAuth()
    return queryOptions({
        queryKey: ['currentUser'],
        queryFn: ()=>authApi.getCurrentUser(),
          onError:(err)=>{
        console.error(err.response.data.message)

          },
    })
}

// const addBookQueryOptions=()=>{
//     return queryOptions({
//         queryKey: ['addBook'],
//         queryFn: (formData)=>api.addBook(formData),
//         onSuccess: () => {
//             setIsSubmitting(false)
//             reset()
//             onOpenChange(false)
//             onSuccess()
//             toast.success('Book added successfully')
//         },
//         onError: (error) => {
//             console.error("Error adding book:", error)
//             toast.error(`Error adding book: ${error.response.data.message}`)
//             setIsSubmitting(false)
//         },
//     })
// }
