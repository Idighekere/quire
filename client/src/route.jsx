import { lazy, Suspense } from 'react'
import { AuthLayout, ErrorBoundary, HomeSharedLayout, ProtectedRoute } from './components'
import Preloader from '@/components/ui/preloader'
import {
  Home,
  CustomErrorPage,
  ErrorPage,
} from './pages/unprotected'
import {
  AuthProvider,
  BookSearchProvider,
  CourseSearchParamsProvider
} from './contexts'
import { DashboardLayout } from '@/pages/protected'

const CoursesPage = lazy(() => import('./pages/unprotected/courses'))
const BooksPage = lazy(() => import('./pages/unprotected/books'))
const RegisterPage = lazy(() => import('./pages/unprotected/register'))
const LoginPage = lazy(() => import('./pages/unprotected/login'))
const DepartmentsPage = lazy(() => import('./pages/unprotected/departments'))
const DepartmentDetailPage = lazy(() => import('./pages/unprotected/department-detail'))
const ContactPage = lazy(() => import('./pages/unprotected/contact'))
const AboutPage = lazy(() => import('./pages/unprotected/about'))
const PrivacyPage = lazy(() => import('./pages/unprotected/privacy'))
const MaterialsArchivePage = lazy(() => import('./pages/unprotected/materials'))
const RequestsPage = lazy(() => import('./pages/unprotected/requests'))
const DashboardBooksPage = lazy(() => import('@/pages/protected/dashboard-books'))
const DashboardCoursesPage = lazy(() => import('@/pages/protected/dashboard-courses'))
const DashboardHome = lazy(() => import('@/pages/protected/dashboard-home'))
const DashboardModerationPage = lazy(() => import('@/pages/protected/dashboard-moderation'))

const SuspenseFallback = () => <Preloader />
const withSuspense = (node) => <Suspense fallback={<SuspenseFallback />}>{node}</Suspense>

export const createAppRoutes = () => [
  {
    path: '/',
    element: <HomeSharedLayout />,
    children: [
      { path: '/', element: <Home />, errorElement: <ErrorPage /> },
      {
        path: '/courses',
        element: withSuspense(
          <CourseSearchParamsProvider>
            <CoursesPage />
          </CourseSearchParamsProvider>
        ),
        errorElement: <ErrorPage />
      },

      {
        path: '/books',
        element: withSuspense(
          <BookSearchProvider>
            <BooksPage />
          </BookSearchProvider>
        ),
        errorElement: <ErrorPage />
      },
      {
        path: '/departments',
        element: withSuspense(<DepartmentsPage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/departments/:slug',
        element: withSuspense(<DepartmentDetailPage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/contact',
        element: withSuspense(<ContactPage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/about',
        element: withSuspense(<AboutPage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/privacy',
        element: withSuspense(<PrivacyPage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/materials',
        element: withSuspense(<MaterialsArchivePage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/requests',
        element: withSuspense(<RequestsPage />),
        errorElement: <ErrorPage />
      },
      {
        path: '/unauthorized',
        element: (
          <CustomErrorPage
            statusCode={401}
            title={'Unauthorized'}
            message={
              "You don't have enough permissions to access this resources"
            }
          />
        )
      },

    ]
  },
  {
        path:"/auth/",
        element:<AuthLayout/>,
        children:[

      {
        path: '/auth/login',
        element: withSuspense(<LoginPage />)

      },
      {
        path: '/auth/register',
        element: withSuspense(<RegisterPage />)
      }
        ]
      },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'uploader']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,

    children: [
      {
        path: '/dashboard/',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['admin', 'uploader']}>
            <DashboardHome />
          </ProtectedRoute>
        )
      },
      {
        path: 'books',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['admin', 'uploader']}>
            <DashboardBooksPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'courses',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardCoursesPage />{' '}
          </ProtectedRoute>
        )
      },
      {
        path: 'moderation',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardModerationPage />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '*',
    element: (
      <HomeSharedLayout>
        <CustomErrorPage />
      </HomeSharedLayout>
    ),
    errorElement: <ErrorPage />
  }
]
