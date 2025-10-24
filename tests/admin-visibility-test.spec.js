const { test, expect } = require('@playwright/test');

test.describe('Admin Page Text Visibility', () => {
  test('should check all text elements on admin page for visibility', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({ path: 'tests/screenshots/admin-page-full.png', fullPage: true });

    console.log('\n=== ADMIN PAGE TEXT VISIBILITY CHECK ===\n');

    // Check all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    console.log(`\n--- HEADINGS (${headings.length} found) ---`);
    for (const heading of headings) {
      const text = await heading.textContent();
      const styles = await heading.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          background: computed.backgroundColor,
          tagName: el.tagName,
        };
      });
      if (text && text.trim()) {
        console.log(`[${styles.tagName}] "${text.trim().slice(0, 60)}" - Color: ${styles.color}`);
      }
    }

    // Check all paragraphs
    const paragraphs = await page.locator('p').all();
    console.log(`\n--- PARAGRAPHS (${paragraphs.length} found) ---`);
    for (const p of paragraphs.slice(0, 30)) {
      const text = await p.textContent();
      const styles = await p.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          className: el.className,
        };
      });
      if (text && text.trim()) {
        console.log(`"${text.trim().slice(0, 50)}" - Color: ${styles.color} - Classes: ${styles.className.slice(0, 50)}`);
      }
    }

    // Check TabsTrigger elements specifically
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`\n--- TAB TRIGGERS (${tabs.length} found) ---`);
    for (const tab of tabs) {
      const text = await tab.textContent();
      const styles = await tab.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const isActive = el.getAttribute('data-state') === 'active';
        return {
          color: computed.color,
          background: computed.backgroundColor,
          isActive,
          className: el.className,
        };
      });
      console.log(`Tab: "${text?.trim()}" - Color: ${styles.color} - BG: ${styles.background} - Active: ${styles.isActive}`);
    }

    // Check all labels
    const labels = await page.locator('label').all();
    console.log(`\n--- LABELS (${labels.length} found) ---`);
    for (const label of labels.slice(0, 20)) {
      const text = await label.textContent();
      const styles = await label.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          className: el.className,
        };
      });
      if (text && text.trim()) {
        console.log(`"${text.trim().slice(0, 40)}" - Color: ${styles.color}`);
      }
    }

    // Check for any elements with blue text
    const blueElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const blue = [];
      allElements.forEach((el) => {
        const color = window.getComputedStyle(el).color;
        // Check if color is a shade of blue (rgb values where b > r and b > g)
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          if (b > r && b > g && b > 100) {
            const text = el.textContent?.trim();
            if (text && text.length > 0 && text.length < 100) {
              blue.push({
                text: text.slice(0, 50),
                color,
                className: el.className,
                tagName: el.tagName,
              });
            }
          }
        }
      });
      return blue.slice(0, 20);
    });

    console.log(`\n--- BLUE TEXT ELEMENTS (${blueElements.length} found) ---`);
    blueElements.forEach(el => {
      console.log(`[${el.tagName}] "${el.text}" - Color: ${el.color} - Classes: ${el.className.slice(0, 50)}`);
    });
  });
});
