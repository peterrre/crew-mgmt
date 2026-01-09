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
  const [formData, setFormData] = useState({
    title: shift.title,
    start: new Date(shift.start).toISOString().slice(0, 16),
    end: new Date(shift.end).toISOString().slice(0, 16),
    helperId: shift.helperId || '',
  });

  useEffect(() => {
    fetchHelpers();
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
          helperId: formData.helperId || null,
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
          <h2 className="text-xl font-bold text-gray-900">Edit Shift</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          )}

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
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
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
        </form>
      </div>
    </div>
  );
}
