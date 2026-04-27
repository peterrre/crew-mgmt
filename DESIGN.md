# Design System – Crew Management

This document outlines the design tokens and guidelines used to create an Apple‑like user experience for the Crew Management application.

## Overview

The design system is built around a set of **design tokens** (colors, typography, spacing, shadows, etc.) that are defined in `src/styles/tokens.ts` and consumed via Tailwind CSS. By centralizing these values we ensure consistency, ease of theming, and a clear visual language.

## Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#FFFFFF` | Page background |
| `backgroundSecondary` | `#F5F5F7` | Elevated surfaces, cards, modals |
| `backgroundTertiary` | `#EFEFF4` | Subtle variations, hover states |
| `foregroundPrimary` | `#1D1D1F` | Primary text |
| `foregroundSecondary` | `#6E6E73` | Secondary text, captions |
| `foregroundTertiary` | `#AEAEB2` | Disabled text, placeholders |
| `blue` | `#0A84FF` | Primary action, links |
| `blueForeground` | `#FFFFFF` | Text on blue background |
| `green` | `#34C759` | Success, confirmation |
| `greenForeground` | `#FFFFFF` | Text on green background |
| `red` | `#FF3B30` | Error, destructive actions |
| `redForeground` | `#FFFFFF` | Text on red background |
| `yellow` | `#FF9F0A` | Warnings, highlights |
| `yellowForeground` | `#FFFFFF` | Text on yellow background |
| `purple` | `#BF5AF2` | Secondary accent, creative highlights |
| `purpleForeground` | `#FFFFFF` | Text on purple background |
| `orange` | `#FF9F0A` | (same as yellow) |
| `orangeForeground` | `#FFFFFF` |  |
| `border` | `#E5E5EA` | Dividers, input borders |
| `borderLight` | `#D2D2D7` | Subtle separators |
| `separator` | `#C6C6C8` | Stronger dividers |

> **Note:** All colors are chosen to be soft, with sufficient contrast for accessibility (WCAG AA).

### Typography

We use the system font stack to match the native platform feel:

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji";
```

Font sizes follow a 4‑px based scale (see `spacing` below) and are mapped to Tailwind’s `text-*` utilities.

| Size | rem | px |
|------|-----|----|
| xs | 0.75 | 12 |
| sm | 0.875 | 14 |
| base | 1 | 16 |
| lg | 1.125 | 18 |
| xl | 1.25 | 20 |
| 2xl | 1.5 | 24 |
| 3xl | 1.875 | 30 |
| 4xl | 2.25 | 36 |
| 5xl | 3 | 48 |
| 6xl | 3.75 | 60 |

Weights: 100–900 in steps of 100 (Thin to Black).  
Line heights: unitless ratios (tight 1.25, normal 1.5, relaxed 1.6, etc.).

### Spacing

All spacing values are multiples of 4 px (0.25rem). The scale includes fractions for fine‑tuning (0.5 px, 1.5 px, etc.) but the core is 4px increments.

Use the `space-*' utilities (or `p-`, `m-`, `gap-`) with the token names (e.g., `p-4` = 1rem, `space-x-3` = 0.75rem).

### Border Radius

Apple‑like subtle rounding:

- `none`: 0px  
- `sm`: 2px  
- `default`: 4px  
- `md`: 6px  
- `lg`: 8px  
- `xl`: 12px  
- `2xl`: 16px  
- `3xl`: 24px  
- `full`: 9999px (pill)

Apply via `rounded-*` (e.g., `rounded-lg`).

### Shadows

Soft depth for cards, modals, and elevated elements:

- `shadow-sm`: `0px 1px 2px rgba(0,0,0,0.05)`  
- `shadow` (default): `0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)`  
- `shadow-md`: `0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)`  
- `shadow-lg`: `0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)`  
- `shadow-xl`: `0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -3px rgba(0,0,0,0.04)`  
- `shadow-2xl`: `0px 25px 50px -12px rgba(0,0,0,0.25)`  
- `shadow-inner`: `inset 0px 2px 4px rgba(0,0,0,0.06)`  
- `shadow-outline`: `0px 0px 0px 3px rgba(10,132,255,0.5)` (focus ring)  
- `shadow-none`: `none`

### Transitions

Standardized easing and durations for animations:

- `transition-default`: 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)`  
- `transition-fast`: 100 ms, same easing  
- `transition-slow`: 200 ms, same easing  

Apply via `transition-*` utilities (e.g., `transition-colors`, `duration-150`).

### zIndex

A simple scale for layering (modals, dropdowns, etc.):

- `auto`, `base` (0), `docked` (-10), then 10, 20, 30, 40, 50.

Use `z-*' utilities.

## Usage in Components

1. **Import the token file** (only needed if you want to use the raw values in JS/TS; for Tailwind you can go straight to utility classes).
2. **Prefer utility classes** (`bg-background`, `text-foregroundPrimary`, `rounded-lg`, `shadow`, `p-4`) over inline styles.
3. **When a design‑specific value is not covered by Tailwind**, extend the theme via `tailwind.config.ts` (already done) or add a custom class in `globals.css`.
4. **For dark mode**, we rely on Tailwind’s `dark:` variant; the color tokens above are for the light mode. Dark mode values are defined in `app/globals.css` (HSL variables).

## Updating the Design System

- Add new tokens to `src/styles/tokens.ts`.
- Map them to Tailwind in `tailwind.config.ts` under `theme.extend`.
- Document the addition in this file.
- Run `npm run lint` and `npm run build` to verify no regressions.
- Update any existing components to adopt the new token if appropriate.

## Apple‑like Feel Checklist

- [ ] Ample whitespace (use spacing tokens generously).  
- [ ] Subtle shadows and rounded corners (never sharp).  
- [ ] Text legibility (sufficient contrast, system font).  
- [ ] Minimal color usage—let the content speak; use accents sparingly for actions and highlights.  
- [ ] Smooth transitions (use the defined transition tokens).  
- [ ] Consistent alignment and grid (4‑px base).  

---

*This living document evolves with the design system. Please keep it up‑to‑date.*  