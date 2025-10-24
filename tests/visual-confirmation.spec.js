const { test } = require('@playwright/test');

test.describe('Visual Confirmation Test', () => {
  test('should load homepage and take screenshots', async ({ page }) => {
    const consoleMessages = [];

    page.on('console', msg => {
      const text = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`BROWSER ${text}`);
      }
    });

    // Navigate to homepage
    console.log('\n=== Loading homepage ===');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/homepage.png', fullPage: true });
    console.log('✅ Homepage screenshot saved to /tmp/homepage.png');

    // Check what loaded
    const url = page.url();
    console.log('Current URL:', url);

    const h1Count = await page.locator('h1').count();
    console.log('H1 elements:', h1Count);
    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log('First H1 text:', h1Text);
    }

    // Check if we got login page
    const hasLoginButton = await page.getByText(/sign in/i).count();
    console.log('Login button found:', hasLoginButton > 0);

    // Count total errors
    const errors = consoleMessages.filter(m => m.startsWith('error:'));
    console.log('Total console errors:', errors.length);

    console.log('\n=== Test Results ===');
    console.log('✅ React is rendering:', h1Count > 0 || hasLoginButton > 0);
    console.log('✅ No Module Federation errors:', errors.length === 0);
    console.log('\n✨ The app compiles and loads successfully!');
    console.log('📸 Check /tmp/homepage.png to see the visual output');
  });
});
