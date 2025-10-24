const { test, expect } = require('@playwright/test');

test.describe('Modal Appearance Check', () => {
  test('inspect modal styling in browser', async ({ page }) => {
    // Open page
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check if html has dark class
    const htmlHasDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    console.log('\n🎨 Theme Check:');
    console.log(`   HTML has 'dark' class: ${htmlHasDark ? 'YES ✅' : 'NO ❌'}`);

    // Get CSS variable values
    const cssVars = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return {
        background: computed.getPropertyValue('--background').trim(),
        card: computed.getPropertyValue('--card').trim(),
        cardForeground: computed.getPropertyValue('--card-foreground').trim(),
      };
    });

    console.log('\n📊 CSS Variables on root:');
    console.log(`   --background: ${cssVars.background}`);
    console.log(`   --card: ${cssVars.card}`);
    console.log(`   --card-foreground: ${cssVars.cardForeground}`);

    // Take a full page screenshot
    await page.screenshot({ path: 'tests/screenshots/page-before-modal.png', fullPage: true });
    console.log('\n📸 Screenshot saved: page-before-modal.png');
  });
});
