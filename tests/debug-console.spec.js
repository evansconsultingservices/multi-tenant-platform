const { test, expect } = require('@playwright/test');

test.describe('Console Error Debugging', () => {
  test('should capture and display all console errors', async ({ page }) => {
    const consoleMessages = [];
    const pageErrors = [];

    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      console.log(`CONSOLE ${type.toUpperCase()}: ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log(`PAGE ERROR: ${error.message}`);
      console.log(`STACK: ${error.stack}`);
    });

    // Navigate to the page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait additional time for any async operations
    await page.waitForTimeout(5000);

    // Log all captured messages
    console.log('\n=== CONSOLE MESSAGES SUMMARY ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });

    console.log('\n=== PAGE ERRORS SUMMARY ===');
    pageErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });

    // Check page HTML structure
    const htmlContent = await page.content();
    console.log('\n=== PAGE HTML (first 1000 chars) ===');
    console.log(htmlContent.substring(0, 1000));

    // Check if React root is mounted
    const hasReactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null,
        children: root ? root.children.length : 0
      };
    });

    console.log('\n=== REACT ROOT STATUS ===');
    console.log(JSON.stringify(hasReactRoot, null, 2));

    // Check if any scripts loaded
    const scriptInfo = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return scripts.map(script => ({
        src: script.src,
        loaded: script.readyState === 'complete' || !script.readyState,
        hasError: script.onerror !== null
      }));
    });

    console.log('\n=== SCRIPT LOADING STATUS ===');
    scriptInfo.forEach((script, index) => {
      console.log(`${index + 1}. ${script.src} - Loaded: ${script.loaded}`);
    });

    // The test passes regardless - this is for debugging only
    expect(true).toBe(true);
  });
});