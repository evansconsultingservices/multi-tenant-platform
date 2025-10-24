const { test, expect } = require('@playwright/test');

test.describe('Admin Navigation and Breadcrumbs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Mock authentication by setting localStorage
    await page.evaluate(() => {
      const mockUser = {
        uid: 'test-admin-uid',
        email: 'admin@example.com',
        displayName: 'Test Admin',
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
    });
  });

  test('should show breadcrumbs below heading in admin panel', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Check that the heading appears first
    const heading = await page.locator('h1:has-text("Administration Panel")');
    await expect(heading).toBeVisible();

    // Check that breadcrumbs exist and are visible
    const breadcrumb = await page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Check that breadcrumb contains Dashboard > Admin
    await expect(page.locator('nav[aria-label="breadcrumb"]:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('nav[aria-label="breadcrumb"]:has-text("Admin")')).toBeVisible();

    // Verify breadcrumbs appear AFTER the heading (check position)
    const headingBox = await heading.boundingBox();
    const breadcrumbBox = await breadcrumb.boundingBox();

    expect(breadcrumbBox.y).toBeGreaterThan(headingBox.y);
    console.log('✓ Breadcrumb is positioned below heading');
  });

  test('should NOT show back to dashboard button in admin panel', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Check that there's no "Back to Dashboard" button
    const backButton = await page.locator('button:has-text("Back to Dashboard")');
    await expect(backButton).toHaveCount(0);
    console.log('✓ No "Back to Dashboard" button found');
  });

  test('should navigate to companies tab via URL parameter', async ({ page }) => {
    // Navigate directly to companies tab
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(2000);

    // Verify URL contains tab parameter
    expect(page.url()).toContain('tab=companies');

    // Verify Companies tab is active (has data-state="active")
    const companiesTab = await page.locator('[role="tab"]:has-text("Companies")');
    const dataState = await companiesTab.getAttribute('data-state');
    expect(dataState).toBe('active');
    console.log('✓ Companies tab is active');

    // Verify companies content is visible
    const companiesHeading = await page.locator('h2:has-text("Company Management")');
    await expect(companiesHeading).toBeVisible();
    console.log('✓ Company Management section is visible');
  });

  test('should update URL when clicking tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Click on Companies tab
    await page.click('[role="tab"]:has-text("Companies")');
    await page.waitForTimeout(1000);

    // Check URL was updated
    expect(page.url()).toContain('tab=companies');
    console.log('✓ URL updated to include tab=companies');

    // Click on Tools tab
    await page.click('[role="tab"]:has-text("Tools")');
    await page.waitForTimeout(1000);

    // Check URL was updated
    expect(page.url()).toContain('tab=tools');
    console.log('✓ URL updated to include tab=tools');
  });

  test('should navigate from company list to company details and back', async ({ page }) => {
    // Navigate to companies tab
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(2000);

    // Check if there are any companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      // Click the first "View Details" button
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      // Verify we're on a company details page
      const companyHeading = await page.locator('h1').first();
      await expect(companyHeading).toBeVisible();
      console.log('✓ Navigated to company details page');

      // Verify breadcrumbs show: Dashboard > Admin > Companies > [Company Name]
      const breadcrumb = await page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.locator('a:has-text("Dashboard")')).toBeVisible();
      await expect(breadcrumb.locator('a:has-text("Admin")')).toBeVisible();
      await expect(breadcrumb.locator('a:has-text("Companies")')).toBeVisible();
      console.log('✓ Breadcrumbs visible on company details page');

      // Verify breadcrumbs are positioned BELOW the heading
      const headingBox = await companyHeading.boundingBox();
      const breadcrumbBox = await breadcrumb.boundingBox();
      expect(breadcrumbBox.y).toBeGreaterThan(headingBox.y);
      console.log('✓ Breadcrumbs positioned below heading on company details page');

      // Click the Back button
      await page.click('button:has-text("Back")');
      await page.waitForTimeout(2000);

      // Verify we're back on the admin panel with companies tab active
      expect(page.url()).toContain('/admin');
      expect(page.url()).toContain('tab=companies');
      console.log('✓ Back button navigated to /admin?tab=companies');

      // Verify Companies tab is active
      const companiesTab = await page.locator('[role="tab"]:has-text("Companies")');
      const dataState = await companiesTab.getAttribute('data-state');
      expect(dataState).toBe('active');
      console.log('✓ Companies tab is still active after navigation back');

      // Verify companies content is visible
      const companiesHeading = await page.locator('h2:has-text("Company Management")');
      await expect(companiesHeading).toBeVisible();
      console.log('✓ Company Management section is visible after back navigation');
    } else {
      console.log('⚠ No companies found to test navigation');
    }
  });

  test('should click breadcrumb link to navigate back to companies tab', async ({ page }) => {
    // Navigate to companies tab
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(2000);

    // Check if there are any companies
    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      // Click the first "View Details" button
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      // Click the "Companies" link in breadcrumb
      await page.click('nav[aria-label="breadcrumb"] a:has-text("Companies")');
      await page.waitForTimeout(2000);

      // Verify we're back on admin panel with companies tab
      expect(page.url()).toContain('/admin');
      expect(page.url()).toContain('tab=companies');
      console.log('✓ Breadcrumb "Companies" link navigated to /admin?tab=companies');

      // Verify Companies tab is active
      const companiesTab = await page.locator('[role="tab"]:has-text("Companies")');
      const dataState = await companiesTab.getAttribute('data-state');
      expect(dataState).toBe('active');
      console.log('✓ Companies tab is active after breadcrumb click');
    } else {
      console.log('⚠ No companies found to test breadcrumb navigation');
    }
  });

  test('should take screenshot of admin panel breadcrumbs', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'tests/screenshots/admin-breadcrumbs.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: tests/screenshots/admin-breadcrumbs.png');
  });

  test('should take screenshot of company details breadcrumbs', async ({ page }) => {
    await page.goto('http://localhost:3000/admin?tab=companies');
    await page.waitForTimeout(2000);

    const viewButtons = await page.locator('button:has-text("View Details")').count();

    if (viewButtons > 0) {
      await page.click('button:has-text("View Details")');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'tests/screenshots/company-details-breadcrumbs.png',
        fullPage: false
      });
      console.log('✓ Screenshot saved: tests/screenshots/company-details-breadcrumbs.png');
    } else {
      console.log('⚠ No companies found for screenshot');
    }
  });
});
