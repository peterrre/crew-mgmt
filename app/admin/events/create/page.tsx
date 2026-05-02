'use client'

import { useEffect, useState } from 'react'
import { EventForm } from '@/components/event-form'
import { createEvent, getUsers } from '@/lib/actions/events'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreateEventPage() {
  const router = useRouter()
  const [users, setUsers] = useState<{ id: string; name: string | null }[]>([])

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  const handleCancel = () => {
    router.push('/admin/events')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      <header className="sticky top-0 z-50 bg-backgroundSecondary/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/events" className="flex items-center space-x-2 text-blue hover:text-foregroundPrimary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Events</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foregroundPrimary mb-8">Create Event</h1>
        <EventForm
          users={users.map(u => ({ id: u.id, name: u.name || 'Unknown' }))}
          onSubmit={createEvent}
          onCancel={handleCancel}
          submitLabel="Create Event"
        />
      </main>
    </div>
  )
}
