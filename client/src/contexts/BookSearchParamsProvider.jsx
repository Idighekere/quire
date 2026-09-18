import React, {  useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookSearchContext } from './book-context'


export function BookSearchProvider ({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [bookParams, setBookParams] = useState({
    courseCode: '',
    category: 'all',
    query: ''
  })

const [bookSearchText, setBookSearchText] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const parsedParams = {
      courseCode: params.get('courseCode') || '',
      category: params.get('category') || 'all',
      query: params.get('query') || ''
    }

    setBookParams(parsedParams)
    // The URL is the source of truth for search text so shared links
    // (e.g. fulfilled requests) arrive with the search bar pre-filled.
    setBookSearchText(parsedParams.query)
    setIsLoading(false)
  }, [location.search])

  const updateBookParams = newParams => {
    const updatedParams = { ...bookParams, ...newParams }

    // Update the URL
    const params = new URLSearchParams()
    Object.entries(updatedParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    navigate({ search: params.toString() }, { replace: true })

    // Also update the local state
    setBookParams(updatedParams)
  }

  const value = {
    bookParams,
    updateBookParams,
    isLoading,
    bookSearchText,
    setBookSearchText
  }

  return (
    <BookSearchContext.Provider value={value}>
      {children}
    </BookSearchContext.Provider>
  )
}
