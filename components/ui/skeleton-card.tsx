import { Skeleton } from '@/components/ui/skeleton';

/** Card-shaped skeleton loader for list views */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/** Row skeleton for table-like lists */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border/30">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="h-4 w-1/4 rounded ml-auto" />
    </div>
  );
}
