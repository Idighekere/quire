import React from 'react'
import NavBar from './navbar'
import Footer from './footer'
import ScrollToTop from './scroll-to-top'
import { Outlet } from 'react-router-dom'

const HomeSharedLayout = ({ children }) => {
  return (
    <>
      <ScrollToTop />
      <NavBar />
      {children ? children : <Outlet />}
      <Footer />
    </>
  )
}

export default HomeSharedLayout
