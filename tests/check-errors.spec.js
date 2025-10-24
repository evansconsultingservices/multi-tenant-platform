const { test } = require('@playwright/test');

test.describe('Check for JavaScript errors', () => {
  test('should capture all console messages and errors', async ({ page }) => {
    const consoleMessages = [];
    const errors = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(text);
      console.log(`BROWSER ${text}`);

      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      const text = `PAGE ERROR: ${error.message}`;
      errors.push(text);
      console.log(text);
    });

    // Navigate to homepage first
    console.log('\n=== Loading homepage ===');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== Homepage Results ===');
    console.log('URL:', page.url());
    console.log('Total console messages:', consoleMessages.length);
    console.log('Errors:', errors.length);

    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach(e => console.log(e));
    }

    // Check if React loaded
    const hasH1 = await page.locator('h1').count();
    console.log('H1 elements found:', hasH1);

    const bodyText = await page.locator('body').textContent();
    console.log('Body has text:', bodyText.length > 100);
    if (bodyText.length < 200) {
      console.log('Body text:', bodyText);
    }
  });
});
