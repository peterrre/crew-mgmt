# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: volunteer-application.test.ts >> Volunteer Application Flow >> should allow a volunteer to sign up and see confirmation
- Location: tests/e2e/volunteer-application.test.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /volunteer/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /volunteer/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "Server error" [level=1] [ref=e4]
  - generic [ref=e6]:
    - paragraph [ref=e7]: There is a problem with the server configuration.
    - paragraph [ref=e8]: Check the server logs for more information.
```

# Test source

```ts
  1  | // tests/e2e/volunteer-application.test.ts
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Volunteer Application Flow', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Start from the homepage
  7  |     await page.goto('/');
  8  |   });
  9  | 
  10 |   test('should allow a volunteer to sign up and see confirmation', async ({ page }) => {
  11 |     // Check that the page has a link or button for volunteer sign up
  12 |     const volunteerLink = page.getByRole('link', { name: /volunteer/i });
> 13 |     await expect(volunteerLink).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
  14 | 
  15 |     // Click the volunteer sign up link
  16 |     await volunteerLink.click();
  17 | 
  18 |     // Wait for the sign up page to load
  19 |     await expect(page).toHaveURL(/.*\/signup-volunteer/);
  20 | 
  21 |     // Fill out the form
  22 |     await page.getByLabel(/name/i).fill('Test Volunteer');
  23 |     await page.getByLabel(/email/i).fill('test@example.com');
  24 |     await page.getByLabel(/password/i).fill('securePassword123');
  25 | 
  26 |     // Submit the form
  27 |     await page.getByRole('button', { name: /sign up/i }).click();
  28 | 
  29 |     // Wait for confirmation or redirect
  30 |     // Expect to see a success message or be redirected to a login page
  31 |     await expect(page.getByText(/account created/i)).toBeVisible();
  32 |   });
  33 | });
```