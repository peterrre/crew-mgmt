'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { View } from 'react-big-calendar';
import dynamic from 'next/dynamic';
import ShiftCreateDialog from '@/components/shift-create-dialog';
import ShiftEditDialog from '@/components/shift-edit-dialog';
import { useAvailabilityOverlay } from '@/hooks/use-availability-overlay';
import { useEventData } from '@/contexts/event-data-context';

const BigCalendar = dynamic(() => import('@/components/big-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface ShiftAssignment {
  id: string;
  role: "RESPONSIBLE" | "HELPER";
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helperId: string | null;
  eventId: string;
  minHelpers: number;
  maxHelpers: number;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  event?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location: string | null;
  };
  assignments: ShiftAssignment[];
}

interface EventScheduleEditorProps {
  eventId: string;
  eventStartDate: Date;
  eventEndDate?: Date;
}

export default function EventScheduleEditor({ eventId, eventStartDate }: EventScheduleEditorProps) {
  const { shifts, crew, availability, shiftsLoading, refreshAll } = useEventData();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<unknown>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showAvailability, setShowAvailability] = useState(true);
  const [showMatchingOnly, setShowMatchingOnly] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date(eventStartDate));
  const [calendarView, setCalendarView] = useState<View>('week');

  // Helper function to check if a user has availability during a time period
  const checkHelperAvailability = useCallback(
    (userId: string, shiftStart: Date, shiftEnd: Date) => {
      return availability.some((slot) => {
        if (slot.userId !== userId) return false;
        // Check if availability slot overlaps with shift
        return slot.start <= shiftStart && slot.end >= shiftEnd;
      });
    },
    [availability]
  );

  const filteredShifts = useMemo(() => {
    let filtered = shifts;
    switch (filter) {
      case 'assigned':
        filtered = shifts.filter((s) => s.helperId);
        break;
      case 'unassigned':
        filtered = shifts.filter((s) => !s.helperId);
        break;
      default:
        filtered = shifts;
    }

    // If "Matching" filter is enabled, only show shifts where helper has availability
    if (showMatchingOnly) {
      filtered = filtered.filter((shift) => {
        if (!shift.helperId) return false;
        return checkHelperAvailability(shift.helperId, shift.start, shift.end);
      });
    }

    return filtered;
  }, [shifts, filter, showMatchingOnly, checkHelperAvailability]);

  // Merge shifts with availability for calendar display using custom hook
  const calendarEvents = useAvailabilityOverlay({
    shifts: filteredShifts,
    availability,
    showAvailability,
  });

  const counts = useMemo(() => {
    const assigned = shifts.filter((s) => s.helperId).length;
    const unassigned = shifts.filter((s) => !s.helperId).length;
    return { crew: assigned, volunteer: 0, unassigned, availability: availability.length };
  }, [shifts, availability]);

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date } | any) => {
    setSelectedSlot(slotInfo);
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: { isAvailability?: boolean; [key: string]: any }) => {
    // Don't open edit dialog for availability slots
    if (event.isAvailability) return;
    setEditingShift(event as Shift);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-blue" />
          <h3 className="text-lg font-semibold text-foregroundPrimary">
            Schedule ({shifts.length} shifts)
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'assigned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('assigned')}
          >
            Assigned ({counts.crew})
          </Button>
          <Button
            variant={filter === 'unassigned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unassigned')}
          >
            Unassigned ({counts.unassigned})
          </Button>
          <div className="border-l border-border mx-1"></div>
          <Button
            variant={showAvailability ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAvailability(!showAvailability)}
          >
            Show Availability
          </Button>
          <Button
            variant={showMatchingOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMatchingOnly(!showMatchingOnly)}
          >
            Matching
          </Button>
        </div>
      </div>

      <p className="text-sm text-blue mb-4">
        Click and drag on the calendar to create shifts
      </p>

      <div className="bg-background rounded-xl border border-border p-4">
        {shiftsLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <BigCalendar
            events={calendarEvents}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            counts={counts}
            date={calendarDate}
            onNavigate={setCalendarDate}
            view={calendarView}
            onView={setCalendarView}
          />
        )}
      </div>

      {showCreateDialog && (
        <ShiftCreateDialog
          eventId={eventId}
          crew={crew}
          selectedSlot={selectedSlot}
          checkHelperAvailability={checkHelperAvailability}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
          }}
          onSuccess={async () => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
            await refreshAll();
          }}
        />
      )}

      {editingShift && (
        <ShiftEditDialog
          shift={editingShift}
          crew={crew}
          onClose={() => setEditingShift(null)}
          onSuccess={async () => {
            setEditingShift(null);
            await refreshAll();
          }}
        />
      )}
    </div>
  );
}