const { test, expect } = require('@playwright/test');

test.describe('Dashboard and Navigation Tests', () => {
  test('verify dashboard loads and shows correct content', async ({ page }) => {
    // Go to the app
    await page.goto('http://localhost:3000');

    // Wait for auth redirect
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/current-dashboard.png', fullPage: true });

    console.log('\n=== CURRENT PAGE ===');
    console.log('URL:', page.url());

    // Get all text
    const bodyText = await page.textContent('body');
    console.log('\n=== PAGE CONTENT ===');
    console.log(bodyText.substring(0, 500));

    // Check for old unwanted cards
    console.log('\n=== CHECKING FOR OLD CARDS (should be GONE) ===');
    const roleCard = await page.locator('text="Your Role"').count();
    const availableToolsCard = await page.locator('text="Available Tools"').nth(1).count();
    const lastActivityCard = await page.locator('text="Last Activity"').count();
    const gettingStartedCard = await page.locator('text="Getting Started"').count();

    console.log('Your Role card:', roleCard > 0 ? '❌ FOUND (BAD!)' : '✅ Not found');
    console.log('Available Tools card:', availableToolsCard > 0 ? '❌ FOUND (BAD!)' : '✅ Not found');
    console.log('Last Activity card:', lastActivityCard > 0 ? '❌ FOUND (BAD!)' : '✅ Not found');
    console.log('Getting Started card:', gettingStartedCard > 0 ? '❌ FOUND (BAD!)' : '✅ Not found');

    // Check for new clean design
    console.log('\n=== CHECKING FOR NEW CLEAN DESIGN ===');
    const welcomeBack = await page.locator('text=/Welcome back/i').count();
    const selectTool = await page.locator('text=/Select a tool/i').count();

    console.log('Welcome back message:', welcomeBack > 0 ? '✅ FOUND' : '❌ Not found');
    console.log('Select tool message:', selectTool > 0 ? '✅ FOUND' : '❌ Not found');

    // Check sidebar
    console.log('\n=== CHECKING SIDEBAR ===');
    const homeLink = await page.locator('text="Home"').count();
    const adminLink = await page.locator('text="Admin"').count();

    console.log('Home link in sidebar:', homeLink > 0 ? '✅ FOUND' : '❌ Not found');
    console.log('Admin link in sidebar:', adminLink > 0 ? '✅ FOUND' : '❌ Not found');

    // Check for hardcoded Hello World in sidebar
    const hardcodedHelloWorld = await page.locator('text="Hello World Tool"').count();
    console.log('Hello World Tool in sidebar:', hardcodedHelloWorld > 0 ? '⚠️  FOUND (check if from database or hardcoded)' : '❌ Not found');

    // Check font colors
    console.log('\n=== CHECKING FONT COLORS ===');
    const foregroundElements = await page.locator('.text-foreground').count();
    const mutedForegroundElements = await page.locator('.text-muted-foreground').count();

    console.log('text-foreground elements:', foregroundElements);
    console.log('text-muted-foreground elements:', mutedForegroundElements);

    console.log('\n=== SCREENSHOTS ===');
    console.log('Full page: /tmp/current-dashboard.png');
  });
});
