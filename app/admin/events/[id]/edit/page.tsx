'use client'

import { useEffect, useState } from 'react'
import { EventForm } from '@/components/event-form'
import { updateEvent, getUsers } from '@/lib/actions/events'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EditEventPageProps {
  params: { id: string }
}

interface Event {
  id: string
  name: string
  description: string | null
  startDate: Date
  endDate: Date
  location: string | null
  contactPersonId: string | null
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
    getUsers().then(setUsers)
  }, [])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!event) {
    return <div className="container mx-auto py-8">Event not found</div>
  }

  const initialData = {
    name: event.name,
    description: event.description || '',
    startDate: new Date(event.startDate).toISOString().slice(0, 16), // Format for datetime-local
    endDate: new Date(event.endDate).toISOString().slice(0, 16),
    location: event.location || '',
    contactPersonId: event.contactPersonId || '',
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Event</h1>
      <div className="space-y-6">
        <EventForm
          initialData={initialData}
          users={users.map(u => ({ id: u.id, name: u.name || 'Unknown' }))}
          onSubmit={updateEvent.bind(null, params.id)}
          submitLabel="Update Event"
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${params.id}`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}