import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import EventDetailTabs from '@/components/event-detail-tabs'
import { EventDataProvider } from '@/contexts/event-data-context'
import { EventActions } from '@/components/event-actions'

export const dynamic = 'force-dynamic'

interface EventDetailPageProps {
  params: { id: string }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      location: true,
      contactPersonId: true,
      isArchived: true,
      contactPerson: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          shifts: true,
          crew: true,
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            {event.isArchived && <Badge variant="secondary">Archived</Badge>}
          </div>
          <p className="text-muted-foreground mt-2">
            {format(event.startDate, 'PPP')} - {format(event.endDate, 'PPP')}
          </p>
        </div>
        <div className="flex gap-2">
          {!event.isArchived && (
            <Link href={`/admin/events/${event.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              Edit Event
            </Link>
          )}
          <Link href="/admin/events" className={buttonVariants({ variant: "outline" })}>
            Back to Events
          </Link>
          {!event.isArchived && <EventActions eventId={event.id} eventName={event.name} />}
        </div>
      </div>

      <EventDataProvider eventId={event.id}>
        <EventDetailTabs
          event={{
            id: event.id,
            name: event.name,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            contactPerson: event.contactPerson,
          }}
        />
      </EventDataProvider>
    </div>
  )
}