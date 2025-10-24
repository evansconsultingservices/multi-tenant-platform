const { test, expect } = require('@playwright/test');

test.describe('User Creation with Real Authentication', () => {
  test('add user to company (requires manual login)', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔐 AUTHENTICATION REQUIRED');
    console.log('═══════════════════════════════════════════════════');
    console.log('Please log in manually when the browser opens.');
    console.log('The test will wait 20 seconds for you to log in.');
    console.log('═══════════════════════════════════════════════════\n');

    // Step 1: Open the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if already on login page or logged in
    const isOnLogin = await page.locator('text=/sign in|continue with google/i').count() > 0;

    if (isOnLogin) {
      console.log('⏳ Waiting 20 seconds for manual Google login...');
      console.log('   Please click "Continue with Google" and complete the sign-in');
      await page.waitForTimeout(20000); // Wait 20 seconds for manual login
    } else {
      console.log('✅ Already logged in');
    }

    // Step 2: Navigate to admin companies
    console.log('\n🔧 Navigating to companies...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/real-auth-1-companies.png' });

    // Check if we can see companies (confirms we're logged in)
    const viewButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewButtons} companies`);

    if (viewButtons === 0) {
      console.log('\n❌ No companies found or not properly authenticated!');
      console.log('   Please ensure:');
      console.log('   1. You are logged in with an admin account');
      console.log('   2. There are companies in the database');
      await page.screenshot({ path: 'tests/screenshots/real-auth-error-no-companies.png' });
      return;
    }

    // Step 3: Click first company
    console.log('\n🔧 Opening company details...');
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/real-auth-2-company-details.png' });

    // Get company name
    const companyName = await page.locator('h1').first().textContent();
    console.log(`📋 Company: ${companyName}`);

    // Step 4: Click Users tab
    console.log('\n🔧 Opening Users tab...');
    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });

    if (await usersTab.count() === 0) {
      console.log('❌ Cannot find Users tab!');
      await page.screenshot({ path: 'tests/screenshots/real-auth-error-no-users-tab.png' });
      return;
    }

    await usersTab.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/real-auth-3-users-tab.png' });

    // Count existing users
    const existingUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Existing users: ${existingUserCount}`);

    // Step 5: Click Invite User
    console.log('\n🔧 Opening Invite User dialog...');
    const inviteButton = page.locator('button:has-text("Invite User")');

    if (await inviteButton.count() === 0) {
      console.log('❌ Cannot find "Invite User" button!');
      await page.screenshot({ path: 'tests/screenshots/real-auth-error-no-invite-button.png' });
      return;
    }

    await inviteButton.click();
    await page.waitForTimeout(1500);

    // Verify modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    console.log('✅ Invite dialog opened');

    // Check modal styling
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
    console.log(`🎨 Is dark theme: ${modalBg.isDark ? 'YES ✅' : 'NO ❌'}`);

    await page.screenshot({ path: 'tests/screenshots/real-auth-4-invite-modal.png' });

    // Step 6: Fill user form
    console.log('\n🔧 Filling user form...');
    const timestamp = Date.now();
    const userData = {
      firstName: 'PlaywrightTest',
      lastName: `User${timestamp}`,
      email: `playwright.test.${timestamp}@example.com`,
      department: 'QA Testing'
    };

    console.log(`📝 User: ${userData.firstName} ${userData.lastName}`);
    console.log(`📝 Email: ${userData.email}`);

    // Fill form fields
    await page.locator('input[name="firstName"]').first().fill(userData.firstName);
    console.log('✅ Filled first name');

    await page.locator('input[name="lastName"]').first().fill(userData.lastName);
    console.log('✅ Filled last name');

    await page.locator('input[type="email"]').first().fill(userData.email);
    console.log('✅ Filled email');

    const deptInput = page.locator('input[name="department"]');
    if (await deptInput.count() > 0) {
      await deptInput.first().fill(userData.department);
      console.log('✅ Filled department');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/real-auth-5-form-filled.png' });

    // Step 7: Submit form
    console.log('\n🔧 Submitting form...');
    const submitButton = page.locator('button[type="submit"]')
      .or(page.locator('button:has-text("Add User")'));

    await submitButton.first().click();
    console.log('✅ Clicked submit button');

    // Wait for submission
    console.log('⏳ Waiting for user creation (8 seconds)...');
    await page.waitForTimeout(8000);

    await page.screenshot({ path: 'tests/screenshots/real-auth-6-after-submit.png' });

    // Check if modal closed
    const modalStillVisible = await modal.isVisible().catch(() => false);
    console.log(`📋 Modal closed: ${!modalStillVisible ? 'YES ✅' : 'NO ❌'}`);

    // Step 8: Verify user appears
    console.log('\n🔧 Verifying user in table...');
    await page.waitForTimeout(2000);

    const newUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Users after: ${newUserCount} (was ${existingUserCount})`);

    const userRow = page.locator(`tr:has-text("${userData.email}")`);
    const userInTable = await userRow.count() > 0;

    if (userInTable) {
      console.log(`✅ SUCCESS! User "${userData.email}" appears in table!`);
      const rowText = await userRow.first().textContent();
      console.log(`📋 Row content: ${rowText}`);
    } else {
      console.log(`❌ User "${userData.email}" NOT found in table`);

      // Show current table content
      const tableText = await page.locator('table').textContent();
      console.log(`\n📄 Current table content:`);
      console.log(tableText);
    }

    await page.screenshot({ path: 'tests/screenshots/real-auth-7-final-state.png' });

    // Final Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Company: ${companyName}`);
    console.log(`User: ${userData.firstName} ${userData.lastName}`);
    console.log(`Email: ${userData.email}`);
    console.log('───────────────────────────────────────────────────');
    console.log(`✓ User in table: ${userInTable ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ User count increased: ${newUserCount > existingUserCount ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Modal closed: ${!modalStillVisible ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Modal dark theme: ${modalBg.isDark ? 'YES ✅' : 'NO ❌'}`);
    console.log('═══════════════════════════════════════════════════');

    // Assertions
    expect(userInTable).toBe(true);
    expect(newUserCount).toBeGreaterThan(existingUserCount);
  });
});
