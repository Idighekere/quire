import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight } from '@phosphor-icons/react'
import { BRAND_NAME } from '@/constants/branding'

export default function CtaSection() {
  return (
    <section className="w-full px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border bg-card p-8 shadow-soft-lift md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-accent-lavender px-3 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
              Start your quire
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tighter md:text-4xl">
              Your next material is one search away
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Browse 8 departments or request what&apos;s missing — the community keeps the quire growing.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/materials">
                  Browse materials <ArrowRight weight="bold" className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/requests">Request a material</Link>
              </Button>
            </div>
            <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.09em] text-muted-foreground">
              {BRAND_NAME} · community-built for Uniuyo engineering
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
