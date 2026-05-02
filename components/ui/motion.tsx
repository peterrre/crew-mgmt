'use client';

import { motion, type Variants, type Transition } from 'framer-motion';

/* ──────────────────────────────────────────────
 *  Reusable Framer Motion Variants & Components
 *  Apple-like: subtle, professional, not playful
 * ────────────────────────────────────────────── */

// ── Shared transition presets ──────────────────
export const transitions = {
  /** Snappy spring for micro-interactions (buttons, taps) */
  spring: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 } as Transition,
  /** Gentle ease for fades and slides */
  ease: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } as Transition,
  /** Quick ease for short elements */
  quick: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } as Transition,
};

// ── Variant: fadeIn ────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.ease },
  exit: { opacity: 0, transition: transitions.quick },
};

// ── Variant: slideUp ───────────────────────────
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.ease },
  exit: { opacity: 0, y: -8, transition: transitions.quick },
};

// ── Variant: scaleIn (for dialogs / modals) ────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.97, transition: transitions.quick },
};

// ── Variant: stagger container ─────────────────
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

// ── Variant: stagger item (pair with staggerContainer) ──
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transitions.ease },
  exit: { opacity: 0, y: -6, transition: transitions.quick },
};

// ── Reusable Motion Components ─────────────────

/** Fade-in wrapper for page content */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideUp}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container for list items */
export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger item */
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

/** Card with subtle hover-lift effect */
export function MotionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      whileHover={{ y: -3, transition: transitions.spring }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Button-like tap feedback (scale down on press) */
export function MotionButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97, transition: transitions.spring }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/** Scale + fade overlay for non-Radix dialogs (like EditAvailability) */
export function MotionOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
    >
      {children}
    </motion.div>
  );
}

/** Scale + fade panel for custom dialog content */
export function MotionPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Hero section entrance animation */
export function HeroEntrance({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export motion for convenience
export { motion, AnimatePresence } from 'framer-motion';
