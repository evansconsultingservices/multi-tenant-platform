import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Company } from '@/types/company.types';
import { Check, AlertCircle } from 'lucide-react';

interface CompanyWebhooksTabProps {
  company: Company;
  onUpdateCompany: (updates: any) => Promise<void>;
}

export const CompanyWebhooksTab: React.FC<CompanyWebhooksTabProps> = ({
  company,
  onUpdateCompany
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookApiKey, setWebhookApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current values when component mounts or company changes
  useEffect(() => {
    setWebhookUrl(company.settings?.webhooks?.url || '');
    setWebhookApiKey(company.settings?.webhooks?.apiKey || '');
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

  const handleSave = async () => {
    setError(null);
    setShowSuccess(false);

    // Validate Webhook URL
    if (webhookUrl && !validateUrl(webhookUrl)) {
      setError('Please enter a valid webhook URL');
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
        },
      };

      await onUpdateCompany(updates);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving webhooks:', err);
      setError(err instanceof Error ? err.message : 'Failed to save webhook configuration');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentUrl = company.settings?.webhooks?.url || '';
    const currentApiKey = company.settings?.webhooks?.apiKey || '';

    return webhookUrl !== currentUrl || webhookApiKey !== currentApiKey;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhook URLs for automation workflows. These webhooks are triggered
            automatically when creating episodes from articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          {showSuccess && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Webhook configuration saved successfully!
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {hasChanges() && (
              <Button
                variant="outline"
                onClick={() => {
                  setWebhookUrl(company.settings?.webhooks?.url || '');
                  setWebhookApiKey(company.settings?.webhooks?.apiKey || '');
                  setError(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              How It Works
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>When an episode is created, a POST request is sent to the webhook URL</li>
              <li>The request includes episode data (title, article content, etc.)</li>
              <li>If configured, the API key is included in the X-API-Key header</li>
              <li>Your automation platform can then process the episode (generate script, audio, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
