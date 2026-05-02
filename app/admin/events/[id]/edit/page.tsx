'use client'

import { useEffect, useState, useCallback } from 'react'
import { EventForm } from '@/components/event-form'
import { updateEvent, getUsers } from '@/lib/actions/events'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  acceptingVolunteers: boolean
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvent = useCallback(async () => {
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
  }, [params.id])

  useEffect(() => {
    fetchEvent()
    getUsers().then(setUsers)
  }, [fetchEvent])

  const handleCancel = () => {
    router.push(`/admin/events/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background flex items-center justify-center">
        <div className="text-foregroundSecondary">Loading...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background flex items-center justify-center">
        <div className="text-foregroundSecondary">Event not found</div>
      </div>
    )
  }

  const toLocalDateTimeInputValue = (dateValue: Date | string | null | undefined) => {
    const date = dateValue ? new Date(dateValue) : null
    if (!date || isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 16)
  }

  const initialData = {
    name: event.name,
    description: event.description || '',
    startDate: toLocalDateTimeInputValue(event.startDate),
    endDate: toLocalDateTimeInputValue(event.endDate),
    location: event.location || '',
    contactPersonId: event.contactPersonId || '',
    acceptingVolunteers: event.acceptingVolunteers,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      <header className="sticky top-0 z-50 bg-backgroundSecondary/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href={`/admin/events/${params.id}`} className="flex items-center space-x-2 text-blue hover:text-foregroundPrimary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Event</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foregroundPrimary mb-8">Edit Event</h1>
        <EventForm
          initialData={initialData}
          users={users.map(u => ({ id: u.id, name: u.name || 'Unknown' }))}
          onSubmit={updateEvent.bind(null, params.id)}
          onCancel={handleCancel}
          submitLabel="Update Event"
        />
      </main>
    </div>
  )
}
