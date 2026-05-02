import { test, expect } from '@playwright/test';

const routes = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'signup-volunteer', path: '/signup-volunteer' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

for (const route of routes) {
  for (const viewport of viewports) {
    test(`visual regression: ${route.name} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle' });
      
      // Wait for fonts and transitions to settle
      await page.waitForTimeout(1000);
      
      // Full-page screenshot comparison
      await expect(page).toHaveScreenshot(`${route.name}-${viewport.name}.png`, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      });
    });
  }
}
