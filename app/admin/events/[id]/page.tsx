import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { format } from 'date-fns'
import EventDetailTabs from '@/components/event-detail-tabs'

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

  // Count pending shift requests for this event
  const pendingRequestsCount = await prisma.shiftRequest.count({
    where: {
      eventId: params.id,
      status: 'PENDING',
    },
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground mt-2">
            {format(event.startDate, 'PPP')} - {format(event.endDate, 'PPP')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/events/${event.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit Event
          </Link>
          <Link href="/admin/events" className={buttonVariants({ variant: "outline" })}>
            Back to Events
          </Link>
        </div>
      </div>

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
        crewCount={event._count.crew}
        shiftsCount={event._count.shifts}
        pendingRequestsCount={pendingRequestsCount}
      />
    </div>
  )
}