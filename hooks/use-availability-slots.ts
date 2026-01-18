'use client';

import { useState, useEffect, useCallback } from 'react';
import { addDays, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

export interface AvailabilitySlot {
  id?: string;
  start: string;
  end: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEnd?: string;
}

interface UseAvailabilitySlotsReturn {
  slots: AvailabilitySlot[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  addSlot: (slot: Omit<AvailabilitySlot, 'id'>) => void;
  updateSlot: (index: number, slot: AvailabilitySlot) => void;
  removeSlot: (index: number) => void;
  copyWeek: (sourceWeekStart: Date, targetWeekStart: Date) => void;
  save: () => Promise<boolean>;
  expandRecurringSlots: (until: Date) => AvailabilitySlot[];
}

function roundToNearest30Minutes(dateString: string): string {
  const date = new Date(dateString);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 30) * 30;
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export function useAvailabilitySlots(): UseAvailabilitySlotsReturn {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          const fetchedSlots = data?.user?.availabilitySlots || [];
          setSlots(
            fetchedSlots.map((slot: any) => ({
              id: slot.id,
              start: roundToNearest30Minutes(slot.start),
              end: roundToNearest30Minutes(slot.end),
              isRecurring: slot.isRecurring,
              recurrencePattern: slot.recurrencePattern,
              recurrenceEnd: slot.recurrenceEnd
                ? roundToNearest30Minutes(slot.recurrenceEnd)
                : undefined,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load availability');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const addSlot = useCallback((slot: Omit<AvailabilitySlot, 'id'>) => {
    const processedSlot: AvailabilitySlot = {
      ...slot,
      start: roundToNearest30Minutes(slot.start),
      end: roundToNearest30Minutes(slot.end),
    };
    setSlots((prev) => [...prev, processedSlot]);
  }, []);

  const updateSlot = useCallback((index: number, slot: AvailabilitySlot) => {
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[index] = {
        ...slot,
        start: roundToNearest30Minutes(slot.start),
        end: roundToNearest30Minutes(slot.end),
      };
      return newSlots;
    });
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const copyWeek = useCallback(
    (sourceWeekStart: Date, targetWeekStart: Date) => {
      const sourceStart = startOfWeek(sourceWeekStart, { weekStartsOn: 1 });
      const sourceEnd = endOfWeek(sourceWeekStart, { weekStartsOn: 1 });
      const daysDiff = differenceInDays(targetWeekStart, sourceStart);

      const weekSlots = slots.filter((slot) => {
        const slotStart = new Date(slot.start);
        return slotStart >= sourceStart && slotStart <= sourceEnd;
      });

      const copiedSlots = weekSlots.map((slot) => ({
        ...slot,
        id: undefined,
        start: roundToNearest30Minutes(
          addDays(new Date(slot.start), daysDiff).toISOString()
        ),
        end: roundToNearest30Minutes(
          addDays(new Date(slot.end), daysDiff).toISOString()
        ),
        isRecurring: false,
        recurrencePattern: undefined,
        recurrenceEnd: undefined,
      }));

      setSlots((prev) => [...prev, ...copiedSlots]);
    },
    [slots]
  );

  const expandRecurringSlots = useCallback(
    (until: Date): AvailabilitySlot[] => {
      const expanded: AvailabilitySlot[] = [];

      slots.forEach((slot) => {
        if (!slot.isRecurring) {
          expanded.push(slot);
          return;
        }

        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        const duration = slotEnd.getTime() - slotStart.getTime();
        const recurrenceEnd = slot.recurrenceEnd
          ? new Date(slot.recurrenceEnd)
          : until;
        const endDate = recurrenceEnd < until ? recurrenceEnd : until;

        let currentStart = slotStart;
        let occurrence = 0;

        while (currentStart <= endDate && occurrence < 100) {
          const currentEnd = new Date(currentStart.getTime() + duration);

          expanded.push({
            ...slot,
            id: `${slot.id || 'new'}-${occurrence}`,
            start: currentStart.toISOString(),
            end: currentEnd.toISOString(),
          });

          switch (slot.recurrencePattern) {
            case 'daily':
              currentStart = addDays(currentStart, 1);
              break;
            case 'weekly':
              currentStart = addDays(currentStart, 7);
              break;
            case 'monthly':
              currentStart = new Date(
                currentStart.getFullYear(),
                currentStart.getMonth() + 1,
                currentStart.getDate(),
                currentStart.getHours(),
                currentStart.getMinutes()
              );
              break;
            default:
              currentStart = addDays(currentStart, 7);
          }
          occurrence++;
        }
      });

      return expanded;
    },
    [slots]
  );

  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const availabilityToSend = slots
        .filter((slot) => slot.start && slot.end)
        .map((slot) => ({
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString(),
          isRecurring: slot.isRecurring,
          recurrencePattern: slot.recurrencePattern,
          recurrenceEnd: slot.recurrenceEnd
            ? new Date(slot.recurrenceEnd).toISOString()
            : undefined,
        }));

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability: availabilityToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update availability');
        return false;
      }

      return true;
    } catch (err) {
      setError('Something went wrong');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [slots]);

  return {
    slots,
    isLoading,
    isSaving,
    error,
    addSlot,
    updateSlot,
    removeSlot,
    copyWeek,
    save,
    expandRecurringSlots,
  };
}
