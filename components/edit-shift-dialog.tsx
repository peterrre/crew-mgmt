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
import { X, Loader2, Trash2 } from 'lucide-react';

interface Helper {
  id: string;
  name: string | null;
  email: string;
  role: string;
  availability: string[];
}

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helperId: string | null;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  isAvailability?: boolean;
  userId?: string;
}

interface EditShiftDialogProps {
  shift: Shift;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditShiftDialog({ shift, onClose, onSuccess }: EditShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [unassignedShifts, setUnassignedShifts] = useState<Shift[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);

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
    helperId: shift.helperId || '',
  });

  useEffect(() => {
    fetchHelpers();
    fetchAvailabilitySlots();
    if (shift.isAvailability) {
      fetchUnassignedShifts();
    }
  }, []);

  const fetchHelpers = async () => {
    try {
      const response = await fetch('/api/helpers');
      if (response.ok) {
        const data = await response.json();
        setHelpers(data?.helpers || []);
      }
    } catch (error) {
      console.error('Error fetching helpers:', error);
    }
  };

  const fetchAvailabilitySlots = async () => {
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        setAvailabilitySlots(data?.availabilitySlots || []);
      }
    } catch (error) {
      console.error('Error fetching availability slots:', error);
    }
  };

  const fetchUnassignedShifts = async () => {
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        let unassigned = (data?.shifts || []).filter((s: any) => !s.helperId);
        // Filter to only shifts that overlap with the volunteer's availability slot
        if (shift.isAvailability) {
          unassigned = unassigned.filter((s: any) => {
            const shiftStart = new Date(s.start);
            const shiftEnd = new Date(s.end);
            return shiftStart < shift.end && shiftEnd > shift.start;
          });
        }
        setUnassignedShifts(unassigned);
      }
    } catch (error) {
      console.error('Error fetching unassigned shifts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const helperIdToSend = formData.helperId === 'unassigned' || formData.helperId === '' ? null : formData.helperId;

      // Validate availability for volunteers
      if (helperIdToSend && selectedHelper?.role === 'VOLUNTEER') {
        const helperSlots = availabilitySlots.filter(slot => slot.helper.id === helperIdToSend);
        const shiftStart = new Date(formData.start);
        const shiftEnd = new Date(formData.end);
        const overlaps = helperSlots.some(slot => {
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          return shiftStart < slotEnd && shiftEnd > slotStart;
        });
        if (!overlaps) {
          setError('The shift does not overlap with the volunteer\'s availability.');
          setLoading(false);
          return;
        }
      }

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
        if (response.status === 404) {
          setError('Shift not found. The data may be stale. Please refresh the page.');
        } else {
          setError(data.error || 'Failed to update shift');
        }
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedShiftId) {
      setError('Please select a shift');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const selectedShift = unassignedShifts.find(s => s.id === selectedShiftId);
      if (!selectedShift) {
        setError('Selected shift not found');
        return;
      }

      const availStart = new Date(shift.start);
      const availEnd = new Date(shift.end);
      const shiftStart = new Date(selectedShift.start);
      const shiftEnd = new Date(selectedShift.end);

      const overlapStart = new Date(Math.max(shiftStart.getTime(), availStart.getTime()));
      const overlapEnd = new Date(Math.min(shiftEnd.getTime(), availEnd.getTime()));

      if (overlapStart >= overlapEnd) {
        setError('No overlap with availability');
        return;
      }

      // If overlap is the whole shift, assign directly
      if (overlapStart.getTime() === shiftStart.getTime() && overlapEnd.getTime() === shiftEnd.getTime()) {
        const response = await fetch(`/api/shifts/${selectedShiftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helperId: shift.userId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to assign shift');
          return;
        }
      } else {
        // Split the shift
        // Update the existing shift to the overlap
        const updateResponse = await fetch(`/api/shifts/${selectedShiftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: overlapStart.toISOString(),
            end: overlapEnd.toISOString(),
            helperId: shift.userId,
          }),
        });

        if (!updateResponse.ok) {
          const data = await updateResponse.json();
          setError(data.error || 'Failed to update shift');
          return;
        }

        // Create new shift for before overlap
        if (shiftStart < overlapStart) {
          const beforeResponse = await fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: selectedShift.title,
              start: shiftStart.toISOString(),
              end: overlapStart.toISOString(),
            }),
          });

          if (!beforeResponse.ok) {
            setError('Failed to create before shift');
            return;
          }
        }

        // Create new shift for after overlap
        if (shiftEnd > overlapEnd) {
          const afterResponse = await fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: selectedShift.title,
              start: overlapEnd.toISOString(),
              end: shiftEnd.toISOString(),
            }),
          });

          if (!afterResponse.ok) {
            setError('Failed to create after shift');
            return;
          }
        }
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

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setError('Failed to delete shift');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const selectedHelper = helpers.find((h) => h.id === formData.helperId);
  const showAvailabilityWarning =
    selectedHelper?.role === 'VOLUNTEER' &&
    selectedHelper?.availability?.length > 0 &&
    formData.start;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {shift.isAvailability ? `Assign Shift to ${shift.helper?.name}` : 'Edit Shift'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={shift.isAvailability ? (e) => e.preventDefault() : handleSubmit} className="p-6 space-y-4">
          {shift.isAvailability ? (
            <div className="space-y-2">
              <Label htmlFor="shift">Select Shift to Assign</Label>
              {unassignedShifts.length === 0 ? (
                <p className="text-gray-500 text-sm">No unassigned shifts available for assignment.</p>
              ) : (
                <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an unassigned shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedShifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title} - {new Date(s.start).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Shift Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Stage Setup, Bar, Security"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="helper">Assign Helper</Label>
                <Select
                  value={formData.helperId}
                  onValueChange={(value) => setFormData({ ...formData, helperId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a helper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {helpers.map((helper) => (
                      <SelectItem key={helper.id} value={helper.id}>
                        {helper?.name || helper?.email} ({helper?.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showAvailabilityWarning && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700 font-medium">Availability Note:</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedHelper?.availability?.join(', ')}
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          {shift.isAvailability ? (
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssign}
                disabled={loading || unassignedShifts.length === 0}
                className="flex-1 bg-amber-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
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
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
