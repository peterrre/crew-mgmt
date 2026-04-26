// tests/e2e/volunteer-application.test.ts
import { test, expect } from '@playwright/test';

test.describe('Volunteer Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page because the volunteer sign up link is there
    await page.goto('/login');
  });

  test('should allow a volunteer to sign up and see confirmation', async ({ page }) => {
    // Check that the page has a link or button for volunteer sign up
    const volunteerLink = page.getByRole('link', { name: /sign up here/i });
    await expect(volunteerLink).toBeVisible();

    // Click the volunteer sign up link
    await volunteerLink.click();

    // Wait for the sign up page to load
    await expect(page).toHaveURL(/.*\/signup-volunteer/, { timeout: 10000 });

    // Fill out the form with all required fields
    await page.getByLabel(/name/i).fill('Test Volunteer');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('securePassword123');
    
    // Add a small delay to ensure form is ready
    await page.waitForTimeout(500);

    // Submit the form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for either success message OR redirect to login/dashboard
    // Try multiple possible success indicators
    try {
      await expect(page.getByText(/account created/i)).toBeVisible({ timeout: 8000 });
    } catch {
      // If no success message, check if redirected to login or dashboard
      await expect(page).toHaveURL(/\/(login|dashboard|home)/, { timeout: 8000 });
    }
  });
});
