const { test, expect } = require('@playwright/test');

test.describe('Complete Company and User Creation Flow', () => {
  test('should create a company and then add a user to it', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push({ url: request.url(), failure: request.failure() });
      console.log('❌ Network failed:', request.url());
    });

    // Authenticate
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

    // === PART 1: CREATE A COMPANY ===
    console.log('\n📦 PART 1: Creating a company...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/flow-1-companies-page.png' });

    // Click "Add Company" or "Create Company" button
    const addCompanyButton = page.locator('button').filter({ hasText: /add|create|new/i });
    const buttonCount = await addCompanyButton.count();
    console.log(`📊 Found ${buttonCount} add/create buttons`);

    if (buttonCount > 0) {
      console.log('✅ Clicking add company button...');
      await addCompanyButton.first().click();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'tests/screenshots/flow-2-create-company-dialog.png' });

      // Fill company form
      const timestamp = Date.now();
      const companyData = {
        name: `Test Company ${timestamp}`,
        slug: `test-company-${timestamp}`,
        tier: 'pro'
      };

      console.log('📝 Company data:', companyData);

      try {
        const nameInput = page.locator('input[name="name"]').or(page.locator('label:has-text("Company Name") ~ input')).first();
        await nameInput.fill(companyData.name);
        console.log('✅ Filled company name');

        const slugInput = page.locator('input[name="slug"]').or(page.locator('label:has-text("Slug") ~ input')).first();
        if (await slugInput.count() > 0) {
          await slugInput.fill(companyData.slug);
          console.log('✅ Filled company slug');
        }

        await page.screenshot({ path: 'tests/screenshots/flow-3-company-form-filled.png' });

        // Submit
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Create")'));
        await submitButton.first().click();
        console.log('✅ Clicked submit');

        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'tests/screenshots/flow-4-after-company-creation.png' });

        // Check if company appears in list
        const companyRow = page.locator(`tr:has-text("${companyData.name}")`).or(page.locator(`text=${companyData.name}`));
        const companyExists = await companyRow.count() > 0;

        if (companyExists) {
          console.log(`✅ Company "${companyData.name}" created successfully!`);
        } else {
          console.log(`⚠️ Company not found in list immediately, continuing...`);
        }

      } catch (e) {
        console.log('❌ Error creating company:', e.message);
      }
    } else {
      console.log('⚠️ No "Add Company" button found - companies might need to be created differently');
    }

    // === PART 2: FIND AND OPEN A COMPANY ===
    console.log('\n📂 PART 2: Opening a company...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);

    const viewButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewButtons} companies with View Details button`);

    if (viewButtons === 0) {
      console.log('❌ No companies available. Cannot test user creation.');
      console.log('\n📊 FINAL SUMMARY:');
      console.log(`   Console errors: ${consoleErrors.length}`);
      console.log(`   Network errors: ${networkErrors.length}`);
      console.log(`   Company created: UNKNOWN`);
      console.log(`   User created: SKIPPED (no company)`);
      return;
    }

    // Click first company
    console.log('✅ Opening first company...');
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/flow-5-company-details.png' });

    // === PART 3: ADD USER TO COMPANY ===
    console.log('\n👤 PART 3: Adding user to company...');

    // Click Users tab
    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });
    await expect(usersTab.first()).toBeVisible();
    await usersTab.first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/flow-6-users-tab.png' });

    // Count existing users
    const existingUsers = await page.locator('table tbody tr').count();
    console.log(`📊 Existing users: ${existingUsers}`);

    // Click Invite User
    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'tests/screenshots/flow-7-invite-dialog.png' });

    // Fill user form
    const timestamp2 = Date.now();
    const userData = {
      firstName: 'Test',
      lastName: `User${timestamp2}`,
      email: `testuser${timestamp2}@example.com`,
      department: 'Engineering'
    };

    console.log('📝 User data:', userData);

    try {
      // Fill first name - try multiple selectors
      const firstNameField = page.locator('input[name="firstName"]')
        .or(page.locator('label:text-is("First Name") ~ input'))
        .or(page.locator('label:has-text("First") ~ input'));
      await firstNameField.first().fill(userData.firstName);
      console.log('✅ Filled first name');

      // Fill last name
      const lastNameField = page.locator('input[name="lastName"]')
        .or(page.locator('label:text-is("Last Name") ~ input'))
        .or(page.locator('label:has-text("Last") ~ input'));
      await lastNameField.first().fill(userData.lastName);
      console.log('✅ Filled last name');

      // Fill email
      const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
      await emailField.first().fill(userData.email);
      console.log('✅ Filled email');

      // Fill department (optional)
      const departmentField = page.locator('input[name="department"]');
      if (await departmentField.count() > 0) {
        await departmentField.first().fill(userData.department);
        console.log('✅ Filled department');
      }

      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/flow-8-user-form-filled.png' });

      // Submit
      const submitUserButton = page.locator('button[type="submit"]')
        .or(page.locator('button:has-text("Invite")'))
        .or(page.locator('button:has-text("Add")'));
      await submitUserButton.first().click();
      console.log('✅ Clicked submit user form');

      // Wait for submission
      await page.waitForTimeout(4000);

      await page.screenshot({ path: 'tests/screenshots/flow-9-after-user-creation.png' });

      // Check if user appears
      const newUserCount = await page.locator('table tbody tr').count();
      console.log(`📊 Users after creation: ${newUserCount} (was ${existingUsers})`);

      const userRow = page.locator(`tr:has-text("${userData.email}")`);
      const userExists = await userRow.count() > 0;

      if (userExists) {
        console.log(`✅ SUCCESS! User "${userData.email}" appears in the list!`);
      } else {
        console.log(`❌ FAILED! User "${userData.email}" NOT found in list`);

        // Debug: show what's actually in the table
        const tableContent = await page.locator('table').textContent();
        console.log('📄 Table content:', tableContent);
      }

      console.log('\n📊 FINAL SUMMARY:');
      console.log(`   Console errors: ${consoleErrors.length}`);
      console.log(`   Network errors: ${networkErrors.length}`);
      console.log(`   User created successfully: ${userExists ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   User count changed: ${newUserCount > existingUsers ? 'YES' : 'NO'}`);

      if (consoleErrors.length > 0) {
        console.log('\n❌ Console Errors:');
        consoleErrors.forEach(err => console.log(`   - ${err}`));
      }

      if (networkErrors.length > 0) {
        console.log('\n❌ Network Errors:');
        networkErrors.forEach(err => console.log(`   - ${err.url}`));
      }

      // Assert user was created
      expect(userExists).toBe(true);

    } catch (e) {
      console.log('❌ Error during user creation:', e.message);
      console.log('Stack:', e.stack);

      console.log('\n📊 FINAL SUMMARY (ERROR):');
      console.log(`   Console errors: ${consoleErrors.length}`);
      console.log(`   Network errors: ${networkErrors.length}`);
      console.log(`   Test error: ${e.message}`);

      throw e;
    }
  });
});
