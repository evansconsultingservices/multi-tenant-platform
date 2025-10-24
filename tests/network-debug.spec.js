const { test, expect } = require('@playwright/test');

test.describe('Network Request Debugging', () => {
  test('should analyze network requests for failing routes', async ({ page }) => {
    const requests = [];
    const responses = [];

    // Capture all network requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    // Capture all responses
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'] || 'unknown'
      });
    });

    console.log('\n=== TESTING FAILING ROUTE: /dashboard/tools/hello-world ===');

    try {
      await page.goto('http://localhost:3000/dashboard/tools/hello-world', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
    } catch (error) {
      console.log(`Navigation error: ${error.message}`);
    }

    await page.waitForTimeout(3000);

    console.log('\n--- REQUESTS ---');
    requests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url} (${req.resourceType})`);
    });

    console.log('\n--- RESPONSES ---');
    responses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.url} (${res.contentType})`);
    });

    // Check for any JS files returning HTML
    const jsRequests = responses.filter(res =>
      res.url.includes('.js') &&
      (res.contentType.includes('text/html') || res.contentType.includes('text/plain'))
    );

    if (jsRequests.length > 0) {
      console.log('\n❌ PROBLEM FOUND: JavaScript files returning HTML:');
      jsRequests.forEach(req => {
        console.log(`- ${req.url} returned ${req.contentType} (Status: ${req.status})`);
      });
    }

    // Check for 404s on JS files
    const failedJsRequests = responses.filter(res =>
      res.url.includes('.js') && res.status !== 200
    );

    if (failedJsRequests.length > 0) {
      console.log('\n❌ FAILED JS REQUESTS:');
      failedJsRequests.forEach(req => {
        console.log(`- ${req.url} (Status: ${req.status})`);
      });
    }

    // Get the actual response content for the main bundle
    const bundleResponse = responses.find(res => res.url.includes('bundle.js'));
    if (bundleResponse) {
      try {
        const bundleContent = await page.evaluate(async (url) => {
          const response = await fetch(url);
          const text = await response.text();
          return {
            length: text.length,
            preview: text.substring(0, 200),
            isHtml: text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
          };
        }, bundleResponse.url);

        console.log('\n--- BUNDLE.JS ANALYSIS ---');
        console.log(`Length: ${bundleContent.length} chars`);
        console.log(`Is HTML: ${bundleContent.isHtml}`);
        console.log(`Preview: ${bundleContent.preview}`);
      } catch (error) {
        console.log(`Failed to analyze bundle: ${error.message}`);
      }
    }

    expect(true).toBe(true); // This test is for debugging only
  });
});