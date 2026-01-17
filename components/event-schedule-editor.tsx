'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, X, Loader2 } from 'lucide-react';
import { View } from 'react-big-calendar';
import dynamic from 'next/dynamic';
import EventShiftRequestsPanel from '@/components/event-shift-requests-panel';

const BigCalendar = dynamic(() => import('@/components/big-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helperId: string | null;
  eventId: string;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
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
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showAvailability, setShowAvailability] = useState(true);
  const [showMatchingOnly, setShowMatchingOnly] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date(eventStartDate));
  const [calendarView, setCalendarView] = useState<View>('week');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, crewRes, requestsRes, availabilityRes] = await Promise.all([
        fetch(`/api/shifts?eventId=${eventId}`),
        fetch(`/api/events/${eventId}/crew`),
        fetch(`/api/events/${eventId}/shift-requests`),
        fetch(`/api/events/${eventId}/availability`),
      ]);

      if (shiftsRes.ok) {
        const data = await shiftsRes.json();
        const eventShifts = (data?.shifts || [])
          .filter((s: any) => s.eventId === eventId)
          .map((shift: any) => ({
            ...shift,
            start: new Date(shift.start),
            end: new Date(shift.end),
          }));
        setShifts(eventShifts);
      }

      if (crewRes.ok) {
        const data = await crewRes.json();
        setCrew(data?.crew || []);
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data?.requests || []);
      }

      if (availabilityRes.ok) {
        const data = await availabilityRes.json();
        const availabilitySlots = (data?.availability || []).map((slot: any) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));
        setAvailability(availabilitySlots);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Merge shifts with availability for calendar display
  const calendarEvents = useMemo(() => {
    const events: any[] = [...filteredShifts];

    if (showAvailability) {
      // Calculate free time by subtracting assigned shifts from availability slots
      const freeAvailability: any[] = [];

      availability.forEach((slot) => {
        // Find all shifts assigned to this user that overlap with this availability slot
        const userShifts = shifts.filter(
          (shift) =>
            shift.helperId === slot.userId &&
            shift.start < slot.end &&
            shift.end > slot.start
        );

        if (userShifts.length === 0) {
          // No overlapping shifts, entire slot is available
          freeAvailability.push({
            id: slot.id,
            title: `Available: ${slot.user.name || slot.user.email}`,
            start: slot.start,
            end: slot.end,
            isAvailability: true,
            userId: slot.userId,
            user: slot.user,
          });
        } else {
          // Calculate free periods by subtracting shift times
          const sortedShifts = [...userShifts].sort(
            (a, b) => a.start.getTime() - b.start.getTime()
          );

          let currentStart = slot.start;

          sortedShifts.forEach((shift) => {
            // If there's a gap before this shift, add it as free time
            if (currentStart < shift.start) {
              freeAvailability.push({
                id: `${slot.id}-${currentStart.getTime()}`,
                title: `Available: ${slot.user.name || slot.user.email}`,
                start: currentStart,
                end: shift.start,
                isAvailability: true,
                userId: slot.userId,
                user: slot.user,
              });
            }
            // Move current start to after this shift
            currentStart = shift.end > currentStart ? shift.end : currentStart;
          });

          // If there's time remaining after the last shift
          if (currentStart < slot.end) {
            freeAvailability.push({
              id: `${slot.id}-${currentStart.getTime()}`,
              title: `Available: ${slot.user.name || slot.user.email}`,
              start: currentStart,
              end: slot.end,
              isAvailability: true,
              userId: slot.userId,
              user: slot.user,
            });
          }
        }
      });

      events.push(...freeAvailability);
    }

    return events;
  }, [filteredShifts, availability, showAvailability, shifts]);

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

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/shift-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        }
      );

      if (response.ok) {
        await fetchData(); // Refresh all data
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/shift-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED' }),
        }
      );

      if (response.ok) {
        await fetchData(); // Refresh all data
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div>
      <EventShiftRequestsPanel
        requests={requests}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-lg font-semibold text-sky-900 dark:text-white">
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
          <div className="border-l border-gray-300 dark:border-slate-600 mx-1"></div>
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

      <p className="text-sm text-sky-700 dark:text-slate-400 mb-4">
        Click and drag on the calendar to create shifts
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-slate-700 p-4">
        {loading ? (
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
        <CreateEventShiftDialog
          eventId={eventId}
          crew={crew}
          selectedSlot={selectedSlot}
          checkHelperAvailability={checkHelperAvailability}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
            fetchData();
          }}
        />
      )}

      {editingShift && (
        <EditEventShiftDialog
          shift={editingShift}
          crew={crew}
          checkHelperAvailability={checkHelperAvailability}
          onClose={() => setEditingShift(null)}
          onSuccess={() => {
            setEditingShift(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Create Shift Dialog for Event
interface CreateEventShiftDialogProps {
  eventId: string;
  crew: CrewMember[];
  selectedSlot: any;
  checkHelperAvailability: (userId: string, start: Date, end: Date) => boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateEventShiftDialog({
  eventId,
  crew,
  selectedSlot,
  checkHelperAvailability,
  onClose,
  onSuccess,
}: CreateEventShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');

  const formatLocalDateTime = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    start: selectedSlot?.start ? formatLocalDateTime(selectedSlot.start) : '',
    end: selectedSlot?.end ? formatLocalDateTime(selectedSlot.end) : '',
    helperId: 'unassigned',
  });

  // Check availability when helper or time changes
  useEffect(() => {
    if (formData.helperId && formData.helperId !== 'unassigned' && formData.start && formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      const hasAvailability = checkHelperAvailability(formData.helperId, startDate, endDate);

      if (!hasAvailability) {
        const selectedCrew = crew.find((c) => c.userId === formData.helperId);
        const name = selectedCrew?.user.name || selectedCrew?.user.email || 'This crew member';
        setAvailabilityWarning(`${name} does not have availability during this time slot.`);
      } else {
        setAvailabilityWarning('');
      }
    } else {
      setAvailabilityWarning('');
    }
  }, [formData.helperId, formData.start, formData.end, checkHelperAvailability, crew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const helperIdToSend =
        formData.helperId === 'unassigned' || formData.helperId === ''
          ? null
          : formData.helperId;

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          start: new Date(formData.start).toISOString(),
          end: new Date(formData.end).toISOString(),
          helperId: helperIdToSend,
          eventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create shift');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Create Shift</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Shift Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Stage Setup, Bar, Security"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start">Start Time</Label>
            <Input
              id="start"
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end">End Time</Label>
            <Input
              id="end"
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="helper">Assign Crew Member (optional)</Label>
            <Select
              value={formData.helperId}
              onValueChange={(value) => setFormData({ ...formData, helperId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a crew member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {crew.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.name || member.user.email} ({member.user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {crew.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No crew assigned to this event yet. Add crew members first.
              </p>
            )}
            {availabilityWarning && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                ⚠️ {availabilityWarning}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shift'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Shift Dialog for Event
interface EditEventShiftDialogProps {
  shift: Shift;
  crew: CrewMember[];
  checkHelperAvailability: (userId: string, start: Date, end: Date) => boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function EditEventShiftDialog({
  shift,
  crew,
  checkHelperAvailability,
  onClose,
  onSuccess,
}: EditEventShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');

  const formatLocalDateTime = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: shift.title,
    start: formatLocalDateTime(shift.start),
    end: formatLocalDateTime(shift.end),
    helperId: shift.helperId || 'unassigned',
  });

  // Check availability when helper or time changes
  useEffect(() => {
    if (formData.helperId && formData.helperId !== 'unassigned' && formData.start && formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      const hasAvailability = checkHelperAvailability(formData.helperId, startDate, endDate);

      if (!hasAvailability) {
        const selectedCrew = crew.find((c) => c.userId === formData.helperId);
        const name = selectedCrew?.user.name || selectedCrew?.user.email || 'This crew member';
        setAvailabilityWarning(`${name} does not have availability during this time slot.`);
      } else {
        setAvailabilityWarning('');
      }
    } else {
      setAvailabilityWarning('');
    }
  }, [formData.helperId, formData.start, formData.end, checkHelperAvailability, crew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const helperIdToSend =
        formData.helperId === 'unassigned' || formData.helperId === ''
          ? null
          : formData.helperId;

      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          start: new Date(formData.start).toISOString(),
          end: new Date(formData.end).toISOString(),
          helperId: helperIdToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update shift');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete shift');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Edit Shift</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Shift Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-start">Start Time</Label>
            <Input
              id="edit-start"
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-end">End Time</Label>
            <Input
              id="edit-end"
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-helper">Assign Crew Member</Label>
            <Select
              value={formData.helperId}
              onValueChange={(value) => setFormData({ ...formData, helperId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a crew member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {crew.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.name || member.user.email} ({member.user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availabilityWarning && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                ⚠️ {availabilityWarning}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
            >
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
