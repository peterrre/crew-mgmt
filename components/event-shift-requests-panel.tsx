'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ShiftRequest {
  id: string;
  type: 'CANCEL' | 'SWAP' | 'MODIFY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  createdAt: string;
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

interface EventShiftRequestsPanelProps {
  requests: ShiftRequest[];
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

export default function EventShiftRequestsPanel({
  requests,
  onApprove,
  onReject,
}: EventShiftRequestsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const recentRequests = requests.filter((r) => r.status !== 'PENDING').slice(0, 3);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onApprove(requestId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onReject(requestId);
    } finally {
      setProcessingId(null);
    }
  };

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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-sky-900 dark:text-white">
            Shift Requests
          </h3>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
              {pendingRequests.length} pending
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {pendingRequests.length === 0 && recentRequests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No shift requests for this event
            </p>
          ) : (
            <>
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pending Approval
                  </h4>
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(request.type)}`}>
                              {request.type}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.shift.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDateTime(request.shift.start)} - {formatDateTime(request.shift.end)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start space-x-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Requested by:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {request.requester.name || request.requester.email}
                          </span>
                        </div>

                        {request.type === 'SWAP' && request.newHelper && (
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Swap with:</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {request.newHelper.name || request.newHelper.email}
                            </span>
                          </div>
                        )}

                        {request.type === 'MODIFY' && request.newStart && request.newEnd && (
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">New time:</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {formatDateTime(request.newStart)} - {formatDateTime(request.newEnd)}
                            </span>
                          </div>
                        )}

                        {request.reason && (
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Reason:</span>
                            <span className="text-gray-700 dark:text-gray-300">{request.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Processed Requests */}
              {recentRequests.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recently Processed
                  </h4>
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusIcon(request.status)}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(request.type)}`}>
                              {request.type}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.shift.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {request.status} by {request.reviewer?.name || 'Admin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
