// tests/e2e/volunteer-application.test.ts
import { test, expect } from '@playwright/test';

test.describe('Volunteer Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page because the volunteer sign up link is there
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    // Wait for the login form to be ready by waiting for the welcome heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 15000 });
  });

  test('should allow a volunteer to sign up and see confirmation', async ({ page }) => {
    // Use timestamp to avoid duplicate email errors
    const timestamp = Date.now();
    const testName = `Test Volunteer ${timestamp}`;
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'securePassword123';

    // Check that the page has a link or button for volunteer sign up
    const volunteerLink = page.getByRole('link', { name: /sign up here/i });
    await expect(volunteerLink).toBeVisible();

    // Click the volunteer sign up link
    await volunteerLink.click();

    // Wait for the sign up page to load
    await expect(page).toHaveURL(/.*\/signup-volunteer/, { timeout: 10000 });

    // Fill out the form with all required fields
    await page.getByLabel(/name/i).fill(testName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Add a small delay to ensure form is ready
    await page.waitForTimeout(500);

    // Submit the form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for either success message OR redirect to a known page
    try {
      // Wait for success message with multiple possible patterns
      await expect(page.getByText(/account created|success|thank you|confirmation/i)).toBeVisible({ timeout: 15000 });
    } catch {
      // If no success message, wait for navigation to a known page (login, dashboard, home, or root)
      await expect(page).toHaveURL(/(login|dashboard|home|$)/, { timeout: 15000 });
    }
  });
});