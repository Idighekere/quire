import { useEffect, useRef, useState } from 'react'
import {
  MagnifyingGlass,
  ChatCircle,
  Eye,
  Paperclip,
  Folders,
  ChatText,
  PaperPlaneTilt,
  FolderOpen,
  Notebook,
} from '@phosphor-icons/react'

const withoutCards = [
  { icon: Paperclip, title: 'Fwd: MEE 304 note.pdf', sub: 'Whose Drive is this?', rotate: -4 },
  { icon: Folders, title: '7 Drive folders, no structure', sub: '', rotate: 2 },
  { icon: ChatText, title: 'Tap to resend', sub: 'WhatsApp material expired', rotate: -2 },
  { icon: PaperPlaneTilt, title: 'Request buried in class group', sub: 'no one saw it', rotate: 3 },
  { icon: FolderOpen, title: 'Past questions 2021–2024', sub: 'scattered across 5 folders', rotate: -3 },
  { icon: Notebook, title: "Notes in someone's green book", sub: '', rotate: 2 },
]

const withCards = [
  {
    wash: 'bg-accent-sky',
    icon: MagnifyingGlass,
    title: 'Find by course',
    body: 'Pick department, level, semester → every material for that course, in one place.',
    foot: 'No more scattered Drives',
  },
  {
    wash: 'bg-accent-lavender',
    icon: ChatCircle,
    title: "Request what's missing",
    body: "Can't find it? Request it — it doesn't get buried. Contributors see it and fulfill it.",
    foot: 'Your request actually gets seen',
  },
  {
    wash: 'bg-accent-mint',
    icon: Eye,
    title: 'Preview before you download',
    body: 'Open in-browser preview, then download. One structured Drive, always available.',
    foot: "Never 'ask to resend' again",
  },
]

