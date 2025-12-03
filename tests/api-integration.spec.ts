import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const API_BASE = 'http://192.168.1.75:3010';

  test('API health endpoint responds correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
  });

  test('API returns proper error for unauthenticated requests', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/auth/profile/test-user-id`);
    // Should return 401 or similar for unauthenticated requests
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('Podcast episodes endpoint requires authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/podcast/episodes`);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toMatch(/UNAUTHORIZED|INVALID_TOKEN/);
  });
});

test.describe('Frontend Loading Tests', () => {
  test('Parent app loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check that the page loaded
    await expect(page).toHaveTitle(/Media Orchestrator/);

    // Should show login page since not authenticated
    const loginButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

    // Filter out expected errors (like Firebase auth)
    const unexpectedErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('auth') &&
      !e.includes('network')
    );

    expect(unexpectedErrors.length).toBe(0);
  });

  test('Child app remote entries are accessible', async ({ request }) => {
    // Check video-asset-manager remote entry
    const vamResponse = await request.get('http://localhost:3004/remoteEntry.js');
    expect(vamResponse.ok()).toBeTruthy();
    const vamContent = await vamResponse.text();
    expect(vamContent).toContain('video_asset_manager');

    // Check podcast-manager remote entry
    const pmResponse = await request.get('http://localhost:3005/remoteEntry.js');
    expect(pmResponse.ok()).toBeTruthy();
    const pmContent = await pmResponse.text();
    expect(pmContent).toContain('podcast_manager');
  });
});
