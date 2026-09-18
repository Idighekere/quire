import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import ErrorBoundary from './components/errors/error-boundary'
import { AuthProvider } from './contexts'
import { Toaster } from 'react-hot-toast'
import { createAppRoutes } from './route'



function RouterConfiguration () {
  const router = createBrowserRouter(createAppRoutes())
  return <RouterProvider router={router} />
}

function App () {
  return (
    <>
      <ErrorBoundary>
          <AuthProvider>
            {/* <AuthMiddleware> */}

           <RouterConfiguration />
            {/* </AuthMiddleware> */}
          </AuthProvider>
            <Toaster />
      </ErrorBoundary>
    </>
  )
}

export default App
