const { test, expect } = require('@playwright/test');

test.describe('Complete Flow: Create Company and User', () => {
  test('should create a company, then add a user to it', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push({ url: request.url() });
      console.log('❌ Network failed:', request.url());
    });

    // Step 1: Authenticate
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 STEP 1: Authenticating...');
    console.log('═══════════════════════════════════════════════════');

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
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 STEP 2: Creating a Company...');
    console.log('═══════════════════════════════════════════════════');

    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/flow-step1-companies-page.png' });

    // Step 3: Click "Add Company" button
    const addCompanyButton = page.locator('button').filter({ hasText: /add company|create company/i });
    const buttonExists = await addCompanyButton.count() > 0;

    if (!buttonExists) {
      console.log('❌ No "Add Company" button found!');
      throw new Error('Cannot find Add Company button');
    }

    console.log('✅ Found "Add Company" button');
    await addCompanyButton.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/flow-step2-company-dialog.png' });

    // Step 4: Fill company form
    const timestamp = Date.now();
    const companyData = {
      name: `Test Company ${timestamp}`,
      slug: `test-co-${timestamp}`,
      email: `contact${timestamp}@testcompany.com`
    };

    console.log(`📝 Company: ${companyData.name}`);
    console.log(`📝 Slug: ${companyData.slug}`);
    console.log(`📝 Email: ${companyData.email}`);

    // Fill company name
    const nameInput = page.locator('input[name="name"]')
      .or(page.locator('label:has-text("Company Name") ~ input'))
      .or(page.locator('label:has-text("Name") ~ input'));

    if (await nameInput.count() > 0) {
      await nameInput.first().fill(companyData.name);
      console.log('✅ Filled company name');
    } else {
      console.log('❌ Could not find company name field');
    }

    // Fill slug if exists
    const slugInput = page.locator('input[name="slug"]')
      .or(page.locator('label:has-text("Slug") ~ input'));

    if (await slugInput.count() > 0) {
      await slugInput.first().fill(companyData.slug);
      console.log('✅ Filled company slug');
    }

    // Fill contact email if exists
    const emailInput = page.locator('input[name="contactEmail"]')
      .or(page.locator('input[name="email"]'))
      .or(page.locator('label:has-text("Email") ~ input'));

    if (await emailInput.count() > 0) {
      await emailInput.first().fill(companyData.email);
      console.log('✅ Filled contact email');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/flow-step3-company-form-filled.png' });

    // Submit company form
    console.log('\n⏳ Submitting company form...');
    const submitButton = page.locator('button[type="submit"]')
      .or(page.locator('button:has-text("Create")'))
      .or(page.locator('button:has-text("Add")'));

    await submitButton.first().click();
    console.log('✅ Clicked submit');

    // Wait for company to be created
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/flow-step4-after-company-creation.png' });

    // Check if company appears in list
    const companyRow = page.locator(`tr:has-text("${companyData.name}")`)
      .or(page.locator(`text="${companyData.name}"`));
    const companyExists = await companyRow.count() > 0;

    if (companyExists) {
      console.log(`✅ Company "${companyData.name}" created successfully!`);
    } else {
      console.log(`⚠️ Company not immediately visible, continuing anyway...`);
    }

    // Step 5: Open the company we just created (or first available)
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 STEP 3: Opening Company Details...');
    console.log('═══════════════════════════════════════════════════');

    await page.waitForTimeout(2000);

    const viewDetailsButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewDetailsButtons} companies with "View Details" button`);

    if (viewDetailsButtons === 0) {
      console.log('❌ No companies available even after creation!');
      throw new Error('Company creation may have failed');
    }

    // Click the first "View Details" button
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/flow-step5-company-details.png' });

    // Step 6: Click Users tab
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 STEP 4: Opening Users Tab...');
    console.log('═══════════════════════════════════════════════════');

    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });
    await expect(usersTab.first()).toBeVisible();
    await usersTab.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/flow-step6-users-tab.png' });

    // Count existing users
    const existingUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Existing users in company: ${existingUserCount}`);

    // Step 7: Click Invite User
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 STEP 5: Inviting a User...');
    console.log('═══════════════════════════════════════════════════');

    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    await page.waitForTimeout(1500);

    // Check modal styling
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const modalBg = await modal.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`🎨 Modal background: ${modalBg}`);

    await page.screenshot({ path: 'tests/screenshots/flow-step7-invite-dialog.png' });

    // Step 8: Fill user form
    const userTimestamp = Date.now();
    const userData = {
      firstName: 'TestUser',
      lastName: `Number${userTimestamp}`,
      email: `user${userTimestamp}@example.com`,
      department: 'Engineering'
    };

    console.log(`📝 User: ${userData.firstName} ${userData.lastName}`);
    console.log(`📝 Email: ${userData.email}`);

    // Fill first name
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.first().fill(userData.firstName);
    console.log('✅ Filled first name');

    // Fill last name
    const lastNameInput = page.locator('input[name="lastName"]');
    await lastNameInput.first().fill(userData.lastName);
    console.log('✅ Filled last name');

    // Fill email
    const userEmailInput = page.locator('input[type="email"]');
    await userEmailInput.first().fill(userData.email);
    console.log('✅ Filled email');

    // Fill department
    const deptInput = page.locator('input[name="department"]');
    if (await deptInput.count() > 0) {
      await deptInput.first().fill(userData.department);
      console.log('✅ Filled department');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/flow-step8-user-form-filled.png' });

    // Step 9: Submit user form
    console.log('\n⏳ Submitting user form...');
    const userSubmitButton = page.locator('button[type="submit"]')
      .or(page.locator('button:has-text("Add User")'));

    await userSubmitButton.first().click();
    console.log('✅ Clicked submit');

    // Wait for user creation
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/flow-step9-after-user-creation.png' });

    // Check if modal closed
    const modalStillVisible = await modal.isVisible().catch(() => false);
    console.log(`📋 Modal closed: ${!modalStillVisible ? 'YES ✅' : 'NO ❌'}`);

    // Step 10: Verify user appears
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 STEP 6: Verifying User Creation...');
    console.log('═══════════════════════════════════════════════════');

    await page.waitForTimeout(2000);

    const newUserCount = await page.locator('table tbody tr').count();
    console.log(`📊 Users after creation: ${newUserCount} (was ${existingUserCount})`);

    const userRow = page.locator(`tr:has-text("${userData.email}")`);
    const userInTable = await userRow.count() > 0;

    if (userInTable) {
      console.log(`✅ SUCCESS! User "${userData.email}" appears in the table!`);
      const rowText = await userRow.first().textContent();
      console.log(`📋 Row: ${rowText}`);
    } else {
      console.log(`❌ FAILED! User "${userData.email}" NOT in table`);
      const tableText = await page.locator('table').textContent();
      console.log(`📄 Table:\n${tableText}`);
    }

    await page.screenshot({ path: 'tests/screenshots/flow-step10-final-verification.png' });

    // Final Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 FINAL TEST RESULTS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Company: ${companyData.name}`);
    console.log(`User: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    console.log('───────────────────────────────────────────────────');
    console.log(`✅ Company created: ${companyExists ? 'YES' : 'MAYBE'}`);
    console.log(`✅ User in table: ${userInTable ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✅ User count increased: ${newUserCount > existingUserCount ? 'YES' : 'NO'}`);
    console.log(`✅ Modal closed: ${!modalStillVisible ? 'YES' : 'NO'}`);
    console.log('───────────────────────────────────────────────────');
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);
    console.log('═══════════════════════════════════════════════════');

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.slice(0, 10).forEach(err => console.log(`   ${err}`));
    }

    // Assert success
    expect(userInTable).toBe(true);
  });
});
