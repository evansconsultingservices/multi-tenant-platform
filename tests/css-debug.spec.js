const { test, expect } = require('@playwright/test');

test.describe('CSS Background Debug', () => {
  test('should check actual CSS values for background', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Get computed background color of main container
    const backgroundColor = await page.evaluate(() => {
      // Check dashboard background
      const dashboardDiv = document.querySelector('.min-h-screen');
      if (dashboardDiv) {
        const styles = window.getComputedStyle(dashboardDiv);
        return {
          backgroundColor: styles.backgroundColor,
          backgroundImage: styles.backgroundImage,
          element: 'dashboard-main',
          className: dashboardDiv.className
        };
      }
      return null;
    });

    console.log('Dashboard Background:', JSON.stringify(backgroundColor, null, 2));

    // Check CSS variables
    const cssVars = await page.evaluate(() => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      return {
        background: rootStyles.getPropertyValue('--background'),
        foreground: rootStyles.getPropertyValue('--foreground'),
        muted: rootStyles.getPropertyValue('--muted'),
        rootClasses: document.documentElement.className,
        bodyClasses: document.body.className
      };
    });

    console.log('CSS Variables:', JSON.stringify(cssVars, null, 2));

    // Check what theme is active
    const themeInfo = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        htmlClasses: html.className,
        bodyClasses: body.className,
        isDark: html.classList.contains('dark') || body.classList.contains('dark')
      };
    });

    console.log('Theme Info:', JSON.stringify(themeInfo, null, 2));

    expect(true).toBe(true);
  });
});