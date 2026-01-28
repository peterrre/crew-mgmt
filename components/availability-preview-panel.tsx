'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface AvailabilitySlot {
  id?: string;
  start: string;
  end: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEnd?: string;
}

interface Shift {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  helperId: string | null;
  eventId: string;
  event?: {
    name: string;
  };
}

interface AvailabilityPreviewPanelProps {
  availability: AvailabilitySlot[];
}

function isShiftMatching(shift: Shift, availability: AvailabilitySlot[]): boolean {
  const shiftStart = new Date(shift.start);
  const shiftEnd = new Date(shift.end);

  return availability.some((slot) => {
    if (!slot.start || !slot.end) return false;
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    return shiftStart >= slotStart && shiftEnd <= slotEnd;
  });
}

export default function AvailabilityPreviewPanel({
  availability,
}: AvailabilityPreviewPanelProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await fetch('/api/shifts/unassigned');

        if (response.ok) {
          const data = await response.json();
          setShifts(data.shifts || []);
        } else {
          console.error('Failed to fetch unassigned shifts:', response.status);
        }
      } catch (error) {
        console.error('Error fetching unassigned shifts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const { matchingShifts, nonMatchingShifts } = useMemo(() => {
    if (!shifts.length) {
      return { matchingShifts: [], nonMatchingShifts: [] };
    }

    const matching: Shift[] = [];
    const nonMatching: Shift[] = [];

    shifts.forEach((shift) => {
      const matches = availability.length > 0 && isShiftMatching(shift, availability);

      if (matches) {
        matching.push(shift);
      } else {
        nonMatching.push(shift);
      }
    });

    return { matchingShifts: matching, nonMatchingShifts: nonMatching };
  }, [shifts, availability]);

  if (loading) {
    return (
      <div className="w-64 border-l border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900">
        <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Available Shifts
        </h4>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const totalShifts = shifts.length;

  return (
    <div className="w-64 border-l border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900 overflow-y-auto">
      <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Available Shifts
      </h4>

      {totalShifts === 0 ? (
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          No unassigned shifts available
        </p>
      ) : (
        <div className="space-y-3">
          {matchingShifts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {matchingShifts.length} matching your availability
              </p>
              <div className="space-y-2">
                {matchingShifts.slice(0, 5).map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-300 dark:border-green-700"
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {shift.title}
                    </p>
                    {shift.event?.name && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {shift.event.name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(shift.start), 'MMM d, HH:mm')} -{' '}
                      {format(new Date(shift.end), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonMatchingShifts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
                {availability.length === 0 ? 'All' : 'Other'} open shifts ({nonMatchingShifts.length})
              </p>
              <div className="space-y-2">
                {nonMatchingShifts.slice(0, matchingShifts.length > 0 ? 3 : 8).map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700 opacity-75"
                  >
                    <p className="font-medium text-sm text-gray-700 dark:text-slate-300 truncate">
                      {shift.title}
                    </p>
                    {shift.event?.name && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {shift.event.name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(shift.start), 'MMM d, HH:mm')} -{' '}
                      {format(new Date(shift.end), 'HH:mm')}
                    </div>
                  </div>
                ))}
                {nonMatchingShifts.length > (matchingShifts.length > 0 ? 3 : 8) && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                    +{nonMatchingShifts.length - (matchingShifts.length > 0 ? 3 : 8)} more
                  </p>
                )}
              </div>
            </div>
          )}

          {availability.length === 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Add availability to see which shifts match
            </p>
          )}
        </div>
      )}
    </div>
  );
}
