'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';

interface AvailabilitySlot {
  id?: string;
  start: string;
  end: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEnd?: string;
}

interface EditAvailabilityProps {
  onClose: () => void;
}

export default function EditAvailability({ onClose }: EditAvailabilityProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        const slots = data?.user?.availabilitySlots || [];
        setAvailability(slots.map((slot: any) => ({
          id: slot.id,
          start: roundToNearest30Minutes(slot.start),
          end: roundToNearest30Minutes(slot.end),
          isRecurring: slot.isRecurring,
          recurrencePattern: slot.recurrencePattern,
          recurrenceEnd: slot.recurrenceEnd ? roundToNearest30Minutes(slot.recurrenceEnd) : undefined,
        })));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setFetching(false);
    }
  };

  const addSlot = () => {
    setAvailability([...availability, {
      start: '',
      end: '',
      isRecurring: false,
    }]);
  };

  const roundToNearest30Minutes = (dateString: string) => {
    const date = new Date(dateString);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    // Format as local datetime string for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    let processedValue = value;
    if (field === 'start' || field === 'end') {
      processedValue = roundToNearest30Minutes(value);
    }
    const newAvailability = [...availability];
    newAvailability[index] = { ...newAvailability[index], [field]: processedValue };
    setAvailability(newAvailability);
  };

  const removeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability: availability.filter(slot => slot.start && slot.end),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update availability');
        return;
      }

      onClose();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Availability</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fetching ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Times will be automatically rounded to the nearest 30 minutes.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Availability Slots</Label>
                  <Button type="button" onClick={addSlot} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slot
                  </Button>
                </div>

                {availability.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400 text-center py-8">No availability slots set. Add your first slot above.</p>
                ) : (
                  <div className="space-y-3">
                    {availability.map((slot, index) => (
                      <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">Slot {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeSlot(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`start-${index}`}>Start</Label>
                            <Input
                              id={`start-${index}`}
                              type="datetime-local"
                              value={slot.start}
                              onChange={(e) => updateSlot(index, 'start', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`end-${index}`}>End</Label>
                            <Input
                              id={`end-${index}`}
                              type="datetime-local"
                              value={slot.end}
                              onChange={(e) => updateSlot(index, 'end', e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`recurring-${index}`}
                            checked={slot.isRecurring}
                            onCheckedChange={(checked) => updateSlot(index, 'isRecurring', checked)}
                          />
                          <Label htmlFor={`recurring-${index}`}>Recurring</Label>
                        </div>

                        {slot.isRecurring && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`pattern-${index}`}>Pattern</Label>
                              <Select
                                value={slot.recurrencePattern || ''}
                                onValueChange={(value) => updateSlot(index, 'recurrencePattern', value)}
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
                              <Label htmlFor={`recurrence-end-${index}`}>Until</Label>
                              <Input
                                id={`recurrence-end-${index}`}
                                type="datetime-local"
                                value={slot.recurrenceEnd || ''}
                                onChange={(e) => updateSlot(index, 'recurrenceEnd', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg">{error}</div>
              )}

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
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-orange-600 dark:bg-amber-600 dark:hover:bg-orange-700"
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
            </>
          )}
        </form>
      </div>
    </div>
  );
}
