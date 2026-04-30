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
        return 'bg-red/10 text-red/30';
      case 'SWAP':
        return 'bg-blue/10 text-blue/30';
      case 'MODIFY':
        return 'bg-yellow/10 text-yellow/30';
      default:
        return 'bg-backgroundSecondary text-foregroundSecondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red" />;
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
    <div className="mb-6 bg-background rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-backgroundSecondary/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow" />
          <h3 className="font-semibold text-foregroundPrimary">
            Shift Requests
          </h3>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-1 bg-backgroundSecondary0 text-white text-xs font-medium rounded-full">
              {pendingRequests.length} pending
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-foregroundTertiary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-foregroundTertiary" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {pendingRequests.length === 0 && recentRequests.length === 0 ? (
            <p className="text-sm text-foregroundTertiary py-4 text-center">
              No shift requests for this event
            </p>
          ) : (
            <>
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foregroundSecondary">
                    Pending Approval
                  </h4>
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-backgroundSecondary/20 border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(request.type)}`}>
                              {request.type}
                            </span>
                            <span className="text-sm font-medium text-foregroundPrimary">
                              {request.shift.title}
                            </span>
                          </div>
                          <p className="text-xs text-foregroundSecondary">
                            {formatDateTime(request.shift.start)} - {formatDateTime(request.shift.end)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="bg-green hover:bg-green/80 text-greenForeground"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="border-red/30 text-red hover:bg-red/10"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start space-x-2 text-sm">
                          <span className="text-foregroundTertiary font-medium">Requested by:</span>
                          <span className="text-foregroundSecondary">
                            {request.requester.name || request.requester.email}
                          </span>
                        </div>

                        {request.type === 'SWAP' && request.newHelper && (
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="text-foregroundTertiary font-medium">Swap with:</span>
                            <span className="text-foregroundSecondary">
                              {request.newHelper.name || request.newHelper.email}
                            </span>
                          </div>
                        )}

                        {request.type === 'MODIFY' && request.newStart && request.newEnd && (
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="text-foregroundTertiary font-medium">New time:</span>
                            <span className="text-foregroundSecondary">
                              {formatDateTime(request.newStart)} - {formatDateTime(request.newEnd)}
                            </span>
                          </div>
                        )}

                        {request.reason && (
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="text-foregroundTertiary font-medium">Reason:</span>
                            <span className="text-foregroundSecondary">{request.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Processed Requests */}
              {recentRequests.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foregroundSecondary">
                    Recently Processed
                  </h4>
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-backgroundSecondary/50 border border-border rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusIcon(request.status)}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(request.type)}`}>
                              {request.type}
                            </span>
                            <span className="text-sm font-medium text-foregroundPrimary">
                              {request.shift.title}
                            </span>
                          </div>
                          <p className="text-xs text-foregroundSecondary">
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
