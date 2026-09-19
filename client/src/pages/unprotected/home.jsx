import Hero from '@/components/home/hero'
import PinnedStory from '@/components/home/pinned-story'
import RecentlyAdded from '@/components/home/recently-added'
import CtaSection from '@/components/home/cta-section'

// NOTE: RecentlyAdded stays EAGER on purpose. It renders a skeleton with
// reserved space on first paint; lazy-loading it behind Suspense=null made
// the whole section pop in ~300ms after FCP and shoved the CTA down —
// a CLS hit inside the Lighthouse measurement window. The API call itself
// is still gated behind IntersectionObserver inside the component, so
// below-fold data never contends with the critical path.
const Home = () => {
  return (
    <>
      <Hero />
      <PinnedStory />
      <RecentlyAdded />
      <CtaSection />
    </>
  )
}

export default Home