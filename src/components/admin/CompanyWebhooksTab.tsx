import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Company } from '@/types/company.types';
import { api } from '@/services/api';
import { Check, AlertCircle, Loader2, Server, FolderOpen, XCircle } from 'lucide-react';

interface CompanyWebhooksTabProps {
  company: Company;
  onUpdateCompany: (updates: any) => Promise<void>;
}

type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';

export const CompanyWebhooksTab: React.FC<CompanyWebhooksTabProps> = ({
  company,
  onUpdateCompany
}) => {
  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookApiKey, setWebhookApiKey] = useState('');

  // SFTP state
  const [sftpHost, setSftpHost] = useState('');
  const [sftpPort, setSftpPort] = useState('22');
  const [sftpUsername, setSftpUsername] = useState('');
  const [sftpPassword, setSftpPassword] = useState('');
  const [sftpBasePath, setSftpBasePath] = useState('');

  // SFTP connection test state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('untested');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [availableDirectories, setAvailableDirectories] = useState<string[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState(false);

  // General state
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current values when component mounts or company changes
  useEffect(() => {
    // Webhook values
    setWebhookUrl(company.settings?.webhooks?.url || '');
    setWebhookApiKey(company.settings?.webhooks?.apiKey || '');

    // SFTP values
    setSftpHost(company.settings?.sftp?.host || '');
    setSftpPort(String(company.settings?.sftp?.port || 22));
    setSftpUsername(company.settings?.sftp?.username || '');
    setSftpPassword(company.settings?.sftp?.password || '');
    setSftpBasePath(company.settings?.sftp?.basePath || '');

    // Reset connection status when company changes
    setConnectionStatus('untested');
    setAvailableDirectories([]);
  }, [company]);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleTestConnection = async () => {
    if (!sftpHost || !sftpUsername || !sftpPassword) {
      setError('Please fill in SFTP host, username, and password to test connection');
      return;
    }

    setConnectionStatus('testing');
    setConnectionMessage('');
    setError(null);

    try {
      const response = await api.post<{ success: boolean; message: string }>('/sftp/test-connection', {
        host: sftpHost,
        port: parseInt(sftpPort, 10) || 22,
        username: sftpUsername,
        password: sftpPassword,
      });

      if (response.success && response.data?.success) {
        setConnectionStatus('success');
        setConnectionMessage(response.data.message || 'Connected successfully');

        // Fetch available directories
        await fetchDirectories();
      } else {
        setConnectionStatus('failed');
        setConnectionMessage(response.data?.message || response.error?.message || 'Connection failed');
      }
    } catch (err) {
      console.error('SFTP connection test error:', err);
      setConnectionStatus('failed');
      setConnectionMessage(err instanceof Error ? err.message : 'Connection test failed');
    }
  };

  const fetchDirectories = async () => {
    setLoadingDirectories(true);
    try {
      const response = await api.post<{ directories: string[] }>('/sftp/list-directories', {
        host: sftpHost,
        port: parseInt(sftpPort, 10) || 22,
        username: sftpUsername,
        password: sftpPassword,
      });

      if (response.success && response.data?.directories) {
        setAvailableDirectories(response.data.directories);
      } else {
        console.error('Failed to fetch directories:', response.error);
        setAvailableDirectories(['/']);
      }
    } catch (err) {
      console.error('Error fetching directories:', err);
      setAvailableDirectories(['/']);
    } finally {
      setLoadingDirectories(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setShowSuccess(false);

    // Validate Webhook URL
    if (webhookUrl && !validateUrl(webhookUrl)) {
      setError('Please enter a valid webhook URL');
      return;
    }

    // Validate SFTP port
    const portNum = parseInt(sftpPort, 10);
    if (sftpPort && (isNaN(portNum) || portNum < 1 || portNum > 65535)) {
      setError('Please enter a valid SFTP port (1-65535)');
      return;
    }

    try {
      setSaving(true);

      const updates: any = {
        settings: {
          ...company.settings,
          webhooks: {
            url: webhookUrl || null,
            apiKey: webhookApiKey || null,
          },
          sftp: {
            host: sftpHost || null,
            port: portNum || 22,
            username: sftpUsername || null,
            password: sftpPassword || null,
            basePath: sftpBasePath || null,
          },
        },
      };

      await onUpdateCompany(updates);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const hasWebhookChanges = () => {
    const currentUrl = company.settings?.webhooks?.url || '';
    const currentApiKey = company.settings?.webhooks?.apiKey || '';

    return webhookUrl !== currentUrl || webhookApiKey !== currentApiKey;
  };

  const hasSftpChanges = () => {
    const currentHost = company.settings?.sftp?.host || '';
    const currentPort = String(company.settings?.sftp?.port || 22);
    const currentUsername = company.settings?.sftp?.username || '';
    const currentPassword = company.settings?.sftp?.password || '';
    const currentBasePath = company.settings?.sftp?.basePath || '';

    return (
      sftpHost !== currentHost ||
      sftpPort !== currentPort ||
      sftpUsername !== currentUsername ||
      sftpPassword !== currentPassword ||
      sftpBasePath !== currentBasePath
    );
  };

  const hasChanges = () => hasWebhookChanges() || hasSftpChanges();

  const resetAll = () => {
    // Reset webhook fields
    setWebhookUrl(company.settings?.webhooks?.url || '');
    setWebhookApiKey(company.settings?.webhooks?.apiKey || '');

    // Reset SFTP fields
    setSftpHost(company.settings?.sftp?.host || '');
    setSftpPort(String(company.settings?.sftp?.port || 22));
    setSftpUsername(company.settings?.sftp?.username || '');
    setSftpPassword(company.settings?.sftp?.password || '');
    setSftpBasePath(company.settings?.sftp?.basePath || '');

    // Reset status
    setConnectionStatus('untested');
    setAvailableDirectories([]);
    setError(null);
  };

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'testing':
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing connection...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>{connectionMessage || 'Connected successfully'}</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            <span>{connectionMessage || 'Connection failed'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Configuration saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Webhook Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhook URLs for automation workflows. These webhooks are triggered
            automatically when creating episodes from articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL Field */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">
              Webhook URL
            </Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://hook.us1.make.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Webhook URL for automation workflows (Make.com, Zapier, n8n, etc.). Leave empty to disable.
            </p>
          </div>

          {/* Webhook API Key Field */}
          <div className="space-y-2">
            <Label htmlFor="webhookApiKey">
              Webhook API Key (Optional)
            </Label>
            <Input
              id="webhookApiKey"
              type="password"
              placeholder="Enter API key..."
              value={webhookApiKey}
              onChange={(e) => setWebhookApiKey(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Optional API key sent in the X-API-Key header for webhook authentication.
            </p>
          </div>

         
        </CardContent>
      </Card>

      {/* SFTP Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            SFTP Configuration
          </CardTitle>
          <CardDescription>
            Configure SFTP server credentials for file uploads and storage.
            Files will be uploaded to the specified base path.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Host and Port Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="sftpHost">Host</Label>
              <Input
                id="sftpHost"
                type="text"
                placeholder="sftp.example.com"
                value={sftpHost}
                onChange={(e) => {
                  setSftpHost(e.target.value);
                  setConnectionStatus('untested');
                }}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sftpPort">Port</Label>
              <Input
                id="sftpPort"
                type="number"
                placeholder="22"
                value={sftpPort}
                onChange={(e) => {
                  setSftpPort(e.target.value);
                  setConnectionStatus('untested');
                }}
                disabled={saving}
                min={1}
                max={65535}
              />
            </div>
          </div>

          {/* Username and Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sftpUsername">Username</Label>
              <Input
                id="sftpUsername"
                type="text"
                placeholder="username"
                value={sftpUsername}
                onChange={(e) => {
                  setSftpUsername(e.target.value);
                  setConnectionStatus('untested');
                }}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sftpPassword">Password</Label>
              <Input
                id="sftpPassword"
                type="password"
                placeholder="Enter password..."
                value={sftpPassword}
                onChange={(e) => {
                  setSftpPassword(e.target.value);
                  setConnectionStatus('untested');
                }}
                disabled={saving}
              />
            </div>
          </div>

          {/* Test Connection Button and Status */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={saving || connectionStatus === 'testing' || !sftpHost || !sftpUsername || !sftpPassword}
            >
              {connectionStatus === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            {renderConnectionStatus()}
          </div>

          {/* Base Path Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="sftpBasePath" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Base Path
            </Label>
            {connectionStatus === 'success' && availableDirectories.length > 0 ? (
              <Select
                value={sftpBasePath || 'none'}
                onValueChange={(value) => setSftpBasePath(value === 'none' ? '' : value)}
                disabled={saving || loadingDirectories}
              >
                <SelectTrigger id="sftpBasePath">
                  <SelectValue placeholder="Select a directory..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">/ (root)</SelectItem>
                  {availableDirectories.map((dir) => (
                    <SelectItem key={dir} value={dir}>
                      {dir}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="sftpBasePath"
                type="text"
                placeholder="/uploads/podcasts"
                value={sftpBasePath}
                onChange={(e) => setSftpBasePath(e.target.value)}
                disabled={saving}
              />
            )}
            <p className="text-sm text-muted-foreground">
              {connectionStatus === 'success'
                ? 'Select the root directory for file operations.'
                : 'Test connection to see available directories, or enter a path manually.'}
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {hasChanges() && (
          <Button
            variant="outline"
            onClick={resetAll}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
