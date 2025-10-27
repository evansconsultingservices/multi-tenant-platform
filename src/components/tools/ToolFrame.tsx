import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ModuleFederationLoader } from './ModuleFederationLoader';
import { ToolService } from '@/services/tool.service';
import { Tool } from '@/types/tool.types';
import { useAuth } from '@/contexts/AuthContext';

interface ToolConfig {
  remoteName: string;
  exposedModule: string;
  remoteUrl: string;
  fallbackUrl?: string;
}

export const ToolFrame: React.FC<{ toolId: string }> = ({ toolId }) => {
  const { user } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const loadTool = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Check if user has access to this tool
        const accessCheck = await ToolService.hasToolAccess(user.id, toolId);
        setHasAccess(accessCheck.hasAccess);

        if (accessCheck.hasAccess) {
          // Load tool details from all tools (admin can see all)
          const allTools = await ToolService.getAllTools();
          const foundTool = allTools.find(t => t.id === toolId);
          setTool(foundTool || null);
        }
      } catch (error) {
        console.error('Error loading tool:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTool();
  }, [toolId, user]);

  // Map tool to Module Federation config
  const getToolConfig = (tool: Tool): ToolConfig | null => {
    // Dynamically derive remote URL from tool URL
    // Convert http://localhost:3001 to http://localhost:3001/remoteEntry.js
    const getRemoteEntryUrl = (baseUrl: string): string => {
      const url = new URL(baseUrl);
      return `${url.origin}/remoteEntry.js`;
    };

    // Map based on tool URL/name to determine the remote name
    if (tool.url.includes('3001') || tool.name.toLowerCase().includes('hello world')) {
      return {
        remoteName: 'helloWorld',
        exposedModule: './App',
        remoteUrl: getRemoteEntryUrl(tool.url),
        fallbackUrl: tool.url
      };
    }

    if (tool.url.includes('3002') || tool.name.toLowerCase().includes('cloudinary')) {
      return {
        remoteName: 'cloudinaryTool',
        exposedModule: './App',
        remoteUrl: getRemoteEntryUrl(tool.url),
        fallbackUrl: tool.url
      };
    }

    if (tool.url.includes('3004') || tool.name.toLowerCase().includes('video asset')) {
      return {
        remoteName: 'videoAssetManager',
        exposedModule: './App',
        remoteUrl: getRemoteEntryUrl(tool.url),
        fallbackUrl: tool.url
      };
    }

    if (tool.url.includes('3005') || tool.url.includes('podcast-manager') || tool.name.toLowerCase().includes('podcast')) {
      return {
        remoteName: 'podcastManager',
        exposedModule: './App',
        remoteUrl: getRemoteEntryUrl(tool.url),
        fallbackUrl: tool.url
      };
    }

    // Default: try to use as iframe fallback
    return {
      remoteName: 'unknown',
      exposedModule: './App',
      remoteUrl: getRemoteEntryUrl(tool.url),
      fallbackUrl: tool.url
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tool...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess || !tool) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have access to this tool. Contact your administrator to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toolConfig = getToolConfig(tool);

  if (!toolConfig) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Configuration Error</h3>
            <p className="text-muted-foreground">
              This tool is not properly configured. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ModuleFederationLoader
      toolId={toolId}
      remoteName={toolConfig.remoteName}
      exposedModule={toolConfig.exposedModule}
      remoteUrl={toolConfig.remoteUrl}
    />
  );
};

export const ToolPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();

  if (!toolId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Invalid Tool</h3>
            <p className="text-muted-foreground">No tool specified.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ToolFrame toolId={toolId} />;
};
