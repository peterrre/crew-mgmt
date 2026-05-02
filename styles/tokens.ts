// Design Tokens for Crew Management - Apple-inspired aesthetic
// Central place for design values; import into tailwind.config.ts
export const colors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F7',
  backgroundTertiary: '#EFEFF4',

  // Foreground (text)
  foregroundPrimary: '#1D1D1F',
  foregroundSecondary: '#6E6E73',
  foregroundTertiary: '#AEAEB2',

  // Accent colors (Apple-inspired)
  blue: '#0062CC',
  blueForeground: '#FFFFFF',
  green: '#34C759',
  greenForeground: '#FFFFFF',
  red: '#FF3B30',
  redForeground: '#FFFFFF',
 yellow: '#FF9500',
  yellowForeground: '#FFFFFF',
  purple: '#AF52DE',
  purpleForeground: '#FFFFFF',
  orange: '#FF9500',
  orangeForeground: '#FFFFFF',
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#FFB300',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  amberForeground: '#FFFFFF',
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0EA5E9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  skyForeground: '#FFFFFF',

  // Grays
  gray: '#8E8E93',
  grayForeground: '#FFFFFF',

  // Borders & separators
  border: '#E5E5EA',
  borderLight: '#D2D2D7',
  separator: '#C6C6C8',

  // Shadows (subtle depth)
  shadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
  shadowMedium: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowLarge: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',

  // Gradients (for subtle UI accents)
  gradientPrimary: 'linear-gradient(135deg, #0062CC 0%, #34C759 100%)',
  gradientSecondary: 'linear-gradient(135deg, #AF52DE 0%, #FF9500 100%)',
};

export const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

export const radius = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const shadows = {
  sm: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  DEFAULT: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -3px rgba(0, 0, 0, 0.04)',
  '2xl': '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0px 2px 4px rgba(0, 0, 0, 0.06)',
  outline: '0px 0px 0px 3px rgba(10, 132, 255, 0.5)',
  none: 'none',
};

export const transition = {
  default: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const zIndex = {
  auto: 'auto',
  base: '0',
  docked: '-10',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
};