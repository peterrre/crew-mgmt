'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, ClipboardCheck, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CardGridSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toastApplicationSubmitted, toastLoadError, toastGenericError } from '@/lib/toast-helpers';
import { useRouter } from 'next/navigation';

interface AvailableEvent {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  contactPerson: { name: string; email: string } | null;
  crewCount: number;
  shiftsCount: number;
  pendingApplicationsCount: number;
  hasApplied: boolean;
}

export default function AvailableEvents() {
  const [events, setEvents] = useState<AvailableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<AvailableEvent | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchAvailableEvents();
  }, []);

  const fetchAvailableEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/available-events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching available events:', error);
      toastLoadError('available events');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!applyingTo) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/volunteer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: applyingTo.id,
          message: message.trim() || undefined,
        }),
      });

      if (response.ok) {
        toastApplicationSubmitted(applyingTo.name, () => {
          router.push('/my-applications');
        });
        setApplyingTo(null);
        setMessage('');
        // Update the event in the list to show "Applied"
        setEvents((prev) =>
          prev.map((e) =>
            e.id === applyingTo.id ? { ...e, hasApplied: true } : e
          )
        );
      } else {
        const data = await response.json();
        toastGenericError(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toastGenericError('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <CardGridSkeleton cards={6} />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No events available"
        description="There are no events currently accepting volunteer applications. Check back later for new opportunities!"
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{event.name}</CardTitle>
                {event.hasApplied && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Applied
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.location && (
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              )}
              {event.description && (
                <p className="text-sm text-gray-500 dark:text-slate-500 mb-3 line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-gray-600 border-gray-400">
                  <Users className="w-3 h-3 mr-1" />
                  {event.crewCount} crew
                </Badge>
                <Badge variant="outline" className="text-gray-600 border-gray-400">
                  {event.shiftsCount} shifts
                </Badge>
              </div>
              {event.hasApplied ? (
                <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-400">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Application pending review
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setApplyingTo(event)}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Apply to Volunteer
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Apply Dialog */}
      <Dialog open={!!applyingTo} onOpenChange={(open) => !open && setApplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {applyingTo?.name}</DialogTitle>
            <DialogDescription>
              Submit your application to volunteer at this event. The event organizers will review your application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-slate-400">
                <p className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  {applyingTo && new Date(applyingTo.startDate).toLocaleDateString()} - {applyingTo && new Date(applyingTo.endDate).toLocaleDateString()}
                </p>
                {applyingTo?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {applyingTo.location}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the organizers why you'd like to volunteer at this event..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyingTo(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
