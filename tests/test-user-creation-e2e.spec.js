const { test, expect } = require('@playwright/test');

test.describe('End-to-End User Creation Test', () => {
  test('should actually create a user and see it in the list', async ({ page }) => {
    // Track console errors and network requests
    const consoleErrors = [];
    const networkErrors = [];
    const networkRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()
      });
      console.log('❌ Network request failed:', request.url());
    });

    page.on('response', async response => {
      if (response.url().includes('firestore') || response.url().includes('users')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
        console.log(`📡 ${response.request().method()} ${response.url()} - ${response.status()}`);
      }
    });

    // Step 1: Navigate and authenticate
    console.log('\n🔧 Step 1: Navigating to app and authenticating...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const mockUser = {
        uid: 'test-admin-uid',
        email: 'admin@example.com',
        displayName: 'Test Admin',
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    // Step 2: Navigate to companies
    console.log('\n🔧 Step 2: Navigating to companies tab...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/step1-companies-list.png' });
    console.log('📸 Screenshot: step1-companies-list.png');

    // Step 3: Check if companies exist
    const viewButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewButtons} companies`);

    if (viewButtons === 0) {
      console.log('❌ TEST SKIPPED: No companies found. Please create a company first.');
      return;
    }

    // Step 4: Click first company
    console.log('\n🔧 Step 3: Opening first company details...');
    await page.click('button:has-text("View Details")');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/step2-company-details.png' });
    console.log('📸 Screenshot: step2-company-details.png');

    // Step 5: Click Users tab
    console.log('\n🔧 Step 4: Clicking Users tab...');
    const usersTab = await page.locator('[role="tab"][value="users"]');
    await expect(usersTab).toBeVisible();
    await usersTab.click();
    await page.waitForTimeout(2000);

    // Verify tab is active
    const dataState = await usersTab.getAttribute('data-state');
    console.log(`📊 Users tab state: ${dataState}`);
    expect(dataState).toBe('active');

    await page.screenshot({ path: 'tests/screenshots/step3-users-tab.png' });
    console.log('📸 Screenshot: step3-users-tab.png');

    // Step 6: Count existing users
    console.log('\n🔧 Step 5: Counting existing users...');
    const existingUserRows = await page.locator('table tbody tr').count();
    console.log(`📊 Existing users: ${existingUserRows}`);

    // Step 7: Click Invite User button
    console.log('\n🔧 Step 6: Clicking "Invite User" button...');
    const inviteButton = await page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    await page.waitForTimeout(1500);

    // Verify dialog opened
    const dialog = await page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    console.log('✅ Invite dialog opened');

    await page.screenshot({ path: 'tests/screenshots/step4-invite-dialog.png' });
    console.log('📸 Screenshot: step4-invite-dialog.png');

    // Step 8: Fill out the form
    console.log('\n🔧 Step 7: Filling out user form...');
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Test',
      lastName: `User${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      role: 'user',
      department: 'Engineering'
    };

    console.log('📝 Test user data:', testUser);

    // Try multiple selectors for each field
    const firstNameInput = page.locator('input[name="firstName"]').or(page.locator('label:has-text("First Name") + input')).or(page.locator('input').filter({ hasText: /first/i }).first());
    const lastNameInput = page.locator('input[name="lastName"]').or(page.locator('label:has-text("Last Name") + input')).or(page.locator('input').filter({ hasText: /last/i }).first());
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const departmentInput = page.locator('input[name="department"]').or(page.locator('label:has-text("Department") + input'));

    // Fill first name
    try {
      await firstNameInput.first().fill(testUser.firstName);
      console.log('✅ Filled first name');
    } catch (e) {
      console.log('❌ Could not fill first name:', e.message);
    }

    // Fill last name
    try {
      await lastNameInput.first().fill(testUser.lastName);
      console.log('✅ Filled last name');
    } catch (e) {
      console.log('❌ Could not fill last name:', e.message);
    }

    // Fill email
    try {
      await emailInput.first().fill(testUser.email);
      console.log('✅ Filled email');
    } catch (e) {
      console.log('❌ Could not fill email:', e.message);
    }

    // Fill department
    try {
      if (await departmentInput.count() > 0) {
        await departmentInput.first().fill(testUser.department);
        console.log('✅ Filled department');
      }
    } catch (e) {
      console.log('⚠️ Could not fill department (optional):', e.message);
    }

    // Select role (if role selector exists)
    try {
      const roleSelect = page.locator('select[name="role"]').or(page.locator('[role="combobox"]'));
      if (await roleSelect.count() > 0) {
        await roleSelect.first().click();
        await page.waitForTimeout(500);
        await page.locator(`[role="option"]:has-text("${testUser.role}")`).or(page.locator(`option:has-text("${testUser.role}")`)).click();
        console.log('✅ Selected role');
      }
    } catch (e) {
      console.log('⚠️ Could not select role:', e.message);
    }

    await page.screenshot({ path: 'tests/screenshots/step5-form-filled.png' });
    console.log('📸 Screenshot: step5-form-filled.png');

    // Step 9: Submit the form
    console.log('\n🔧 Step 8: Submitting form...');
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Invite")'));
    await expect(submitButton.first()).toBeVisible();
    await submitButton.first().click();

    // Wait for the dialog to close
    console.log('⏳ Waiting for dialog to close...');
    await page.waitForTimeout(3000);

    // Check if dialog closed
    const dialogStillVisible = await dialog.isVisible().catch(() => false);
    if (dialogStillVisible) {
      console.log('⚠️ Dialog still visible - there might be a validation error');
      await page.screenshot({ path: 'tests/screenshots/step6-after-submit-error.png' });
    } else {
      console.log('✅ Dialog closed');
    }

    // Step 10: Wait for user to appear in list
    console.log('\n🔧 Step 9: Checking if user appears in list...');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/step7-after-creation.png' });
    console.log('📸 Screenshot: step7-after-creation.png');

    // Count users again
    const newUserRows = await page.locator('table tbody tr').count();
    console.log(`📊 Users after creation: ${newUserRows} (was ${existingUserRows})`);

    // Look for the new user by email
    const userRow = await page.locator(`tr:has-text("${testUser.email}")`);
    const userExists = await userRow.count() > 0;

    if (userExists) {
      console.log(`✅ SUCCESS! User "${testUser.firstName} ${testUser.lastName}" (${testUser.email}) was created and appears in the list`);
    } else {
      console.log(`❌ FAILED! User "${testUser.email}" was NOT found in the list`);

      // Try to find any user with the email in the whole page
      const anyMatch = await page.locator(`text=${testUser.email}`).count();
      console.log(`📊 Email found anywhere on page: ${anyMatch} times`);
    }

    // Print summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Network errors: ${networkErrors.length}`);
    console.log(`   User created: ${userExists ? 'YES ✅' : 'NO ❌'}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n❌ Network Errors:');
      networkErrors.forEach(err => console.log(`   - ${err.url}: ${JSON.stringify(err.failure)}`));
    }

    // Assert that user was created
    expect(userExists).toBe(true);
  });
});
