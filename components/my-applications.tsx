'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Loader2, XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
 className: 'bg-backgroundSecondary text-foregroundSecondary',
 },
};

export default function MyApplications() {
 const [applications, setApplications] = useState<Application[]>([]);
 const [loading, setLoading] = useState(true);
 const [withdrawing, setWithdrawing] = useState<string | null>(null);
 const { toast } = useToast();

 const fetchApplications = useCallback(async () => {
 try {
 setLoading(true);
 const response = await fetch('/api/volunteer-applications');
 if (response.ok) {
 const data = await response.json();
 setApplications(data.applications || []);
 }
 } catch (error) {
 console.error('Error fetching applications:', error);
 toast({
 title: 'Error',
 description: 'Failed to load your applications',
 variant: 'destructive',
 });
 } finally {
 setLoading(false);
 }
 }, [toast]);

 useEffect(() => {
 fetchApplications();
 }, [fetchApplications]);

 const handleWithdraw = async (applicationId: string) => {
 try {
 const response = await fetch(`/api/volunteer-applications/${applicationId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: 'WITHDRAWN' }),
 });

 if (response.ok) {
 toast({
 title: 'Application Withdrawn',
 description: 'Your application has been withdrawn.',
 });
 // Update local state
 setApplications((prev) =>
 prev.map((app) =>
 app.id === applicationId ? { ...app, status: 'WITHDRAWN' as const } : app
 )
 );
 } else {
 const data = await response.json();
 toast({
 title: 'Error',
 description: data.error || 'Failed to withdraw application',
 variant: 'destructive',
 });
 }
 } catch (error) {
 console.error('Error withdrawing application:', error);
 toast({
 title: 'Error',
 description: 'Failed to withdraw application',
 variant: 'destructive',
 });
 } finally {
 setWithdrawing(null);
 }
 };

 if (loading) {
 return (
 <Card>
 <CardContent className="flex items-center justify-center py-8">
 <Loader2 className="w-6 h-6 animate-spin mr-2" />
 <p className="text-foregroundSecondary">Loading your applications...</p>
 </CardContent>
 </Card>
 );
 }

 if (applications.length === 0) {
 return (
 <Card>
 <CardContent className="flex items-center justify-center py-8">
 <p className="text-foregroundSecondary">You haven&apos;t applied to any events yet.</p>
 </CardContent>
 </Card>
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
 <p className="text-sm text-foregroundSecondary mb-2 flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 {application.event.location}
 </p>
 )}
 {application.message && (
 <div className="bg-backgroundSecondary rounded-md p-3 mb-3">
 <p className="text-xs text-foregroundTertiary mb-1">Your message:</p>
 <p className="text-sm text-foregroundPrimary">{application.message}</p>
 </div>
 )}
 {application.reviewNote && (
 <div className="bg-blue/10 rounded-md p-3 mb-3">
 <p className="text-xs text-blue mb-1">
 Reviewer note{application.reviewer ? ` from ${application.reviewer.name}` : ''}:
 </p>
 <p className="text-sm text-blue">{application.reviewNote}</p>
 </div>
 )}
 <div className="flex items-center justify-between mt-3">
 <p className="text-xs text-foregroundTertiary">
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
 className="text-red border-red hover:bg-red/10"
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
 className="bg-red hover:bg-red/90"
 >
 Withdraw
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </>
 );
}
