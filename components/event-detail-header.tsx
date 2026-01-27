'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit, Archive, Trash2 } from 'lucide-react';
import { archiveEvent, deleteEvent } from '@/lib/actions/events';

interface EventDetailHeaderProps {
  event: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isArchived: boolean;
  };
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveEvent(event.id);
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Failed to archive event:', error);
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-start mb-8 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">{event.name}</h1>
            {event.isArchived && <Badge variant="secondary">Archived</Badge>}
          </div>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {format(event.startDate, 'PPP')} - {format(event.endDate, 'PPP')}
          </p>
        </div>

        {/* Desktop: Show all buttons */}
        <div className="hidden md:flex gap-2 flex-shrink-0">
          {!event.isArchived && (
            <Link href={`/admin/events/${event.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Event
              </Button>
            </Link>
          )}
          <Link href="/admin/events">
            <Button variant="outline">Back to Events</Button>
          </Link>
          {!event.isArchived && (
            <>
              <Button
                variant="outline"
                disabled={isArchiving}
                onClick={() => setShowArchiveDialog(true)}
              >
                <Archive className="w-4 h-4 mr-2" />
                {isArchiving ? 'Archiving...' : 'Archive'}
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>

        {/* Mobile: Dropdown menu */}
        <div className="md:hidden flex gap-2 flex-shrink-0">
          <Link href="/admin/events">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
          {!event.isArchived && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="flex items-center cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={isArchiving}
                  className="cursor-pointer"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {isArchiving ? 'Archiving...' : 'Archive Event'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{event.name}&quot;? The event will be hidden
              from the main list but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &quot;{event.name}&quot;? This action
              cannot be undone. All shifts, crew assignments, and requests associated with this
              event will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
