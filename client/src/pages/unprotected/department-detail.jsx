import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Briefcase, CheckCircle as CheckCircle2, GraduationCap, Users } from "@phosphor-icons/react"
import { departments } from '@/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import ShareButton from '@/components/share-button'

const accentWashes = [
  "bg-accent-lavender",
  "bg-accent-mint",
  "bg-accent-sand",
  "bg-accent-sky",
  "bg-accent-blush",
]

export default function DepartmentDetailPage() {
  const { slug } = useParams()

  const department = departments.find(dept => dept.slug === slug)

  if (!department) {
    return (
      <div className='flex min-h-screen items-center justify-center px-4'>
        <Card className='w-full max-w-md text-center shadow-card'>
          <CardHeader>
            <CardTitle className='text-2xl'>Department Not Found</CardTitle>
            <CardDescription>
              The department you're looking for doesn't exist or may have been moved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to='/departments'>
              <Button>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Departments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Icon = department.icon
  const currentIndex = departments.findIndex(d => d.slug === slug)
  const wash = accentWashes[currentIndex % accentWashes.length]
  const prevDept = currentIndex > 0 ? departments[currentIndex - 1] : null
  const nextDept = currentIndex < departments.length - 1 ? departments[currentIndex + 1] : null

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='w-full px-4 pb-16 pt-16 md:px-8 md:pb-20 md:pt-20'>
        <div className='mx-auto max-w-7xl'>
          {/* Breadcrumb */}
          <nav className='mb-10'>
            <ol className='flex flex-wrap items-center gap-2 text-sm'>
              <li>
                <Link to='/' className='text-muted-foreground transition-colors hover:text-foreground'>
                  Home
                </Link>
              </li>
              <li aria-hidden className='text-muted-foreground/50'>/</li>
              <li>
                <Link to='/departments' className='text-muted-foreground transition-colors hover:text-foreground'>
                  Departments
                </Link>
              </li>
              <li aria-hidden className='text-muted-foreground/50'>/</li>
              <li className='font-medium'>{department.shortName}</li>
            </ol>
          </nav>

          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 flex flex-col items-center gap-4'>
              <div className={cn('flex size-16 items-center justify-center rounded-md', wash, 'text-foreground')}>
                <Icon weight='bold' className='h-8 w-8' />
              </div>
              <Badge className='font-mono'>{department.shortName}</Badge>
            </div>
            <h1 className='max-w-4xl text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl'>
              {department.name}
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl'>
              {department.description}
            </p>
            <p className='mt-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
              {department.associationName}
            </p>
            <div className='mt-6 flex justify-center'>
              <ShareButton
                path={`/departments/${department.slug}`}
                title={`${department.name} (${department.shortName}) — Uniuyo engineering on Quire`}
                label='Share department'
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className='w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Functions & Roles */}
            <Card className='shadow-card'>
              <CardHeader>
                <div className='mb-4 flex size-11 items-center justify-center rounded-md bg-accent-mint text-foreground'>
                  <Briefcase weight='bold' className='h-5 w-5' />
                </div>
                <CardTitle>Key Functions & Roles</CardTitle>
                <CardDescription>
                  Core areas of focus and responsibilities in {department.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3'>
                  {department.functions.map((func, index) => (
                    <li key={index} className='flex items-start gap-3'>
                      <CheckCircle2 weight='bold' className='mt-0.5 h-5 w-5 flex-shrink-0 text-primary' />
                      <span className='leading-relaxed text-muted-foreground'>{func}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Career Paths */}
            <Card className='shadow-card'>
              <CardHeader>
                <div className='mb-4 flex size-11 items-center justify-center rounded-md bg-accent-sky text-foreground'>
                  <GraduationCap weight='bold' className='h-5 w-5' />
                </div>
                <CardTitle>Career Opportunities</CardTitle>
                <CardDescription>
                  Potential career paths for {department.shortName} graduates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  {department.careerPaths.map((career, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2.5 rounded-md border bg-card p-3 transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift'
                    >
                      <Users weight='bold' className='h-4 w-4 flex-shrink-0 text-primary' />
                      <span className='text-sm font-medium'>{career}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className='mt-4 shadow-card'>
            <CardContent className='py-8'>
              <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
                <div className='flex flex-col items-center gap-4 text-center md:flex-row md:text-left'>
                  <div className='flex size-12 flex-shrink-0 items-center justify-center rounded-md bg-accent-sand text-foreground'>
                    <BookOpen weight='bold' className='h-6 w-6' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold tracking-tight'>
                      Browse {department.shortName} Course Materials
                    </h3>
                    <p className='text-muted-foreground'>
                      Access textbooks, past questions, and lecture notes for all {department.name} courses
                    </p>
                  </div>
                </div>
                <Link to={`/courses?department=${department.slug}`}>
                  <Button size='lg'>
                    View Courses
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Navigation between departments */}
      <section className='w-full px-4 py-10 md:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
            {prevDept ? (
              <Link
                to={`/departments/${prevDept.slug}`}
                className='group flex flex-1 items-center gap-3 rounded-lg border bg-card p-4 shadow-card transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift'
              >
                <ArrowLeft className='h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-150 ease-nuesa group-hover:-translate-x-0.5' />
                <div>
                  <p className='font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>Previous</p>
                  <p className='font-medium'>{prevDept.name}</p>
                </div>
              </Link>
            ) : (
              <div className='flex-1' />
            )}

            {nextDept && (
              <Link
                to={`/departments/${nextDept.slug}`}
                className='group flex flex-1 items-center justify-end gap-3 rounded-lg border bg-card p-4 text-right shadow-card transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift'
              >
                <div>
                  <p className='font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>Next</p>
                  <p className='font-medium'>{nextDept.name}</p>
                </div>
                <ArrowRight className='h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-150 ease-nuesa group-hover:translate-x-0.5' />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}