'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, LogOut, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ShiftRequest {
  id: string;
  type: 'SWAP' | 'CANCEL' | 'MODIFY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  newHelperId?: string;
  newStart?: string;
  newEnd?: string;
  createdAt: string;
  shift: {
    id: string;
    title: string;
    start: string;
    end: string;
    helper: {
      id: string;
      name: string;
      email: string;
    };
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  newHelper?: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
}

export default function ShiftRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/shift-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shift requests.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/shift-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status }),
      });

      if (response.ok) {
        toast({
          title: 'Request Updated',
          description: `Request has been ${status.toLowerCase()}.`,
        });
        fetchRequests(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CANCEL':
        return 'bg-red-100 text-red-800';
      case 'SWAP':
        return 'bg-blue-100 text-blue-800';
      case 'MODIFY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-amber-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="dark:text-slate-300 dark:hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-sky-900 dark:text-white">Shift Requests</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-sky-700 hover:text-sky-900 dark:text-slate-300 dark:hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-sky-900 dark:text-white mb-2">Manage Shift Requests</h2>
          <p className="text-sky-700 dark:text-slate-400">Review and approve volunteer shift change requests</p>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-gray-600 dark:text-slate-400">No shift requests found</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="w-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.shift.title}</CardTitle>
                      <CardDescription>
                        {new Date(request.shift.start).toLocaleString()} - {new Date(request.shift.end).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(request.type)}>{request.type}</Badge>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-slate-300 mb-2">Requester</h4>
                      <p className="text-sm">{request.requester.name} ({request.requester.email})</p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Current Helper: {request.shift.helper?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-slate-300 mb-2">Request Details</h4>
                      <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                      {request.type === 'SWAP' && request.newHelper && (
                        <p className="text-sm"><strong>Swap with:</strong> {request.newHelper.name}</p>
                      )}
                      {request.type === 'MODIFY' && (
                        <div className="text-sm">
                          <p><strong>New Start:</strong> {request.newStart ? new Date(request.newStart).toLocaleString() : 'N/A'}</p>
                          <p><strong>New End:</strong> {request.newEnd ? new Date(request.newEnd).toLocaleString() : 'N/A'}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
                        Requested: {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReviewRequest(request.id, 'APPROVED')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReviewRequest(request.id, 'REJECTED')}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.reviewer && (
                    <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
                      Reviewed by {request.reviewer.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}