# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: volunteer-application.test.ts >> Volunteer Application Flow >> should allow a volunteer to sign up and see confirmation
- Location: tests/e2e/volunteer-application.test.ts:12:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: getByRole('form')
Expected: attached
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 10000ms
  - waiting for getByRole('form')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - main [ref=e3]:
    - button "Switch to dark mode" [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img [ref=e12]
        - heading "Welcome back" [level=1] [ref=e14]
        - paragraph [ref=e15]: Sign in to manage your event crew
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - text: Email
            - textbox "Email" [ref=e19]:
              - /placeholder: you@example.com
          - generic [ref=e20]:
            - text: Password
            - textbox "Password" [ref=e21]:
              - /placeholder: ••••••••
          - button "Sign in" [ref=e22] [cursor=pointer]
        - generic [ref=e23]:
          - paragraph [ref=e24]:
            - text: Don't have an account?
            - link "Register" [ref=e25] [cursor=pointer]:
              - /url: /register
          - paragraph [ref=e26]:
            - text: Volunteer?
            - link "Sign up here" [ref=e27] [cursor=pointer]:
              - /url: /signup-volunteer
```

# Test source

```ts
  1  | // tests/e2e/volunteer-application.test.ts
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Volunteer Application Flow', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Start from the login page because the volunteer sign up link is there
  7  |     await page.goto('/login');
  8  |     // Wait for the login form to be ready
> 9  |     await expect(page.getByRole('form')).toBeAttached({ timeout: 10000 });
     |                                          ^ Error: expect(locator).toBeAttached() failed
  10 |   });
  11 | 
  12 |   test('should allow a volunteer to sign up and see confirmation', async ({ page }) => {
  13 |     // Check that the page has a link or button for volunteer sign up
  14 |     const volunteerLink = page.getByRole('link', { name: /sign up here/i });
  15 |     await expect(volunteerLink).toBeVisible();
  16 | 
  17 |     // Click the volunteer sign up link
  18 |     await volunteerLink.click();
  19 | 
  20 |     // Wait for the sign up page to load
  21 |     await expect(page).toHaveURL(/.*\/signup-volunteer/, { timeout: 10000 });
  22 | 
  23 |     // Fill out the form with all required fields
  24 |     await page.getByLabel(/name/i).fill('Test Volunteer');
  25 |     await page.getByLabel(/email/i).fill('test@example.com');
  26 |     await page.getByLabel(/password/i).fill('securePassword123');
  27 |     
  28 |     // Add a small delay to ensure form is ready
  29 |     await page.waitForTimeout(500);
  30 | 
  31 |     // Submit the form
  32 |     await page.getByRole('button', { name: /sign up/i }).click();
  33 | 
  34 |     // Wait for either success message OR redirect to a known page
  35 |     try {
  36 |       // Wait for success message with multiple possible patterns
  37 |       await expect(page.getByText(/account created|success|thank you|confirmation/i)).toBeVisible({ timeout: 10000 });
  38 |     } catch {
  39 |       // If no success message, wait for navigation to a known page (login, dashboard, home, or root)
  40 |       await expect(page).toHaveURL(/\/(login|dashboard|home|$)/, { timeout: 10000 });
  41 |     }
  42 |   });
  43 | });
  44 | 
```