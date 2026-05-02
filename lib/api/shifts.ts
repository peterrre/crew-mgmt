import { Shift, Assignment } from "@/types/shift";

export async function fetchShifts(params: { eventId?: string } = {}): Promise<Shift[]> {
  try {
    const url = params.eventId
      ? `/api/shifts?eventId=${params.eventId}`
      : "/api/shifts";
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.shifts || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchAssignments(params: { eventId?: string; shiftId?: string } = {}): Promise<Assignment[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.eventId) queryParams.set("eventId", params.eventId);
    if (params.shiftId) queryParams.set("shiftId", params.shiftId);
    const url = `/api/shifts/assignments?${queryParams.toString()}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.assignments || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function assignUserToShift(shiftId: string, data: { userId: string; role?: string }): Promise<any> {
  const response = await fetch(`/api/shifts/${shiftId}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to assign user");
  }
  return response.json();
}

export async function removeUserFromShift(assignmentId: string): Promise<void> {
  const response = await fetch(`/api/shifts/assignments/${assignmentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to remove user");
  }
}
