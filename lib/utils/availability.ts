import { Prisma } from '@prisma/client'

/**
 * Represents a time interval with start and end dates.
 */
export interface TimeInterval {
  start: Date
  end: Date
}

/**
 * Expands an availability slot into a list of non-recurring intervals based on recurrence pattern.
 * For non-recurring slots, returns the slot itself.
 * For recurring slots, generates occurrences up to a horizon (default 1 year from start).
 * Supports recurrence patterns: 'daily', 'weekly', 'monthly', 'yearly'.
 * If recurrenceEnd is set, expansions stop at that date.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function expandSlotToIntervals(slot: Prisma.AvailabilitySlotGetPayload<{}>): TimeInterval[] {
  const { start, end, isRecurring, recurrencePattern, recurrenceEnd } = slot
  const intervals: TimeInterval[] = []

  if (!isRecurring || !recurrencePattern) {
    intervals.push({ start: new Date(start), end: new Date(end) })
    return intervals
  }

  // Determine the end date for expansion: recurrenceEnd if set, otherwise 1 year from start
  const maxEnd = recurrenceEnd ? new Date(recurrenceEnd) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000)

  const currentStart = new Date(start)
  const currentEnd = new Date(end)

  while (currentStart <= maxEnd) {
    // Add the current interval
    intervals.push({ start: new Date(currentStart), end: new Date(currentEnd) })

    // Increment based on pattern
    switch (recurrencePattern.toLowerCase()) {
      case 'daily':
        currentStart.setDate(currentStart.getDate() + 1)
        currentEnd.setDate(currentEnd.getDate() + 1)
        break
      case 'weekly':
        currentStart.setDate(currentStart.getDate() + 7)
        currentEnd.setDate(currentEnd.getDate() + 7)
        break
      case 'monthly':
        currentStart.setMonth(currentStart.getMonth() + 1)
        currentEnd.setMonth(currentEnd.getMonth() + 1)
        break
      case 'yearly':
        currentStart.setFullYear(currentStart.getFullYear() + 1)
        currentEnd.setFullYear(currentEnd.getFullYear() + 1)
        break
      default:
        // Unknown pattern, treat as non-recurring (should not happen if validated)
        intervals.push({ start: new Date(currentStart), end: new Date(currentEnd) })
        break
    }
  }

  return intervals
}

/**
 * Checks if two time intervals overlap.
 * Assumes intervals are valid (start <= end).
 */
export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end
}

/**
 * Validates a list of availability slots for overlaps.
 * Returns true if there are any overlaps, false otherwise.
 * Also validates that start < end for each slot.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function hasOverlappingSlots(slots: Prisma.AvailabilitySlotGetPayload<{}>[]): boolean {
  // First, validate each slot has start < end
  for (const slot of slots) {
    if (new Date(slot.start) >= new Date(slot.end)) {
      return true // invalid slot
    }
  }

  // Expand all slots to intervals
  const allIntervals: TimeInterval[] = []
  for (const slot of slots) {
    allIntervals.push(...expandSlotToIntervals(slot))
  }

  // Check for any overlap among intervals
  for (let i = 0; i < allIntervals.length; i++) {
    for (let j = i + 1; j < allIntervals.length; j++) {
      if (intervalsOverlap(allIntervals[i], allIntervals[j])) {
        return true
      }
    }
  }

  return false
}

/**
 * Returns a list of error messages for the given slots, if any.
 * Empty array means valid.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function validateAvailabilitySlots(slots: Prisma.AvailabilitySlotGetPayload<{}>[]): string[] {
  const errors: string[] = []

  // Validate each slot
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    if (new Date(slot.start) >= new Date(slot.end)) {
      errors.push(`Slot ${i + 1}: Start time must be before end time.`)
    }
    if (slot.isRecurring && !slot.recurrencePattern) {
      errors.push(`Slot ${i + 1}: Recurring slot must have a recurrence pattern.`)
    }
    // Validate recurrence pattern values
    if (slot.recurrencePattern) {
      const pattern = slot.recurrencePattern.toLowerCase()
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(pattern)) {
        errors.push(`Slot ${i + 1}: Invalid recurrence pattern '${slot.recurrencePattern}'. Must be one of: daily, weekly, monthly, yearly.`)
      }
    }
    // If recurrenceEnd is set, it must be after start
    if (slot.recurrenceEnd && new Date(slot.recurrenceEnd) <= new Date(slot.start)) {
      errors.push(`Slot ${i + 1}: Recurrence end must be after start time.`)
    }
  }

  // Check for overlaps
  if (hasOverlappingSlots(slots)) {
    errors.push('One or more availability slots overlap. Please adjust your availability.')
  }

  return errors
}