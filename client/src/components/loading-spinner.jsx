import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import Preloader from "@/components/ui/preloader"

function LoadingSpinner({ children, delay = 2000 }) {
  const location = useLocation()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Show preloader on location change
    setIsLoading(true)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [location.pathname, delay])

  if (isLoading && location.pathname !== "/") {
    return <Preloader fullScreen message="" />
  }

  return children
}

export default LoadingSpinner