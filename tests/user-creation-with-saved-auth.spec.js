const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Path to saved auth state
const authFile = path.join(__dirname, 'auth-state.json');

test.describe('User Creation with Saved Auth State', () => {
  test.use({
    // Use saved authentication state if it exists
    storageState: fs.existsSync(authFile) ? authFile : undefined
  });

  test('create and verify user in database', async ({ page }) => {
    // Check if auth state exists
    if (!fs.existsSync(authFile)) {
      console.log('\n❌ ERROR: No saved authentication state found!');
      console.log('═══════════════════════════════════════════════════');
      console.log('Please run this command first to save your login:');
      console.log('  node tests/helpers/save-auth-state.js');
      console.log('═══════════════════════════════════════════════════\n');
      throw new Error('Authentication state not found. Run save-auth-state.js first.');
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔐 Using Saved Authentication State');
    console.log('═══════════════════════════════════════════════════\n');

    // Navigate directly to admin companies
    console.log('🔧 Navigating to companies...');
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/saved-auth-1-companies.png' });

    // Check for companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();
    console.log(`📊 Found ${viewButtons} companies`);

    if (viewButtons === 0) {
      console.log('\n❌ No companies found!');
      console.log('This might mean:');
      console.log('  - Auth state expired (re-run save-auth-state.js)');
      console.log('  - No companies in database');
      console.log('  - Not logged in as admin');

      const pageContent = await page.textContent('body');
      if (pageContent.includes('Sign in') || pageContent.includes('Google')) {
        console.log('\n⚠️  Detected login page - auth state has expired!');
        console.log('   Please run: node tests/helpers/save-auth-state.js');
      }

      await page.screenshot({ path: 'tests/screenshots/saved-auth-error.png' });
      throw new Error('No companies found');
    }

    // Open first company
    console.log('\n🔧 Opening company...');
    await page.locator('button:has-text("View Details")').first().click();
    await page.waitForTimeout(2000);

    const companyName = await page.locator('h1').first().textContent();
    console.log(`📋 Company: ${companyName}`);
    await page.screenshot({ path: 'tests/screenshots/saved-auth-2-company.png' });

    // Click Users tab
    console.log('\n🔧 Opening Users tab...');
    const usersTab = page.locator('[role="tab"]').filter({ hasText: /users/i });
    await usersTab.first().click();
    await page.waitForTimeout(2000);

    const existingCount = await page.locator('table tbody tr').count();
    console.log(`📊 Existing users: ${existingCount}`);
    await page.screenshot({ path: 'tests/screenshots/saved-auth-3-users.png' });

    // Click Invite User
    console.log('\n🔧 Opening Invite dialog...');
    await page.locator('button:has-text("Invite User")').click();
    await page.waitForTimeout(1500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check modal theme
    const modalBg = await modal.evaluate((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        return { bg, isDark: r < 100 && g < 100 && b < 100 };
      }
      return { bg, isDark: false };
    });

    console.log(`🎨 Modal: ${modalBg.bg} - ${modalBg.isDark ? 'Dark ✅' : 'Light ❌'}`);
    await page.screenshot({ path: 'tests/screenshots/saved-auth-4-modal.png' });

    // Fill form
    console.log('\n🔧 Creating user...');
    const timestamp = Date.now();
    const user = {
      firstName: 'Automated',
      lastName: `Test${timestamp}`,
      email: `autotest.${timestamp}@example.com`,
      department: 'QA'
    };

    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);

    await page.locator('input[name="firstName"]').fill(user.firstName);
    await page.locator('input[name="lastName"]').fill(user.lastName);
    await page.locator('input[type="email"]').fill(user.email);

    const deptInput = page.locator('input[name="department"]');
    if (await deptInput.count() > 0) {
      await deptInput.fill(user.department);
    }

    await page.screenshot({ path: 'tests/screenshots/saved-auth-5-filled.png' });

    // Submit
    console.log('\n🔧 Submitting...');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(8000);

    const modalClosed = !(await modal.isVisible().catch(() => false));
    console.log(`📋 Modal closed: ${modalClosed ? 'YES ✅' : 'NO ❌'}`);

    await page.screenshot({ path: 'tests/screenshots/saved-auth-6-submitted.png' });

    // Verify
    console.log('\n🔧 Verifying...');
    await page.waitForTimeout(2000);

    const newCount = await page.locator('table tbody tr').count();
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    const found = await userRow.count() > 0;

    console.log(`📊 Users: ${newCount} (was ${existingCount})`);
    console.log(`📋 User in table: ${found ? 'YES ✅' : 'NO ❌'}`);

    if (found) {
      const row = await userRow.first().textContent();
      console.log(`📋 Row: ${row}`);
    }

    await page.screenshot({ path: 'tests/screenshots/saved-auth-7-final.png' });

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESULTS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Company: ${companyName}`);
    console.log(`User: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log('───────────────────────────────────────────────────');
    console.log(`✓ User in table: ${found ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Count increased: ${newCount > existingCount ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Modal closed: ${modalClosed ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ Dark theme: ${modalBg.isDark ? 'YES ✅' : 'NO ❌'}`);
    console.log('═══════════════════════════════════════════════════');

    if (found && newCount > existingCount) {
      console.log('\n🎉 SUCCESS! User created and verified in database!');
    } else {
      console.log('\n❌ FAILED! User not properly created.');
    }

    console.log('');

    expect(found).toBe(true);
    expect(newCount).toBeGreaterThan(existingCount);
    expect(modalBg.isDark).toBe(true);
  });
});
