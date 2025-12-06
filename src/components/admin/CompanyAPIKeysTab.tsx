import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Company } from '@/types/company.types';
import { APIKey, CreateAPIKeyInput } from '@/types/apikey.types';
import { APIKeyService } from '@/services/apikey.service';
import { Copy, Trash2 } from 'lucide-react';

interface CompanyAPIKeysTabProps {
  company: Company;
}

export const CompanyAPIKeysTab: React.FC<CompanyAPIKeysTabProps> = ({ company }) => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read', 'write'] as string[],
  });

  useEffect(() => {
    loadAPIKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const keys = await APIKeyService.getCompanyAPIKeys(company.id);
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    try {
      const input: CreateAPIKeyInput = {
        name: formData.name,
        permissions: formData.permissions,
      };

      const result = await APIKeyService.generateAPIKey(company.id, input);
      setNewlyCreatedKey(result.key);
      setShowKeyDialog(true);
      setShowCreateDialog(false);

      // Reset form
      setFormData({
        name: '',
        permissions: ['read', 'write'],
      });

      await loadAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!window.confirm(`Revoke API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await APIKeyService.revokeAPIKey(keyId);
      await loadAPIKeys();
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string, message: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text).then(() => {
      // Create a temporary notification element
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2';
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
        setTimeout(() => notification.remove(), 200);
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Generate and manage API keys for programmatic access to {company.name}
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🔑</div>
              <p>No API keys generated yet</p>
              <p className="text-sm mt-2">
                Create your first API key to enable programmatic access
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {apiKey.keyPrefix}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(apiKey.keyPrefix, 'Key prefix copied!')}
                          title="Copy key prefix"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                        {apiKey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {apiKey.permissions.join(', ')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {apiKey.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {apiKey.lastUsedAt ? apiKey.lastUsedAt.toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {apiKey.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeKey(apiKey.id, apiKey.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for {company.name}. Make sure to copy it - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Production API Key"
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name to identify this key
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Permissions</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes('read')}
                    onChange={() => handlePermissionToggle('read')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Read - View data</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes('write')}
                    onChange={() => handlePermissionToggle('write')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Write - Create and update data</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes('delete')}
                    onChange={() => handlePermissionToggle('delete')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Delete - Remove data</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes('podcast:callback')}
                    onChange={() => handlePermissionToggle('podcast:callback')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Podcast Callbacks - Allow webhook callbacks from Make.com/Pipedream</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>
              Generate API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created!</DialogTitle>
            <DialogDescription>
              ⚠️ Copy this key now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm break-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => newlyCreatedKey && copyToClipboard(newlyCreatedKey, 'API key copied!')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Security Warning
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Store this key securely. Anyone with this key can access your data.
                Never commit it to source control.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setShowKeyDialog(false);
              setNewlyCreatedKey(null);
            }}>
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
