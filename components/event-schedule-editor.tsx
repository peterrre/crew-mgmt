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
      <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface ShiftAssignment {
  id: string;
  role: 'RESPONSIBLE' | 'HELPER';
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

interface CrewMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface AvailabilitySlot {
  id: string;
  start: Date;
  end: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface EventScheduleEditorProps {
  eventId: string;
  eventStartDate: Date;
  eventEndDate: Date;
}

export default function EventScheduleEditor({
  eventId,
  eventStartDate,
  eventEndDate,
}: EventScheduleEditorProps) {
  const { shifts, crew, availability, shiftsLoading, refreshShifts, refreshAll } = useEventData();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
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

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    // Don't open edit dialog for availability slots
    if (event.isAvailability) return;
    setEditingShift(event);
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-lg font-semibold text-sky-900 dark:text-white">
            Schedule ({shifts.length} shifts)
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs sm:text-sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'assigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('assigned')}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Assigned ({counts.crew})</span>
              <span className="sm:hidden">Assign ({counts.crew})</span>
            </Button>
            <Button
              variant={filter === 'unassigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unassigned')}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Unassigned ({counts.unassigned})</span>
              <span className="sm:hidden">Unass ({counts.unassigned})</span>
            </Button>
          </div>

          <div className="hidden sm:block border-l border-gray-300 dark:border-slate-600 mx-1"></div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={showAvailability ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAvailability(!showAvailability)}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Show Availability</span>
              <span className="sm:hidden">Avail</span>
            </Button>
            <Button
              variant={showMatchingOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMatchingOnly(!showMatchingOnly)}
              className="text-xs sm:text-sm"
            >
              Matching
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-sky-700 dark:text-slate-400 mb-4">
        <span className="hidden sm:inline">Click and drag on the calendar to create shifts</span>
        <span className="sm:hidden">Tap calendar to create shifts</span>
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-slate-700 p-4">
        {shiftsLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
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
          checkHelperAvailability={checkHelperAvailability}
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
