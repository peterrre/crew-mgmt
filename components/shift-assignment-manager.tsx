'use client';

import { useState } from 'react';
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

  const responsible = assignments.find((a) => a.role === 'RESPONSIBLE');
  const helpers = assignments.filter((a) => a.role === 'HELPER');
  const currentCount = assignments.length;
  const needsMore = currentCount < minHelpers;
  const atMax = maxHelpers > 0 && currentCount >= maxHelpers;

  // Get available crew members (not already assigned)
  const assignedUserIds = new Set(assignments.map((a) => a.user.id));
  const availableCrew = crew.filter((c) => !assignedUserIds.has(c.user.id));

  const handleAddAssignment = async (role: 'RESPONSIBLE' | 'HELPER') => {
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

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

      setSelectedUserId('');
      onAssignmentChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setLoading(true);
    setError(null);

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

      onAssignmentChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment');
    } finally {
      setLoading(false);
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

      {/* Responsible person */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wide">
          Responsible Person
        </label>
        {responsible ? (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {responsible.user.name || responsible.user.email}
              </span>
              <Badge variant="outline" className="text-xs">
                {responsible.user.role}
              </Badge>
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
                {availableCrew.map((member) => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    {member.user.name || member.user.email} ({member.user.role})
                  </SelectItem>
                ))}
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
                className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white">
                    {helper.user.name || helper.user.email}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {helper.user.role}
                  </Badge>
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
              {availableCrew.map((member) => (
                <SelectItem key={member.user.id} value={member.user.id}>
                  {member.user.name || member.user.email} ({member.user.role})
                </SelectItem>
              ))}
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
