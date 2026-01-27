'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEventData } from '@/contexts/event-data-context';
import { toastRequestApproved, toastRequestRejected, toastGenericError } from '@/lib/toast-helpers';
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';

interface ShiftRequest {
  id: string;
  type: 'CANCEL' | 'SWAP' | 'MODIFY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  shift: {
    id: string;
    title: string;
    start: Date;
    end: Date;
  };
  requester: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  newHelper?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  reviewer?: {
    id: string;
    name: string | null;
  } | null;
  newStart?: Date | null;
  newEnd?: Date | null;
}

interface EventRequestsManagerProps {
  eventId: string;
}

export default function EventRequestsManager({ eventId }: EventRequestsManagerProps) {
  const { requests, requestsLoading, refreshRequests, refreshAll } = useEventData();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [typeFilter, setTypeFilter] = useState<'all' | 'CANCEL' | 'SWAP' | 'MODIFY'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [optimisticRequests, setOptimisticRequests] = useState<ShiftRequest[]>([]);
  const { toast } = useToast();

  // Use optimistic requests if available, otherwise use context requests
  const displayRequests = optimisticRequests.length > 0 ? optimisticRequests : requests;

  const handleApprove = async (requestId: string) => {
    // Optimistic update: immediately mark as approved
    const updatedRequests = requests.map((req) =>
      req.id === requestId
        ? { ...req, status: 'APPROVED' as const, reviewedAt: new Date().toISOString() }
        : req
    );
    setOptimisticRequests(updatedRequests);
    setProcessingId(requestId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/shift-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toastRequestApproved(data.message);
        await refreshAll();
        setOptimisticRequests([]); // Clear optimistic state after real data loads
      } else {
        // Rollback on error
        setOptimisticRequests([]);
        toastGenericError(data.error || 'Failed to approve request');
      }
    } catch (error) {
      // Rollback on error
      setOptimisticRequests([]);
      console.error('Error approving request:', error);
      toastGenericError('An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    // Optimistic update: immediately mark as rejected
    const updatedRequests = requests.map((req) =>
      req.id === requestId
        ? { ...req, status: 'REJECTED' as const, reviewedAt: new Date().toISOString() }
        : req
    );
    setOptimisticRequests(updatedRequests);
    setProcessingId(requestId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/shift-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED' }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toastRequestRejected(data.message);
        await refreshAll();
        setOptimisticRequests([]); // Clear optimistic state after real data loads
      } else {
        // Rollback on error
        setOptimisticRequests([]);
        toastGenericError(data.error || 'Failed to reject request');
      }
    } catch (error) {
      // Rollback on error
      setOptimisticRequests([]);
      console.error('Error rejecting request:', error);
      toastGenericError('An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    let filtered = displayRequests;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.shift.title.toLowerCase().includes(query) ||
          r.requester.name?.toLowerCase().includes(query) ||
          r.requester.email.toLowerCase().includes(query) ||
          r.reason?.toLowerCase().includes(query)
      );
    }

    // Sort by created date (newest first)
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [displayRequests, statusFilter, typeFilter, searchQuery]);

  // Count requests by status
  const counts = useMemo(() => {
    return {
      pending: displayRequests.filter((r) => r.status === 'PENDING').length,
      approved: displayRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: displayRequests.filter((r) => r.status === 'REJECTED').length,
    };
  }, [displayRequests]);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CANCEL':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'SWAP':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MODIFY':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(date);
  };

  if (requestsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with status tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Pending ({counts.pending})
        </Button>
        <Button
          variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('APPROVED')}
          className="flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Approved ({counts.approved})
        </Button>
        <Button
          variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('REJECTED')}
          className="flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Rejected ({counts.rejected})
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All ({displayRequests.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by shift, requester, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CANCEL">Cancel</SelectItem>
            <SelectItem value="SWAP">Swap</SelectItem>
            <SelectItem value="MODIFY">Modify</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-slate-400 text-center">
                {searchQuery || typeFilter !== 'all'
                  ? 'No requests match your filters'
                  : statusFilter === 'PENDING'
                  ? 'No pending requests'
                  : 'No requests found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left section: Request info */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getStatusIcon(request.status)}</div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getTypeBadgeColor(request.type)}>
                            {request.type}
                          </Badge>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {request.shift.title}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {getTimeAgo(request.createdAt)}
                          </span>
                        </div>

                        {/* Shift time */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDateTime(request.shift.start)} - {formatDateTime(request.shift.end)}
                          </span>
                        </div>

                        {/* Requester */}
                        <div className="flex items-start gap-2 text-sm mb-2">
                          <User className="w-4 h-4 mt-0.5 text-gray-500" />
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {request.requester.name || request.requester.email}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              ({request.requester.role})
                            </span>
                          </div>
                        </div>

                        {/* Request details based on type */}
                        {request.type === 'SWAP' && request.newHelper && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                            <p className="text-sm text-blue-900 dark:text-blue-300">
                              <span className="font-medium">Swap with:</span>{' '}
                              {request.newHelper.name || request.newHelper.email}
                            </p>
                          </div>
                        )}

                        {request.type === 'MODIFY' && request.newStart && request.newEnd && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                            <p className="text-sm text-amber-900 dark:text-amber-300">
                              <span className="font-medium">New time:</span>{' '}
                              {formatDateTime(request.newStart)} - {formatDateTime(request.newEnd)}
                            </p>
                          </div>
                        )}

                        {/* Reason */}
                        {request.reason && (
                          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-md p-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Reason:</span> {request.reason}
                            </p>
                          </div>
                        )}

                        {/* Reviewer info for processed requests */}
                        {request.status !== 'PENDING' && request.reviewer && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {request.status.charAt(0) + request.status.slice(1).toLowerCase()} by{' '}
                            {request.reviewer.name} {request.reviewedAt && `on ${formatDateTime(request.reviewedAt)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right section: Actions */}
                  {request.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        size="sm"
                        className="w-full sm:w-auto lg:w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        size="sm"
                        className="w-full sm:w-auto lg:w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
