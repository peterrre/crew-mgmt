'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { archiveEvent, deleteEvent } from '@/lib/actions/events'
import { Archive, Trash2 } from 'lucide-react'

interface EventActionsProps {
  eventId: string
  eventName: string
}

export function EventActions({ eventId, eventName }: EventActionsProps) {
  const router = useRouter()
  const [isArchiving, setIsArchiving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      await archiveEvent(eventId)
    } catch (error) {
      console.error('Failed to archive event:', error)
      setIsArchiving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteEvent(eventId)
    } catch (error) {
      console.error('Failed to delete event:', error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isArchiving}>
            <Archive className="w-4 h-4 mr-2" />
            {isArchiving ? 'Archiving...' : 'Archive'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{eventName}&quot;? The event will be hidden from the main list but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &quot;{eventName}&quot;? This action cannot be undone. All shifts, crew assignments, and requests associated with this event will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
