const { test, expect } = require('@playwright/test');

test.describe('Text Visibility Check', () => {
  test('should check for invisible blue text in admin pages', async ({ page }) => {
    const url = 'http://localhost:3000/login';
    await page.goto(url);

    // Take screenshot of login page
    await page.screenshot({ path: 'tests/screenshots/login-page.png', fullPage: true });

    // Check for any elements with blue text that might be invisible
    const blueTextElements = await page.locator('[class*="text-blue"], [class*="text-primary"]').all();
    console.log(`Found ${blueTextElements.length} elements with potential blue text classes`);

    // Check headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    console.log(`\n=== Checking ${headings.length} headings ===`);

    for (const heading of headings.slice(0, 10)) {
      const text = await heading.textContent();
      const color = await heading.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.color;
      });
      console.log(`Heading: "${text?.slice(0, 50)}" - Color: ${color}`);
    }

    // Check for CardDescription and CardTitle elements
    const cardTitles = await page.locator('[class*="CardTitle"], [class*="font-medium"], [class*="font-semibold"]').all();
    console.log(`\n=== Checking ${Math.min(cardTitles.length, 20)} card/title elements ===`);

    for (const element of cardTitles.slice(0, 20)) {
      const text = await element.textContent();
      const color = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          className: el.className,
        };
      });
      console.log(`Element: "${text?.slice(0, 40)}" - Color: ${color.color} - Classes: ${color.className.slice(0, 60)}`);
    }
  });

  test('should check admin panel page for text visibility', async ({ page, context }) => {
    // First login (this test assumes you have Google auth set up)
    // For now, let's just navigate and see what we can find
    const url = 'http://localhost:3000/admin';

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.screenshot({ path: 'tests/screenshots/admin-panel.png', fullPage: true });

      // Check all text elements for color
      const allText = await page.locator('h1, h2, h3, p, label, span').all();
      console.log(`\n=== Admin Panel: Checking ${Math.min(allText.length, 30)} text elements ===`);

      for (const element of allText.slice(0, 30)) {
        const text = await element.textContent();
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            background: computed.backgroundColor,
            className: el.className,
            tagName: el.tagName,
          };
        });

        if (text && text.trim()) {
          console.log(`[${styles.tagName}] "${text.trim().slice(0, 40)}" - Color: ${styles.color} - BG: ${styles.background}`);
        }
      }
    } catch (error) {
      console.log('Could not access admin panel (might need authentication):', error.message);
    }
  });
});
