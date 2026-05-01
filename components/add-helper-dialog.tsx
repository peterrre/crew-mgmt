'use client';

import { useState } from 'react';
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
import { Role } from '@/lib/role';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { FormFieldMessage } from '@/components/ui/form-fields';
import { toast } from 'sonner';

const addHelperSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.string().default(Role.VOLUNTEER),
  availability: z.string().optional(),
});

type AddHelperFormValues = z.infer<typeof addHelperSchema>;

interface AddHelperDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHelperDialog({
  open,
  onClose,
  onSuccess,
}: AddHelperDialogProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<AddHelperFormValues>({
    resolver: zodResolver(addHelperSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: Role.VOLUNTEER,
      availability: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: AddHelperFormValues) => {
    setLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/helpers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          availability: data.availability
            ? data.availability.split(',').map((s) => s.trim())
            : [],
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const msg = responseData.error || 'Failed to create helper';
        setServerError(msg);
        toast.error(msg);
        return;
      }

      toast.success('Helper added successfully');
      onSuccess();
      reset();
      onClose();
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
          <DialogTitle>Add Helper</DialogTitle>
          <DialogDescription>Create a new helper account</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              {...register('name')}
              className={cn(
                'h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.name ? 'border-destructive' : ''
              )}
              placeholder="John Doe"
            />
            <FormFieldMessage message={errors.name?.message} type="error" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              {...register('email')}
              className={cn(
                'h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.email ? 'border-destructive' : ''
              )}
              placeholder="john@example.com"
            />
            <FormFieldMessage message={errors.email?.message} type="error" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-password">Password</Label>
            <Input
              id="add-password"
              type="password"
              {...register('password')}
              className={cn(
                'h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue',
                errors.password ? 'border-destructive' : ''
              )}
              placeholder="••••••••"
              minLength={6}
            />
            <FormFieldMessage message={errors.password?.message} type="error" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value, { shouldValidate: true })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.CREW}>Crew</SelectItem>
                <SelectItem value={Role.VOLUNTEER}>Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRole === Role.VOLUNTEER && (
            <div className="space-y-2">
              <Label htmlFor="add-availability">Availability (optional)</Label>
              <Input
                id="add-availability"
                {...register('availability')}
                className="h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue"
                placeholder="e.g., Weekends, Evenings"
              />
              <p className="text-xs text-foregroundTertiary">
                Separate with commas
              </p>
            </div>
          )}

          {serverError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
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
                  Adding...
                </>
              ) : (
                'Add Helper'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
