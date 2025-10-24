const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Debug', () => {
  test('should debug admin panel rendering', async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
    });

    // Navigate to admin panel (it will redirect to login first)
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    console.log('\n=== STEP 1: Initial page load ===');
    console.log('URL after first load:', page.url());

    // Mock authentication by setting localStorage
    await page.evaluate(() => {
      const mockUser = {
        uid: 'test-admin-uid',
        email: 'admin@example.com',
        displayName: 'Test Admin',
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    console.log('\n=== STEP 2: After setting mock user in localStorage ===');

    // Navigate to admin panel again
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== STEP 3: After navigating to admin again ===');
    console.log('Current URL:', page.url());

    // Take screenshot
    await page.screenshot({ path: '/tmp/admin-debug.png', fullPage: true });
    console.log('Screenshot saved to /tmp/admin-debug.png');

    // Get page HTML
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('\n=== BODY HTML (first 500 chars) ===');
    console.log(bodyHTML.substring(0, 500));

    // Check for various elements
    console.log('\n=== Element checks ===');

    const hasH1 = await page.locator('h1').count();
    console.log('H1 elements found:', hasH1);
    if (hasH1 > 0) {
      console.log('H1 text:', await page.locator('h1').first().textContent());
    }

    const hasTabsList = await page.locator('[role="tablist"]').count();
    console.log('Tablists found:', hasTabsList);

    const hasTabs = await page.locator('[role="tab"]').count();
    console.log('Tabs found:', hasTabs);

    // Check for "Administration Panel" text
    const hasAdminText = await page.getByText('Administration Panel').count();
    console.log('Administration Panel text found:', hasAdminText);

    // Check if we got redirected
    const hasDashboardText = await page.getByText('Dashboard').count();
    console.log('Dashboard text found (redirected?):', hasDashboardText);
  });
});
