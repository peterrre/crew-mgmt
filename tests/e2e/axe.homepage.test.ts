// tests/e2e/axe.homepage.test.ts
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const publicRoutes = [
  { path: '/', name: 'Landing Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/register', name: 'Register Page' },
  { path: '/signup-volunteer', name: 'Volunteer Signup Page' },
];

// Auth-protected routes – may redirect to login, still audit the rendered page
const authRoutes = [
  { path: '/admin/events', name: 'Admin Events' },
  { path: '/profile', name: 'Profile' },
  { path: '/reports', name: 'Reports' },
  { path: '/helpers', name: 'Helpers' },
  { path: '/schedules', name: 'Schedules' },
  { path: '/shift-requests', name: 'Shift Requests' },
];

test.describe('Accessibility Audit – Public Routes', () => {
  for (const route of publicRoutes) {
    test(`${route.name} has no detectable a11y violations`, async ({ page }) => {
      await page.goto(route.path);
      const results = await new AxeBuilder({ page })
        .exclude('nextjs-portal')
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Accessibility Audit – Auth-Protected Routes', () => {
  for (const route of authRoutes) {
    test(`${route.name} – audit rendered page (may be login redirect)`, async ({ page }) => {
      await page.goto(route.path);
      // Wait for page to settle (redirect or render)
      await page.waitForLoadState('networkidle').catch(() => {});
      const results = await new AxeBuilder({ page })
        .exclude('nextjs-portal')
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
