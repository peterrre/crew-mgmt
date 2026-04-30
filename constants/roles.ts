export const ROLES = {
  RESPONSIBLE: 'RESPONSIBLE',
  HELPER: 'HELPER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
