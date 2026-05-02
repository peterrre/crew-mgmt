'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { transitions } from '@/components/ui/motion';

/** Pressable wrapper — subtle scale on hover/tap like Apple buttons */
export function Pressable({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={transitions.spring}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Fade-in wrapper for page content */
export function FadeIn({
  children,
  className,
  delay = 0,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...transitions.ease, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Slide-up wrapper for cards and sections */
export function SlideIn({
  children,
  className,
  delay = 0,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ ...transitions.ease, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children animate in sequence */
const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger child item */
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.ease },
};

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
