const { test, expect } = require('@playwright/test');
const readline = require('readline');

// Helper function to wait for user input
async function waitForUserInput(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

test.describe('User Creation with Manual Login (Unlimited Time)', () => {
  test('add user to company - wait for manual login', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔐 MANUAL AUTHENTICATION REQUIRED');
    console.log('═══════════════════════════════════════════════════');
    console.log('The browser will open. Please:');
    console.log('1. Click "Continue with Google"');
    console.log('2. Complete the Google sign-in process');
    console.log('3. Return to this terminal');
    console.log('4. Press ENTER to continue the test');
    console.log('═══════════════════════════════════════════════════\n');

    // Open the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for user to confirm they've logged in
    await waitForUserInput('\nPress ENTER after you have successfully logged in: ');
    console.log('\n✅ Continuing test...\n');

    // Navigate to admin companies
    console.log('🔧 Navigating to companies...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/manual-1-companies.png' });

    // Check for companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewButtons} companies`);

    if (viewButtons === 0) {
      console.log('\n❌ ERROR: No companies found!');
      console.log('Possible issues:');
      console.log('  - Not logged in with admin account');
      console.log('  - No companies exist in database');
      console.log('  - Permission issues');
      await page.screenshot({ path: 'tests/screenshots/manual-error-no-companies.png' });

      // Show what's on the page
      const pageText = await page.locator('body').textContent();
      console.log('\n📄 Page content:');
      console.log(pageText.substring(0, 500));

      throw new Error('No companies found - cannot continue test');
    }

    // Open first company
    console.log('\n🔧 Opening company details...');
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/manual-2-company-details.png' });

    const companyName = await page.locator('h1').first().textContent();
    console.log(`📋 Company: ${companyName}`);

    // Click Users tab
    console.log('\n🔧 Clicking Users tab...');
    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });

    const tabCount = await usersTab.count();
    console.log(`📊 Found ${tabCount} tabs matching "users"`);

    if (tabCount === 0) {
      console.log('❌ Cannot find Users tab!');

      // Show all tabs
      const allTabs = await page.locator('[role="tab"]').allTextContents();
      console.log(`Available tabs: ${allTabs.join(', ')}`);

      await page.screenshot({ path: 'tests/screenshots/manual-error-no-users-tab.png' });
      throw new Error('Users tab not found');
    }

    await usersTab.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/manual-3-users-tab.png' });

    // Count existing users
    const existingUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Current users in company: ${existingUserCount}`);

    // Click Invite User
    console.log('\n🔧 Opening Invite User dialog...');
    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible({ timeout: 5000 });
    await inviteButton.click();
    await page.waitForTimeout(1500);

    // Verify modal opened
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    console.log('✅ Invite dialog opened');

    // Check modal styling (dark theme)
    const modalBg = await modal.evaluate((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const isDark = r < 100 && g < 100 && b < 100;
        return { bg, r, g, b, isDark };
      }
      return { bg, isDark: false };
    });

    console.log(`🎨 Modal background: ${modalBg.bg}`);
    console.log(`🎨 RGB: R=${modalBg.r}, G=${modalBg.g}, B=${modalBg.b}`);
    console.log(`🎨 Dark theme: ${modalBg.isDark ? 'YES ✅' : 'NO ❌ (should be dark!)'}`);

    await page.screenshot({ path: 'tests/screenshots/manual-4-invite-modal.png' });

    // Create test user
    console.log('\n🔧 Filling user form...');
    const timestamp = Date.now();
    const userData = {
      firstName: 'Playwright',
      lastName: `Test${timestamp}`,
      email: `playwright.${timestamp}@example.com`,
      department: 'QA Automation'
    };

    console.log(`📝 Creating user:`);
    console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Department: ${userData.department}`);

    // Fill first name
    await page.locator('input[name="firstName"]').first().fill(userData.firstName);
    console.log('   ✓ First name filled');

    // Fill last name
    await page.locator('input[name="lastName"]').first().fill(userData.lastName);
    console.log('   ✓ Last name filled');

    // Fill email
    await page.locator('input[type="email"]').first().fill(userData.email);
    console.log('   ✓ Email filled');

    // Fill department (optional field)
    const deptInput = page.locator('input[name="department"]');
    if (await deptInput.count() > 0) {
      await deptInput.first().fill(userData.department);
      console.log('   ✓ Department filled');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/manual-5-form-filled.png' });

    // Submit form
    console.log('\n🔧 Submitting form...');
    const submitButton = page.locator('button[type="submit"]')
      .or(page.locator('button:has-text("Add User")'));

    await submitButton.first().click();
    console.log('✅ Submit button clicked');

    // Wait for user creation
    console.log('⏳ Waiting 8 seconds for user creation...');
    await page.waitForTimeout(8000);

    await page.screenshot({ path: 'tests/screenshots/manual-6-after-submit.png' });

    // Check if modal closed (success indicator)
    const modalStillVisible = await modal.isVisible().catch(() => false);
    console.log(`📋 Modal closed: ${!modalStillVisible ? 'YES ✅' : 'NO ❌'}`);

    if (modalStillVisible) {
      console.log('⚠️  Modal still open - checking for error messages...');
      const modalText = await modal.textContent();
      console.log(`Modal content: ${modalText}`);
    }

    // Verify user appears in table
    console.log('\n🔧 Verifying user appears in table...');
    await page.waitForTimeout(2000);

    const newUserCount = await page.locator('table tbody tr').count();
    const userCountIncreased = newUserCount > existingUserCount;

    console.log(`📊 User count: ${newUserCount} (was ${existingUserCount})`);
    console.log(`📊 Count increased: ${userCountIncreased ? 'YES ✅' : 'NO ❌'}`);

    // Look for the specific user by email
    const userRow = page.locator(`tr:has-text("${userData.email}")`);
    const userInTable = await userRow.count() > 0;

    if (userInTable) {
      console.log(`✅ SUCCESS! User "${userData.email}" found in table!`);

      // Get row details
      const rowText = await userRow.first().textContent();
      console.log(`📋 Row content: ${rowText}`);
    } else {
      console.log(`❌ User "${userData.email}" NOT found in table`);

      // Debug: show current table
      const tableRows = await page.locator('table tbody tr').allTextContents();
      console.log(`\n📄 Current table rows (${tableRows.length}):`);
      tableRows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row}`);
      });
    }

    await page.screenshot({ path: 'tests/screenshots/manual-7-final-verification.png' });

    // Final summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Company: ${companyName}`);
    console.log(`User: ${userData.firstName} ${userData.lastName}`);
    console.log(`Email: ${userData.email}`);
    console.log('───────────────────────────────────────────────────');
    console.log(`✓ User found in table: ${userInTable ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ User count increased: ${userCountIncreased ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Modal closed properly: ${!modalStillVisible ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Modal has dark theme: ${modalBg.isDark ? 'YES ✅' : 'NO ❌'}`);
    console.log('───────────────────────────────────────────────────');
    console.log(`Users before: ${existingUserCount}`);
    console.log(`Users after: ${newUserCount}`);
    console.log(`Difference: +${newUserCount - existingUserCount}`);
    console.log('═══════════════════════════════════════════════════');

    if (userInTable && userCountIncreased) {
      console.log('\n🎉 TEST PASSED! User was created successfully!');
    } else {
      console.log('\n❌ TEST FAILED! User creation did not work as expected.');
      console.log('   Check screenshots in tests/screenshots/manual-*.png');
    }

    console.log('\nScreenshots saved:');
    console.log('  - manual-1-companies.png');
    console.log('  - manual-2-company-details.png');
    console.log('  - manual-3-users-tab.png');
    console.log('  - manual-4-invite-modal.png (check dark theme)');
    console.log('  - manual-5-form-filled.png');
    console.log('  - manual-6-after-submit.png');
    console.log('  - manual-7-final-verification.png');
    console.log('');

    // Assert test passed
    expect(userInTable).toBe(true);
    expect(userCountIncreased).toBe(true);
    expect(modalBg.isDark).toBe(true);
  });
});
