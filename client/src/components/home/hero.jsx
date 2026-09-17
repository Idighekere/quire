import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { MagnifyingGlass as Search, Building, Flask, FileText, Gear, Cpu } from '@phosphor-icons/react'
import { departments, levels, semesters } from '@/constants'
import { BRAND_NAME } from '@/constants/branding'

function FloatingChip({ children, wash, rotate, className, hideOnMobile }) {
  return (
    <div
      className={`absolute flex ${hideOnMobile ? 'hidden md:flex' : 'flex'} ${className}`}
      style={{ "--r": `${rotate}deg` }}
      aria-hidden="true"
    >
      <div className={`flex items-center gap-1.5 rounded-[14px] border bg-card px-2.5 py-1.5 text-[0.7rem] font-medium shadow-card md:px-3 md:py-2 md:text-xs ${wash}`} style={{ transform: "rotate(var(--r))" }}>
        {children}
      </div>
    </div>
  )
}

export default function Hero () {
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [semester, setSemester] = useState('')

  const handleSearch = () => {
    if (department && level && semester) {
      window.location.href = `/courses?department=${department}&level=${level}&semester=${semester}`
    }
  }

  const isReady = Boolean(department && level && semester)

  return (
    <section className='relative flex w-full flex-col items-center justify-center overflow-visible px-4 pb-16 pt-16 md:pb-24 md:pt-24 lg:pb-28 lg:pt-32'>
      <div className='relative mx-auto w-full max-w-5xl'>
        {/* Orbit chips — orbit around headline only, well clear of pill */}
        <FloatingChip wash="bg-accent-lavender" rotate={-5} className="left-[0%] top-[8%] animate-[quire-float_5s_ease-in-out_infinite]" hideOnMobile>
          <Building weight="bold" className="h-3.5 w-3.5 shrink-0" /> 200L · CVE
        </FloatingChip>
        <FloatingChip wash="bg-accent-mint" rotate={4} className="right-[0%] top-[10%] animate-[quire-float_6s_ease-in-out_0.7s_infinite]" hideOnMobile>
          <Flask weight="bold" className="h-3.5 w-3.5 shrink-0" /> CHE 211
        </FloatingChip>
        <FloatingChip wash="bg-accent-sand" rotate={-4} className="left-[1%] top-[38%] animate-[quire-float_5.5s_ease-in-out_0.3s_infinite]">
          <FileText weight="bold" className="h-3.5 w-3.5 shrink-0" /> Past question
        </FloatingChip>
        <FloatingChip wash="bg-accent-sky" rotate={3} className="right-[1%] top-[40%] animate-[quire-float_6.2s_ease-in-out_1s_infinite]">
          <Gear weight="bold" className="h-3.5 w-3.5 shrink-0" /> MEE 304
        </FloatingChip>
        <FloatingChip wash="bg-accent-blush" rotate={-3} className="left-[38%] top-[2%] hidden lg:flex animate-[quire-float_4.6s_ease-in-out_0.9s_infinite]">
          <Cpu weight="bold" className="h-3.5 w-3.5 shrink-0" /> CPE 419
        </FloatingChip>

        {/* Starburst doodle */}
        <span aria-hidden="true" className="absolute right-[13%] top-[4%] hidden text-lg leading-none text-primary md:block">✶</span>
        {/* Handwritten micro-copy — clear of pill */}
        <span aria-hidden="true" className="absolute bottom-[2%] right-[2%] hidden rotate-[6deg] text-right font-mono text-[0.62rem] leading-tight opacity-50 md:block">
          less searching,<br />more learning. ↘
        </span>

        <div className='mb-10 flex flex-col items-center text-center md:mb-14'>
          <span className='mb-6 inline-flex items-center gap-2 rounded-full bg-accent-lavender px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-foreground'>
            {BRAND_NAME}
          </span>
          <h1 className='max-w-3xl text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl'>
            Find your <span className="text-primary">engineering</span> course materials
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl'>
            A quire for every course. No scattered Drives, no &ldquo;ask to resend.&rdquo;
          </p>
        </div>

        {/* Search surface - the "big search pill" */}
        <div className='w-full rounded-xl border bg-card p-4 shadow-soft-lift md:p-5' style={{ borderRadius: 'calc(var(--radius-xl) * 0.8)' }}>
          <div className='grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]'>
            <div>
              <Select value={department} onValueChange={setDepartment} name="department">
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select Department' />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.shortName}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={level} onValueChange={setLevel} name="level">
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Level' />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level} Level
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={semester} onValueChange={setSemester} name="semester">
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Semester' />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map(semester => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size='lg'
              className='w-full md:w-auto'
              onClick={handleSearch}
              disabled={!isReady}
            >
              <Search weight='bold' className='h-5 w-5' />
              Search Courses
            </Button>
          </div>
        </div>

        <p className='mt-6 text-center font-mono text-[0.6875rem] uppercase tracking-[0.09em] text-muted-foreground'>
          Prefer to browse the shelves
        </p>
      </div>

      <style>{`
        @keyframes quire-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="quire-float"] { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
