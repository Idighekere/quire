import { Hero, RecentlyAdded } from '@/components'
import PinnedStory from '@/components/home/pinned-story'
import CtaSection from '@/components/home/cta-section'
import React from 'react'

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