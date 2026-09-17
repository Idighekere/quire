import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Books as Library, MagnifyingGlass as Search, SignIn as LogIn, UploadSimple as Upload } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCard } from "@/components";
import Pagination from "@/components/pagination";
import { getAllBooksQueryOptions } from "@/services";
import { bookCategories } from "@/constants";
import { Skeleton } from "@/components/ui/skeleton";
import Preloader from "@/components/ui/preloader";

const ITEMS_PER_PAGE = 12;

export default function MaterialsArchivePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  const {
    data: booksResponse,
    isPending: isLoading,
    error,
  } = useQuery(
    getAllBooksQueryOptions({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchText,
      category: activeCategory === "all" ? "" : activeCategory,
    }),
  );

  const books = booksResponse?.data?.books || [];
  const pagination = booksResponse?.data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  };

  // Since backend handles filtering, we just use the books directly
  const displayBooks = books;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchText(searchQuery);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Preloader message="Loading archive" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full px-4 pb-14 pt-16 md:px-8 md:pb-16 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex flex-col items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-mint px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
                The full shelf
              </span>
              <div className="flex size-14 items-center justify-center rounded-md bg-card shadow-card">
                <Library weight="bold" className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl">
              Materials Archive
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Browse our complete collection of engineering materials. Search
              for textbooks, past questions, and lecture notes across all
              departments.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full px-4 pb-14 md:px-8 md:pb-20">
        <div className="mx-auto max-w-7xl">
          {/* Search and Filter Section */}
          <div className="mb-10 flex flex-col gap-6">
            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto flex w-full max-w-2xl items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search materials by title..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">
                <span className="hidden md:inline">Search</span>
                <Search className="h-4 w-4 md:hidden" />
              </Button>
            </form>

            {/* Category Tabs */}
            <Tabs
              value={activeCategory}
              onValueChange={handleCategoryChange}
              className="w-full"
            >
              <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                {Object.entries(bookCategories).map(([key, value]) => (
                  <TabsTrigger value={key} key={key}>
                    {value}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Results count */}
            {!isLoading && searchText && (
              <p className="text-center text-sm text-muted-foreground">
                Showing results for{" "}
                <strong className="font-medium text-foreground">"{searchText}"</strong>
              </p>
            )}
          </div>

          {/* Loading State */}
          {isLoading && <MaterialsSkeleton />}

          {/* Error State */}
          {error && (
            <div className="py-12 text-center">
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                {error.message ||
                  "Failed to load materials. Please try again later."}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && displayBooks.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 inline-flex size-14 items-center justify-center rounded-md bg-muted/60">
                <Library className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">No materials found</h2>
              <p className="mx-auto max-w-md text-muted-foreground">
                {searchText
                  ? `No materials match your search "${searchText}". Try a different search term or category.`
                  : "No materials available in this category yet."}
              </p>
              {(searchText || activeCategory !== "all") && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchText("");
                    setActiveCategory("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Books Grid */}
          {!isLoading && !error && displayBooks.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayBooks.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </section>

      {/* Contributor CTA Section */}
      <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center justify-between gap-6 rounded-lg border bg-card p-8 text-center shadow-card md:flex-row md:text-left">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-md bg-accent-sand text-foreground">
                <Upload weight="bold" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">Want to contribute?</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Help fellow students by uploading textbooks, past questions, or lecture notes.
                </p>
              </div>
            </div>
            <Link to="/auth/login">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to Upload
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MaterialsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-card">
            <div className="mb-4 flex gap-4">
              <Skeleton className="h-32 w-24 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        ))}
    </div>
  )
}

