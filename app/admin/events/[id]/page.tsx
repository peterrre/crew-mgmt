import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import EventDetailTabs from '@/components/event-detail-tabs'
import { EventDataProvider } from '@/contexts/event-data-context'
import { EventDetailHeader } from '@/components/event-detail-header'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'

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
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink asChild>
              <Link href="/">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block" />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/events">Events</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{event.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <EventDetailHeader
        event={{
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          isArchived: event.isArchived,
        }}
      />

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