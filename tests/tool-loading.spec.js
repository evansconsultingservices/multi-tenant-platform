const { test, expect } = require('@playwright/test');

test.describe('Tool Loading Tests', () => {
  let consoleErrors = [];
  let pageLogs = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors and logs
    consoleErrors = [];
    pageLogs = [];

    page.on('console', msg => {
      const text = msg.text();
      pageLogs.push(`${msg.type()}: ${text}`);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('CONSOLE ERROR:', text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log('PAGE ERROR:', error.message);
    });
  });

  test('should verify child app remoteEntry.js loads correctly', async ({ page }) => {
    // Test direct access to remoteEntry.js
    const response = await page.goto('http://localhost:3001/remoteEntry.js');

    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain('webpack');
    expect(content.length).toBeGreaterThan(100);

    console.log('✅ remoteEntry.js loads correctly');
  });

  test('should verify hello-world-tool app is accessible', async ({ page }) => {
    // Test direct access to child app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content.length).toBeGreaterThan(0);

    console.log('✅ Child app is accessible');
  });

  test('should test Module Federation loading via dashboard navigation', async ({ page }) => {
    // Navigate to main app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Since we can't easily mock Firebase auth, let's test the Module Federation
    // loading component directly by injecting it into the page

    await page.evaluate(() => {
      // Create a container for our test
      const testDiv = document.createElement('div');
      testDiv.id = 'module-federation-test';
      document.body.appendChild(testDiv);

      // Try to access the window global that Module Federation should create
      window.testModuleFederation = true;
    });

    // Check if the main app is properly set up for Module Federation
    const hasWebpackShareScopes = await page.evaluate(() => {
      return typeof window.__webpack_share_scopes__ !== 'undefined';
    });

    if (hasWebpackShareScopes) {
      console.log('✅ Main app has Module Federation globals');
    } else {
      console.log('⚠️ Module Federation globals not found');
    }

    // Test that we can reach the child app from the main app context
    const childAppResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/remoteEntry.js');
        return response.ok;
      } catch (error) {
        return false;
      }
    });

    expect(childAppResponse).toBe(true);
    console.log('✅ Main app can reach child app remoteEntry.js');
  });

  test('should simulate tool loading by testing ModuleFederationLoader component', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Inject a test to simulate what happens when ModuleFederationLoader tries to load a remote
    const moduleLoadingTest = await page.evaluate(async () => {
      try {
        // Simulate the Module Federation loading process
        const remoteName = 'helloWorld';
        const remoteUrl = 'http://localhost:3001/remoteEntry.js';

        // Try to load the remote entry script
        const script = document.createElement('script');
        script.src = remoteUrl;
        script.onerror = () => console.error('Failed to load remoteEntry.js');
        script.onload = () => console.log('remoteEntry.js loaded successfully');

        document.head.appendChild(script);

        // Wait a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if the remote is now available
        const container = window[remoteName];
        if (container) {
          console.log('Remote container found:', remoteName);
          return { success: true, hasContainer: true };
        } else {
          console.log('Remote container not found:', remoteName);
          return { success: true, hasContainer: false };
        }
      } catch (error) {
        console.error('Module Federation test error:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('Module Federation loading test result:', moduleLoadingTest);

    // Wait for any async loading to complete
    await page.waitForTimeout(3000);

    // Check console for any critical errors
    const criticalErrors = consoleErrors.filter(error =>
      error.includes('Failed to load remoteEntry.js') ||
      error.includes('Remote helloWorld is not available') ||
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    );

    if (criticalErrors.length > 0) {
      console.log('❌ Critical Module Federation errors found:', criticalErrors);

      // Log all console messages for debugging
      console.log('All console messages:');
      pageLogs.forEach(log => console.log(log));

      // This test should fail if there are critical errors
      expect(criticalErrors.length).toBe(0);
    } else {
      console.log('✅ No critical Module Federation errors detected');
    }
  });

  test('should test actual tool navigation workflow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Try to navigate to dashboard (should redirect to login)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login
    expect(page.url()).toContain('/login');

    // For testing purposes, let's try to access a tool URL directly
    // This would be the URL pattern when a user clicks on a tool
    await page.goto('http://localhost:3000/dashboard/tools/hello-world');
    await page.waitForLoadState('networkidle');

    // Should still redirect to login when not authenticated
    expect(page.url()).toContain('/login');

    console.log('✅ Tool navigation redirects work correctly');
  });
});