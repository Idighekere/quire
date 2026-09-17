import React from 'react'
import NavBar from './navbar'
import Footer from './footer'
import ScrollToTop from './scroll-to-top'
import LoadingSpinner from './loading-spinner'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts'

const AuthLayout = ({ children }) => {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to='/dashboard' replace />
  }

  return (
    <>
      <ScrollToTop />
      <LoadingSpinner>
        <NavBar />
        {children ? children : <Outlet />}
        {/* <Footer /> */}
      </LoadingSpinner>
    </>
  )
}

export default AuthLayout
