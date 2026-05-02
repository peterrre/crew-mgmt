'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
import { toast } from 'sonner';

interface Helper {
  id: string;
  name: string | null;
  email: string;
  role: string;
  availability: string[];
  availabilitySlots: any[];
}

interface EditHelperDialogProps {
  helper: Helper | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditHelperDialog({
  helper,
  onClose,
  onSuccess,
}: EditHelperDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [formData, setFormData] = useState({
    name: helper?.name || '',
    role: helper?.role || Role.VOLUNTEER,
    password: '',
    availability: helper?.availability?.join(', ') || '',
  });

  const isAdmin = (session?.user as any)?.role === Role.ADMIN;
  const isOwnProfile = (session?.user as any)?.id === helper?.id;
  const canEditName = isAdmin || isOwnProfile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helper) return;
    setLoading(true);
    setServerError('');

    try {
      const updateData: any = { role: formData.role };

      if (canEditName && formData.name) {
        updateData.name = formData.name;
      }

      if (formData.password) {
        updateData.password = formData.password;
      }

      if (formData.role === Role.VOLUNTEER) {
        updateData.availability = formData.availability
          ? formData.availability.split(',').map((s) => s.trim())
          : [];
      }

      const response = await fetch(`/api/helpers/${helper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || 'Failed to update helper';
        setServerError(msg);
        toast.error(msg);
        return;
      }

      toast.success('Helfer aktualisiert');
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
      setServerError('');
      onClose();
    }
  };

  if (!helper) return null;

  return (
    <Dialog open={!!helper} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Helper</DialogTitle>
          <DialogDescription>Update helper information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            {canEditName ? (
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue"
                placeholder="Enter name"
              />
            ) : (
              <p className="text-sm text-foregroundSecondary">{helper?.name || 'Unnamed'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-foregroundSecondary">{helper?.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={!isAdmin}
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

          <div className="space-y-2">
            <Label htmlFor="edit-password">New Password (optional)</Label>
            <Input
              id="edit-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue"
              placeholder="Leave blank to keep current"
              minLength={6}
            />
          </div>

          {formData.role === 'VOLUNTEER' && (
            <>
              {helper?.availabilitySlots?.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Availability Times</Label>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-backgroundSecondary">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Start</th>
                          <th className="px-3 py-2 text-left">End</th>
                          <th className="px-3 py-2 text-left">Recurring</th>
                        </tr>
                      </thead>
                      <tbody>
                        {helper.availabilitySlots.map((slot: any, index: number) => (
                          <tr key={index} className="border-t border-border/30">
                            <td className="px-3 py-2">{new Date(slot.start).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{new Date(slot.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="px-3 py-2">{new Date(slot.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="px-3 py-2">{slot.isRecurring ? slot.recurrencePattern || 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-availability">Availability</Label>
                <Input
                  id="edit-availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="h-11 rounded-xl border-border bg-backgroundSecondary/60 transition-all duration-200 focus:ring-2 focus:ring-blue/30 focus:border-blue"
                  placeholder="e.g., Weekends, Evenings"
                />
                <p className="text-xs text-foregroundTertiary">Separate with commas</p>
              </div>
            </>
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
              disabled={loading}
              className="flex-1 bg-blue hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
