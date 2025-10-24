const { test, expect } = require('@playwright/test');

test.describe('Invite User Modal Styling', () => {
  test('should display modal with dark theme styling', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Mock authentication
    await page.evaluate(() => {
      const mockUser = {
        uid: 'test-admin-uid',
        email: 'admin@example.com',
        displayName: 'Test Admin',
        role: 'admin',
        companyId: 'test-company-id'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    // Navigate to admin companies
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(2000);

    // Check if there are companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons === 0) {
      console.log('⚠️ No companies found. Test requires at least one company.');
      return;
    }

    // Click first company
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);

    // Click Users tab
    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });
    await usersTab.first().click();
    await page.waitForTimeout(1500);

    // Click Invite User button
    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot of modal
    await page.screenshot({ path: 'tests/screenshots/invite-modal-test.png' });

    // Check if dialog is visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Get computed background color of the dialog
    const bgColor = await dialog.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('\n📊 DIALOG STYLING TEST RESULTS:');
    console.log(`   Dialog background-color: ${bgColor}`);

    // Check DialogContent specifically
    const dialogContent = page.locator('[role="dialog"]').first();
    const contentBgColor = await dialogContent.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const contentColor = await dialogContent.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    console.log(`   Content background-color: ${contentBgColor}`);
    console.log(`   Content text color: ${contentColor}`);

    // Get all applied classes
    const classes = await dialogContent.evaluate((el) => {
      return el.className;
    });
    console.log(`   Applied classes: ${classes}`);

    // Check if background is dark (not white)
    // White/light backgrounds typically have RGB values > 200
    // Dark backgrounds have RGB values < 100
    const isDark = await dialogContent.evaluate((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        console.log(`   RGB values: R=${r}, G=${g}, B=${b}`);
        // Check if it's dark (all values should be low for dark theme)
        return r < 100 && g < 100 && b < 100;
      }
      return false;
    });

    console.log(`   Is background dark? ${isDark ? 'YES ✅' : 'NO ❌'}`);

    if (!isDark) {
      console.log('\n❌ FAILED: Modal background is not dark!');
      console.log('   The modal appears to have a light/white background.');
    } else {
      console.log('\n✅ PASSED: Modal has dark background');
    }

    // Also check CSS variables
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        background: styles.getPropertyValue('--background'),
        card: styles.getPropertyValue('--card'),
        cardForeground: styles.getPropertyValue('--card-foreground'),
      };
    });

    console.log('\n🎨 CSS Variables:');
    console.log(`   --background: ${cssVars.background}`);
    console.log(`   --card: ${cssVars.card}`);
    console.log(`   --card-foreground: ${cssVars.cardForeground}`);

    expect(isDark).toBe(true);
  });
});
