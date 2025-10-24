const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Route and Error Testing', () => {
  let allConsoleErrors = [];
  let allPageErrors = [];

  test.beforeEach(async ({ page }) => {
    // Reset error arrays for each test
    allConsoleErrors = [];
    allPageErrors = [];

    // Capture ALL console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        allConsoleErrors.push(`[${type}] ${text}`);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else {
        console.log(`[${type}] ${text}`);
      }
    });

    // Capture ALL page errors
    page.on('pageerror', error => {
      allPageErrors.push(error.message);
      console.log(`❌ PAGE ERROR: ${error.message}`);
      console.log(`STACK: ${error.stack}`);
    });

    // Capture request failures
    page.on('requestfailed', request => {
      console.log(`❌ REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
    });
  });

  test('should test ALL routes and verify no console errors', async ({ page }) => {
    const routes = [
      '/',
      '/login',
      '/dashboard',
      '/dashboard/tools/hello-world',
      '/admin',
      '/admin/users',
      '/admin/tools',
      '/nonexistent-route' // Test 404 handling
    ];

    console.log('\n=== TESTING ALL ROUTES ===');

    for (const route of routes) {
      console.log(`\n🔍 Testing route: ${route}`);

      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        // Wait for React to render
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const pageTitle = await page.title();
        const bodyText = await page.locator('body').textContent();

        console.log(`  📍 Final URL: ${currentUrl}`);
        console.log(`  📄 Page Title: ${pageTitle}`);
        console.log(`  📝 Content Length: ${bodyText.length} chars`);
        console.log(`  📝 Content Preview: ${bodyText.substring(0, 100)}...`);

        // Check if page has meaningful content
        if (bodyText.length < 50) {
          console.log(`  ⚠️ WARNING: Very short content for route ${route}`);
        }

        // Check for error messages in content
        const hasErrorInContent = bodyText.includes('Error') ||
                                  bodyText.includes('404') ||
                                  bodyText.includes('Not Found') ||
                                  bodyText.includes('Something went wrong');

        if (hasErrorInContent && route !== '/nonexistent-route') {
          console.log(`  ⚠️ WARNING: Error content detected in route ${route}`);
        }

      } catch (error) {
        console.log(`  ❌ FAILED to load route ${route}: ${error.message}`);
      }
    }

    console.log('\n=== FINAL ERROR SUMMARY ===');
    console.log(`Total Console Errors: ${allConsoleErrors.length}`);
    console.log(`Total Page Errors: ${allPageErrors.length}`);

    if (allConsoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS FOUND:');
      allConsoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (allPageErrors.length > 0) {
      console.log('\n❌ PAGE ERRORS FOUND:');
      allPageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // This test should FAIL if there are any console or page errors
    expect(allConsoleErrors.length).toBe(0);
    expect(allPageErrors.length).toBe(0);

    console.log('\n✅ ALL ROUTES TESTED SUCCESSFULLY WITH NO ERRORS');
  });
});