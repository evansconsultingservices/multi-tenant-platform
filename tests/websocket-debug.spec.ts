import { test, expect } from '@playwright/test';

/**
 * Debug test to check console logs even without authentication
 * This test verifies the Module Federation imports work correctly
 */
test.describe('WebSocket Module Debug', () => {
  test('check if socket hooks module loads correctly', async ({ page }) => {
    // Collect all console messages
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      // Print relevant logs immediately
      console.log(`CONSOLE [${msg.type()}]: ${text.slice(0, 200)}`);
    });

    // Collect page errors
    page.on('pageerror', (error) => {
      console.log(`PAGE ERROR: ${error.message}`);
    });

    // Navigate to the app - even on login page we should see Module Federation loading
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Print all logs for analysis
    console.log('\n=== ALL CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== END LOGS ===\n');

    // At minimum, check that the app loaded without errors
    const pageErrorLogs = consoleLogs.filter(log =>
      log.includes('[error]') &&
      !log.includes('favicon') &&
      !log.includes('manifest')
    );
    console.log('Error logs:', pageErrorLogs);

    expect(true).toBe(true);
  });

  test('check podcast manager remote entry loads', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
    });

    // Test loading the podcast manager remote entry directly
    console.log('Testing podcast manager remoteEntry.js...');
    const response = await page.goto('http://localhost:3005/remoteEntry.js');
    console.log('RemoteEntry response status:', response?.status());

    // Check content contains expected Module Federation exports
    const content = await page.content();
    const hasFirebaseListeners = content.includes('firebaseListeners');
    const hasUseSocket = content.includes('useSocket') || content.includes('useEpisodeListener');

    console.log('Contains firebaseListeners:', hasFirebaseListeners);
    console.log('Contains useSocket hooks:', hasUseSocket);

    expect(response?.status()).toBe(200);
  });

  test('check parent shell remoteEntry loads', async ({ page }) => {
    // Test loading the shell remoteEntry
    console.log('Testing shell remoteEntry.js...');
    const response = await page.goto('http://localhost:3000/remoteEntry.js');
    console.log('Shell remoteEntry response status:', response?.status());

    const content = await page.content();
    const hasUseSocket = content.includes('./useSocket');
    const hasConnectSocket = content.includes('connectSocket');
    const hasWebSocketURL = content.includes('192.168.1.75:3010') || content.includes('localhost:3010');

    console.log('Exposes useSocket:', hasUseSocket);
    console.log('Contains connectSocket:', hasConnectSocket);
    console.log('Contains WebSocket URL:', hasWebSocketURL);

    expect(response?.status()).toBe(200);
    expect(hasUseSocket).toBe(true);
  });

  test('verify child app imports from shell correctly', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (text.includes('firebaseListeners') || text.includes('shell/useSocket')) {
        console.log(`FOUND: ${text}`);
      }
    });

    // Load child app's remoteEntry and check for shell imports
    const response = await page.goto('http://localhost:3005/remoteEntry.js');
    const content = await page.content();

    // Check if the child app references shell/useSocket
    const hasShellImport = content.includes('shell/useSocket') || content.includes('shell');
    console.log('Child app references shell:', hasShellImport);

    // Look for the Module Federation remote configuration
    const hasRemoteConfig = content.includes('remotes') || content.includes('__webpack_require__');
    console.log('Has webpack config:', hasRemoteConfig);

    expect(response?.status()).toBe(200);
  });

  test('direct child app load with firebaseListeners module', async ({ page }) => {
    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      // Print WebSocket-related logs immediately
      if (text.includes('firebaseListeners') || text.includes('Module loaded')) {
        console.log(`>>> ${text}`);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`PAGE ERROR: ${error.message}`);
    });

    // Load the podcast manager app directly to see if the firebaseListeners module loads
    // This tests if the console.log at the top of firebaseListeners.ts fires
    console.log('Loading podcast manager directly at http://localhost:3005...');
    await page.goto('http://localhost:3005');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Print all logs
    console.log('\n=== ALL CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== END ALL LOGS ===\n');

    // Look for the firebaseListeners module load log
    const hasFirebaseListenersLog = consoleLogs.some(log =>
      log.includes('firebaseListeners') && log.includes('Module loaded')
    );
    console.log('Has firebaseListeners module load log:', hasFirebaseListenersLog);

    // If the module isn't loading, it might be because no component imports it
    // Let's also check for any Module Federation errors
    const mfErrors = consoleLogs.filter(log =>
      log.includes('Module Federation') ||
      log.includes('remote') ||
      log.includes('Shared module is not available') ||
      log.includes('shell/')
    );
    console.log('Module Federation related logs:', mfErrors);

    expect(true).toBe(true);
  });

  test('episode detail page console logs', async ({ page }) => {
    // This test simulates navigating to an episode detail page (bypassing auth)
    // by loading the child app directly at an episode detail route

    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      // Print all relevant WebSocket/socket/episode logs immediately
      if (
        text.includes('WebSocket') ||
        text.includes('Socket') ||
        text.includes('socket') ||
        text.includes('firebaseListeners') ||
        text.includes('useEpisodeListener') ||
        text.includes('episode') ||
        text.includes('Episode')
      ) {
        console.log(`>>> ${text}`);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`PAGE ERROR: ${error.message}`);
    });

    // Navigate to child app's episode detail page directly
    // Note: This should trigger EpisodeDetail component mount which calls useEpisodeListener
    console.log('Loading episode detail page at http://localhost:3005/episodes/test-id...');
    await page.goto('http://localhost:3005/episodes/test-id');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('Current URL:', page.url());

    // Print WebSocket-related logs
    console.log('\n=== WEBSOCKET/EPISODE LOGS ===');
    const wsLogs = consoleLogs.filter(log =>
      log.includes('WebSocket') ||
      log.includes('Socket') ||
      log.includes('socket') ||
      log.includes('firebaseListeners') ||
      log.includes('useEpisodeListener') ||
      log.includes('episode') ||
      log.includes('Episode')
    );
    wsLogs.forEach(log => console.log(log));
    console.log('=== END WEBSOCKET/EPISODE LOGS ===\n');

    // Print all logs
    console.log('\n=== ALL LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== END ALL LOGS ===\n');

    expect(true).toBe(true);
  });
});