export default function PinnedStory() {
  const containerRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const updateMobile = () => setIsMobile(mql.matches)
    updateMobile()
    mql.addEventListener('change', updateMobile)
    return () => mql.removeEventListener('change', updateMobile)
  }, [])

  useEffect(() => {
    if (isMobile) return
    let ticking = false
    let lastProgress = -1
    // Cached geometry — reading getBoundingClientRect/offsetHeight inside
    // the scroll handler forces a sync layout every frame (our own
    // setProgress dirties styles between reads). Measure on mount/resize/
    // load/font-swap instead; per-scroll reads only window.scrollY, which
    // never forces layout.
    let docTop = 0
    let sectionHeight = 0
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      docTop = rect.top + window.scrollY
      sectionHeight = el.offsetHeight
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const total = sectionHeight - window.innerHeight
        const scrolled = Math.min(Math.max(window.scrollY - docTop, 0), total)
        const p = total > 0 ? scrolled / total : 0
        // Only re-render on meaningful progress change (perf: skip per-frame setState)
        if (Math.abs(p - lastProgress) > 0.02) {
          lastProgress = p
          setProgress(p)
        }
        ticking = false
      })
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {})
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
    }
  }, [isMobile])

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Mobile fallback — no pin, just stacked (warm espresso, not tezera navy)
  // NOTE: no content-visibility here. Without contain-intrinsic-size the
  // skipped sections collapse to ~0 height and expand on scroll-near —
  // another layout-shift source. The card count is small; just render it.
  if (isMobile) {
    return (
      <section className="w-full bg-[#2d241b] px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-2xl text-[#a3a69a]">Without the Library</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {withoutCards.map((c) => (
              <div key={c.title} className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-sm text-[#f4f3ee]">
                  <c.icon weight="bold" className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{c.title}</span>
                </div>
                {c.sub && <div className="mt-1 text-xs text-[#a3a69a]">{c.sub}</div>}
              </div>
            ))}
          </div>
          <h2 className="mt-10 text-center font-serif text-2xl text-[#ff7329]">With the Library</h2>
          <div className="mt-6 grid gap-4">
            {withCards.map((c) => (
              <div key={c.title} className="rounded-xl border bg-[#fffefa] p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className={`flex size-9 items-center justify-center rounded-md ${c.wash}`}><c.icon weight="bold" className="h-5 w-5 text-foreground" /></span>
                  <h3 className="font-semibold tracking-tight">{c.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <p className="mt-3 text-xs font-medium text-[#8a9a7b]">✓ {c.foot}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Desktop pinned
  const withoutOpacity = progress < 0.45 ? 1 - progress * 0.6 : Math.max(0, 1 - (progress - 0.45) * 4)
  const withOpacity = progress < 0.35 ? 0 : Math.min(1, (progress - 0.35) * 2.2)
  const heading = progress < 0.5 ? 'without' : 'with'

  return (
    <section ref={containerRef} className="relative h-[260vh] w-full bg-[#2d241b]">
      <div className="sticky top-0 flex h-[100vh] w-full flex-col overflow-hidden">
        {/* Heading — single h2, text swaps (screen readers hear one heading) */}
        <div className="relative mx-auto w-full max-w-5xl shrink-0 px-4 pt-20 text-center md:pt-24">
          <h2
            className="font-serif text-2xl transition-colors duration-300 md:text-3xl"
            style={{ color: heading === 'without' ? '#a3a69a' : '#ff7329' }}
          >
            {heading === 'without' ? 'Without the Library' : 'With the Library'}
          </h2>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-10">
          {/* Without layer */}
          <div
            className="absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-300"
            style={{ opacity: withoutOpacity, pointerEvents: withoutOpacity > 0.1 ? 'auto' : 'none' }}
            aria-hidden={withOpacity > 0.7}
          >
          <div className="grid w-full max-w-5xl grid-cols-3 gap-3 md:gap-4">
            {withoutCards.map((c, i) => {
              const delay = i * 50
              // Visible immediately at top, then drifts outward as you scrub toward "With"
              const drift = progress * 18
              const driftDir = i % 2 === 0 ? -1 : 1
              const base = `rotate(${c.rotate}deg) translateY(${Math.max(0, 10 - progress * 40)}px) translateX(${drift * driftDir * 0.6}px) scale(${0.96 + Math.min(progress * 0.2, 0.04)})`
              return (
                <div
                  key={c.title}
                  className="rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-3 md:p-4"
                  style={{
                    transform: prefersReduced ? undefined : base,
                    opacity: 1,
                    transition: prefersReduced ? 'opacity 150ms ease' : `transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, opacity 300ms ease ${delay}ms`,
                  }}
                >
                  <div className="flex items-center gap-1.5 text-sm font-medium leading-snug text-[#f4f3ee]">
                    <c.icon weight="bold" className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{c.title}</span>
                  </div>
                  {c.sub && <div className="mt-1 text-xs text-[#a3a69a]">{c.sub}</div>}
                </div>
              )
            })}
          </div>
        </div>

          {/* With layer */}
          <div
            className="absolute inset-0 flex items-center justify-center px-4"
            style={{ opacity: withOpacity, pointerEvents: withOpacity > 0.1 ? 'auto' : 'none' }}
            aria-hidden={withOpacity < 0.3}
          >
          <div className="grid w-full max-w-5xl grid-cols-3 gap-4">
            {withCards.map((c, i) => {
              const stagger = i * 80
              const visible = withOpacity > 0.15
              return (
                <div
                  key={c.title}
                  className="flex flex-col rounded-xl border bg-[#fffefa] p-5 shadow-card md:p-6"
                  style={{
                    opacity: visible ? withOpacity : 0,
                    transform: visible ? `translateY(${(1 - withOpacity) * 16}px) scale(${0.98 + withOpacity * 0.02})` : 'translateY(16px) scale(0.98)',
                    transition: prefersReduced
                      ? 'opacity 200ms ease'
                      : `transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${stagger}ms, opacity 300ms ease ${stagger}ms, box-shadow 150ms ease`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${c.wash}`}>
                      <c.icon weight="bold" className="h-5 w-5 text-foreground" />
                    </span>
                    <h3 className="text-sm font-semibold tracking-tight md:text-base">{c.title}</h3>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  <p className="mt-4 text-xs font-medium text-[#8a9a7b]">✓ {c.foot}</p>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
