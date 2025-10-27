export interface VersionInfo {
  version: string;
  buildTimestamp: string;
  gitCommit: string;
  gitBranch: string;
  environment: string;
  buildNumber: number;
}

export interface ChildAppVersion extends VersionInfo {
  appName: string;
}

export class VersionService {
  private static versionInfo: VersionInfo | null = null;

  /**
   * Get version information for the parent application
   */
  static getVersion(): VersionInfo {
    if (!this.versionInfo) {
      try {
        // Import version.json generated at build time
        this.versionInfo = require('../version.json');
      } catch (error) {
        console.warn('Version info not available:', error);
        // Fallback version info
        this.versionInfo = {
          version: 'dev',
          buildTimestamp: new Date().toISOString(),
          gitCommit: 'unknown',
          gitBranch: 'unknown',
          environment: 'development',
          buildNumber: 0,
        };
      }
    }
    // At this point, versionInfo is guaranteed to be non-null
    return this.versionInfo!;
  }

  /**
   * Get version information from a child app via Module Federation
   */
  static async getChildAppVersion(
    remoteName: string,
    appDisplayName: string
  ): Promise<ChildAppVersion | null> {
    try {
      // Load the remote container
      const container = (window as any)[remoteName];
      if (!container) {
        console.warn(`Remote container ${remoteName} not available`);
        return null;
      }

      // Try to get version from menuConfig
      const module = await container.get('./menuConfig');
      const config = module();

      if (config && config.version) {
        return {
          appName: appDisplayName,
          ...config.version,
        };
      }

      return null;
    } catch (error) {
      console.warn(`Could not load version for ${remoteName}:`, error);
      return null;
    }
  }

  /**
   * Get all child app versions
   */
  static async getAllChildAppVersions(): Promise<ChildAppVersion[]> {
    const versions: ChildAppVersion[] = [];

    // Try to load versions from known child apps
    const childApps = [
      { remoteName: 'helloWorld', displayName: 'Hello World Tool' },
      { remoteName: 'videoAssetManager', displayName: 'Video Asset Manager' },
    ];

    for (const app of childApps) {
      const version = await this.getChildAppVersion(app.remoteName, app.displayName);
      if (version) {
        versions.push(version);
      }
    }

    return versions;
  }

  /**
   * Format build timestamp for display
   */
  static formatBuildTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  }

  /**
   * Get environment badge color
   */
  static getEnvironmentBadge(environment: string): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  } {
    switch (environment.toLowerCase()) {
      case 'production':
        return { label: 'Production', variant: 'default' };
      case 'development':
        return { label: 'Development', variant: 'secondary' };
      case 'staging':
        return { label: 'Staging', variant: 'outline' };
      default:
        return { label: environment, variant: 'outline' };
    }
  }
}
