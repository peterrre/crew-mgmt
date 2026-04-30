'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, LogOut, ArrowLeft } from 'lucide-react';
import { View } from 'react-big-calendar';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CreateShiftDialog from '@/components/create-shift-dialog';
import EditShiftDialog from '@/components/edit-shift-dialog';
import { ThemeToggle } from '@/components/theme-toggle';

// Function to subtract overlapping intervals from an availability slot
function subtractIntervals(slot: { start: Date; end: Date }, subtractions: { start: Date; end: Date }[]): { start: Date; end: Date }[] {
  if (subtractions.length === 0) return [slot];

  // Sort subtractions by start time
  const sortedSubs = subtractions.sort((a, b) => a.start.getTime() - b.start.getTime());

  const result: { start: Date; end: Date }[] = [];
  let currentStart = slot.start;

  for (const sub of sortedSubs) {
    // If subtraction starts after current slot end, skip
    if (sub.start >= slot.end) continue;
    // If subtraction ends before current start, skip
    if (sub.end <= currentStart) continue;

    // If there's a gap before subtraction, add it
    if (currentStart < sub.start) {
      result.push({ start: currentStart, end: sub.start });
    }

    // Move current start to end of subtraction, but not beyond slot end
    currentStart = new Date(Math.max(currentStart.getTime(), sub.end.getTime()));
    if (currentStart >= slot.end) break;
  }

  // Add remaining part if any
  if (currentStart < slot.end) {
    result.push({ start: currentStart, end: slot.end });
  }

  return result;
}

// Function to adjust availability slots based on assigned shifts for the same helper
function adjustAvailabilitySlots(availabilitySlots: Shift[], assignedShifts: Shift[]): Shift[] {
  const adjusted: Shift[] = [];

  // Group availability by helper
  const availByHelper = new Map<string, Shift[]>();
  availabilitySlots.forEach(slot => {
    const helperId = slot.helper?.id;
    if (helperId) {
      if (!availByHelper.has(helperId)) availByHelper.set(helperId, []);
      availByHelper.get(helperId)!.push(slot);
    }
  });

  // For each helper, adjust their availability
  availByHelper.forEach((slots, helperId) => {
    const helperAssigned = assignedShifts.filter(s => s.helperId === helperId);
    slots.forEach(slot => {
      const remaining = subtractIntervals(slot, helperAssigned);
      remaining.forEach(rem => {
        adjusted.push({
          ...slot,
          id: `${slot.id}-${rem.start.getTime()}-${rem.end.getTime()}`, // Generate unique id for split slots
          start: rem.start,
          end: rem.end,
        });
      });
    });
  });

  return adjusted;
}

const BigCalendar = dynamic(() => import('@/components/big-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helperId: string | null;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  isAvailability?: boolean;
}

export default function ScheduleEditor() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned' | 'availability' | 'matching' | 'event-period'>('all');
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 6, 10));
  const [calendarView, setCalendarView] = useState<View>('week');

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        const shiftsData = (data?.shifts || []).map((shift: any) => ({
          ...shift,
          start: new Date(shift.start),
          end: new Date(shift.end),
        }));
        const availabilityData = (data?.availabilitySlots || []).map((slot: any) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));
        // Adjust availability slots based on assigned shifts
        const assignedShifts = shiftsData.filter((s: Shift) => s.helperId);
        const adjustedAvailability = adjustAvailabilitySlots(availabilityData, assignedShifts);
        // Remove duplicates by id
        const allShifts = [...shiftsData, ...adjustedAvailability];
        const uniqueShifts = allShifts.filter((shift, index, self) =>
          index === self.findIndex(s => s.id === shift.id)
        );
        setShifts(uniqueShifts);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = useMemo(() => {
    switch (filter) {
      case 'all':
        return shifts;
      case 'assigned':
        return shifts.filter(s => !s.isAvailability && s.helperId);
      case 'unassigned':
        return shifts.filter(s => !s.isAvailability && !s.helperId);
      case 'availability':
        return shifts.filter(s => s.isAvailability);
      case 'matching':
        const unassigned = shifts.filter(s => !s.isAvailability && !s.helperId);
        const availability = shifts.filter(s => s.isAvailability);
        const matchingUnassigned = unassigned.filter(u => availability.some(a => u.start < a.end && u.end > a.start));
        const matchingAvailability = availability.filter(a => unassigned.some(u => a.start < u.end && a.end > u.start));
        return [...matchingUnassigned, ...matchingAvailability];
      case 'event-period':
        const eventStart = new Date(2026, 6, 10);
        const eventEnd = new Date(2026, 6, 12, 23, 59, 59);
        return shifts.filter(s => s.start >= eventStart && s.end <= eventEnd);
      default:
        return shifts;
    }
  }, [shifts, filter]);

  const counts = useMemo(() => {
    const crew = shifts.filter(s => !s.isAvailability && s.helper?.role === 'CREW').length;
    const volunteer = shifts.filter(s => !s.isAvailability && s.helper?.role === 'VOLUNTEER').length;
    const unassigned = shifts.filter(s => !s.isAvailability && !s.helperId).length;
    const availability = shifts.filter(s => s.isAvailability).length;
    return { crew, volunteer, unassigned, availability };
  }, [shifts]);

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    console.log('Selected event:', event.title, event.isAvailability);
    setEditingShift(event);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-backgroundSecondary/80/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="dark:text-foregroundTertiary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-blue to-yellow rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foregroundPrimary">Schedule Editor</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-blue hover:text-foregroundPrimary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foregroundPrimary mb-2">Festival 2026 Schedule</h2>
          <p className="text-blue">July 10-12, 2026 - Click and drag to create shifts</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('all'); setCalendarView('week'); setCalendarDate(new Date(2026, 6, 5)); }} title="Show all shifts and availability slots">All</Button>
            <Button variant={filter === 'assigned' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('assigned'); setCalendarView('week'); setCalendarDate(new Date(2026, 6, 5)); }} title="Show only assigned shifts">Assigned</Button>
            <Button variant={filter === 'unassigned' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('unassigned'); setCalendarView('week'); setCalendarDate(new Date(2026, 6, 5)); }} title="Show only unassigned shifts">Unassigned</Button>
            <Button variant={filter === 'availability' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('availability'); setCalendarView('week'); setCalendarDate(new Date(2026, 6, 5)); }} title="Show only volunteer availability times">Availability</Button>
            <Button variant={filter === 'matching' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('matching'); setCalendarView('week'); setCalendarDate(new Date(2026, 6, 5)); }} title="Show unassigned shifts and overlapping volunteer availability for potential assignments">Matching</Button>
            <Button variant={filter === 'event-period' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('event-period'); setCalendarDate(new Date(2026, 6, 10)); setCalendarView('day'); }} title="Show only shifts during the event period (July 10-12, 2026)">Event Period</Button>
          </div>
        </div>

        <div className="bg-background rounded-2xl p-6 shadow-lg border border-border">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <BigCalendar
              events={filteredShifts}
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
      </main>

      {showCreateDialog && (
        <CreateShiftDialog
          selectedSlot={selectedSlot}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
            fetchShifts();
          }}
        />
      )}

      {editingShift && (
        <EditShiftDialog
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSuccess={() => {
            setEditingShift(null);
            fetchShifts();
          }}
        />
      )}
    </div>
  );
}