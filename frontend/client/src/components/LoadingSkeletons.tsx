import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder rows for table-like content.
 */
export function TableSkeleton({ rows = 3, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={cn(
                "h-4 animate-pulse rounded bg-accent",
                j === 0 && "w-1/3",
                j === 1 && "w-1/4",
                j === 2 && "w-16",
                j === 3 && "w-20",
                j === 4 && "w-12 ml-auto"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton card grid for sections with multiple cards.
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-lg bg-accent" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-accent" />
          </div>
          <div className="space-y-2">
            <div className="h-3 animate-pulse rounded bg-accent/70" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-accent/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton hero section with text placeholders.
 */
export function HeroSkeleton() {
  return (
    <div className="container py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-accent" />
          <div className="space-y-2">
            <div className="h-10 w-full animate-pulse rounded bg-accent" />
            <div className="h-10 w-4/5 animate-pulse rounded bg-accent" />
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-accent/70" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-accent/70" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 animate-pulse rounded-md bg-accent" />
            <div className="h-10 w-28 animate-pulse rounded-md bg-accent" />
          </div>
        </div>
        <div className="hidden aspect-[4/3] animate-pulse rounded-2xl bg-accent lg:block" />
      </div>
    </div>
  );
}

/**
 * Single skeleton item for list/card layouts.
 */
export function ItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <div className="size-10 animate-pulse rounded-lg bg-accent" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-accent" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-accent/70" />
      </div>
    </div>
  );
}
