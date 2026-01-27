import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, AlertCircle, FileX, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status Badge with icon for improved accessibility and visual clarity
 *
 * Features:
 * - Icon + text for non-color-dependent status identification
 * - Proper WCAG contrast ratios
 * - Semantic color coding
 */

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type RequestType = 'SWAP' | 'CANCEL' | 'MODIFY';

interface StatusBadgeProps {
  status: ApplicationStatus | RequestStatus | RequestType;
  type?: 'application' | 'request' | 'requestType';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    icon: LucideIcon;
    className: string;
    ariaLabel: string;
  }
> = {
  // Application statuses
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    ariaLabel: 'Status: Pending review',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    ariaLabel: 'Status: Approved',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    ariaLabel: 'Status: Rejected',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    icon: FileX,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    ariaLabel: 'Status: Withdrawn',
  },

  // Request types
  SWAP: {
    label: 'Swap',
    icon: AlertCircle,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    ariaLabel: 'Request type: Swap shift',
  },
  CANCEL: {
    label: 'Cancel',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    ariaLabel: 'Request type: Cancel shift',
  },
  MODIFY: {
    label: 'Modify',
    icon: AlertCircle,
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    ariaLabel: 'Request type: Modify shift',
  },
};

export function StatusBadge({
  status,
  type = 'application',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 font-medium border',
        config.className,
        className
      )}
      aria-label={config.ariaLabel}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Role Badge with consistent styling
 */
interface RoleBadgeProps {
  role: 'ADMIN' | 'CREW' | 'VOLUNTEER';
  className?: string;
}

const roleConfig = {
  ADMIN: {
    label: 'Admin',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  CREW: {
    label: 'Crew',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  },
  VOLUNTEER: {
    label: 'Volunteer',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <Badge className={cn(config.className, className)} aria-label={`Role: ${config.label}`}>
      {config.label}
    </Badge>
  );
}
