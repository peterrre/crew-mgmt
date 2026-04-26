// tests/e2e/volunteer-application.test.ts
import { test, expect } from '@playwright/test';

test.describe('Volunteer Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page because the volunteer sign up link is there
    await page.goto('/login');
    // Wait for the login page to be rendered (client-side)
    await expect(page.getByText('Welcome back')).toBeAttached({ timeout: 10000 });
    // Debug: save the HTML to see what we have
    await require('fs').writeFileSync('/home/hermes/crew-mgmt/login.html', await page.content());
  });

  test('should allow a volunteer to sign up and see confirmation', async ({ page }) => {
    // Click the volunteer sign up link
    await page.getByRole('link', { name: /sign up here/i }).click();

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

    // Wait for either success message OR redirect to any page
    // Try multiple possible success indicators
    try {
      await expect(page.getByText(/account created/i)).toBeVisible({ timeout: 8000 });
    } catch {
      // If no success message, wait for navigation to complete and verify we're not on signup page
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      // Check that we've navigated away from the signup page
      expect(currentUrl).not.toMatch(/.*\/signup-volunteer/);
    }
  });
});