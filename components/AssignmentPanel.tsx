import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Assignment } from "@/types/shift";

import { ShiftAssignmentRole } from "@/lib/shiftAssignmentRole";
import { fetchAvailableUsers } from "@/lib/api/users";

interface AssignmentPanelProps {
  shiftId: string;
  assignments: Assignment[];
  minHelpers: number;
  maxHelpers: number;
  currentUserId: string | undefined;
  isAdmin: boolean;
  isCrew: boolean;
  isVolunteer: boolean;
  onSelfAssign: (role: ShiftAssignmentRole) => Promise<void>;
  onRemoveAssignment: (assignmentId: string) => Promise<void>;
  onClose: () => void;
}

export const AssignmentPanel = ({
  shiftId,
  assignments,
  minHelpers,
  maxHelpers,
  currentUserId,
  isAdmin,
  isCrew,
  isVolunteer,
  onSelfAssign,
  onRemoveAssignment,
  onClose,
}: AssignmentPanelProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const responsible = assignments.find((a) => (a.role as any) === ShiftAssignmentRole.RESPONSIBLE);
  const helpers = assignments.filter((a) => (a.role as any) === ShiftAssignmentRole.HELPER);
  const helperCount = helpers.length;
  const isUnderMin = helperCount < minHelpers;
  const isOverMax = helperCount > maxHelpers;
  const isUserAssigned = assignments.some((a) => a.userId === currentUserId);

  const loadAvailableUsers = useCallback(async () => {
    if (!(isAdmin || isCrew)) return;
    try {
      await fetchAvailableUsers({ shiftId });
      // users are not used in UI; fetched for side effect only
    } catch (err: unknown) {
      toast.error("Failed to load users");
    }
  }, [isAdmin, isCrew, shiftId]);

  useEffect(() => {
    if (isAdmin || isCrew) {
      loadAvailableUsers();
    }
  }, [isAdmin, isCrew, loadAvailableUsers]);

  const handleAssignResponsible = async () => {
    if (!selectedUserId) return;
    try {
      toast.success("Assigned as responsible (placeholder)");
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to assign");
    }
  };

  const handleAssignHelper = async () => {
    if (!selectedUserId) return;
    try {
      toast.success("Assigned as helper (placeholder)");
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to assign");
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Assignments</h3>
          {!isVolunteer && (isAdmin || isCrew) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={handleAssignResponsible}>
                  Assign Responsible
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleAssignHelper}>
                  Assign Helper
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Responsible */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-8 w-8 bg-blue rounded-full flex items-center justify-center text-blueForeground text-xs">
            R
          </div>
          <div>
            <div className="font-medium">Responsible</div>
            {responsible ? (
              <>
                <div className="flex items-center space-x-2">
                  {responsible.user?.name ?? "Unknown"}
                  {currentUserId && responsible.userId === currentUserId && (
                    <Badge variant="secondary" className="ml-1 text-xs">Me</Badge>
                  )}
                  {!isVolunteer && (isAdmin || isCrew || responsible.userId === currentUserId) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="More options">
                          <UserCircle className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onSelect={async () => {
                            if (responsible.id) {
                              await onRemoveAssignment(responsible.id);
                            }
                          }}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-foregroundTertiary">
                Nobody assigned
                {!isVolunteer && (isAdmin || isCrew) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUserId(null);
                      handleAssignResponsible();
                    }}
                  >
                    Assign
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Helpers */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 h-8 w-8 bg-green rounded-full flex items-center justify-center text-greenForeground text-xs">
                H
              </div>
              <div>
                <div className="font-medium">Helpers ({helperCount})</div>
                <div className="text-xs text-foregroundTertiary">
                  Min: {minHelpers} | Max: {maxHelpers}
                  {isUnderMin && (
                    <span className="ml-2 bg-red/10 text-red text-xs px-1 rounded">
                      Under min
                    </span>
                  )}
                  {isOverMax && (
                    <span className="ml-2 bg-red/10 text-red text-xs px-1 rounded">
                      Over max
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!isVolunteer && (isAdmin || isCrew) && helperCount < maxHelpers && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUserId(null);
                  handleAssignHelper();
                }}
              >
                + Add Helper
              </Button>
            )}
          </div>

          {helpers.length > 0 ? (
            helpers.map((helper) => (
              <div key={helper.id} className="flex items-center space-x-2 p-2 bg-backgroundSecondary rounded">
                <div className="flex-shrink-0 h-6 w-6 bg-green rounded-full flex items-center justify-center text-greenForeground text-xs">
                  H
                </div>
                <div className="flex-1">
                  <div className="font-medium">{helper.user?.name ?? "Unknown"}</div>
                  {currentUserId && helper.userId === currentUserId && (
                    <Badge variant="secondary" className="ml-1 text-xs">Me</Badge>
                  )}
                </div>
                {!isVolunteer &&
                  (isAdmin || isCrew || helper.userId === currentUserId) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="More options">
                          <UserCircle className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onSelect={async () => {
                            if (helper.id) {
                              await onRemoveAssignment(helper.id);
                            }
                          }}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>
            ))
          ) : (
            <div className="text-sm text-foregroundTertiary text-center py-4">
              Nobody assigned as helper
            </div>
          )}
        </div>

        {/* Volunteer self-assign section */}
        {isVolunteer && !isUserAssigned && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Join this shift</h3>
            <div className="space-y-2">
              {!responsible && (
                <Button
                  variant="default"
                  onClick={() => onSelfAssign(ShiftAssignmentRole.RESPONSIBLE)}
                  className="w-full"
                >
                  Take as Responsible
                </Button>
              )}
              {helperCount < maxHelpers && (
                <Button
                  variant="outline"
                  onClick={() => onSelfAssign(ShiftAssignmentRole.HELPER)}
                  className="w-full"
                >
                  Join as Helper
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};