import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton loader for table rows
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-96" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for card grids (events, applications, etc.)
 */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for dashboard stats cards
 */
export function StatsSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="w-5 h-5" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for calendar views
 */
export function CalendarSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Calendar grid */}
        <div className="space-y-4">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>

          {/* Calendar days */}
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <Skeleton key={dayIndex} className="h-24 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
