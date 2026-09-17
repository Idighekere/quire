import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Book, GoogleLogo, WarningCircle as AlertCircle } from "@phosphor-icons/react"
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services'
import { ENVIRONMENT } from '@/config'
import toast from 'react-hot-toast'

const GOOGLE_ERROR_MESSAGES = {
  google_not_configured: 'Google sign-in is not set up on the server yet.',
  google_failed: 'Google sign-in failed. Please try again.',
  google_no_email: 'Could not verify an email address with Google.',
  google_no_offline: 'Google did not grant Drive access. Pick the account matching your admin email and tick all permission boxes, then try again.'
}

function LoginPage () {
  const [searchParams] = useSearchParams()
  const googleError = searchParams.get('error')
  const googleErrorMessage = GOOGLE_ERROR_MESSAGES[googleError] || null
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const { mutateAsync: loginMutation, error, isPending } = useMutation({
    mutationFn: async data => await authApi.login(data),
    onSuccess: () => {
      toast.success('Login successful.')
      window.location.href = '/dashboard'
    },
    onError: err => {
      // toast.error(err.response.data.message)
      console.error(err)
    }
  })

  const onSubmit = async data => {
    await loginMutation(data)
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12 md:px-12 lg:px-16'>
      <Card className='w-full max-w-md border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-card'>
        <CardHeader className='space-y-1 px-0 md:px-6'>
          <div className='mb-6 flex justify-center'>
            <div className='flex size-14 items-center justify-center rounded-md bg-accent-lavender text-foreground'>
              <Book weight='bold' className='h-7 w-7 text-primary' />
            </div>
          </div>
          <span className='text-center font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
            Library member access
          </span>
          <CardTitle className='text-center text-2xl font-bold tracking-tight'>
            Login to your account
          </CardTitle>
          <CardDescription className='px-0 text-center'>
            Enter your email and password to add books
          </CardDescription>
        </CardHeader>
        <CardContent className='px-0 md:px-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {googleErrorMessage && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{googleErrorMessage}</AlertDescription>
              </Alert>
            )}
            {error?.response?.data?.message && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {error?.response?.data?.message}
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='your.email@example.com'
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <p className='text-sm text-destructive'>{errors.email.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Password</Label>
                <Link
                  to='/forgot-password'
                  className='text-sm text-primary transition-opacity hover:opacity-80'
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                placeholder='Enter password'
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className={`${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <p className='text-sm text-destructive'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={isPending || !isValid}
            >
              {isPending ? 'Logging in...' : 'Login'}
            </Button>

            <div className='flex items-center gap-3'>
              <span className='h-px flex-1 bg-border' />
              <span className='text-xs text-muted-foreground'>or</span>
              <span className='h-px flex-1 bg-border' />
            </div>

            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={() => {
                window.location.href = `${ENVIRONMENT.APP.BASE_URL}/auth/google?redirect=${encodeURIComponent(window.location.origin)}`
              }}
            >
              <GoogleLogo className='h-4 w-4' />
              Continue with Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex flex-col px-0 md:px-6'>
          <div className='text-center text-sm text-muted-foreground'>
            Don't have an account?{' '}
            <Link to='/auth/register' className='font-medium text-primary transition-opacity hover:opacity-80'>
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage