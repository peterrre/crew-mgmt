'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Loader2, XCircle, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ListSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toastApplicationWithdrawn, toastLoadError, toastGenericError } from '@/lib/toast-helpers';

interface Application {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string | null;
  };
  reviewer: {
    name: string;
  } | null;
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

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/volunteer-applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toastLoadError('your applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    // Store original state for rollback
    const originalApplications = [...applications];

    // Optimistic update: immediately mark as withdrawn
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: 'WITHDRAWN' as const } : app
      )
    );

    // Undo function to resubmit the application
    const handleUndo = async () => {
      try {
        const response = await fetch(`/api/volunteer-applications/${applicationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PENDING' }),
        });

        if (response.ok) {
          setApplications((prev) =>
            prev.map((app) =>
              app.id === applicationId ? { ...app, status: 'PENDING' as const } : app
            )
          );
          toast({
            title: 'Application Restored',
            description: 'Your application has been restored to pending status.',
          });
        } else {
          toastGenericError('Failed to restore application');
        }
      } catch (error) {
        console.error('Error restoring application:', error);
        toastGenericError('Failed to restore application');
      }
    };

    try {
      const response = await fetch(`/api/volunteer-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      });

      if (response.ok) {
        toastApplicationWithdrawn(handleUndo);
      } else {
        // Rollback on error
        setApplications(originalApplications);
        const data = await response.json();
        toastGenericError(data.error || 'Failed to withdraw application');
      }
    } catch (error) {
      // Rollback on error
      setApplications(originalApplications);
      console.error('Error withdrawing application:', error);
      toastGenericError('Failed to withdraw application');
    } finally {
      setWithdrawing(null);
    }
  };

  if (loading) {
    return <ListSkeleton items={3} />;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No applications yet"
        description="You haven't applied to any events yet. Browse available events above to find opportunities to volunteer!"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {applications.map((application) => {
          const status = statusConfig[application.status];
          const StatusIcon = status.icon;

          return (
            <Card key={application.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{application.event.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(application.event.startDate).toLocaleDateString()} - {new Date(application.event.endDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={status.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {application.event.location && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {application.event.location}
                  </p>
                )}
                {application.message && (
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-md p-3 mb-3">
                    <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Your message:</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{application.message}</p>
                  </div>
                )}
                {application.reviewNote && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 mb-3">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Reviewer note{application.reviewer ? ` from ${application.reviewer.name}` : ''}:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{application.reviewNote}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500 dark:text-slate-500">
                    Applied: {new Date(application.createdAt).toLocaleDateString()}
                    {application.reviewedAt && (
                      <> | Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}</>
                    )}
                  </p>
                  {application.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawing(application.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={!!withdrawing} onOpenChange={(open) => !open && setWithdrawing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? You can apply again later if the event is still accepting volunteers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => withdrawing && handleWithdraw(withdrawing)}
              className="bg-red-600 hover:bg-red-700"
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
