const { test, expect } = require('@playwright/test');

test('check dashboard content', async ({ page }) => {
  // Go to dashboard
  await page.goto('http://localhost:3000/dashboard');

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/dashboard-screenshot.png', fullPage: true });

  // Get all text content
  const bodyText = await page.textContent('body');
  console.log('=== DASHBOARD PAGE CONTENT ===');
  console.log(bodyText);

  // Check for old cards that shouldn't be there
  const hasRoleCard = await page.locator('text=Role').count();
  const hasOrganizationCard = await page.locator('text=Organization').nth(1).count(); // nth(1) to skip header
  const hasMemberSinceCard = await page.locator('text=Member Since').count();
  const hasLoginCountCard = await page.locator('text=Login Count').count();
  const hasQuickActionsCard = await page.locator('text=Quick Actions').count();
  const hasAdministrationCard = await page.locator('text=Administration').count();

  console.log('\n=== OLD CARDS CHECK ===');
  console.log('Role card:', hasRoleCard > 0 ? 'FOUND (should not exist)' : 'Not found (good)');
  console.log('Organization card:', hasOrganizationCard > 0 ? 'FOUND (should not exist)' : 'Not found (good)');
  console.log('Member Since card:', hasMemberSinceCard > 0 ? 'FOUND (should not exist)' : 'Not found (good)');
  console.log('Login Count card:', hasLoginCountCard > 0 ? 'FOUND (should not exist)' : 'Not found (good)');
  console.log('Quick Actions card:', hasQuickActionsCard > 0 ? 'FOUND (should not exist)' : 'Not found (good)');
  console.log('Administration card:', hasAdministrationCard > 0 ? 'FOUND (should not exist)' : 'Not found (good)');

  // Check for new clean design elements
  const hasWelcomeMessage = await page.locator('text=Welcome back').count();
  const hasSelectToolMessage = await page.locator('text=Select a tool to get started').count();

  console.log('\n=== NEW DESIGN CHECK ===');
  console.log('Welcome message:', hasWelcomeMessage > 0 ? 'FOUND (good)' : 'Not found (bad)');
  console.log('Select tool message:', hasSelectToolMessage > 0 ? 'FOUND (good)' : 'Not found (bad)');

  console.log('\nScreenshot saved to: /tmp/dashboard-screenshot.png');
});
