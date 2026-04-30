"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Loader2, CheckCircle2 } from "lucide-react";

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

function isShiftMatching(
  shift: Shift,
  availability: AvailabilitySlot[],
): boolean {
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
        // Use the unassigned shifts endpoint so volunteers can see available shifts
        const response = await fetch("/api/shifts/unassigned");
        if (response.ok) {
          const data = await response.json();
          setShifts(data.shifts || []);
        }
      } catch (error) {
        console.error("Error fetching shifts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const { matchingShifts, nonMatchingShifts } = useMemo(() => {
    if (!shifts.length) return { matchingShifts: [], nonMatchingShifts: [] };

    const matching: Shift[] = [];
    const nonMatching: Shift[] = [];

    shifts.forEach((shift) => {
      if (availability.length > 0 && isShiftMatching(shift, availability)) {
        matching.push(shift);
      } else {
        nonMatching.push(shift);
      }
    });

    return { matchingShifts: matching, nonMatchingShifts: nonMatching };
  }, [shifts, availability]);

  if (loading) {
    return (
      <div className="w-64 border-l border-border p-4 bg-backgroundSecondary">
        <h4 className="font-semibold text-sm mb-3 text-foregroundPrimary flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Available Shifts
        </h4>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-foregroundTertiary" />
        </div>
      </div>
    );
  }

  const totalShifts = shifts.length;

  return (
    <div className="w-64 border-l border-border p-4 bg-backgroundSecondary overflow-y-auto">
      <h4 className="font-semibold text-sm mb-3 text-foregroundPrimary flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Available Shifts
      </h4>

      {totalShifts === 0 ? (
        <p className="text-foregroundTertiary text-sm">
          No unassigned shifts available
        </p>
      ) : (
        <div className="space-y-3">
          {matchingShifts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {matchingShifts.length} matching your availability
              </p>
              <div className="space-y-2">
                {matchingShifts.slice(0, 5).map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-green/10 rounded-lg p-3 border border-green/30"
                  >
                    <p className="font-medium text-sm text-foregroundPrimary truncate">
                      {shift.title}
                    </p>
                    {shift.event?.name && (
                      <p className="text-xs text-foregroundTertiary truncate">
                        {shift.event.name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-foregroundSecondary">
                      <Clock className="w-3 h-3" />
                      {format(new Date(shift.start), "MMM d, HH:mm")} -{" "}
                      {format(new Date(shift.end), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonMatchingShifts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foregroundTertiary mb-2">
                {availability.length === 0 ? "All" : "Other"} open shifts (
                {nonMatchingShifts.length})
              </p>
              <div className="space-y-2">
                {nonMatchingShifts
                  .slice(0, matchingShifts.length > 0 ? 3 : 8)
                  .map((shift) => (
                    <div
                      key={shift.id}
                      className="bg-backgroundSecondary rounded-lg p-3 border border-border opacity-75"
                    >
                      <p className="font-medium text-sm text-foregroundSecondary truncate">
                        {shift.title}
                      </p>
                      {shift.event?.name && (
                        <p className="text-xs text-foregroundTertiary truncate">
                          {shift.event.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-foregroundTertiary">
                        <Clock className="w-3 h-3" />
                        {format(new Date(shift.start), "MMM d, HH:mm")} -{" "}
                        {format(new Date(shift.end), "HH:mm")}
                      </div>
                    </div>
                  ))}
                {nonMatchingShifts.length >
                  (matchingShifts.length > 0 ? 3 : 8) && (
                  <p className="text-xs text-foregroundTertiary text-center">
                    +
                    {nonMatchingShifts.length -
                      (matchingShifts.length > 0 ? 3 : 8)}{" "}
                    more
                  </p>
                )}
              </div>
            </div>
          )}

          {availability.length === 0 && (
            <p className="text-xs text-blue mt-2">
              Add availability to see which shifts match
            </p>
          )}
        </div>
      )}
    </div>
  );
}
