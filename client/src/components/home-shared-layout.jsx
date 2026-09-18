import React from 'react'
import NavBar from './navbar'
import Footer from './footer'
import ScrollToTop from './scroll-to-top'
import { Outlet } from 'react-router-dom'

const HomeSharedLayout = ({ children }) => {
  return (
    <>
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <NavBar />
      <main id="main-content">
        {children ? children : <Outlet />}
      </main>
      <Footer />
    </>
  )
}

export default HomeSharedLayout
