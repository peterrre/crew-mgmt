import Link from 'next/link';

/**
 * Skip-navigation link for keyboard/screen-reader users.
 * Rendered as the very first focusable element in the layout.
 * Only becomes visible on focus.
 */
export function SkipNavLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue/50"
    >
      Zum Hauptinhalt springen
    </Link>
  );
}
