// tests/e2e/notification-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Notification Flow', () => {
  // Use credentials that should exist in the test database
  const ADMIN_EMAIL = 'admin@crewmgmt.local';
  const ADMIN_PASSWORD = 'admin123';
  const VOLUNTEER_EMAIL = 'volunteer@crewmgmt.local';
  const VOLUNTEER_PASSWORD = 'volunteer123';

  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    // Wait for the login form to be ready
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 15000 });
  });

  test('should send notification when shift is created and show in bell dropdown', async ({ page }) => {
    // Login as admin
    await page.locator('#email').fill(ADMIN_EMAIL);
    await page.locator('#password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect to home page
    await expect(page).toHaveURL(/(dashboard|home|\/$)/, { timeout: 15000 });
    
    // Navigate to admin events page to create an event first (if needed)
    await page.goto('/admin/events');
    await expect(page).toHaveURL(/\/admin\/events/, { timeout: 10000 });
    
    // Check if there's already an event, if not create one
    const eventLink = page.locator('a[href*="/admin/events/"]').first();
    let eventId = '';
    
    if (await eventLink.count() > 0) {
      // Use existing event
      const href = await eventLink.getAttribute('href');
      eventId = href?.split('/').pop() || '';
    } else {
      // Create a new event (simplified - in real test we'd use API)
      // For now, we'll assume there's at least one event
      await test.skip('Need at least one event to test shift creation');
      return;
    }
    
    // Navigate to event detail page
    await page.goto(`/admin/events/${eventId}`);
    await expect(page).toHaveURL(/\/admin\/events\/.+/, { timeout: 10000 });
    
    // Click on Schedule tab to see the calendar
    await page.getByRole('tab', { name: /schedule/i }).click();
    
    // Wait for calendar to load
    await page.waitForSelector('.rbc-time-view', { timeout: 10000 });
    
    // Click and drag to create a shift (select a time slot)
    // We'll click on a specific time slot in the calendar
    const calendarContainer = page.locator('.rbc-time-view');
    await calendarContainer.waitFor({ state: 'visible', timeout: 5000 });
    
    // Get the bounding box of the calendar to calculate click position
    const box = await calendarContainer.boundingBox();
    if (!box) {
      await test.skip('Could not get calendar bounding box');
      return;
    }
    
    // Click around the middle of the calendar to select a time slot
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 3; // Upper third to get a reasonable time
    
    // Click to select slot (this should open the create shift dialog)
    await page.mouse.click(x, y);
    
    // Wait for the shift create dialog to appear
    await expect(page.getByText(/create shift/i)).toBeVisible({ timeout: 5000 });
    
    // Fill out the shift creation form
    await page.locator('input[placeholder*="Stage Setup"]').fill('Test Shift for Notification');
    
    // Set start and end times (tomorrow at 2 PM and 4 PM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0); // 2:00 PM
    const startTime = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    
    tomorrow.setHours(16, 0, 0); // 4:00 PM
    const endTime = tomorrow.toISOString().slice(0, 16);
    
    await page.locator('input[type="datetime-local"]').first().fill(startTime);
    await page.locator('input[type="datetime-local"]').nth(1).fill(endTime);
    
    // Select a responsible person (if available)
    const responsibleSelect = page.locator('select').first();
    if (await responsibleSelect.count() > 0) {
      await responsibleSelect.click();
      // Select the first option that's not "Unassigned"
      const options = page.locator('select option');
      const optionCount = await options.count();
      for (let i = 0; i < optionCount; i++) {
        const optionText = await options.nth(i).textContent();
        if (optionText && !optionText.includes('Unassigned')) {
          await options.nth(i).click();
          break;
        }
      }
    }
    
    // Click create shift button
    await page.getByRole('button', { name: /create shift/i }).click();
    
    // Wait for dialog to close and shift to be created
    await expect(page.getByText(/create shift/i)).not.toBeVisible({ timeout: 5000 });
    
    // Wait a moment for notifications to be processed
    await page.waitForTimeout(2000);
    
    // Check notification bell for updates
    const notificationBell = page.locator('[data-state*="bell"], [aria-label*="notification"], .notification-bell').first();
    if (await notificationBell.count() > 0) {
      // Check if bell has a badge indicating new notifications
      const bellBadge = notificationBell.locator('[class*="badge"], span:not([class*="sr-only"])');
      if (await bellBadge.count() > 0) {
        const badgeText = await bellBadge.textContent();
        expect(badgeText?.trim()).toMatch(/\d+/); // Should have a number
      }
    }
    
    // Click on the bell to open notification dropdown
    await notificationBell.click();
    
    // Wait for notification dropdown to appear
    const notificationDropdown = page.locator('[role="menu"], [data-state*="popover"], .notification-dropdown');
    await expect(notificationDropdown).toBeVisible({ timeout: 5000 });
    
    // Look for our shift notification in the dropdown
    const notificationItem = notificationDropdown.getByText(/test shift for notification/i);
    await expect(notificationItem).toBeVisible({ timeout: 5000 });
  });

  test('should allow sending and receiving chat messages in ShiftCommentBox', async ({ page }) => {
    // Login as admin
    await page.locator('#email').fill(ADMIN_EMAIL);
    await page.locator('#password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect
    await expect(page).toHaveURL(/(dashboard|home|\/$)/, { timeout: 15000 });
    
    // Navigate to admin events page
    await page.goto('/admin/events');
    await expect(page).toHaveURL(/\/admin\/events/, { timeout: 10000 });
    
    // Find an event with shifts
    const eventLink = page.locator('a[href*="/admin/events/"]').first();
    if (await eventLink.count() === 0) {
      await test.skip('Need at least one event to test chat');
      return;
    }
    
    const href = await eventLink.getAttribute('href');
    const eventId = href?.split('/').pop() || '';
    
    // Navigate to event detail page
    await page.goto(`/admin/events/${eventId}`);
    await expect(page).toHaveURL(/\/admin\/events\/.+/, { timeout: 10000 });
    
    // Click on Schedule tab
    await page.getByRole('tab', { name: /schedule/i }).click();
    
    // Wait for calendar to load
    await page.waitForSelector('.rbc-time-view', { timeout: 10000 });
    
    // Find an existing shift on the calendar to click on
    const shiftEvent = page.locator('.rbc-event').first();
    if (await shiftEvent.count() === 0) {
      await test.skip('Need at least one shift to test chat');
      return;
    }
    
    // Click on the shift to select it
    await shiftEvent.click();
    
    // Wait for ShiftCommentBox to appear
    await expect(page.getByText(/kommentare/i)).toBeVisible({ timeout: 5000 });
    
    // Wait for messages to load
    await page.waitForTimeout(2000);
    
    // Send a test message
    const testMessage = `Test message ${Date.now()}`;
    const textarea = page.locator('textarea[placeholder*="Kommentar schreiben"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill(testMessage);
    
    // Click send button
    await page.getByRole('button', { name: /nachricht senden/i }).click();
    
    // Wait for message to appear in the list
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });
    
    // Verify message appears in the chat
    const messageBubbles = page.locator('.msg-message, [class*="message"], .chat-bubble');
    const lastMessage = messageBubbles.last();
    await expect(lastMessage).toContainText(testMessage);
  });
});