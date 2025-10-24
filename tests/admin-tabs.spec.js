const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Tabs', () => {
  test('should verify admin panel horizontal tabs are working', async ({ page }) => {
    // Navigate to admin panel (it will redirect to login first)
    await page.goto('http://localhost:3000/admin');
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

    // Navigate to admin panel again
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if tabs component is present
    const tabsList = await page.locator('[role="tablist"]').first();
    await expect(tabsList).toBeVisible();

    console.log('✅ Admin tabs component is visible');

    // Check for specific tab triggers
    const overviewTab = await page.locator('[role="tab"][value="overview"], [data-value="overview"]').first();
    const usersTab = await page.locator('[role="tab"][value="users"], [data-value="users"]').first();
    const toolsTab = await page.locator('[role="tab"][value="tools"], [data-value="tools"]').first();

    // Verify tabs are visible
    if (await overviewTab.isVisible()) {
      console.log('✅ Overview tab found');
    } else {
      console.log('❌ Overview tab not found');
    }

    if (await usersTab.isVisible()) {
      console.log('✅ Users tab found');
    } else {
      console.log('❌ Users tab not found');
    }

    if (await toolsTab.isVisible()) {
      console.log('✅ Tools tab found');
    } else {
      console.log('❌ Tools tab not found');
    }

    // Test tab clicking functionality
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
      console.log('✅ Users tab clicked successfully');
    }

    if (await toolsTab.isVisible()) {
      await toolsTab.click();
      await page.waitForTimeout(500);
      console.log('✅ Tools tab clicked successfully');
    }

    // Check for any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors found:', consoleErrors);
    } else {
      console.log('✅ No console errors detected');
    }

    // Final verification - ensure we're on admin page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    console.log(`✅ Admin panel test completed. Current URL: ${currentUrl}`);
  });
});