'use client'

import { useEffect, useState } from 'react'
import { EventForm } from '@/components/event-form'
import { updateEvent, getUsers } from '@/lib/actions/events'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { themeConfig } from '@/lib/theme-config'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

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

  const handleCancel = () => {
    router.push(`/admin/events/${params.id}`)
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
        <div className="container mx-auto py-8">Event not found</div>
      </div>
    )
  }

  const initialData = {
    name: event.name,
    description: event.description || '',
    startDate: new Date(event.startDate).toISOString().slice(0, 16),
    endDate: new Date(event.endDate).toISOString().slice(0, 16),
    location: event.location || '',
    contactPersonId: event.contactPersonId || '',
    acceptingVolunteers: event.acceptingVolunteers,
  }

  return (
    <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href={`/admin/events/${params.id}`} className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Event</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/events">Events</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/admin/events/${params.id}`}>{event.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold mb-8">Edit Event</h1>
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