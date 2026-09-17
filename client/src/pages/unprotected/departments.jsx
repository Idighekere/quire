import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap } from "@phosphor-icons/react"
import { departments } from '@/constants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const accentWashes = [
  "bg-accent-lavender",
  "bg-accent-mint",
  "bg-accent-sand",
  "bg-accent-sky",
  "bg-accent-blush",
]

const stats = [
  { value: "8", label: "Departments" },
  { value: "5", label: "Year Program" },
  { value: "B.Eng", label: "Degree Awarded" },
  { value: "COREN", label: "Accredited" },
]

export default function DepartmentsPage() {
  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='w-full px-4 pb-16 pt-16 md:px-8 md:pb-20 md:pt-20'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 flex flex-col items-center gap-4'>
              <span className='inline-flex items-center gap-2 rounded-full bg-accent-lavender px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]'>
                Eight departments, one faculty
              </span>
              <div className='flex size-14 items-center justify-center rounded-md bg-card shadow-card'>
                <GraduationCap weight='bold' className='h-7 w-7 text-primary' />
              </div>
            </div>
            <h1 className='max-w-3xl text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl'>
              Engineering Departments
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl'>
              Explore the eight engineering departments at the University of Uyo,
              Faculty of Engineering. Each department offers unique programs designed
              to prepare students for successful careers in their respective fields.
            </p>
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className='w-full px-4 pb-16 md:px-8 md:pb-20'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {departments.map((dept, index) => {
              const Icon = dept.icon
              const wash = accentWashes[index % accentWashes.length]
              return (
                <Card
                  key={dept.id}
                  className='group flex flex-col transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift'
                >
                  <CardHeader className='pb-3'>
                    <div className='mb-2 flex items-center gap-3'>
                      <div className={cn('flex size-11 items-center justify-center rounded-md', wash, 'text-foreground')}>
                        <Icon weight='bold' className='h-5 w-5' />
                      </div>
                      <Badge className='font-mono'>
                        {dept.shortName}
                      </Badge>
                    </div>
                    <CardTitle className='text-lg leading-tight'>
                      {dept.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='flex flex-1 flex-col'>
                    <CardDescription className='mb-4 flex-1 leading-relaxed'>
                      <span className='line-clamp-3'>{dept.description}</span>
                    </CardDescription>
                    <div className='space-y-3'>
                      <p className='font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
                        {dept.associationName}
                      </p>
                      <Link to={`/departments/${dept.slug}`}>
                        <Button
                          variant='outline'
                          className='w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground'
                        >
                          Learn More
                          <ArrowRight className='ml-2 h-4 w-4' />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className='w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-12 flex flex-col items-center gap-4 text-center'>
            <span className='inline-flex items-center gap-2 rounded-full bg-accent-sand px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]'>
              Faculty at a glance
            </span>
            <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
              Quick Stats
            </h2>
            <p className='max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl'>
              Key statistics about the Faculty of Engineering, University of Uyo
            </p>
          </div>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className='flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-center shadow-card'
              >
                <p className='text-4xl font-bold tracking-tight text-primary'>
                  {stat.value}
                </p>
                <p className='font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground'>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}