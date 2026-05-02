'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { transitions } from '@/components/ui/motion';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Apple-like empty state — centered, muted, professional */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.ease}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-backgroundTertiary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-foregroundTertiary" />
      </div>
      <h3 className="text-lg font-semibold text-foregroundPrimary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-foregroundSecondary max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
