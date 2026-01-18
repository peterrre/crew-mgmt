'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helperId: string | null;
  eventId: string;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
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
  checkHelperAvailability: (userId: string, start: Date, end: Date) => boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShiftEditDialog({
  shift,
  crew,
  checkHelperAvailability,
  onClose,
  onSuccess,
}: ShiftEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');

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
    helperId: shift.helperId || 'unassigned',
  });

  // Check availability when helper or time changes
  useEffect(() => {
    if (formData.helperId && formData.helperId !== 'unassigned' && formData.start && formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      const hasAvailability = checkHelperAvailability(formData.helperId, startDate, endDate);

      if (!hasAvailability) {
        const selectedCrew = crew.find((c) => c.userId === formData.helperId);
        const name = selectedCrew?.user.name || selectedCrew?.user.email || 'This crew member';
        setAvailabilityWarning(`${name} does not have availability during this time slot.`);
      } else {
        setAvailabilityWarning('');
      }
    } else {
      setAvailabilityWarning('');
    }
  }, [formData.helperId, formData.start, formData.end, checkHelperAvailability, crew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const helperIdToSend =
        formData.helperId === 'unassigned' || formData.helperId === ''
          ? null
          : formData.helperId;

      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          start: new Date(formData.start).toISOString(),
          end: new Date(formData.end).toISOString(),
          helperId: helperIdToSend,
        }),
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
        method: 'DELETE',
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

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-start">Start Time</Label>
            <Input
              id="edit-start"
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              required
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-helper">Assign Crew Member</Label>
            <Select
              value={formData.helperId}
              onValueChange={(value) => setFormData({ ...formData, helperId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a crew member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {crew.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.name || member.user.email} ({member.user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availabilityWarning && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                ⚠️ {availabilityWarning}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
            >
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-orange-600"
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
          </div>
        </form>
      </div>
    </div>
  );
}
