const { test } = require('@playwright/test');

test('manual verification - check what authenticated user sees', async ({ page }) => {
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. The browser will open');
  console.log('2. Manually log in with Google');
  console.log('3. Wait on the dashboard');
  console.log('4. The test will check what you see');
  console.log('\nStarting in 3 seconds...\n');

  await page.goto('http://localhost:3000');

  // Wait for manual login (60 seconds)
  console.log('Waiting for you to log in... (60 seconds)');
  await page.waitForTimeout(60000);

  // Now check what's on screen
  console.log('\n=== CHECKING CURRENT STATE ===');
  console.log('URL:', page.url());

  const bodyText = await page.textContent('body');
  console.log('\n=== FULL PAGE TEXT ===');
  console.log(bodyText);

  // Check specific elements
  console.log('\n=== ELEMENT CHECK ===');
  const welcomeBack = await page.locator('text=/Welcome back/i').count();
  const roleCard = await page.locator('text="Your Role"').count();
  const availableTools = await page.locator('text="Available Tools"').count();
  const homeLink = await page.locator('text="Home"').count();

  console.log('Welcome back:', welcomeBack > 0 ? '✅ FOUND' : '❌ NOT FOUND');
  console.log('Your Role card:', roleCard > 0 ? '❌ FOUND (should be gone!)' : '✅ NOT FOUND');
  console.log('Available Tools text:', availableTools > 0 ? 'FOUND' : 'NOT FOUND');
  console.log('Home in sidebar:', homeLink > 0 ? '✅ FOUND' : '❌ NOT FOUND');

  // Screenshot
  await page.screenshot({ path: '/tmp/logged-in-dashboard.png', fullPage: true });
  console.log('\n📸 Screenshot saved: /tmp/logged-in-dashboard.png');

  console.log('\nTest will stay open for 10 more seconds so you can inspect...');
  await page.waitForTimeout(10000);
});
