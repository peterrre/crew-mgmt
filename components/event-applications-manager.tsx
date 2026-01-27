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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Search,
  Loader2,
  Mail,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toggleAcceptingVolunteers } from '@/lib/actions/events';
import { useEventData } from '@/contexts/event-data-context';
import {
  toastApplicationApproved,
  toastApplicationRejected,
  toastApplicationsToggled,
  toastLoadError,
  toastGenericError,
} from '@/lib/toast-helpers';

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
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
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
      toastLoadError('applications');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleToggleAccepting = async (accepting: boolean) => {
    const previousState = acceptingVolunteers;

    // Optimistic update
    setAcceptingVolunteers(accepting);

    try {
      setTogglingAccepting(true);
      await toggleAcceptingVolunteers(eventId, accepting);
      toastApplicationsToggled(accepting);
    } catch (error) {
      // Rollback on error
      setAcceptingVolunteers(previousState);
      console.error('Error toggling accepting volunteers:', error);
      toastGenericError('Failed to update application settings');
    } finally {
      setTogglingAccepting(false);
    }
  };

  const handleReview = async () => {
    if (!reviewingApplication || !reviewAction) return;

    // Store original applications for rollback
    const originalApplications = [...applications];

    // Optimistic update: immediately update UI
    const updatedApplications = applications.map((app) =>
      app.id === reviewingApplication.id
        ? {
            ...app,
            status: reviewAction,
            reviewNote: reviewNote.trim() || null,
            reviewedAt: new Date().toISOString(),
          }
        : app
    );
    setApplications(updatedApplications as Application[]);

    // Close dialog and reset immediately
    setReviewingApplication(null);
    setReviewAction(null);
    setReviewNote('');

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
        if (reviewAction === 'APPROVED') {
          toastApplicationApproved(
            reviewingApplication.user.name || reviewingApplication.user.email,
            'the event'
          );
        } else {
          toastApplicationRejected(reviewingApplication.user.name || reviewingApplication.user.email);
        }
        // Fetch fresh data to ensure sync
        fetchApplications();
        // Refresh event data to update crew count
        refreshData();
      } else {
        // Rollback on error
        setApplications(originalApplications);
        const data = await response.json();
        toastGenericError(data.error || 'Failed to review application');
      }
    } catch (error) {
      // Rollback on error
      setApplications(originalApplications);
      console.error('Error reviewing application:', error);
      toastGenericError('Failed to review application');
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
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
              <Badge className="ml-2 bg-yellow-500">{pendingApplications.length}</Badge>
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Applicant</TableHead>
                      <TableHead className="min-w-[150px]">Message</TableHead>
                      <TableHead className="min-w-[100px]">Applied</TableHead>
                      <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">{app.user.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{app.user.email}</span>
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
                          <span className="text-sm whitespace-nowrap">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50 whitespace-nowrap"
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
                              className="text-red-600 border-red-600 hover:bg-red-50 whitespace-nowrap"
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
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="mt-4">
          {processedApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processed applications
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Applicant</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Reviewer Note</TableHead>
                      <TableHead className="min-w-[150px]">Reviewed</TableHead>
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
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium">{app.user.name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground truncate">{app.user.email}</div>
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
                              <div className="text-sm whitespace-nowrap">
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
              </div>
            </div>
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
              <div className="bg-gray-50 dark:bg-slate-800 rounded-md p-3">
                <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Applicant's message:</p>
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
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
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
