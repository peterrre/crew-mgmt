'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { restoreEvent } from '@/lib/actions/events'
import { StaggerContainer, StaggerItem } from '@/components/ui/motion'

interface Event {
  id: string
  name: string
  startDate: Date
  endDate: Date
  description: string | null
  location: string | null
  isArchived: boolean
}

interface EventsListProps {
  events: Event[]
  showArchived: boolean
}

export function EventsList({ events, showArchived }: EventsListProps) {
  const router = useRouter()

  const handleToggleArchived = (checked: boolean) => {
    router.push(checked ? '/admin/events?showArchived=true' : '/admin/events')
  }

  const handleRestore = async (id: string) => {
    await restoreEvent(id)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foregroundPrimary">Events</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={handleToggleArchived}
            />
            <Label htmlFor="show-archived" className="text-foregroundSecondary">Show Archived</Label>
          </div>
          <Button asChild className="bg-blue hover:bg-blue/90 text-blueForeground">
            <Link href="/admin/events/create">Create Event</Link>
          </Button>
        </div>
      </div>

      <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <StaggerItem key={event.id}>
            <Card className={`bg-background rounded-2xl shadow-lg border border-border transition-all hover:shadow-xl hover:-translate-y-0.5 ${event.isArchived ? 'opacity-60' : ''}`}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start text-foregroundPrimary">
                  <span className="font-semibold">{event.name}</span>
                  <div className="flex gap-2">
                    {event.isArchived && (
                      <Badge variant="secondary" className="bg-backgroundSecondary text-foregroundSecondary">Archived</Badge>
                    )}
                    <Badge variant="outline" className="border-border text-foregroundSecondary">
                      {format(event.startDate, 'MMM dd')} - {format(event.endDate, 'MMM dd')}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foregroundSecondary mb-2">
                  {event.description || 'No description'}
                </p>
                {event.location && (
                  <p className="text-sm text-foregroundTertiary">
                    📍 {event.location}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild className="border-border text-foregroundPrimary hover:bg-backgroundSecondary">
                    <Link href={`/admin/events/${event.id}`}>View</Link>
                  </Button>
                  {event.isArchived ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(event.id)}
                      className="border-border text-foregroundPrimary hover:bg-backgroundSecondary"
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="border-border text-foregroundPrimary hover:bg-backgroundSecondary">
                      <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foregroundSecondary">No events found.</p>
          <Button asChild className="mt-4 bg-blue hover:bg-blue/90 text-blueForeground">
            <Link href="/admin/events/create">Create your first event</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
