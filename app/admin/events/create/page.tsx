'use client'

import { EventForm } from '@/components/event-form'
import { createEvent } from '@/lib/actions/events'

export default function CreateEventPage() {
  // Mock data - in real app, fetch from API
  const users = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
  ]

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Create Event</h1>
      <EventForm
        users={users}
        onSubmit={createEvent}
        submitLabel="Create Event"
      />
    </div>
  )
}