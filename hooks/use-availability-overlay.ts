import { useMemo } from 'react';

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

interface UseAvailabilityOverlayOptions {
  shifts: Shift[];
  availability: AvailabilitySlot[];
  showAvailability: boolean;
}

/**
 * Hook that merges shifts with availability slots for calendar display.
 * Calculates free time by subtracting assigned shifts from availability slots.
 */
export function useAvailabilityOverlay({
  shifts,
  availability,
  showAvailability,
}: UseAvailabilityOverlayOptions) {
  return useMemo(() => {
    const events: any[] = [...shifts];

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
  }, [shifts, availability, showAvailability]);
}
