import type { Config } from "tailwindcss";
import {
  colors as allColors,
  typography,
  spacing,
  radius,
  shadows,
  transition,
  zIndex,
} from "./styles/tokens";

const semanticColors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  primary: {
    DEFAULT: allColors.blue,
    foreground: allColors.blueForeground,
  },
  secondary: {
    DEFAULT: allColors.backgroundSecondary,
    foreground: allColors.foregroundPrimary,
  },
  muted: {
    DEFAULT: allColors.backgroundTertiary,
    foreground: allColors.foregroundSecondary,
  },
  accent: {
    DEFAULT: allColors.blue,
    foreground: allColors.blueForeground,
  },
  destructive: {
    DEFAULT: allColors.red,
    foreground: allColors.redForeground,
  },
  border: allColors.border,
  input: allColors.border,
  ring: allColors.blue,
};

const colors = {
  ...Object.fromEntries(
    Object.entries(allColors).filter(
      ([key]) =>
        ![
          "shadow",
          "shadowMedium",
          "shadowLarge",
          "gradientPrimary",
          "gradientSecondary",
        ].includes(key),
    ),
  ),
  ...semanticColors,
};

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: radius,
      colors,
      spacing,
      shadow: shadows,
      transition,
      zIndex,
      fontFamily: {
        sans: [typography.fontFamily],
      },
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary": allColors.gradientPrimary,
        "gradient-secondary": allColors.gradientSecondary,
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
