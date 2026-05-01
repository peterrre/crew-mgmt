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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { FormFieldMessage } from '@/components/ui/form-fields';
import { toast } from 'sonner';

interface Helper {
  id: string;
  name: string | null;
  email: string;
  role: string;
  availability: string[];
}

const shiftSchema = z.object({
  title: z.string().min(1, { message: 'Shift title is required' }),
  start: z.string().min(1, { message: 'Start time is required' }),
  end: z.string().min(1, { message: 'End time is required' }),
  helperId: z.string().default('unassigned'),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

interface CreateShiftDialogProps {
  open: boolean;
  selectedSlot: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateShiftDialog({
  open,
  selectedSlot,
  onClose,
  onSuccess,
}: CreateShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [helpers, setHelpers] = useState<Helper[]>([]);

  const formatLocalDateTime = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      start: selectedSlot?.start ? formatLocalDateTime(selectedSlot.start) : '',
      end: selectedSlot?.end ? formatLocalDateTime(selectedSlot.end) : '',
      helperId: 'unassigned',
    },
  });

  const selectedHelperId = watch('helperId');
  const startValue = watch('start');

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

  const selectedHelper = helpers.find((h) => h.id === selectedHelperId);
  const showAvailabilityWarning =
    selectedHelper?.role === 'VOLUNTEER' &&
    selectedHelper?.availability?.length > 0 &&
    startValue;

  const onSubmit = async (data: ShiftFormValues) => {
    setLoading(true);
    setServerError('');

    try {
      const helperIdToSend =
        data.helperId === 'unassigned' || data.helperId === '' ? null : data.helperId;

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          start: new Date(data.start).toISOString(),
          end: new Date(data.end).toISOString(),
          helperId: helperIdToSend,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const msg = responseData.error || 'Failed to create shift';
        setServerError(msg);
        toast.error(msg);
        return;
      }

      toast.success('Shift created successfully');
      reset();
      onSuccess();
    } catch (err) {
      const msg = 'Something went wrong';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setServerError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Shift</DialogTitle>
          <DialogDescription>Schedule a new shift for an event</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="shift-title">Shift Title</Label>
            <Input
              id="shift-title"
              {...register('title')}
              className={cn(
                'h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.title ? 'border-destructive' : ''
              )}
              placeholder="e.g., Stage Setup, Bar, Security"
            />
            <FormFieldMessage message={errors.title?.message} type="error" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift-start">Start Time</Label>
            <Input
              id="shift-start"
              type="datetime-local"
              {...register('start')}
              className={cn(
                'h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.start ? 'border-destructive' : ''
              )}
            />
            <FormFieldMessage message={errors.start?.message} type="error" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift-end">End Time</Label>
            <Input
              id="shift-end"
              type="datetime-local"
              {...register('end')}
              className={cn(
                'h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.end ? 'border-destructive' : ''
              )}
            />
            <FormFieldMessage message={errors.end?.message} type="error" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift-helper">Assign Helper (optional)</Label>
            <Select
              value={selectedHelperId}
              onValueChange={(value) => setValue('helperId', value, { shouldValidate: true })}
            >
              <SelectTrigger className="h-11 rounded-xl">
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
            <div className="bg-blue/10 border border-blue/20 rounded-xl p-3">
              <p className="text-sm text-blue font-medium">Availability Note:</p>
              <p className="text-xs text-blue mt-1">
                {selectedHelper?.availability?.join(', ')}
              </p>
            </div>
          )}

          {serverError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
              {serverError}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
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
              disabled={loading || !isValid}
              className="flex-1 bg-blue hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
