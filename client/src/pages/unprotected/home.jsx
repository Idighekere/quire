import { lazy, Suspense } from 'react'
import Hero from '@/components/home/hero'
import PinnedStory from '@/components/home/pinned-story'
import CtaSection from '@/components/home/cta-section'

// Below the fold — split out so the landing paints hero first.
// RecentlyAdded also gates its API call behind IntersectionObserver.
const RecentlyAdded = lazy(() => import('@/components/home/recently-added'))

const Home = () => {
  return (
    <>
      <Hero />
      <PinnedStory />
      <Suspense fallback={null}>
        <RecentlyAdded />
      </Suspense>
      <CtaSection />
    </>
  )
}

export default Home