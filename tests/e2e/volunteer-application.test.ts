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
    await expect(page).toHaveURL(/\/signup-volunteer/);

    // Fill out the form
    await page.getByLabel(/name/i).fill('Test Volunteer');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('securePassword123');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /sign up/i });
    await submitButton.click();

    // Wait for the volunteer's name to appear in the header (indicating successful login and redirect to helper dashboard)
    await expect(page.getByText('Test Volunteer')).toBeVisible({ timeout: 15000 });
    // Additionally, check that we are on the homepage
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});