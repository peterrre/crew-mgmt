'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  
  Search,
  Loader2,
  Mail,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toggleAcceptingVolunteers } from '@/lib/actions/events';
import { useEventData } from '@/contexts/event-data-context';

interface Application {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  reviewer: {
    id: string;
    name: string | null;
  } | null;
}

interface EventApplicationsManagerProps {
  eventId: string;
  acceptingVolunteers: boolean;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow/10 text-yellow',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green/10 text-green',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red/10 text-red',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    icon: AlertCircle,
    className: 'bg-backgroundSecondary text-foregroundPrimary',
  },
};

export default function EventApplicationsManager({
  eventId,
  acceptingVolunteers: initialAccepting,
}: EventApplicationsManagerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingApplication, setReviewingApplication] = useState<Application | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [acceptingVolunteers, setAcceptingVolunteers] = useState(initialAccepting);
  const [togglingAccepting, setTogglingAccepting] = useState(false);
  const { toast } = useToast();
  const { refreshData } = useEventData();

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        if (data.event) {
          setAcceptingVolunteers(data.event.acceptingVolunteers);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleToggleAccepting = async (accepting: boolean) => {
    try {
      setTogglingAccepting(true);
      await toggleAcceptingVolunteers(eventId, accepting);
      setAcceptingVolunteers(accepting);
      toast({
        title: accepting ? 'Applications Open' : 'Applications Closed',
        description: accepting
          ? 'Volunteers can now apply to this event'
          : 'No new applications will be accepted',
      });
    } catch (error) {
      console.error('Error toggling accepting volunteers:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application settings',
        variant: 'destructive',
      });
    } finally {
      setTogglingAccepting(false);
    }
  };

  const handleReview = async () => {
    if (!reviewingApplication || !reviewAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/volunteer-applications/${reviewingApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewAction,
          reviewNote: reviewNote.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: reviewAction === 'APPROVED' ? 'Application Approved' : 'Application Rejected',
          description:
            reviewAction === 'APPROVED'
              ? `${reviewingApplication.user.name || reviewingApplication.user.email} has been added to the event crew`
              : `The application has been rejected`,
        });
        setReviewingApplication(null);
        setReviewAction(null);
        setReviewNote('');
        fetchApplications();
        // Refresh event data to update crew count
        refreshData();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to review application',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast({
        title: 'Error',
        description: 'Failed to review application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      app.user.name?.toLowerCase().includes(search) ||
      app.user.email.toLowerCase().includes(search) ||
      app.message?.toLowerCase().includes(search)
    );
  });

  const pendingApplications = filteredApplications.filter((a) => a.status === 'PENDING');
  const processedApplications = filteredApplications.filter((a) => a.status !== 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <div className="flex items-center justify-between p-4 bg-backgroundSecondary rounded-lg">
        <div>
          <h3 className="font-medium">Accept Volunteer Applications</h3>
          <p className="text-sm text-muted-foreground">
            {acceptingVolunteers
              ? 'Volunteers can apply to this event'
              : 'Applications are currently closed'}
          </p>
        </div>
        <Switch
          checked={acceptingVolunteers}
          onCheckedChange={handleToggleAccepting}
          disabled={togglingAccepting}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foregroundTertiary w-4 h-4" />
        <Input
          placeholder="Search by name, email, or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingApplications.length > 0 && (
              <Badge className="ml-2 bg-backgroundSecondary">{pendingApplications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processed ({processedApplications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending applications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-backgroundTertiary flex items-center justify-center">
                          <User className="w-4 h-4 text-foregroundTertiary" />
                        </div>
                        <div>
                          <div className="font-medium">{app.user.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.message ? (
                        <span className="text-sm line-clamp-2">{app.message}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No message</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green border-green hover:bg-green/10"
                          onClick={() => {
                            setReviewingApplication(app);
                            setReviewAction('APPROVED');
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red border-red hover:bg-red/10"
                          onClick={() => {
                            setReviewingApplication(app);
                            setReviewAction('REJECTED');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="processed" className="mt-4">
          {processedApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processed applications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewer Note</TableHead>
                  <TableHead>Reviewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedApplications.map((app) => {
                  const status = statusConfig[app.status];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-backgroundTertiary flex items-center justify-center">
                            <User className="w-4 h-4 text-foregroundTertiary" />
                          </div>
                          <div>
                            <div className="font-medium">{app.user.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{app.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.reviewNote ? (
                          <span className="text-sm">{app.reviewNote}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.reviewedAt ? (
                          <div className="text-sm">
                            <div>{new Date(app.reviewedAt).toLocaleDateString()}</div>
                            {app.reviewer && (
                              <div className="text-muted-foreground">by {app.reviewer.name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog
        open={!!reviewingApplication && !!reviewAction}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingApplication(null);
            setReviewAction(null);
            setReviewNote('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVED' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVED'
                ? `This will add ${reviewingApplication?.user.name || reviewingApplication?.user.email} to the event crew.`
                : `This will reject the application from ${reviewingApplication?.user.name || reviewingApplication?.user.email}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviewingApplication?.message && (
              <div className="bg-backgroundSecondary rounded-md p-3">
                <p className="text-xs text-foregroundTertiary mb-1">Applicant&apos;s message:</p>
                <p className="text-sm">{reviewingApplication.message}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reviewNote">Note (optional)</Label>
              <Textarea
                id="reviewNote"
                placeholder={
                  reviewAction === 'APPROVED'
                    ? 'Add a welcome note or instructions...'
                    : 'Provide a reason for rejection...'
                }
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewingApplication(null);
                setReviewAction(null);
                setReviewNote('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={submitting}
              className={
                reviewAction === 'APPROVED'
                  ? 'bg-green hover:bg-green/80'
                  : 'bg-red hover:bg-red'
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : reviewAction === 'APPROVED' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}