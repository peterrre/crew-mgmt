import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Enhanced Button with loading state
 *
 * Features:
 * - Shows spinner when loading
 * - Disables interaction during loading
 * - Smooth transitions
 * - Accessible loading state announcements
 */

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, disabled, children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn('relative', className)}
        aria-busy={loading}
        aria-live="polite"
        {...props}
      >
        {loading && (
          <Loader2
            className="mr-2 h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        )}
        <span className={cn(loading && loadingText && 'opacity-0')}>
          {children}
        </span>
        {loading && loadingText && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {loadingText}
          </span>
        )}
        {loading && (
          <span className="sr-only">Loading, please wait</span>
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
