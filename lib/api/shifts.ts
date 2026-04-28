// API client for shift operations

import { Shift, Assignment } from "@/types/shift";

export async function fetchShifts({ eventId }: { eventId?: string }): Promise<Shift[]> {
  const url = eventId ? `/api/shifts?eventId=${eventId}` : '/api/shifts';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch shifts');
  return res.json();
}

export async function fetchAssignments({ eventId }: { eventId?: string }): Promise<Assignment[]> {
  const url = eventId ? `/api/assignments?eventId=${eventId}` : '/api/assignments';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

export async function assignUserToShift(
  shiftId: string,
  body: { userId?: string; role: 'RESPONSIBLE' | 'HELPER' }
): Promise<void> {
  const res = await fetch(`/api/shifts/${shiftId}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Assignment failed' }));
    throw new Error(err.error || 'Assignment failed');
  }
}

export async function removeUserFromShift(assignmentId: string): Promise<void> {
  const res = await fetch(`/api/assignments/${assignmentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Remove failed' }));
    throw new Error(err.error || 'Remove failed');
  }
}
