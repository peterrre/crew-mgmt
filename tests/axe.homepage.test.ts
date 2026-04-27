// tests/axe.homepage.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility tests', () => {
  test.beforeEach(async ({ page }) => {
    await injectAxe(page);
  });

  test('homepage has no detectable accessibility violations on load', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, {
      // You can configure rules here if needed
      // For example, disable certain rules:
      // rules: [
      //   { id: 'color-contrast', enabled: false }
      // ]
    });
  });

  test('dashboard page has no detectable accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    await checkA11y(page);
  });
});