'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { FormFieldMessage } from '@/components/ui/form-fields';

interface CreateShiftRequestDialogProps {
  open: boolean;
  shift: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    helper?: {
      id: string;
      name: string | null;
    } | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface Helper {
  id: string;
  name: string | null;
  email: string;
}

type RequestType = 'CANCEL' | 'SWAP' | 'MODIFY';

const requestSchema = z.object({
  type: z.enum(['CANCEL', 'SWAP', 'MODIFY']),
  reason: z.string().min(1, { message: 'Grund ist erforderlich' }),
  newHelperId: z.string().optional(),
  newStart: z.string().optional(),
  newEnd: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function CreateShiftRequestDialog({
  open,
  shift,
  onClose,
  onSuccess,
}: CreateShiftRequestDialogProps) {
  const [availableHelpers, setAvailableHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHelpers, setLoadingHelpers] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'CANCEL',
      reason: '',
      newHelperId: '',
      newStart: '',
      newEnd: '',
    },
  });

  const requestType = watch('type');
  const newHelperId = watch('newHelperId');

  const fetchAvailableHelpers = useCallback(async () => {
    if (!shift) return;
    setLoadingHelpers(true);
    try {
      const response = await fetch('/api/shift-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: shift.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableHelpers(data.helpers || []);
      } else {
        toast.error('Fehler beim Laden der verfügbaren Helfer.');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoadingHelpers(false);
    }
  }, [shift]);

  useEffect(() => {
    if (requestType === 'SWAP') {
      fetchAvailableHelpers();
    }
  }, [requestType, fetchAvailableHelpers]);

  const onSubmit = async (data: RequestFormValues) => {
    if (!shift) return;
    setLoading(true);
    try {
      const body: any = {
        shiftId: shift.id,
        type: data.type,
        reason: data.reason,
      };

      if (data.type === 'SWAP') {
        body.newHelperId = data.newHelperId;
      } else if (data.type === 'MODIFY') {
        body.newStart = new Date(data.newStart || '');
        body.newEnd = new Date(data.newEnd || '');
      }

      const response = await fetch('/api/shift-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success('Anfrage eingereicht — wird überprüft.');
        reset();
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Anfrage konnte nicht gesendet werden.');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open && !!shift} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schicht-Änderung anfragen</DialogTitle>
          <DialogDescription>
            {shift ? `${shift.title} · ${new Date(shift.start).toLocaleString('de-DE')} – ${new Date(shift.end).toLocaleTimeString('de-DE')}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="req-type">Art der Anfrage</Label>
            <Select
              value={requestType}
              onValueChange={(value) => setValue('type', value as RequestType, { shouldValidate: true })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Art auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CANCEL">Schicht absagen</SelectItem>
                <SelectItem value="SWAP">Mit anderem Helfer tauschen</SelectItem>
                <SelectItem value="MODIFY">Zeit ändern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requestType === 'SWAP' && (
            <div className="space-y-2">
              <Label>Tauschen mit</Label>
              {loadingHelpers ? (
                <p className="text-sm text-foregroundTertiary">Lade verfügbare Helfer…</p>
              ) : availableHelpers.length === 0 ? (
                <p className="text-sm text-red">Keine Helfer für dieses Zeitfenster verfügbar</p>
              ) : (
                <Select
                  value={newHelperId}
                  onValueChange={(value) => setValue('newHelperId', value, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Helfer auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHelpers.map((helper) => (
                      <SelectItem key={helper.id} value={helper.id}>
                        {helper.name} ({helper.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {requestType === 'MODIFY' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="req-newStart">Neue Startzeit</Label>
                <Input
                  id="req-newStart"
                  type="datetime-local"
                  {...register('newStart')}
                  className="h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-newEnd">Neue Endzeit</Label>
                <Input
                  id="req-newEnd"
                  type="datetime-local"
                  {...register('newEnd')}
                  className="h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="req-reason">
              Grund <span className="text-red">*</span>
            </Label>
            <Textarea
              id="req-reason"
              {...register('reason')}
              className={cn(
                'rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.reason ? 'border-destructive' : ''
              )}
              placeholder="Bitte erkläre, warum du diese Änderung brauchst…"
              rows={3}
            />
            <FormFieldMessage message={errors.reason?.message} type="error" />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !isValid}
              className="bg-blue hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anfrage senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
