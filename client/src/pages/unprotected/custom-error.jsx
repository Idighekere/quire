import { Button } from '@/components/ui/button'
import { FileX as FileQuestion, House as Home } from "@phosphor-icons/react"

export default function CustomErrorPage ({
  statusCode = 404,
  title = 'Page Not Found',
  message = " We couldn't find the page you're looking for. It might have been removed, renamed, or didn't exist in the first place."
}) {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4'>
      <div className='max-w-md text-center'>
        <div className='mb-6 flex justify-center'>
          <div className='flex size-20 items-center justify-center rounded-md bg-accent-lavender text-foreground'>
            <FileQuestion weight='bold' className='h-10 w-10 text-primary' />
          </div>
        </div>

        <p className='mb-2 font-mono text-6xl font-medium leading-none tracking-tight text-muted-foreground/40'>
          {statusCode}
        </p>
        <h2 className='mb-4 text-2xl font-semibold tracking-tight'>{title}</h2>

        <p className='mb-8 leading-relaxed text-muted-foreground'>{message}</p>

        <Button asChild size='lg'>
          <a href='/'>
            <Home className='mr-2 h-4 w-4' />
            Back to Home
          </a>
        </Button>
      </div>

      {/* Decorative elements */}
      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-0 top-1/4 h-64 w-64 rounded-full bg-muted/80 blur-3xl'></div>
        <div className='absolute bottom-1/4 right-0 h-64 w-64 rounded-full bg-muted/80 blur-3xl'></div>
      </div>
    </div>
  )
}