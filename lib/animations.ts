/**
 * Standardized animation utilities for consistent micro-interactions across the application.
 *
 * Usage:
 * import { animations } from '@/lib/animations';
 * className={animations.card.hover}
 */

/**
 * Standard animation durations (in milliseconds)
 */
export const durations = {
  fast: 150, // Hover effects, quick transitions
  medium: 250, // Dialogs, dropdowns, most UI elements
  slow: 350, // Page transitions, complex animations
} as const;

/**
 * Standard easing functions
 */
export const easings = {
  default: 'ease-in-out',
  in: 'ease-in',
  out: 'ease-out',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Reusable animation classes for common patterns
 */
export const animations = {
  // Card animations
  card: {
    hover: 'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
    hoverSubtle: 'transition-shadow duration-200 hover:shadow-md',
    press: 'active:scale-[0.98] transition-transform duration-100',
  },

  // Button animations
  button: {
    hover: 'transition-colors duration-150 hover:brightness-110',
    press: 'active:scale-[0.98] transition-transform duration-100',
    loading: 'transition-opacity duration-200',
  },

  // Focus states (keyboard navigation)
  focus: {
    ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    ringLarge: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4',
  },

  // Interactive elements (links, menu items, etc.)
  interactive: {
    hover: 'transition-colors duration-150 hover:bg-accent/10',
    press: 'active:bg-accent/20 transition-colors duration-100',
  },

  // Fade transitions
  fade: {
    in: 'animate-in fade-in duration-200',
    out: 'animate-out fade-out duration-150',
  },

  // Slide transitions
  slide: {
    inFromTop: 'animate-in slide-in-from-top duration-200',
    inFromBottom: 'animate-in slide-in-from-bottom duration-200',
    inFromLeft: 'animate-in slide-in-from-left duration-200',
    inFromRight: 'animate-in slide-in-from-right duration-200',
  },

  // Scale transitions
  scale: {
    in: 'animate-in zoom-in-95 duration-200',
    out: 'animate-out zoom-out-95 duration-150',
  },

  // Loading states
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },
} as const;

/**
 * Helper to combine animation classes
 */
export function combineAnimations(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Helper to create custom transition classes
 */
export function createTransition(
  properties: string[],
  duration: keyof typeof durations = 'medium',
  easing: keyof typeof easings = 'default'
): string {
  const props = properties.join(',');
  return `transition-[${props}] duration-${durations[duration]} ${easings[easing]}`;
}

/**
 * Accessibility: Respect user's motion preferences
 * Add this class to elements with animations
 */
export const respectMotion = 'motion-safe:transition-all motion-reduce:transition-none';

/**
 * Common animation combinations
 */
export const presets = {
  // Card that scales and shows shadow on hover
  cardInteractive: combineAnimations(
    animations.card.hover,
    animations.card.press,
    animations.focus.ring
  ),

  // Button with all states
  buttonInteractive: combineAnimations(
    animations.button.hover,
    animations.button.press,
    animations.focus.ring
  ),

  // Link or menu item
  linkInteractive: combineAnimations(
    animations.interactive.hover,
    animations.interactive.press,
    animations.focus.ring
  ),

  // Dialog/modal entrance
  dialogEntrance: combineAnimations(
    animations.fade.in,
    animations.scale.in
  ),

  // Dialog/modal exit
  dialogExit: combineAnimations(
    animations.fade.out,
    animations.scale.out
  ),
} as const;

/**
 * Animation delays for staggered effects
 */
export const delays = {
  none: 'delay-0',
  xs: 'delay-75',
  sm: 'delay-100',
  md: 'delay-150',
  lg: 'delay-200',
  xl: 'delay-300',
} as const;

/**
 * Helper for staggered animations in lists
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): string {
  return `delay-[${index * baseDelay}ms]`;
}
