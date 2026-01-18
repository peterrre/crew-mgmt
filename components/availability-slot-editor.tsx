'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AvailabilitySlot {
  id?: string;
  start: string;
  end: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEnd?: string;
}

interface AvailabilitySlotEditorProps {
  slot: AvailabilitySlot;
  isNew?: boolean;
  onSave: (slot: AvailabilitySlot) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function formatForInput(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export default function AvailabilitySlotEditor({
  slot,
  isNew = false,
  onSave,
  onDelete,
  onClose,
}: AvailabilitySlotEditorProps) {
  const [formData, setFormData] = useState<AvailabilitySlot>({
    ...slot,
    start: formatForInput(slot.start),
    end: formatForInput(slot.end),
    recurrenceEnd: slot.recurrenceEnd ? formatForInput(slot.recurrenceEnd) : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start || !formData.end) {
      return;
    }

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);

    if (endDate <= startDate) {
      return;
    }

    onSave({
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      recurrenceEnd: formData.recurrenceEnd
        ? new Date(formData.recurrenceEnd).toISOString()
        : undefined,
    });
  };

  const displayDate = format(new Date(slot.start), 'EEEE, MMMM d, yyyy');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl border dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isNew ? 'Add Availability' : 'Edit Availability'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {displayDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={formData.start}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={formData.end}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isRecurring: !!checked,
                  recurrencePattern: checked ? prev.recurrencePattern || 'weekly' : undefined,
                }))
              }
            />
            <Label htmlFor="recurring" className="cursor-pointer">
              Repeat this availability
            </Label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-3 pl-6 border-l-2 border-green-200 dark:border-green-800">
              <div>
                <Label htmlFor="pattern">Repeat Pattern</Label>
                <Select
                  value={formData.recurrencePattern || 'weekly'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recurrencePattern: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recurrence-end">Repeat Until (optional)</Label>
                <Input
                  id="recurrence-end"
                  type="datetime-local"
                  value={formData.recurrenceEnd || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recurrenceEnd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {!isNew && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              {isNew ? 'Add' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
