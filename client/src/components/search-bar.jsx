import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MagnifyingGlass as Search } from "@phosphor-icons/react"
import { useCourseParams } from "@/contexts"


export default function SearchBar({ defaultValue = "", onSearch }) {
  const [query, setQuery] = useState(defaultValue)

  const { setCourseSearchText } = useCourseParams()
  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
    setCourseSearchText(query)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 md:w-3/5">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search courses by title or code..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  )
}