import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookCard } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllBooksQueryOptions } from "@/services";

const RECENT_LIMIT = 6;

function RecentlyAddedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array(RECENT_LIMIT)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ))}
    </div>
  );
}

export default function RecentlyAdded() {
  const { data, isPending, error } = useQuery(
    getAllBooksQueryOptions({ page: 1, limit: RECENT_LIMIT })
  );

  if (error) return null;
  if (!isPending && !(data?.data?.books?.length > 0)) return null;

  const books = data?.data?.books || [];

  return (
    <section className="w-full px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-sky px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
              Recently added
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              New materials in the library
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground md:text-xl">
              The latest textbooks, past questions, and lecture notes shared by
              the community.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link to="/materials">Browse all materials</Link>
          </Button>
        </div>

        {isPending ? (
          <RecentlyAddedSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}