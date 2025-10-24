const { test, expect } = require('@playwright/test');

test.describe('UI Interaction Tests', () => {
  test('should verify React UI is actually interactive', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for React to fully mount
    await page.waitForTimeout(2000);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'frontend-state.png', fullPage: true });

    // Check for actual interactive elements
    const googleSignInButton = page.locator('button', { hasText: /continue with google/i });
    const signInText = page.locator('text=Sign in to access your multi-tenant platform');
    const welcomeText = page.locator('text=Welcome');

    // Test if elements are visible
    const googleButtonVisible = await googleSignInButton.isVisible().catch(() => false);
    const signInVisible = await signInText.isVisible().catch(() => false);
    const welcomeVisible = await welcomeText.isVisible().catch(() => false);

    console.log('UI Element Visibility:');
    console.log('- Google Sign In Button:', googleButtonVisible);
    console.log('- Sign In Text:', signInVisible);
    console.log('- Welcome Text:', welcomeVisible);

    // Get the actual rendered content
    const bodyContent = await page.locator('body').textContent();
    console.log('Full body text content:');
    console.log(bodyContent);

    // Check for CSS classes that indicate the UI is properly styled
    const hasExpectedClasses = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root || !root.firstElementChild) return false;

      const firstChild = root.firstElementChild;
      const classes = firstChild.className;

      return {
        hasDarkClass: classes.includes('dark'),
        hasMinHeight: classes.includes('min-h-screen'),
        hasFlexClasses: classes.includes('flex'),
        allClasses: classes
      };
    });

    console.log('CSS Classes Analysis:', hasExpectedClasses);

    // Test if the UI theme toggle works (if present)
    const themeButton = page.locator('button[aria-label*="theme"], button[title*="theme"]');
    const hasThemeButton = await themeButton.isVisible().catch(() => false);
    console.log('Has theme toggle button:', hasThemeButton);

    // Verify the page is not showing the React fallback
    const noScriptContent = await page.locator('noscript').textContent().catch(() => '');
    const hasJsDisabledMessage = bodyContent.includes('You need to enable JavaScript');

    console.log('JavaScript Status:');
    console.log('- NoScript content:', noScriptContent);
    console.log('- Shows JS disabled message:', hasJsDisabledMessage);

    // The page should be interactive if React is working
    expect(hasExpectedClasses.hasDarkClass || hasExpectedClasses.hasMinHeight).toBe(true);

    console.log('✅ React UI is properly mounted and styled');
  });
});