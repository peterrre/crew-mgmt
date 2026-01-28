'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, UserPlus, X, Users, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  role: 'RESPONSIBLE' | 'HELPER';
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
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

interface ShiftAssignmentManagerProps {
  shiftId: string;
  shiftStart: Date;
  shiftEnd: Date;
  assignments: Assignment[];
  crew: CrewMember[];
  minHelpers: number;
  maxHelpers: number;
  canManage: boolean;
  canSetResponsible: boolean;
  onAssignmentChange: () => void;
}

export default function ShiftAssignmentManager({
  shiftId,
  shiftStart,
  shiftEnd,
  assignments,
  crew,
  minHelpers,
  maxHelpers,
  canManage,
  canSetResponsible,
  onAssignmentChange,
}: ShiftAssignmentManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [userConflicts, setUserConflicts] = useState<Map<string, { title: string; start: Date; end: Date }>>(new Map());

  // Optimistic UI state
  const [optimisticAssignments, setOptimisticAssignments] = useState<Assignment[]>(assignments);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Update optimistic state when props change
  useEffect(() => {
    setOptimisticAssignments(assignments);
  }, [assignments]);

  const responsible = optimisticAssignments.find((a) => a.role === 'RESPONSIBLE');
  const helpers = optimisticAssignments.filter((a) => a.role === 'HELPER');
  const currentCount = optimisticAssignments.length;
  const needsMore = currentCount < minHelpers;
  const atMax = maxHelpers > 0 && currentCount >= maxHelpers;

  // Get available crew members (not already assigned)
  const assignedUserIds = new Set(optimisticAssignments.map((a) => a.user.id));
  const availableCrew = crew.filter((c) => !assignedUserIds.has(c.user.id));

  // Fetch conflicts for available crew members
  useEffect(() => {
    const fetchConflicts = async () => {
      if (availableCrew.length === 0) return;

      try {
        // Fetch all shifts with assignments for the event
        const response = await fetch(`/api/shifts?eventId=${shiftId.split('_')[0]}`);
        if (!response.ok) return;

        const data = await response.json();
        const allShifts = data.shifts || [];

        const conflicts = new Map<string, { title: string; start: Date; end: Date }>();
        const currentShiftStart = new Date(shiftStart);
        const currentShiftEnd = new Date(shiftEnd);

        // Check each available crew member for conflicts
        availableCrew.forEach((member) => {
          const userId = member.user.id;

          // Find if this user is assigned to any shift that overlaps
          const conflictingShift = allShifts.find((shift: any) => {
            if (shift.id === shiftId) return false; // Skip current shift

            const hasAssignment = shift.assignments?.some(
              (a: any) => a.userId === userId
            );
            if (!hasAssignment) return false;

            // Check for time overlap
            const shiftStartTime = new Date(shift.start);
            const shiftEndTime = new Date(shift.end);

            return (
              (shiftStartTime < currentShiftEnd && shiftEndTime > currentShiftStart) ||
              (currentShiftStart < shiftEndTime && currentShiftEnd > shiftStartTime)
            );
          });

          if (conflictingShift) {
            conflicts.set(userId, {
              title: conflictingShift.title,
              start: new Date(conflictingShift.start),
              end: new Date(conflictingShift.end),
            });
          }
        });

        setUserConflicts(conflicts);
      } catch (error) {
        console.error('Failed to fetch conflicts:', error);
      }
    };

    fetchConflicts();
  }, [availableCrew.length, shiftId, shiftStart, shiftEnd]);

  const handleAddAssignment = async (role: 'RESPONSIBLE' | 'HELPER') => {
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

    // Find the user being assigned
    const user = crew.find((c) => c.user.id === selectedUserId)?.user;
    if (!user) return;

    // Optimistic update - add assignment immediately
    const optimisticAssignment: Assignment = {
      id: `temp-${Date.now()}`,
      role,
      user,
    };
    setOptimisticAssignments((prev) => [...prev, optimisticAssignment]);
    setPendingAction('add');
    setSelectedUserId('');

    try {
      const response = await fetch(`/api/shifts/${shiftId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add assignment');
      }

      // Success - refresh from server
      onAssignmentChange();
    } catch (err) {
      // Rollback on error
      setOptimisticAssignments(assignments);
      setError(err instanceof Error ? err.message : 'Failed to add assignment');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setLoading(true);
    setError(null);

    // Optimistic update - remove assignment immediately
    const previousAssignments = optimisticAssignments;
    setOptimisticAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    setPendingAction('remove');

    try {
      const response = await fetch(`/api/shifts/${shiftId}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove assignment');
      }

      // Success - refresh from server
      onAssignmentChange();
    } catch (err) {
      // Rollback on error
      setOptimisticAssignments(previousAssignments);
      setError(err instanceof Error ? err.message : 'Failed to remove assignment');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Assignments
          </span>
          <Badge
            variant={needsMore ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {currentCount}/{minHelpers}
            {maxHelpers > minHelpers ? `-${maxHelpers}` : ''}
          </Badge>
        </div>
        {needsMore && (
          <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Needs {minHelpers - currentCount} more
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Conflict warning */}
      {selectedUserId && userConflicts.has(selectedUserId) && (
        <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded border border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Scheduling Conflict:</strong> This person is already assigned to{' '}
            <strong>"{userConflicts.get(selectedUserId)?.title}"</strong> during this time.
            Assigning them will fail.
          </div>
        </div>
      )}

      {/* Responsible person */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wide">
          Responsible Person
        </label>
        {responsible ? (
          <div className={`flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 transition-opacity ${pendingAction ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {responsible.user.name || responsible.user.email}
              </span>
              <Badge variant="outline" className="text-xs">
                {responsible.user.role}
              </Badge>
              {pendingAction && responsible.id.startsWith('temp-') && (
                <Badge variant="secondary" className="text-xs">
                  Saving...
                </Badge>
              )}
            </div>
            {canSetResponsible && helpers.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAssignment(responsible.id)}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : canSetResponsible ? (
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select responsible person..." />
              </SelectTrigger>
              <SelectContent>
                {availableCrew.map((member) => {
                  const conflict = userConflicts.get(member.user.id);
                  return (
                    <SelectItem key={member.user.id} value={member.user.id}>
                      <div className="flex items-center gap-2 w-full">
                        <span>
                          {member.user.name || member.user.email} ({member.user.role})
                        </span>
                        {conflict && (
                          <Badge variant="destructive" className="text-xs ml-auto">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Conflict
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleAddAssignment('RESPONSIBLE')}
              disabled={!selectedUserId || loading}
              size="sm"
            >
              <Star className="w-4 h-4 mr-1" />
              Set
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-slate-400 italic">
            No responsible person assigned
          </div>
        )}
      </div>

      {/* Helpers list */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wide">
          Helpers ({helpers.length})
        </label>
        {helpers.length > 0 ? (
          <div className="space-y-2">
            {helpers.map((helper) => (
              <div
                key={helper.id}
                className={`flex items-center justify-between bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 transition-opacity ${pendingAction ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white">
                    {helper.user.name || helper.user.email}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {helper.user.role}
                  </Badge>
                  {pendingAction && helper.id.startsWith('temp-') && (
                    <Badge variant="secondary" className="text-xs">
                      Saving...
                    </Badge>
                  )}
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAssignment(helper.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-slate-400 italic">
            No helpers assigned
          </div>
        )}
      </div>

      {/* Add helper button */}
      {canManage && responsible && !atMax && availableCrew.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add helper..." />
            </SelectTrigger>
            <SelectContent>
              {availableCrew.map((member) => {
                const conflict = userConflicts.get(member.user.id);
                return (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    <div className="flex items-center gap-2 w-full">
                      <span>
                        {member.user.name || member.user.email} ({member.user.role})
                      </span>
                      {conflict && (
                        <Badge variant="destructive" className="text-xs ml-auto">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Conflict
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            onClick={() => handleAddAssignment('HELPER')}
            disabled={!selectedUserId || loading}
            size="sm"
            variant="outline"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {/* At max message */}
      {atMax && (
        <div className="text-xs text-gray-500 dark:text-slate-400 text-center">
          Maximum helpers reached ({maxHelpers})
        </div>
      )}
    </div>
  );
}
