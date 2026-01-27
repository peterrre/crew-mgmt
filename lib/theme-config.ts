import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Centralized theme configuration for the crew management application.
 * This ensures consistent colors, gradients, and styling across all pages.
 */
export const themeConfig = {
  backgrounds: {
    // Unified page background gradient for ALL pages (admin, crew, volunteer)
    page: 'bg-gradient-to-br from-sky-50/30 via-white to-amber-50/30',
    pageDark: 'dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',

    // Combined page background (light + dark)
    pageGradient: 'bg-gradient-to-br from-sky-50/30 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',

    // Consistent logo gradient across all dashboards
    logo: 'bg-gradient-to-br from-sky-500 to-amber-500',
  },

  roleBadges: {
    // Admin role badge (purple for differentiation)
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',

    // Crew role badge (sky blue)
    crew: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',

    // Volunteer role badge (amber)
    volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },

  buttons: {
    // Primary action buttons (use theme primary color)
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',

    // Secondary action buttons (use theme secondary color)
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',

    // Destructive action buttons (delete, remove, etc.)
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',

    // Outline variant
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',

    // Ghost variant
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  },

  cards: {
    // Default card styling
    default: 'rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700',

    // Interactive card (with hover effect)
    interactive: 'rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer',
  },
} as const

/**
 * Utility function to merge Tailwind classes
 * Same as the existing cn() utility, but exported from theme config for convenience
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get role badge classes by role type
 */
export function getRoleBadgeClasses(role: 'ADMIN' | 'CREW' | 'VOLUNTEER'): string {
  const roleMap = {
    ADMIN: themeConfig.roleBadges.admin,
    CREW: themeConfig.roleBadges.crew,
    VOLUNTEER: themeConfig.roleBadges.volunteer,
  }

  return roleMap[role] || themeConfig.roleBadges.crew
}

/**
 * Get page background gradient classes
 */
export function getPageBackgroundClasses(): string {
  return themeConfig.backgrounds.pageGradient
}
