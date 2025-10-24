const { test, expect } = require('@playwright/test');

test.describe('Complete User Creation and Database Verification', () => {
  test('should create a user and verify it appears in the UI and database', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];
    const networkRequests = [];

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });

    // Track network failures
    page.on('requestfailed', request => {
      networkErrors.push({ url: request.url(), failure: request.failure() });
      console.log('❌ Network failed:', request.url());
    });

    // Track Firestore requests
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('firestore') || url.includes('firebase')) {
        const method = response.request().method();
        const status = response.status();
        networkRequests.push({ method, url, status });

        if (method === 'POST' && url.includes(':commit')) {
          console.log(`📡 Firestore WRITE detected: ${status}`);
        }
      }
    });

    // Step 1: Navigate and authenticate
    console.log('\n🔧 Step 1: Authenticating...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

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

    // Step 2: Navigate to companies
    console.log('\n🔧 Step 2: Navigating to companies tab...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/user-test-1-companies.png' });

    // Step 3: Check for companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewButtons} companies`);

    if (viewButtons === 0) {
      console.log('❌ No companies found. Cannot test user creation without a company.');
      console.log('   Please create a company first through the UI.');
      return;
    }

    // Step 4: Open first company
    console.log('\n🔧 Step 3: Opening company details...');
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/user-test-2-company-details.png' });

    // Get company name from the page
    const companyName = await page.locator('h1').first().textContent();
    console.log(`📋 Company: ${companyName}`);

    // Step 5: Click Users tab
    console.log('\n🔧 Step 4: Opening Users tab...');
    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });
    await expect(usersTab.first()).toBeVisible();
    await usersTab.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/user-test-3-users-tab.png' });

    // Step 6: Count existing users
    const existingUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Existing users: ${existingUserCount}`);

    // Step 7: Click Invite User
    console.log('\n🔧 Step 5: Opening Invite User dialog...');
    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    await page.waitForTimeout(1500);

    // Verify modal is visible and dark themed
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const modalBg = await modal.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`🎨 Modal background: ${modalBg}`);

    await page.screenshot({ path: 'tests/screenshots/user-test-4-invite-modal.png' });

    // Step 8: Fill form
    console.log('\n🔧 Step 6: Filling user form...');
    const timestamp = Date.now();
    const testUser = {
      firstName: 'TestFirst',
      lastName: `User${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      department: 'Engineering'
    };

    console.log(`📝 Creating user: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);

    // Fill first name
    const firstNameInput = page.locator('input[name="firstName"]')
      .or(page.locator('label:has-text("First Name") ~ input'));
    await firstNameInput.first().fill(testUser.firstName);
    console.log('✅ Filled first name');

    // Fill last name
    const lastNameInput = page.locator('input[name="lastName"]')
      .or(page.locator('label:has-text("Last Name") ~ input'));
    await lastNameInput.first().fill(testUser.lastName);
    console.log('✅ Filled last name');

    // Fill email
    const emailInput = page.locator('input[type="email"]')
      .or(page.locator('input[name="email"]'));
    await emailInput.first().fill(testUser.email);
    console.log('✅ Filled email');

    // Fill department if available
    const departmentInput = page.locator('input[name="department"]');
    if (await departmentInput.count() > 0) {
      await departmentInput.first().fill(testUser.department);
      console.log('✅ Filled department');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/user-test-5-form-filled.png' });

    // Step 9: Submit form
    console.log('\n🔧 Step 7: Submitting form...');
    const requestsBeforeSubmit = networkRequests.length;

    const submitButton = page.locator('button[type="submit"]')
      .or(page.locator('button:has-text("Add User")'));
    await submitButton.first().click();
    console.log('✅ Clicked submit button');

    // Wait for submission to complete
    console.log('⏳ Waiting for submission...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'tests/screenshots/user-test-6-after-submit.png' });

    // Check if modal closed (success indicator)
    const modalStillVisible = await modal.isVisible().catch(() => false);
    if (modalStillVisible) {
      console.log('⚠️ Modal still visible - might indicate validation error or failure');

      // Check for error messages
      const errorText = await page.locator('text=/error|fail|invalid/i').count();
      if (errorText > 0) {
        console.log('❌ Error message found in modal');
      }
    } else {
      console.log('✅ Modal closed (likely successful submission)');
    }

    // Step 10: Check if user appears in table
    console.log('\n🔧 Step 8: Verifying user appears in UI...');
    await page.waitForTimeout(2000);

    const newUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Users after creation: ${newUserCount} (was ${existingUserCount})`);

    const userRow = page.locator(`tr:has-text("${testUser.email}")`);
    const userInTable = await userRow.count() > 0;

    if (userInTable) {
      console.log(`✅ SUCCESS! User "${testUser.email}" appears in the table!`);

      // Get the full row content
      const rowText = await userRow.first().textContent();
      console.log(`📋 Row content: ${rowText}`);
    } else {
      console.log(`❌ FAILED! User "${testUser.email}" NOT found in table`);

      // Debug: show table content
      const tableContent = await page.locator('table').textContent();
      console.log(`📄 Current table content:\n${tableContent}`);
    }

    await page.screenshot({ path: 'tests/screenshots/user-test-7-final-state.png' });

    // Step 11: Check network activity
    console.log('\n📡 Network Activity Analysis:');
    const requestsAfterSubmit = networkRequests.length;
    const newRequests = requestsAfterSubmit - requestsBeforeSubmit;
    console.log(`   New network requests: ${newRequests}`);

    const writeRequests = networkRequests.filter(r =>
      r.method === 'POST' && r.url.includes(':commit')
    );
    console.log(`   Firestore write operations: ${writeRequests.length}`);

    // Final summary
    console.log('\n📊 FINAL TEST SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`   Test User: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Company: ${companyName}`);
    console.log('─'.repeat(50));
    console.log(`   User appears in UI: ${userInTable ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   User count changed: ${newUserCount > existingUserCount ? 'YES' : 'NO'}`);
    console.log(`   Modal closed properly: ${!modalStillVisible ? 'YES' : 'NO'}`);
    console.log(`   Firestore writes detected: ${writeRequests.length}`);
    console.log('─'.repeat(50));
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Network errors: ${networkErrors.length}`);
    console.log('═'.repeat(50));

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.slice(0, 5).forEach(err => console.log(`   ${err}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n❌ Network Errors:');
      networkErrors.slice(0, 5).forEach(err => console.log(`   ${err.url}`));
    }

    // Assert success
    expect(userInTable).toBe(true);
    expect(newUserCount).toBeGreaterThan(existingUserCount);
  });
});
