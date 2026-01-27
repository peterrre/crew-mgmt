# Accessibility Guidelines

This document outlines accessibility best practices and utilities for the crew management application.

## Focus Management

### Dialogs and Modals

All dialogs use Radix UI primitives which provide built-in focus management:

- **Auto-focus**: First focusable element is focused when dialog opens
- **Focus trap**: Tab key cycles through focusable elements within dialog
- **Focus return**: Focus returns to trigger element on close
- **Escape key**: Closes dialog and returns focus

**No additional configuration needed** - Radix UI handles this automatically.

#### Custom Focus Requirements

For custom focus behavior, use the `autoFocus` prop:

```tsx
<DialogContent>
  <Input autoFocus /> {/* Will focus this input on open */}
</DialogContent>
```

## ARIA Live Regions

Use the `LiveRegion` component and `useLiveRegion` hook for announcing dynamic changes:

```tsx
import { useLiveRegion } from '@/components/ui/live-region';

function MyComponent() {
  const announce = useLiveRegion();

  const handleAction = () => {
    // Perform action
    announce('Item added successfully', 'polite');
  };
}
```

### When to Use

- **Polite** (default): Status updates, confirmations, non-critical info
- **Assertive**: Errors, warnings, time-sensitive information

### Automatic Announcements

Toast notifications automatically announce to screen readers via `toast-helpers.tsx`.

## Color and Contrast

### Status Indicators

Always use `StatusBadge` component for status display:

```tsx
import { StatusBadge } from '@/components/ui/status-badge';

<StatusBadge status="PENDING" /> // Includes icon + text + proper contrast
```

**Why?**
- Icons provide non-color-dependent status identification
- Text labels ensure clarity
- Proper contrast ratios (WCAG AA compliant)
- Dark mode support

### Role Badges

Use `RoleBadge` for consistent role display:

```tsx
import { RoleBadge } from '@/components/ui/status-badge';

<RoleBadge role="ADMIN" />
```

## Loading States

### Buttons

Use `LoadingButton` for actions with loading states:

```tsx
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save Changes
</LoadingButton>
```

**Features:**
- Spinner icon
- Disabled state during loading
- Optional loading text
- Screen reader announcement

### Forms

For form submissions:

```tsx
<LoadingButton
  type="submit"
  loading={isSubmitting}
  disabled={!isValid || isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</LoadingButton>
```

## Animations and Motion

### Respect User Preferences

Use the `respectMotion` class for elements with animations:

```tsx
import { respectMotion } from '@/lib/animations';

<div className={respectMotion}>
  {/* Animated content */}
</div>
```

This respects `prefers-reduced-motion` media query.

### Standard Animations

Use predefined animation classes from `lib/animations.ts`:

```tsx
import { animations, presets } from '@/lib/animations';

// Card with hover effect
<Card className={presets.cardInteractive}>

// Button with all states
<Button className={presets.buttonInteractive}>

// Custom combination
<div className={`${animations.fade.in} ${animations.scale.in}`}>
```

## Keyboard Navigation

### Focus Indicators

All interactive elements have visible focus indicators using:

```tsx
className={animations.focus.ring}
```

**Standard ring**: 2px ring with 2px offset
**Large ring**: 2px ring with 4px offset (for emphasis)

### Skip Links

Add skip links for keyboard users (if not already present):

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

## Screen Readers

### Hidden Content

Use `sr-only` for screen-reader-only content:

```tsx
<span className="sr-only">Loading, please wait</span>
```

### Icons

Always mark decorative icons as `aria-hidden`:

```tsx
<Icon className="w-4 h-4" aria-hidden="true" />
```

### Labels

Provide accessible labels for interactive elements:

```tsx
// Explicit label
<Button aria-label="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</Button>

// Or use title
<Button title="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</Button>
```

## Form Accessibility

### Labels

Always associate labels with inputs:

```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Error Messages

Link error messages with inputs:

```tsx
<Input
  id="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" className="text-sm text-red-600">
    {errorMessage}
  </p>
)}
```

### Required Fields

Indicate required fields:

```tsx
<Label htmlFor="name">
  Name <span className="text-red-500" aria-label="required">*</span>
</Label>
<Input id="name" required aria-required="true" />
```

## Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color is not the only means of conveying information
- [ ] Images have alt text
- [ ] Forms have associated labels
- [ ] ARIA landmarks are used (`main`, `nav`, `header`, etc.)
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Loading states are announced
- [ ] Errors are announced assertively
- [ ] Dialogs trap focus and return focus on close
- [ ] `prefers-reduced-motion` is respected

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
