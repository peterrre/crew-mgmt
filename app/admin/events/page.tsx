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
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      <header className="sticky top-0 z-50 bg-backgroundSecondary/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-blue hover:text-foregroundPrimary transition-colors">
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
