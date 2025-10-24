const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🔐 Google Authentication Setup');
  console.log('═══════════════════════════════════════════════════');
  console.log('This script will:');
  console.log('1. Open Chrome in non-headless mode');
  console.log('2. Let you log in with Google OAuth normally');
  console.log('3. Save your authentication state for future tests');
  console.log('═══════════════════════════════════════════════════\n');

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--start-maximized'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  console.log('🌐 Opening application...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('\n✋ PLEASE LOG IN NOW');
  console.log('───────────────────────────────────────────────────');
  console.log('1. Click "Continue with Google" in the browser');
  console.log('2. Complete the Google sign-in');
  console.log('3. Wait until you see the dashboard');
  console.log('4. Come back to this terminal and press Ctrl+C');
  console.log('───────────────────────────────────────────────────\n');

  // Keep the browser open for 5 minutes
  console.log('⏳ Browser will stay open for 5 minutes...');
  console.log('   Press Ctrl+C after logging in to save auth state\n');

  // Wait for user to log in (check every 5 seconds)
  const startTime = Date.now();
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - startTime < maxWaitTime) {
    await page.waitForTimeout(5000);

    // Check if we're logged in by looking for dashboard elements
    const isDashboard = await page.url().includes('dashboard') ||
                       await page.locator('text=/dashboard|admin|logout/i').count() > 0;

    if (isDashboard) {
      console.log('✅ Detected successful login!');
      break;
    }
  }

  // Save authentication state
  const authFile = path.join(__dirname, '../auth-state.json');
  await context.storageState({ path: authFile });

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ Authentication state saved!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`File: ${authFile}`);
  console.log('\nYou can now run tests that will automatically');
  console.log('use this authentication state without logging in.');
  console.log('═══════════════════════════════════════════════════\n');

  await browser.close();
  process.exit(0);
})();
