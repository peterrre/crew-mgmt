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
import { X, Loader2, Star, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface ShiftCreateDialogProps {
  eventId: string;
  crew: CrewMember[];
  selectedSlot: any;
  checkHelperAvailability: (userId: string, start: Date, end: Date) => boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShiftCreateDialog({
  eventId,
  crew,
  selectedSlot,
  checkHelperAvailability,
  onClose,
  onSuccess,
}: ShiftCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [helperToAdd, setHelperToAdd] = useState<string>('');

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
    title: '',
    start: selectedSlot?.start ? formatLocalDateTime(selectedSlot.start) : '',
    end: selectedSlot?.end ? formatLocalDateTime(selectedSlot.end) : '',
    responsibleId: 'unassigned',
    minHelpers: 1,
    maxHelpers: 1,
  });

  // Check availability when responsible person or time changes
  useEffect(() => {
    if (formData.responsibleId && formData.responsibleId !== 'unassigned' && formData.start && formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      const hasAvailability = checkHelperAvailability(formData.responsibleId, startDate, endDate);

      if (!hasAvailability) {
        const selectedCrew = crew.find((c) => c.userId === formData.responsibleId);
        const name = selectedCrew?.user.name || selectedCrew?.user.email || 'This crew member';
        setAvailabilityWarning(`${name} does not have availability during this time slot.`);
      } else {
        setAvailabilityWarning('');
      }
    } else {
      setAvailabilityWarning('');
    }
  }, [formData.responsibleId, formData.start, formData.end, checkHelperAvailability, crew]);

  // Get available crew for helper selection (not responsible, not already added)
  const availableForHelper = crew.filter(
    (c) => c.userId !== formData.responsibleId && !selectedHelpers.includes(c.userId)
  );

  const handleAddHelper = () => {
    if (helperToAdd && !selectedHelpers.includes(helperToAdd)) {
      setSelectedHelpers([...selectedHelpers, helperToAdd]);
      setHelperToAdd('');
    }
  };

  const handleRemoveHelper = (userId: string) => {
    setSelectedHelpers(selectedHelpers.filter((id) => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const responsibleUserId =
        formData.responsibleId === 'unassigned' || formData.responsibleId === ''
          ? null
          : formData.responsibleId;

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          start: new Date(formData.start).toISOString(),
          end: new Date(formData.end).toISOString(),
          eventId,
          minHelpers: formData.minHelpers,
          maxHelpers: formData.maxHelpers,
          responsibleUserId,
          helperIds: selectedHelpers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create shift');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-card-foreground">Create Shift</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minHelpers">Min Helpers</Label>
              <Input
                id="minHelpers"
                type="number"
                min="1"
                value={formData.minHelpers}
                onChange={(e) =>
                  setFormData({ ...formData, minHelpers: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHelpers">Max Helpers</Label>
              <Input
                id="maxHelpers"
                type="number"
                min={formData.minHelpers}
                value={formData.maxHelpers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxHelpers: Math.max(parseInt(e.target.value) || 1, formData.minHelpers),
                  })
                }
              />
            </div>
          </div>

          {/* Responsible Person */}
          <div className="space-y-2">
            <Label htmlFor="responsible" className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow" />
              Responsible Person (optional)
            </Label>
            <Select
              value={formData.responsibleId}
              onValueChange={(value) => {
                setFormData({ ...formData, responsibleId: value });
                // Remove from helpers if was selected there
                if (selectedHelpers.includes(value)) {
                  setSelectedHelpers(selectedHelpers.filter((id) => id !== value));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select responsible person" />
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
              <div className="text-xs text-yellow bg-backgroundSecondary/20 p-2 rounded border border-border">
                Warning: {availabilityWarning}
              </div>
            )}
          </div>

          {/* Additional Helpers */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Additional Helpers (optional)
            </Label>

            {/* Selected helpers */}
            {selectedHelpers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedHelpers.map((userId) => {
                  const member = crew.find((c) => c.userId === userId);
                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {member?.user.name || member?.user.email || userId}
                      <button
                        type="button"
                        onClick={() => handleRemoveHelper(userId)}
                        className="ml-1 hover:bg-backgroundTertiary rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Add helper selector */}
            {availableForHelper.length > 0 && (
              <div className="flex gap-2">
                <Select value={helperToAdd} onValueChange={setHelperToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add helper..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForHelper.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user.name || member.user.email} ({member.user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHelper}
                  disabled={!helperToAdd}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {crew.length === 0 && (
              <p className="text-xs text-yellow">
                No crew assigned to this event yet. Add crew members first.
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-backgroundSecondary hover:bg-yellow"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shift'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
