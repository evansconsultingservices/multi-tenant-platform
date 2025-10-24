import { test, expect } from '@playwright/test';

test.describe('App Shell with Shadcn Sidebar', () => {
  test('should navigate to login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should load without compilation errors', async ({ page }) => {
    // Check for JavaScript errors in console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Filter out expected errors or warnings we don't care about
    const significantErrors = errors.filter(error =>
      !error.includes('favicon.ico') &&
      !error.includes('manifest.json') &&
      !error.includes('Failed to fetch') // Firebase connection errors are ok for testing
    );

    expect(significantErrors).toHaveLength(0);
  });

  test('should render login form correctly', async ({ page }) => {
    await page.goto('/login');

    // Check for Google Sign In button
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
    await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('text=Welcome to the Multi-Tenant Platform')).toBeVisible();
  });

  test('should not have module resolution errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Module not found')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});