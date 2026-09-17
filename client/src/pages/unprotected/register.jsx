import { Link, useNavigate } from 'react-router-dom'
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

function RegisterPage () {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  })

  const { mutateAsync: registerUser, error, isPending } = useMutation({
    mutationFn: async data => await authApi.register(data),
    onSuccess: () => {
      toast.success('Registration successful. Please login')
      navigate('/auth/login')
    },
    onError: err => {
      // toast.error(err.response.data.message)
      console.error(err)
    }
  })

  const onSubmit = async data => {
    await registerUser(data)
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12 md:px-12 lg:px-16'>
      <Card className='w-full max-w-md border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-card'>
        <CardHeader className='space-y-1 px-0 md:px-6'>
          <div className='mb-6 flex justify-center'>
            <div className='flex size-14 items-center justify-center rounded-md bg-accent-mint text-foreground'>
              <Book weight='bold' className='h-7 w-7 text-primary' />
            </div>
          </div>
          <span className='text-center font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
            Join the library
          </span>
          <CardTitle className='text-center text-2xl font-bold tracking-tight'>
            Create an account
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your details to create your library account
          </CardDescription>
        </CardHeader>
        <CardContent className='px-0 md:px-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {error?.response?.data?.message && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {error?.response?.data?.message}
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                type='text'
                placeholder='John Doe'
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                className={`h-11 ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && (
                <p className='text-sm text-destructive'>{errors.name.message}</p>
              )}
            </div>

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
                className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <p className='text-sm text-destructive'>{errors.email.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                placeholder='Password'
                type='password'
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className={`h-11 ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <p className='text-sm text-destructive'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type='submit' className='h-11 w-full' disabled={isPending || !isValid}>
              {isPending ? 'Creating account...' : 'Register'}
            </Button>

            <div className='flex items-center gap-3'>
              <span className='h-px flex-1 bg-border' />
              <span className='text-xs text-muted-foreground'>or</span>
              <span className='h-px flex-1 bg-border' />
            </div>

            <Button
              type='button'
              variant='outline'
              className='h-11 w-full'
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
            Already have an account?{' '}
            <Link to='/auth/login' className='font-medium text-primary transition-opacity hover:opacity-80'>
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default RegisterPage