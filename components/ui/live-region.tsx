'use client';

import { useEffect, useState } from 'react';

/**
 * ARIA Live Region for announcing dynamic content changes to screen readers
 *
 * Usage:
 * import { useLiveRegion } from '@/components/ui/live-region';
 *
 * const announce = useLiveRegion();
 * announce('Item added to cart', 'polite');
 */

interface LiveRegionProps {
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  role?: 'status' | 'alert' | 'log';
}

let announcements: Array<(message: string, priority: 'polite' | 'assertive') => void> = [];

export function LiveRegion() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (priority === 'assertive') {
        setAssertiveMessage(''); // Clear first to trigger re-announcement
        setTimeout(() => setAssertiveMessage(message), 100);
        setTimeout(() => setAssertiveMessage(''), 3000);
      } else {
        setPoliteMessage(''); // Clear first to trigger re-announcement
        setTimeout(() => setPoliteMessage(message), 100);
        setTimeout(() => setPoliteMessage(''), 3000);
      }
    };

    announcements.push(announce);

    return () => {
      announcements = announcements.filter((a) => a !== announce);
    };
  }, []);

  return (
    <>
      {/* Polite announcements - won't interrupt current speech */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive announcements - will interrupt current speech */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useLiveRegion() {
  return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcements.forEach((announce) => announce(message, priority));
  };
}

/**
 * Standalone announce function (use when hooks can't be used)
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  announcements.forEach((announce) => announce(message, priority));
}
