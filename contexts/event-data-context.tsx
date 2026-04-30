'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ROLES, Role } from '@/constants/roles';

interface ShiftAssignment {
  id: string;
  role: Role;
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
  helperId: string | null; // Deprecated: use assignments instead
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

interface ShiftRequest {
  id: string;
  type: 'CANCEL' | 'SWAP' | 'MODIFY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  shift: {
    id: string;
    title: string;
    start: Date;
    end: Date;
  };
  requester: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  newHelper?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  reviewer?: {
    id: string;
    name: string | null;
  } | null;
  newStart?: Date | null;
  newEnd?: Date | null;
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

interface VolunteerApplication {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface EventDataContextType {
  eventId: string;

  // Data
  shifts: Shift[];
  crew: CrewMember[];
  requests: ShiftRequest[];
  availability: AvailabilitySlot[];
  applications: VolunteerApplication[];
  acceptingVolunteers: boolean;

  // Loading states
  shiftsLoading: boolean;
  crewLoading: boolean;
  requestsLoading: boolean;
  availabilityLoading: boolean;
  applicationsLoading: boolean;

  // Refresh functions
  refreshShifts: () => Promise<void>;
  refreshCrew: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshAvailability: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshData: () => Promise<void>; // Alias for refreshAll

  // Computed values
  pendingRequestsCount: number;
  pendingApplicationsCount: number;
  shiftsCount: number;
  crewCount: number;
}

const EventDataContext = createContext<EventDataContextType | undefined>(undefined);

interface EventDataProviderProps {
  eventId: string;
  children: ReactNode;
}

export function EventDataProvider({ eventId, children }: EventDataProviderProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [acceptingVolunteers, setAcceptingVolunteers] = useState(false);

  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [crewLoading, setCrewLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const refreshShifts = useCallback(async () => {
    setShiftsLoading(true);
    try {
      const response = await fetch(`/api/shifts?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        const eventShifts = (data?.shifts || [])
          .filter((s: any) => s.eventId === eventId)
          .map((shift: any) => ({
            ...shift,
            start: new Date(shift.start),
            end: new Date(shift.end),
            minHelpers: shift.minHelpers ?? 1,
            maxHelpers: shift.maxHelpers ?? 1,
            assignments: shift.assignments || [],
            event: shift.event
              ? {
                  ...shift.event,
                  startDate: new Date(shift.event.startDate),
                  endDate: new Date(shift.event.endDate),
                }
              : undefined,
          }));
        setShifts(eventShifts);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setShiftsLoading(false);
    }
  }, [eventId]);

  const refreshCrew = useCallback(async () => {
    setCrewLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/crew`);
      if (response.ok) {
        const data = await response.json();
        setCrew(data?.crew || []);
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
    } finally {
      setCrewLoading(false);
    }
  }, [eventId]);

  const refreshRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/shift-requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data?.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  }, [eventId]);

  const refreshAvailability = useCallback(async () => {
    setAvailabilityLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/availability`);
      if (response.ok) {
        const data = await response.json();
        const availabilitySlots = (data?.availability || []).map((slot: any) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));
        setAvailability(availabilitySlots);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [eventId]);

  const refreshApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data?.applications || []);
        if (data?.event) {
          setAcceptingVolunteers(data.event.acceptingVolunteers);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  }, [eventId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshShifts(),
      refreshCrew(),
      refreshRequests(),
      refreshAvailability(),
      refreshApplications(),
    ]);
  }, [refreshShifts, refreshCrew, refreshRequests, refreshAvailability, refreshApplications]);

  const refreshData = refreshAll;

  // Initial data fetch
  useEffect(() => {
    refreshAll();
  }, [eventId]);

  // Computed values
  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const pendingApplicationsCount = applications.filter((a) => a.status === 'PENDING').length;
  const shiftsCount = shifts.length;
  const crewCount = crew.length;

  const value: EventDataContextType = {
    eventId,
    shifts,
    crew,
    requests,
    availability,
    applications,
    acceptingVolunteers,
    shiftsLoading,
    crewLoading,
    requestsLoading,
    availabilityLoading,
    applicationsLoading,
    refreshShifts,
    refreshCrew,
    refreshRequests,
    refreshAvailability,
    refreshApplications,
    refreshAll,
    refreshData,
    pendingRequestsCount,
    pendingApplicationsCount,
    shiftsCount,
    crewCount,
  };

  return <EventDataContext.Provider value={value}>{children}</EventDataContext.Provider>;
}

export function useEventData() {
  const context = useContext(EventDataContext);
  if (context === undefined) {
    throw new Error('useEventData must be used within an EventDataProvider');
  }
  return context;
}
