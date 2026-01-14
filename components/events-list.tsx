'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface Event {
  id: string
  name: string
  startDate: Date
  endDate: Date
  description: string | null
  location: string | null
}

interface EventsListProps {
  events: Event[]
}

export function EventsList({ events }: EventsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        <Button asChild>
          <Link href="/admin/events/create">Create Event</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{event.name}</span>
                <Badge variant="outline">
                  {format(event.startDate, 'MMM dd')} - {format(event.endDate, 'MMM dd')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {event.description || 'No description'}
              </p>
              {event.location && (
                <p className="text-sm text-muted-foreground">
                  📍 {event.location}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/events/${event.id}`}>View</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No events found.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/events/create">Create your first event</Link>
          </Button>
        </div>
      )}
    </div>
  )
}