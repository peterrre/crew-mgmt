'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { transitions } from '@/components/ui/motion';

interface FormFieldMessageProps {
  message?: string;
  type: 'error' | 'success';
}

/** Animated inline form message — error or success */
export function FormFieldMessage({ message, type }: FormFieldMessageProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={transitions.quick}
          className={
            type === 'error'
              ? 'text-sm text-destructive mt-1'
              : 'text-sm text-green-600 dark:text-green-400 mt-1'
          }
        >
          {type === 'error' && <span aria-hidden="true">✕ </span>}
          {type === 'success' && <span aria-hidden="true">✓ </span>}
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Password strength indicator */
export function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: '33%' };
    if (score <= 3) return { label: 'Medium', color: 'bg-yellow-400', width: '66%' };
    return { label: 'Strong', color: 'bg-green-400', width: '100%' };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1 mt-1">
      <div className="h-1 w-full bg-backgroundTertiary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${strength.color}`}
          initial={{ width: 0 }}
          animate={{ width: strength.width }}
          transition={transitions.spring}
        />
      </div>
      <p className="text-xs text-foregroundTertiary">{strength.label}</p>
    </div>
  );
}

/** Wrapper for input field with validation state styling */
export function ValidatedInput({
  isValid,
  hasError,
  children,
}: {
  isValid?: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {isValid && !hasError && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transitions.spring}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
          aria-hidden="true"
        >
          ✓
        </motion.span>
      )}
    </div>
  );
}
