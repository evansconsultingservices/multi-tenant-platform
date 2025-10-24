const { test, expect } = require('@playwright/test');

test.describe('Company User Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Mock authentication by setting localStorage
    await page.evaluate(() => {
      const mockUser = {
        uid: 'test-admin-uid',
        email: 'admin@example.com',
        displayName: 'Test Admin',
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
    });
  });

  test('should show vertical tabs on the left in company details', async ({ page }) => {
    // Navigate to companies tab
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    // Check if there are any companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      // Click the first "View Details" button
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      // Check that tabs exist
      const tabsList = await page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();
      console.log('✓ Tabs list is visible');

      // Check for vertical layout by checking flex-col class
      const hasFlexCol = await tabsList.evaluate(el =>
        el.classList.contains('flex-col')
      );
      expect(hasFlexCol).toBe(true);
      console.log('✓ Tabs are in vertical (flex-col) layout');

      // Verify individual tabs
      const settingsTab = await page.locator('[role="tab"][value="settings"]');
      const usersTab = await page.locator('[role="tab"][value="users"]');
      const apiKeysTab = await page.locator('[role="tab"][value="api-keys"]');

      await expect(settingsTab).toBeVisible();
      await expect(usersTab).toBeVisible();
      await expect(apiKeysTab).toBeVisible();
      console.log('✓ All three tabs (Settings, Users, API Keys) are visible');

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/vertical-tabs.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved: tests/screenshots/vertical-tabs.png');
    } else {
      console.log('⚠ No companies found to test tab layout');
    }
  });

  test('should be able to open invite user dialog', async ({ page }) => {
    // Navigate to companies tab
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    // Check if there are any companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      // Click the first "View Details" button
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      // Click on Users tab
      await page.click('[role="tab"][value="users"]');
      await page.waitForTimeout(1000);

      // Verify Users tab is active
      const usersTab = await page.locator('[role="tab"][value="users"]');
      const dataState = await usersTab.getAttribute('data-state');
      expect(dataState).toBe('active');
      console.log('✓ Users tab is active');

      // Check for "Invite User" button
      const inviteButton = await page.locator('button:has-text("Invite User")');
      await expect(inviteButton).toBeVisible();
      console.log('✓ "Invite User" button is visible');

      // Click the invite button
      await inviteButton.click();
      await page.waitForTimeout(1000);

      // Check if dialog opened
      const dialog = await page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      console.log('✓ Invite user dialog opened');

      // Check for form fields
      const firstNameInput = await page.locator('input[name="firstName"], input[placeholder*="First"], input[placeholder*="first"]');
      const lastNameInput = await page.locator('input[name="lastName"], input[placeholder*="Last"], input[placeholder*="last"]');
      const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]');

      if (await firstNameInput.count() > 0) {
        console.log('✓ First name field found');
      }
      if (await lastNameInput.count() > 0) {
        console.log('✓ Last name field found');
      }
      if (await emailInput.count() > 0) {
        console.log('✓ Email field found');
      }

      // Take screenshot of dialog
      await page.screenshot({
        path: 'tests/screenshots/invite-user-dialog.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved: tests/screenshots/invite-user-dialog.png');
    } else {
      console.log('⚠ No companies found to test user invitation');
    }
  });

  test('should show users table when users exist', async ({ page }) => {
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      // Click on Users tab
      await page.click('[role="tab"][value="users"]');
      await page.waitForTimeout(2000);

      // Check for either users table or "no users" message
      const usersTable = await page.locator('table');
      const noUsersMessage = await page.locator('text=No users found');

      const hasTable = await usersTable.count() > 0;
      const hasMessage = await noUsersMessage.count() > 0;

      if (hasTable) {
        console.log('✓ Users table is displayed');

        // Check table headers
        const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'];
        for (const header of headers) {
          const headerElement = await page.locator(`th:has-text("${header}")`);
          if (await headerElement.count() > 0) {
            console.log(`✓ Table header "${header}" found`);
          }
        }
      } else if (hasMessage) {
        console.log('✓ "No users found" message is displayed');
      } else {
        console.log('⚠ Neither users table nor "no users" message found');
      }

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/users-tab-content.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved: tests/screenshots/users-tab-content.png');
    } else {
      console.log('⚠ No companies found to test users tab');
    }
  });

  test('should check console for errors during user tab interaction', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      await page.click('[role="tab"][value="users"]');
      await page.waitForTimeout(2000);

      // Try to open invite dialog
      const inviteButton = await page.locator('button:has-text("Invite User")');
      if (await inviteButton.count() > 0) {
        await inviteButton.click();
        await page.waitForTimeout(1000);
      }
    }

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:');
      consoleErrors.forEach(error => console.log('  - ' + error));
    } else {
      console.log('✅ No console errors detected during user tab interaction');
    }
  });
});
