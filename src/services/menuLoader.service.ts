import { MenuItem } from '@/types/menu.types';

/**
 * Service for dynamically loading menu configurations from remote child apps via Module Federation
 */
export class MenuLoaderService {
  /**
   * Load menu configuration from a remote child app
   * @param remoteName The Module Federation remote name (e.g., 'helloWorld')
   * @param remoteUrl The URL of the remoteEntry.js file
   * @returns Array of menu items or empty array if loading fails
   */
  static async loadToolMenu(
    remoteName: string,
    remoteUrl: string
  ): Promise<MenuItem[]> {
    try {
      // Load the remote container
      await this.loadRemoteContainer(remoteName, remoteUrl);

      // Try to import the menu config module
      const module = await (window as any)[remoteName].get('./menuConfig');
      const menuConfig = module();

      if (menuConfig && menuConfig.menuConfig) {
        return menuConfig.menuConfig.items || [];
      }

      return [];
    } catch (error) {
      // Graceful fallback: if menu config doesn't exist or fails to load, return empty array
      console.log(`No menu config available for ${remoteName}, using default navigation`);
      return [];
    }
  }

  /**
   * Load a remote Module Federation container dynamically
   * @param remoteName The remote name
   * @param remoteUrl The URL to remoteEntry.js
   */
  private static async loadRemoteContainer(
    remoteName: string,
    remoteUrl: string
  ): Promise<void> {
    // Check if already loaded
    if ((window as any)[remoteName]) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = remoteUrl;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        // Initialize the container
        const container = (window as any)[remoteName];
        if (!container) {
          reject(new Error(`Remote container ${remoteName} not found`));
          return;
        }

        // @ts-ignore
        container.init(__webpack_share_scopes__.default);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load remote entry from ${remoteUrl}`));
      };

      document.head.appendChild(script);
    });
  }
}
