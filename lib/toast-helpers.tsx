import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { announce } from '@/components/ui/live-region';

/**
 * Standardized toast notification helpers for consistent user feedback across the application.
 *
 * Features:
 * - Consistent titles and descriptions
 * - Action buttons for common operations (View, Undo)
 * - Standard durations based on message importance
 * - Support for success, error, and info variants
 * - ARIA live region announcements for screen readers
 */

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

/**
 * Success toast for completed actions
 */
export function toastSuccess(title: string, options?: ToastOptions) {
  // Announce to screen readers
  const message = options?.description ? `${title}. ${options.description}` : title;
  announce(message, 'polite');

  return toast({
    title,
    description: options?.description,
    action: options?.action ? (
      <ToastAction altText={options.action.label} onClick={options.action.onClick}>
        {options.action.label}
      </ToastAction>
    ) : undefined,
    duration: options?.duration,
  });
}

/**
 * Error toast for failed actions
 */
export function toastError(title: string, options?: ToastOptions) {
  // Announce errors assertively to screen readers
  const message = options?.description ? `Error: ${title}. ${options.description}` : `Error: ${title}`;
  announce(message, 'assertive');

  return toast({
    title,
    description: options?.description,
    variant: 'destructive',
    duration: options?.duration,
  });
}

/**
 * Info toast for neutral information
 */
export function toastInfo(title: string, options?: ToastOptions) {
  return toast({
    title,
    description: options?.description,
    action: options?.action ? (
      <ToastAction altText={options.action.label} onClick={options.action.onClick}>
        {options.action.label}
      </ToastAction>
    ) : undefined,
    duration: options?.duration,
  });
}

// Application-specific toast patterns

/**
 * Toast for application approval
 */
export function toastApplicationApproved(userName: string, eventName: string) {
  return toastSuccess('Application Approved', {
    description: `${userName} has been added to ${eventName} crew`,
  });
}

/**
 * Toast for application rejection
 */
export function toastApplicationRejected(userName?: string) {
  return toastInfo('Application Rejected', {
    description: userName
      ? `${userName}'s application has been rejected`
      : 'The application has been rejected',
  });
}

/**
 * Toast for application submission
 */
export function toastApplicationSubmitted(eventName: string, onView?: () => void) {
  return toastSuccess('Application Submitted', {
    description: `Your application to ${eventName} has been submitted. You'll be notified once it's reviewed.`,
    action: onView ? {
      label: 'View Applications',
      onClick: onView,
    } : undefined,
  });
}

/**
 * Toast for application withdrawal
 */
export function toastApplicationWithdrawn(onUndo?: () => void) {
  return toastSuccess('Application Withdrawn', {
    description: 'Your application has been withdrawn.',
    action: onUndo ? {
      label: 'Undo',
      onClick: onUndo,
    } : undefined,
  });
}

/**
 * Toast for shift request approval
 */
export function toastRequestApproved(message?: string) {
  return toastSuccess('Request Approved', {
    description: message || 'The request has been approved successfully',
  });
}

/**
 * Toast for shift request rejection
 */
export function toastRequestRejected(message?: string) {
  return toastInfo('Request Rejected', {
    description: message || 'The request has been rejected',
  });
}

/**
 * Toast for shift request submission
 */
export function toastRequestSubmitted(onView?: () => void) {
  return toastSuccess('Request Submitted', {
    description: 'Your shift change request has been submitted for review.',
    action: onView ? {
      label: 'View Requests',
      onClick: onView,
    } : undefined,
  });
}

/**
 * Toast for toggling application acceptance
 */
export function toastApplicationsToggled(accepting: boolean) {
  return toastInfo(
    accepting ? 'Applications Open' : 'Applications Closed',
    {
      description: accepting
        ? 'Volunteers can now apply to this event'
        : 'No new applications will be accepted',
    }
  );
}

/**
 * Toast for helper deletion
 */
export function toastHelperDeleted(helperName: string, onUndo?: () => void) {
  return toastSuccess('Helper Deleted', {
    description: `${helperName} has been removed.`,
    action: onUndo ? {
      label: 'Undo',
      onClick: onUndo,
    } : undefined,
  });
}

/**
 * Generic error toast
 */
export function toastGenericError(message?: string) {
  return toastError('Error', {
    description: message || 'An unexpected error occurred',
  });
}

/**
 * Toast for failed data loading
 */
export function toastLoadError(resourceName: string) {
  return toastError('Error', {
    description: `Failed to load ${resourceName}`,
  });
}

/**
 * Toast for validation errors
 */
export function toastValidationError(message: string) {
  return toastError('Validation Error', {
    description: message,
  });
}

/**
 * Persistent toast that requires manual dismissal
 * Use for critical information that users must acknowledge
 */
export function toastPersistent(title: string, description: string, variant?: 'default' | 'destructive') {
  return toast({
    title,
    description,
    variant,
    duration: Infinity, // Never auto-dismiss
  });
}

/**
 * Toast with custom duration
 */
export function toastWithDuration(
  title: string,
  description: string,
  durationMs: number,
  variant?: 'default' | 'destructive'
) {
  return toast({
    title,
    description,
    variant,
    duration: durationMs,
  });
}
