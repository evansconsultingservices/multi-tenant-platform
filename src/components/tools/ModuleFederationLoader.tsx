import React, { Suspense, lazy, Component } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ModuleFederationLoaderProps {
  toolId: string;
  remoteName: string;
  exposedModule: string;
  remoteUrl: string;
}

// Error Boundary for Module Federation
class ModuleFederationErrorBoundary extends Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Module Federation Error:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Failed to Load Tool</h3>
              <p className="text-muted-foreground mb-4">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="text-primary hover:underline"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Function to load remote script
const loadRemoteScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      console.log(`Successfully loaded remote script: ${url}`);
      resolve();
    };

    script.onerror = () => {
      console.error(`Failed to load remote script: ${url}`);
      reject(new Error(`Failed to load remote script: ${url}`));
    };

    document.head.appendChild(script);
  });
};

// Dynamic import function for Module Federation
const loadRemoteComponent = (remoteName: string, exposedModule: string, remoteUrl: string) => {
  return lazy(async () => {
    try {
      console.log(`Loading remote component: ${remoteName}/${exposedModule} from ${remoteUrl}`);

      // First, load the remote script
      await loadRemoteScript(remoteUrl);

      // Wait for the remote container to be available with retries
      let container = (window as any)[remoteName];
      let retries = 0;
      const maxRetries = 50; // 50 * 100ms = 5 seconds max wait

      while (!container && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        container = (window as any)[remoteName];
        retries++;
      }

      if (!container) {
        throw new Error(`Remote ${remoteName} is not available after loading script from ${remoteUrl}. Waited ${retries * 100}ms.`);
      }

      console.log(`Remote container ${remoteName} became available after ${retries * 100}ms`);

      console.log(`Remote container ${remoteName} found, initializing...`);

      // Initialize the container with shared scope
      if (typeof container.init === 'function') {
        await container.init(__webpack_share_scopes__.default);
      } else {
        console.warn(`Remote ${remoteName} does not have init function`);
      }

      // Get the exposed module
      const factory = await container.get(exposedModule);
      const Module = factory();

      console.log(`Successfully loaded module: ${remoteName}/${exposedModule}`);
      return Module;
    } catch (error) {
      console.error(`Failed to load remote module ${remoteName}/${exposedModule}:`, error);
      throw new Error(`Could not load ${remoteName}/${exposedModule}: ${error}`);
    }
  });
};

export const ModuleFederationLoader: React.FC<ModuleFederationLoaderProps> = ({
  toolId,
  remoteName,
  exposedModule,
  remoteUrl
}) => {
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [RemoteComponent, setRemoteComponent] = React.useState<React.ComponentType | null>(null);

  // Inject CSS for the remote module
  React.useEffect(() => {
    // Extract base URL from remoteEntry.js URL
    const baseUrl = remoteUrl.replace('/remoteEntry.js', '');
    const linkId = `remote-css-${remoteName}`;

    const loadCSS = async () => {
      const existingLink = document.getElementById(linkId);

      if (!existingLink) {
        let cssUrl = `${baseUrl}/static/css/main.css`;

        // Try to fetch asset-manifest.json to get the correct CSS filename with hash
        try {
          const manifestUrl = `${baseUrl}/asset-manifest.json`;
          const response = await fetch(manifestUrl);

          if (response.ok) {
            const manifest = await response.json();
            // Get the actual CSS file path from manifest
            if (manifest.files && manifest.files['main.css']) {
              cssUrl = `${baseUrl}${manifest.files['main.css']}`;
              console.log(`[Module Federation] Found CSS in manifest: ${cssUrl}`);
            }
          }
        } catch (error) {
          console.warn(`[Module Federation] Could not load asset manifest, using default CSS path`, error);
        }

        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssUrl;
        link.setAttribute('data-remote', remoteName);

        // Add error handler to log if CSS fails to load
        link.onerror = () => {
          console.warn(`[Module Federation] Failed to load CSS for ${remoteName} from ${cssUrl}`);
        };

        link.onload = () => {
          console.log(`[Module Federation] Successfully loaded CSS for ${remoteName}`);
        };

        document.head.appendChild(link);
        console.log(`[Module Federation] Injecting CSS link for ${remoteName}: ${cssUrl}`);
      }
    };

    loadCSS();

    return () => {
      // Clean up CSS when component unmounts
      const link = document.getElementById(linkId);
      if (link) {
        link.remove();
        console.log(`[Module Federation] Removed CSS for ${remoteName}`);
      }
    };
  }, [remoteUrl, remoteName]);

  React.useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        setLoadError(null);

        if (!remoteUrl) {
          throw new Error(`No URL configured for remote: ${remoteName}`);
        }

        const Component = loadRemoteComponent(remoteName, exposedModule, remoteUrl);

        if (isMounted) {
          setRemoteComponent(() => Component);
        }
      } catch (error) {
        console.error('Error loading remote component:', error);
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load remote component');
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [remoteName, exposedModule, remoteUrl]);

  if (loadError) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Remote Tool Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              {loadError}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Make sure the {remoteName} app is running on the correct port.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!RemoteComponent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading {toolId}...</span>
        </div>
      </div>
    );
  }

  return (
    <ModuleFederationErrorBoundary onError={(error) => setLoadError(error.message)}>
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Initializing {toolId}...</span>
            </div>
          </div>
        }
      >
        <div className="h-full">
          <RemoteComponent />
        </div>
      </Suspense>
    </ModuleFederationErrorBoundary>
  );
};