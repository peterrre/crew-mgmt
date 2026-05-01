'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import ShiftAssignmentManager from '@/components/shift-assignment-manager';
import { ROLES } from '@/constants/roles';
import type { Role } from '@/constants/roles';

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
  helperId: string | null;
  eventId: string;
  minHelpers: number;
  maxHelpers: number;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
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

interface ShiftEditDialogProps {
  shift: Shift;
  crew: CrewMember[];
  onClose: () => void;
  onSuccess: () => void;
  checkHelperAvailability: (userId: string, shiftStart: Date, shiftEnd: Date) => boolean;
}

interface AuthUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
}

export default function ShiftEditDialog({
  shift,
  crew,
  onClose,
  onSuccess,
}: ShiftEditDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentShift, setCurrentShift] = useState(shift);

  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;
  const isAdmin = currentUserRole === 'ADMIN';

  // Check if current user is the responsible person
  const isResponsible = currentShift.assignments?.some(
    (a) => a.user.id === currentUserId && a.role === ROLES.RESPONSIBLE
  );

  const canManage = isAdmin || isResponsible;
  const canSetResponsible = isAdmin;

  const formatLocalDateTime = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: shift.title,
    start: formatLocalDateTime(shift.start),
    end: formatLocalDateTime(shift.end),
    minHelpers: shift.minHelpers || 1,
    maxHelpers: shift.maxHelpers || 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          start: new Date(formData.start).toISOString(),
          end: new Date(formData.end).toISOString(),
          minHelpers: formData.minHelpers,
          maxHelpers: formData.maxHelpers,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update shift');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete shift');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = async () => {
    // Refresh shift data after assignment change
    try {
      const response = await fetch(`/api/shifts/${shift.id}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setCurrentShift((prev) => ({
          ...prev,
          assignments: data.assignments || [],
          minHelpers: data.minHelpers,
          maxHelpers: data.maxHelpers,
        }));
      }
    } catch (err) {
      console.error('Failed to refresh assignments:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-card-foreground">Edit Shift</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Shift Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={!isAdmin}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Start Time</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                required
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end">End Time</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                required
                disabled={!isAdmin}
              />
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-min-helpers">Min Helpers</Label>
                <Input
                  id="edit-min-helpers"
                  type="number"
                  min="1"
                  value={formData.minHelpers}
                  onChange={(e) =>
                    setFormData({ ...formData, minHelpers: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-max-helpers">Max Helpers</Label>
                <Input
                  id="edit-max-helpers"
                  type="number"
                  min={formData.minHelpers}
                  value={formData.maxHelpers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxHelpers: Math.max(
                        parseInt(e.target.value) || 1,
                        formData.minHelpers
                      ),
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Assignment Manager */}
          <div className="pt-4 border-t border-border">
            <ShiftAssignmentManager
              shiftId={shift.id}
              assignments={currentShift.assignments || []}
              crew={crew}
              minHelpers={currentShift.minHelpers || 1}
              maxHelpers={currentShift.maxHelpers || 1}
              canManage={canManage}
              canSetResponsible={canSetResponsible}
              onAssignmentChange={handleAssignmentChange}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={loading}
                className="text-red border-red/30 hover:bg-red/10"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {isAdmin && (
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-backgroundSecondary0 hover:bg-yellow"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}