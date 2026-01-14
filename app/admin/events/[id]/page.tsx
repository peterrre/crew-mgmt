import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

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
      contactPerson: true,
      shifts: {
        include: {
          helper: true,
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
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground mt-2">
            {format(event.startDate, 'PPP')} - {format(event.endDate, 'PPP')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/events/${event.id}/edit`} className={buttonVariants({ variant: "outline" })}>Edit Event</Link>
          <Link href="/admin/events" className={buttonVariants({ variant: "outline" })}>Back to Events</Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            )}
            {event.location && (
              <div>
                <h4 className="font-semibold">Location</h4>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
            )}
            {event.contactPerson && (
              <div>
                <h4 className="font-semibold">Contact Person</h4>
                <p className="text-sm text-muted-foreground">{event.contactPerson.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Shifts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Shifts ({event.shifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {event.shifts.length > 0 ? (
            <div className="space-y-2">
              {event.shifts.map((shift) => (
                <div key={shift.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <span className="font-medium">{shift.title}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {format(shift.start, 'HH:mm')} - {format(shift.end, 'HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {shift.helper?.name || 'Unassigned'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No shifts created yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}