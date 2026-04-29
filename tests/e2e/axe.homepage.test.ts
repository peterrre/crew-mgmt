// tests/axe.homepage.test.ts
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Accessibility tests', () => {
  test('homepage has no detectable accessibility violations on load', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('login page has no detectable accessibility violations', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});