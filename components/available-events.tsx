'use client';

import { useEffect, useState , useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, ClipboardCheck, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    fetchAvailableEvents();
  });

  const fetchAvailableEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/available-events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching available events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
}, [toast]);

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
        toast({
          title: 'Application Submitted',
          description: `Your application to ${applyingTo.name} has been submitted. You'll be notified once it's reviewed.`,
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
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit application',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <p className="text-gray-600 dark:text-slate-400">Loading available events...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ClipboardCheck className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-slate-400 text-center">
            No events are currently accepting volunteer applications.
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-500 text-center mt-1">
            Check back later for new opportunities!
          </p>
        </CardContent>
      </Card>
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