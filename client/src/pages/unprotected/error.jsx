import { ENVIRONMENT } from '@/config'
import { useEffect } from 'react'
import { ArrowCounterClockwise as RotateCcw, House as Home, Warning as AlertTriangle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Error page component that displays when an error occurs
 *
 * @param {Object} props - Component props
 * @param {Error} props.error - The error that occurred
 * @param {Object} props.errorInfo - Additional error information
 * @param {Function} props.resetError - Function to reset the error state
 */

const ErrorPage = ({ error, errorInfo, resetError }) => {
  useEffect(() => {
    if (ENVIRONMENT.APP.ENV !== "production") {
      console.group("Error Details")
      console.error("Error:", error)
      console.error("Error Info:", errorInfo)
      console.groupEnd()
    }
  }, [error, errorInfo])

  const handleRetry = () => {
    if (resetError) {
      resetError()
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
    if (resetError) resetError()
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/30 p-4'>
      <Card className='w-full max-w-md shadow-card'>
        <CardHeader className='pb-2 text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='flex size-16 items-center justify-center rounded-md bg-accent-blush text-destructive'>
              <AlertTriangle weight='bold' className='h-8 w-8' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold tracking-tight'>Something went wrong</CardTitle>
          <CardDescription>
            We're sorry, but an error occurred while processing your request.
          </CardDescription>
        </CardHeader>

        <CardContent className='pb-2'>
          {/* Error message */}
          <div className='mb-4 rounded-md bg-muted/60 p-3'>
            <p className='break-words font-mono text-sm'>
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Error tips */}
          <div className='space-y-2 text-sm text-muted-foreground'>
            <p>You can try:</p>
            <ul className='list-disc space-y-1 pl-5'>
              <li>Refreshing the page</li>
              <li>Checking your internet connection</li>
              <li>Going back to the home page</li>
              <li>Trying again later</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className='flex gap-2 pt-2'>
          <Button variant='outline' className='flex-1' onClick={handleRetry}>
            <RotateCcw className='mr-2 h-4 w-4' />
            Try Again
          </Button>
          <Button className='flex-1' onClick={handleGoHome}>
            <Home className='mr-2 h-4 w-4' />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ErrorPage