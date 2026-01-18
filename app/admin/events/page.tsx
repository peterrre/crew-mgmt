import { prisma } from '@/lib/db'
import { EventsList } from '@/components/events-list'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

interface EventsPageProps {
  searchParams: { showArchived?: string }
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const showArchived = searchParams.showArchived === 'true'

  const events = await prisma.event.findMany({
    where: showArchived ? {} : { isArchived: { not: true } },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      description: true,
      location: true,
      isArchived: true,
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="sticky top-0 z-50 bg-amber-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EventsList events={events} showArchived={showArchived} />
      </main>
    </div>
  )
}