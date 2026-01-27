'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  X,
  Loader2,
  Plus,
  Trash2,
  CalendarDays,
  List,
  Copy,
} from 'lucide-react';
import { useAvailabilitySlots, AvailabilitySlot } from '@/hooks/use-availability-slots';
import AvailabilitySlotEditor from '@/components/availability-slot-editor';
import AvailabilityPreviewPanel from '@/components/availability-preview-panel';
import { AvailabilityStatistics } from '@/components/availability-statistics';
import { AvailabilityTemplates } from '@/components/availability-templates';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const formats = {
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture: string,
    localizer: any
  ) =>
    `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(
      end,
      'HH:mm',
      culture
    )}`,
};

interface EditAvailabilityProps {
  onClose: () => void;
}

export default function EditAvailability({ onClose }: EditAvailabilityProps) {
  const {
    slots,
    isLoading,
    isSaving,
    error,
    addSlot,
    updateSlot,
    removeSlot,
    copyWeek,
    save,
    expandRecurringSlots,
  } = useAvailabilitySlots();

  const [selectedSlot, setSelectedSlot] = useState<{
    slot: AvailabilitySlot;
    index: number;
    isNew: boolean;
  } | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('week');
  const [showCopyWeek, setShowCopyWeek] = useState(false);
  const [copyTargetWeek, setCopyTargetWeek] = useState<Date | null>(null);

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      const newSlot: AvailabilitySlot = {
        start: slotInfo.start.toISOString(),
        end: slotInfo.end.toISOString(),
        isRecurring: false,
      };
      setSelectedSlot({ slot: newSlot, index: -1, isNew: true });
    },
    []
  );

  const handleSelectEvent = useCallback(
    (event: any) => {
      const index = slots.findIndex(
        (s) =>
          new Date(s.start).getTime() === new Date(event.start).getTime() &&
          new Date(s.end).getTime() === new Date(event.end).getTime()
      );
      if (index !== -1) {
        setSelectedSlot({ slot: slots[index], index, isNew: false });
      }
    },
    [slots]
  );

  const handleSaveSlot = useCallback(
    (slot: AvailabilitySlot) => {
      if (selectedSlot?.isNew) {
        addSlot(slot);
      } else if (selectedSlot && selectedSlot.index >= 0) {
        updateSlot(selectedSlot.index, slot);
      }
      setSelectedSlot(null);
    },
    [selectedSlot, addSlot, updateSlot]
  );

  const handleDeleteSlot = useCallback(() => {
    if (selectedSlot && !selectedSlot.isNew && selectedSlot.index >= 0) {
      removeSlot(selectedSlot.index);
    }
    setSelectedSlot(null);
  }, [selectedSlot, removeSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await save();
    if (success) {
      onClose();
    }
  };

  const handleCopyWeek = () => {
    if (copyTargetWeek) {
      const sourceWeekStart = startOfWeek(calendarDate, { weekStartsOn: 1 });
      copyWeek(sourceWeekStart, copyTargetWeek);
      setShowCopyWeek(false);
      setCopyTargetWeek(null);
    }
  };

  const calendarEvents = useMemo(() => {
    const twoMonthsLater = addDays(new Date(), 60);
    const expanded = expandRecurringSlots(twoMonthsLater);

    return expanded.map((slot, idx) => ({
      id: slot.id || `slot-${idx}`,
      title: 'Available',
      start: new Date(slot.start),
      end: new Date(slot.end),
      isAvailability: true,
      resource: slot,
    }));
  }, [expandRecurringSlots]);

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: '#10b981',
      borderRadius: '8px',
      opacity: 0.7,
      color: 'white',
      border: '2px dashed #065f46',
      display: 'block',
      fontSize: '13px',
      padding: '4px 8px',
    },
  });

  const CalendarComponent = Calendar as any;

  const addEmptySlot = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now);
    end.setHours(now.getHours() + 2);

    const newSlot: AvailabilitySlot = {
      start: now.toISOString(),
      end: end.toISOString(),
      isRecurring: false,
    };
    setSelectedSlot({ slot: newSlot, index: -1, isNew: true });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-hidden border dark:border-slate-700 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Availability
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="calendar" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 shrink-0">
                <TabsList className="grid w-full max-w-xs grid-cols-2">
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    List
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="calendar" className="flex-1 overflow-hidden m-0 p-0">
                <div className="flex h-full">
                  <div className="flex-1 p-4 overflow-auto">
                    <AvailabilityStatistics slots={slots} />

                    <AvailabilityTemplates
                      onApplyTemplate={(templateSlots) => {
                        // Replace current slots with template
                        templateSlots.forEach(slot => addSlot(slot));
                      }}
                    />

                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Tip:</strong> Drag on the calendar to add availability slots.
                        Click existing slots to edit or delete them.
                      </p>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEmptySlot}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Slot
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCopyWeek(!showCopyWeek)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Week
                      </Button>
                    </div>

                    {showCopyWeek && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                          Copy current week's availability to:
                        </p>
                        <div className="flex gap-2 items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCopyTargetWeek(
                                addWeeks(startOfWeek(calendarDate, { weekStartsOn: 1 }), 1)
                              )
                            }
                            className={
                              copyTargetWeek &&
                              copyTargetWeek.getTime() ===
                                addWeeks(
                                  startOfWeek(calendarDate, { weekStartsOn: 1 }),
                                  1
                                ).getTime()
                                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                                : ''
                            }
                          >
                            Next Week
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCopyTargetWeek(
                                addWeeks(startOfWeek(calendarDate, { weekStartsOn: 1 }), 2)
                              )
                            }
                            className={
                              copyTargetWeek &&
                              copyTargetWeek.getTime() ===
                                addWeeks(
                                  startOfWeek(calendarDate, { weekStartsOn: 1 }),
                                  2
                                ).getTime()
                                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                                : ''
                            }
                          >
                            In 2 Weeks
                          </Button>
                          {copyTargetWeek && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleCopyWeek}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ height: '500px' }}>
                      <CalendarComponent
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        formats={formats}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        selectable
                        eventPropGetter={eventStyleGetter}
                        views={['week', 'day']}
                        view={calendarView}
                        onView={(view: View) => setCalendarView(view)}
                        date={calendarDate}
                        onNavigate={(date: Date) => setCalendarDate(date)}
                        min={new Date(1970, 0, 1, 6, 0, 0)}
                        max={new Date(1970, 0, 1, 23, 59, 59)}
                        step={30}
                        timeslots={2}
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>

                  <AvailabilityPreviewPanel availability={slots} />
                </div>
              </TabsContent>

              <TabsContent value="list" className="flex-1 overflow-auto m-0 p-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Times will be automatically rounded to the nearest
                    30 minutes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Availability Slots</Label>
                    <Button type="button" onClick={addEmptySlot} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Slot
                    </Button>
                  </div>

                  {slots.length === 0 ? (
                    <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                      No availability slots set. Add your first slot above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {slots.map((slot, index) => (
                        <div
                          key={slot.id || index}
                          className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Slot {index + 1}
                              {slot.isRecurring && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  ({slot.recurrencePattern})
                                </span>
                              )}
                            </h4>
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
                                onChange={(e) =>
                                  updateSlot(index, { ...slot, start: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor={`end-${index}`}>End</Label>
                              <Input
                                id={`end-${index}`}
                                type="datetime-local"
                                value={slot.end}
                                onChange={(e) =>
                                  updateSlot(index, { ...slot, end: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`recurring-${index}`}
                              checked={slot.isRecurring}
                              onCheckedChange={(checked) =>
                                updateSlot(index, {
                                  ...slot,
                                  isRecurring: !!checked,
                                  recurrencePattern: checked
                                    ? slot.recurrencePattern || 'weekly'
                                    : undefined,
                                })
                              }
                            />
                            <Label htmlFor={`recurring-${index}`}>Recurring</Label>
                          </div>

                          {slot.isRecurring && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`pattern-${index}`}>Pattern</Label>
                                <Select
                                  value={slot.recurrencePattern || ''}
                                  onValueChange={(value) =>
                                    updateSlot(index, {
                                      ...slot,
                                      recurrencePattern: value,
                                    })
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
                                <Label htmlFor={`recurrence-end-${index}`}>Until</Label>
                                <Input
                                  id={`recurrence-end-${index}`}
                                  type="datetime-local"
                                  value={slot.recurrenceEnd || ''}
                                  onChange={(e) =>
                                    updateSlot(index, {
                                      ...slot,
                                      recurrenceEnd: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mx-4 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-3 p-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
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
                disabled={isSaving}
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                {isSaving ? (
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
        )}
      </div>

      {selectedSlot && (
        <AvailabilitySlotEditor
          slot={selectedSlot.slot}
          isNew={selectedSlot.isNew}
          onSave={handleSaveSlot}
          onDelete={selectedSlot.isNew ? undefined : handleDeleteSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
