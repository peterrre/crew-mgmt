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
import { X, Loader2 } from 'lucide-react';

interface Helper {
  id: string;
  name: string | null;
  email: string;
  role: string;
  availability: string[];
  availabilitySlots: any[];
}

interface EditHelperDialogProps {
  helper: Helper;
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
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: helper.name || '',
    role: helper.role,
    password: '',
    availability: helper?.availability?.join(', ') || '',
  });

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isOwnProfile = (session?.user as any)?.id === helper.id;
  const canEditName = isAdmin || isOwnProfile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData: any = { role: formData.role };

      if (canEditName && formData.name) {
        updateData.name = formData.name;
      }

      if (formData.password) {
        updateData.password = formData.password;
      }

      if (formData.role === 'VOLUNTEER') {
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
        setError(data.error || 'Failed to update helper');
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
      <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Edit Helper</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            {canEditName ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{helper?.name || 'Unnamed'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{helper?.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={!isAdmin}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CREW">Crew</SelectItem>
                <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password (optional)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep current"
              minLength={6}
            />
          </div>

          {formData.role === 'VOLUNTEER' && (
            <>
              {helper?.availabilitySlots?.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Availability Times</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Start</th>
                          <th className="px-3 py-2 text-left">End</th>
                          <th className="px-3 py-2 text-left">Recurring</th>
                        </tr>
                      </thead>
                      <tbody>
                        {helper.availabilitySlots.map((slot: any, index: number) => (
                          <tr key={index} className="border-t">
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
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  value={formData.availability}
                  onChange={(e) =>
                    setFormData({ ...formData, availability: e.target.value })
                  }
                  placeholder="e.g., Weekends, Evenings"
                />
                <p className="text-xs text-muted-foreground">Separate with commas</p>
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>
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
        </form>
      </div>
    </div>
  );
}
