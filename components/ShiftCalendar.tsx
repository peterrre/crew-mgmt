import React, { useState, useEffect } from "react";
import { Calendar } from "react-big-calendar";
import moment from "moment";
import { momentLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import { useSession } from "next-auth/react";
import { Shift, Assignment } from "@/types/shift";
import {
  fetchShifts,
  fetchAssignments,
  assignUserToShift,
  removeUserFromShift,
} from "@/lib/api/shifts";
import { AssignmentPanel } from "./AssignmentPanel";
import { colors } from "@/styles/tokens";

// TODO: Replace hardcoded Tailwind classes for spacing, typography, shadows, etc. with design tokens from '@/styles/tokens'

interface ShiftCalendarProps {
  eventId?: string; // optional filter by event
}

export const ShiftCalendar = ({ eventId }: ShiftCalendarProps) => {
  const localizer = momentLocalizer(moment);
  const { data: session, status } = useSession();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState(false);

  // Role-based helpers (Admin only / Crew / Volunteer)
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isCrew = (session?.user as any)?.role === "CREW";
  const isVolunteer = (session?.user as any)?.role === "VOLUNTEER";

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [shiftsData, assignmentsData] = await Promise.all([
          fetchShifts({ eventId }),
          fetchAssignments({ eventId }),
        ]);
        setShifts(shiftsData);
        setAssignments(assignmentsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadData();
    } else {
      setShifts([]);
      setAssignments([]);
      setLoading(false);
    }
  }, [status, eventId]);

  // Determine assignments for a shift
  const getAssignmentsForShift = (shiftId: string) => {
    return assignments.filter((a) => a.shiftId === shiftId);
  };

  const getResponsible = (shiftId: string) => {
    const assign = getAssignmentsForShift(shiftId).find(
      (a) => a.role === "RESPONSIBLE",
    );
    return assign ? assign.user : null;
  };

  const getHelpers = (shiftId: string) => {
    return getAssignmentsForShift(shiftId)
      .filter((a) => a.role === "HELPER")
      .map((a) => a.user);
  };

  // Check if current user is assigned to shift (any role)
  const isUserAssigned = (shiftId: string) => {
    return getAssignmentsForShift(shiftId).some(
      (a) => a.userId === (session?.user as any)?.id,
    );
  };


  // Handle shift select (click)
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const handleSelectSlot = (_info: {
    start: Date;
    end: Date;
    resource?: any;
  }) => {
    // For simplicity, open a dialog to create shift (admin/crew only)
    if (!(isAdmin || isCrew)) return;
    // TODO: implement shift creation flow
    toast.info("Shift creation not implemented yet");
  };

  // Handle shift click (existing shift)
  const handleSelectEvent = (event: Shift) => {
    setSelectedShift(event);
    setOpenPanel(true);
  };

  // Assign current user as helper/responsible (volunteer self-service)
  const handleSelfAssign = async (role: "RESPONSIBLE" | "HELPER") => {
    if (!selectedShift) return;
    try {
      await assignUserToShift(selectedShift.id, {
        userId: (session?.user as any)!.id,
        role,
      });
      // Refetch assignments
      const updated = await fetchAssignments({ eventId });
      setAssignments(updated);
      toast.success(
        `You are now ${role === "RESPONSIBLE" ? "Responsible" : "Helper"} for this shift`,
      );
      setOpenPanel(false);
    } catch (err) {
      // Backend should return 409 for overlap etc.
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    }
  };

  // Remove assignment (admin/crew/responsible/self)
  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await removeUserFromShift(assignmentId);
      const updated = await fetchAssignments({ eventId });
      setAssignments(updated);
      toast.success("Assignment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  // Event prop getter for styling
  const eventPropGetter = (event: Shift) => {
    const responsible = getResponsible(event.id);
    const helpers = getHelpers(event.id);
    const minHelpers = event.minHelpers ?? 0;
    const maxHelpers = event.maxHelpers ?? 999;
    const helperCount = helpers.length;
    const isUnderMin = helperCount < minHelpers;
    const isOverMax = helperCount > maxHelpers;
    const userIsAssigned = isUserAssigned(event.id);

    return {
      style: {
        backgroundColor: responsible
          ? colors.blue
          : helpers.length > 0
            ? colors.green
            : colors.gray,
        color: "#fff",
        borderRadius: "0.25rem",
        border: isUnderMin || isOverMax ? "2px solid #ef4444" : "none",
        opacity: userIsAssigned ? 1 : 0.9,
        // highlight own assignment
        outline: userIsAssigned ? "2px solid #fbbf24" : "none",
      },
    };
  };

  if (loading)
    return (
      <div className="h-96 w-full flex items-center justify-center">
        Loading calendar...
      </div>
    );
  if (error)
    return <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>;

  return (
    <div className="space-y-4">
      <Toaster />
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Shift Calendar</h2>
        {!isVolunteer && (isAdmin || isCrew) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              /* TODO open create shift dialog */
            }}
          >
            + Create Shift
          </Button>
        )}
      </div>

      <Calendar
        localizer={localizer}
        events={shifts}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        tooltipAccessor="title"
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        views={["month", "week", "day"]}
        style={{ height: 600 }}
      />

      {/* Assignment Panel (sidebar/modal) */}
      <Dialog open={openPanel} onOpenChange={setOpenPanel}>
        <DialogTrigger>{/* triggered by state */}</DialogTrigger>
        <DialogContent className="w-[400px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedShift ? selectedShift.title : "Shift Details"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {selectedShift ? (
              <>
                <p className="mb-2">
                  <strong>Time:</strong> {format(selectedShift.start, "PPp")} –{" "}
                  {format(selectedShift.end, "PPp")}
                </p>
                <p className="mb-2">
                  <strong>Location:</strong> {selectedShift.location ?? "TBD"}
                </p>
                <p className="mb-2">
                  <strong>Event:</strong> {selectedShift.event?.title ?? "N/A"}
                </p>
              </>
            ) : (
              <p>Select a shift to see details.</p>
            )}
          </DialogDescription>

          {/* Assignment list */}
          {selectedShift ? (
            <AssignmentPanel
              shiftId={selectedShift.id}
              assignments={getAssignmentsForShift(selectedShift.id)}
              minHelpers={selectedShift.minHelpers ?? 0}
              maxHelpers={selectedShift.maxHelpers ?? 999}
              currentUserId={(session?.user as any)?.id}
              isAdmin={isAdmin}
              isCrew={isCrew}
              isVolunteer={isVolunteer}
              onSelfAssign={handleSelfAssign}
              onRemoveAssignment={handleRemoveAssignment}
              onClose={() => setOpenPanel(false)}
            />
          ) : (
            <p>No shift selected.</p>
          )}
        </DialogContent>
        <DialogFooter className="flex justify-end">
          <Button variant="secondary" onClick={() => setOpenPanel(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};